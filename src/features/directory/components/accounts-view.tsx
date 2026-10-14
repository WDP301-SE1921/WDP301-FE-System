"use client";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiForm } from "@/components/shared/forms/api-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { BackendUser } from "@/types/backend";
import {
  accountCreateSchema,
  accountUpdateSchema,
} from "@/lib/validators/web-workflows";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { directoryApi } from "../api";

export const ACCOUNT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "DISABLED", label: "Đã khóa" },
];
export function AccountsView({ kind }: { kind: "staff" | "teachers" }) {
  const [{ search, page }, setFilters] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  });
  const query = useLiveQuery(["accounts", kind, search, page], (signal) =>
    directoryApi.accounts(
      kind,
      { search, page: Math.max(1, page), limit: 20 },
      signal,
    ),
  );
  const title = kind === "teachers" ? "Giáo viên" : "Nhân viên";
  const base =
    kind === "teachers" ? "/manager/teachers" : "/manager/system/staff";
  const columns: DataTableColumn<BackendUser>[] = [
    {
      id: "name",
      header: "Họ tên",
      cell: ({ row }) => (
        <p className="font-medium">
          {row.original.displayName || "Chưa có tên"}
        </p>
      ),
    },
    { accessorKey: "email", header: "Email" },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "ACTIVE" ? "success" : "secondary"}
        >
          {row.original.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Xem thông tin ${row.original.displayName || row.original.email}`}
          render={<Link href={`${base}/${row.original.id}`} />}
        >
          Xem và chỉnh sửa
        </Button>
      ),
    },
  ];
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title={title}
        description="Quản lý thông tin và trạng thái tài khoản tại trung tâm."
        actions={
          kind === "teachers" ? (
            <Button render={<Link href={ROUTES.MANAGER.TEACHER_INVITATIONS} />}>
              Mời và duyệt giáo viên
            </Button>
          ) : undefined
        }
      />
      <div
        className={cn(
          "grid min-w-0 items-start gap-6",
          kind === "staff" && "xl:grid-cols-[20rem_minmax(0,1fr)]",
        )}
      >
        {kind === "staff" ? (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Tạo tài khoản {title.toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent>
              <ApiForm
                schema={accountCreateSchema}
                defaults={{ email: "", displayName: "", password: "" }}
                fields={[
                  { name: "displayName", label: "Họ tên" },
                  { name: "email", label: "Email", type: "email" },
                  {
                    name: "password",
                    label: "Mật khẩu ban đầu",
                    type: "password",
                    description:
                      "Ít nhất 8 ký tự. Cung cấp mật khẩu cho người nhận qua kênh riêng.",
                  },
                ]}
                submitLabel="Tạo tài khoản"
                onSubmit={(value) => directoryApi.createAccount("staff", value)}
              />
            </CardContent>
          </Card>
        ) : null}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Danh sách {title.toLowerCase()}</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                className="sm:max-w-md"
                aria-label={`Tìm ${title.toLowerCase()}`}
                placeholder="Tìm tên hoặc email…"
                value={search}
                onChange={(event) =>
                  void setFilters({ search: event.target.value, page: 1 })
                }
              />
              {query.data && (
                <p className="text-sm text-muted-foreground sm:ml-auto">
                  {query.data.total} tài khoản
                </p>
              )}
            </div>
            <DataTable
              columns={columns}
              data={query.data?.items ?? []}
              isLoading={query.isPending}
              isError={query.isError}
              error={query.error}
              onRetry={() => void query.refetch()}
              emptyTitle="Chưa có tài khoản phù hợp"
              emptyDescription="Thử tìm theo tên hoặc email khác."
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Trang {Math.max(1, page)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => void setFilters({ page: page - 1 })}
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    !query.data ||
                    page * 20 >= query.data.total ||
                    query.isFetching
                  }
                  onClick={() => void setFilters({ page: page + 1 })}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
export function AccountDetailView({
  kind,
  id,
}: {
  kind: "staff" | "teachers";
  id: string;
}) {
  const account = useLiveQuery(["account", kind, id], (signal) =>
    directoryApi.account(kind, id, signal),
  );
  return (
    <PageContainer>
      <PageHeader
        title={
          kind === "teachers" ? "Thông tin giáo viên" : "Thông tin nhân viên"
        }
      />
      <AsyncBoundary
        isLoading={account.isPending}
        isError={account.isError}
        error={account.error}
        onRetry={() => void account.refetch()}
        data={account.data}
      >
        {account.data && (
          <Card>
            <CardHeader>
              <CardTitle>
                {account.data.displayName || account.data.email}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="break-all">{account.data.email}</p>
              <ApiForm
                key={`${account.data.id}-${account.data.status}-${account.data.displayName}`}
                schema={accountUpdateSchema}
                defaults={{
                  displayName: account.data.displayName ?? "",
                  status: account.data.status,
                }}
                fields={[
                  { name: "displayName", label: "Họ tên" },
                  {
                    name: "status",
                    label: "Trạng thái",
                    type: "select",
                    options: ACCOUNT_STATUS_OPTIONS,
                  },
                ]}
                onSubmit={(value) =>
                  directoryApi.updateAccount(kind, id, value)
                }
              />
            </CardContent>
          </Card>
        )}
      </AsyncBoundary>
    </PageContainer>
  );
}
