"use client";
import { parseAsInteger, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { directoryApi } from "../api";
import { InvitationsPanel } from "./invitations-panel";

const PAGE_SIZE = 20;

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
    <PageContainer>
      <PageHeader
        title="Quản lý trung tâm"
        description="Danh sách tài khoản quản lý và lời mời quản lý mới. Mọi quản lý có cùng quyền quản lý trung tâm."
      />
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        data={query.data?.items}
        emptyProps={{ title: "Chưa có tài khoản quản lý" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.items.map((manager) => (
            <Card key={manager.id}>
              <CardHeader>
                <CardTitle>{manager.displayName || manager.email}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="break-all text-sm">{manager.email}</p>
                <Badge
                  variant={
                    manager.status === "ACTIVE" ? "success" : "secondary"
                  }
                >
                  {manager.status === "ACTIVE"
                    ? "Hoạt động"
                    : "Đã khóa / chờ duyệt"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
      <TablePagination
        totalItems={query.data?.total ?? 0}
        pageParamKey="managersPage"
        fixedPageSize={PAGE_SIZE}
      />
      <InvitationsPanel kind="manager" />
    </PageContainer>
  );
}

export function TeacherInvitationsView() {
  return (
    <PageContainer>
      <PageHeader
        title="Mời và duyệt giáo viên"
        description="Mời giáo viên bằng email, người nhận tự hoàn tất tài khoản, sau đó quản lý duyệt để có thể phân công lớp."
      />
      <InvitationsPanel kind="teacher" />
    </PageContainer>
  );
}
