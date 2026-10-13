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
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description="Quản lý thông tin và trạng thái tài khoản tại trung tâm."
      />
      <Input
        aria-label={`Tìm ${title.toLowerCase()}`}
        placeholder="Tìm tên hoặc email…"
        value={search}
        onChange={(event) =>
          void setFilters({ search: event.target.value, page: 1 })
        }
      />
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        data={query.data?.items}
        emptyProps={{ title: "Chưa có tài khoản" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.items.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle>{account.displayName || account.email}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="break-all text-sm">{account.email}</p>
                <Badge
                  variant={
                    account.status === "ACTIVE" ? "success" : "secondary"
                  }
                >
                  {account.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
                </Badge>
                <div>
                  <Button
                    variant="outline"
                    render={<Link href={`${base}/${account.id}`} />}
                  >
                    Thông tin và chỉnh sửa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          disabled={page <= 1 || query.isFetching}
          onClick={() => void setFilters({ page: page - 1 })}
        >
          Trước
        </Button>
        <p>
          Trang {Math.max(1, page)} · {query.data?.total ?? 0} tài khoản
        </p>
        <Button
          variant="outline"
          disabled={
            !query.data || page * 20 >= query.data.total || query.isFetching
          }
          onClick={() => void setFilters({ page: page + 1 })}
        >
          Sau
        </Button>
      </div>
      <Card>
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
            onSubmit={(value) => directoryApi.createAccount(kind, value)}
          />
        </CardContent>
      </Card>
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
