"use client";
import { parseAsInteger, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { directoryApi } from "../api";
import { InvitationsPanel } from "./invitations-panel";
import type { BackendUser } from "@/types/backend";

const PAGE_SIZE = 20;
const managerColumns: DataTableColumn<BackendUser>[] = [
  {
    id: "name",
    header: "Họ tên",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.displayName || "Chưa có tên"}
      </span>
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
        {row.original.status === "ACTIVE" ? "Hoạt động" : "Đã khóa / chờ duyệt"}
      </Badge>
    ),
  },
];

/** SRS §3.1, §5.1: several managers; every manager has the full manager role (no sub-permissions). */
export function ManagersView() {
  const [page] = useQueryState("managersPage", parseAsInteger.withDefault(1));
  const query = useLiveQuery(["managers", page], (signal) =>
    directoryApi.managers(
      { page: Math.max(1, page), limit: PAGE_SIZE },
      signal,
    ),
  );
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Quản lý trung tâm"
        description="Danh sách tài khoản quản lý và lời mời quản lý mới. Mọi quản lý có cùng quyền quản lý trung tâm."
      />
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Tài khoản quản lý</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <DataTable
            columns={managerColumns}
            data={query.data?.items ?? []}
            isLoading={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            emptyTitle="Chưa có tài khoản quản lý"
          />
          <TablePagination
            totalItems={query.data?.total ?? 0}
            pageParamKey="managersPage"
            fixedPageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
      <InvitationsPanel kind="manager" />
    </PageContainer>
  );
}

export function TeacherInvitationsView() {
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Mời và duyệt giáo viên"
        description="Mời giáo viên bằng email, người nhận tự hoàn tất tài khoản, sau đó quản lý duyệt để có thể phân công lớp."
      />
      <InvitationsPanel kind="teacher" />
    </PageContainer>
  );
}
