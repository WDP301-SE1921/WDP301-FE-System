"use client";
import { Fragment, useState } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  directoryApi,
  type DirectoryFilters,
} from "@/features/directory/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  LiveSelect,
  displayMoment,
} from "@/features/academic/components/live-fields";
import { dateRangeSchema } from "@/lib/validators/web-workflows";
import { AuditChangeDetails } from "@/features/system/components/audit-change-details";
import { ROLE_LABEL } from "@/constants/roles";
import type { AuditLogRecord } from "@/types/academic-workflows";
import type { BackendUser, PaginatedList } from "@/types/backend";

import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  auditActionLabel,
  auditEntityLabel,
} from "@/constants/audit-events";

const PAGE_SIZE = 20;
const ALL = "all";

/** BE trả role dạng enum (`MANAGER`, `STAFF`…); FE dùng `center_manager`, `staff`… */
function actorRoleLabel(role: string) {
  const key = role.toLowerCase() === "manager" ? "center_manager" : role;
  return (ROLE_LABEL as Record<string, string>)[key.toLowerCase()];
}
const ACCOUNT_PAGE_SIZE = 100;

async function allAccounts(
  read: (
    filters: DirectoryFilters,
    signal?: AbortSignal,
  ) => Promise<PaginatedList<BackendUser>>,
  signal?: AbortSignal,
) {
  const items: BackendUser[] = [];
  for (let page = 1; ; page++) {
    const batch = await read({ page, limit: ACCOUNT_PAGE_SIZE }, signal);
    items.push(...batch.items);
    if (!batch.items.length || page * batch.limit >= batch.total) return items;
  }
}

/** Người để lọc: nhân viên, giáo viên, quản lý (API tài khoản Quản lý được gọi). */
function useAuditActors() {
  return useLiveQuery(["audit-actors"], async (signal) => {
    const lists = await Promise.allSettled([
      allAccounts(
        (filters, abort) => directoryApi.accounts("staff", filters, abort),
        signal,
      ),
      allAccounts(
        (filters, abort) => directoryApi.accounts("teachers", filters, abort),
        signal,
      ),
      allAccounts(directoryApi.managers, signal),
    ]);
    const people = new Map<string, { value: string; label: string }>();
    // Tên theo mã tài khoản, để chi tiết thay đổi hiện tên giáo viên thay vì mã.
    const names: Record<string, string> = {};
    for (const list of lists)
      if (list.status === "fulfilled")
        for (const user of list.value) {
          names[user.id] = user.displayName || user.email;
          people.set(user.id, {
            value: user.id,
            label: [user.displayName || user.email, actorRoleLabel(user.role)]
              .filter(Boolean)
              .join(" · "),
          });
        }
    return {
      names,
      options: [...people.values()].sort((left, right) =>
        left.label.localeCompare(right.label, "vi"),
      ),
      error: lists.find((list) => list.status === "rejected")?.reason,
    };
  });
}

/** SRS §5.14: history of teacher changes, substitutes, makeups, leaves, payment, … (BE audit log). */
export function LiveAuditLogView() {
  const [
    { page, actorUserId, entityType, action, fromDate, toDate },
    setFilters,
  ] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    actorUserId: parseAsString.withDefault(ALL),
    entityType: parseAsString.withDefault(ALL),
    action: parseAsString.withDefault(ALL),
    fromDate: parseAsString.withDefault(""),
    toDate: parseAsString.withDefault(""),
  });
  const actors = useAuditActors();
  const hasRange = !!fromDate && !!toDate;
  const range = dateRangeSchema.safeParse({ fromDate, toDate });
  const rangeError =
    (fromDate || toDate) && !range.success
      ? range.error.issues[0]?.message
      : undefined;
  const filters = {
    page: Math.max(1, page),
    limit: PAGE_SIZE,
    ...(actorUserId !== ALL ? { actorUserId } : {}),
    ...(entityType !== ALL ? { entityType } : {}),
    ...(action !== ALL ? { action } : {}),
    // Whole local (UTC+7) days; BE compares createdAt to these instants.
    ...(hasRange && range.success
      ? {
          from: `${fromDate}T00:00:00.000+07:00`,
          to: `${toDate}T23:59:59.999+07:00`,
        }
      : {}),
  };
  const query = useLiveQuery(
    ["audit-logs", filters],
    (signal) => directoryApi.auditLogs(filters, signal),
    !rangeError,
  );
  // Dòng đang mở xem trước/sau; chỉ là trạng thái hiển thị tạm trên trang hiện tại.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Lịch sử thay đổi"
        description="Ai đã làm gì, lúc nào: thanh toán, đổi giáo viên, dạy thay, học bù, nghỉ học, cho học lại…"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <LiveSelect
          label="Người thực hiện"
          value={actorUserId}
          disabled={actors.isPending}
          options={[
            { value: ALL, label: "Tất cả" },
            ...(actors.data?.options ?? []),
            ...(actorUserId !== ALL &&
            actors.data &&
            !actors.data.options.some((actor) => actor.value === actorUserId)
              ? [{ value: actorUserId, label: "Người đang lọc" }]
              : []),
          ]}
          onChange={(value) => void setFilters({ actorUserId: value, page: 1 })}
        />
        <LiveSelect
          label="Đối tượng"
          value={entityType}
          options={[
            { value: ALL, label: "Tất cả" },
            ...Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={(value) => void setFilters({ entityType: value, page: 1 })}
        />
        <LiveSelect
          label="Hành động"
          value={action}
          options={[
            { value: ALL, label: "Tất cả" },
            ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={(value) => void setFilters({ action: value, page: 1 })}
        />
        <div className="space-y-2">
          <Label htmlFor="audit-from">Từ ngày</Label>
          <Input
            id="audit-from"
            type="date"
            value={fromDate}
            onChange={(event) =>
              void setFilters({ fromDate: event.target.value, page: 1 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audit-to">Đến ngày</Label>
          <Input
            id="audit-to"
            type="date"
            value={toDate}
            onChange={(event) =>
              void setFilters({ toDate: event.target.value, page: 1 })
            }
          />
        </div>
      </div>
      <ApiFeedback
        error={actors.error ?? actors.data?.error}
        retry={() => void actors.refetch()}
      />
      {rangeError && (
        <p role="alert" className="text-sm text-destructive">
          Chọn đủ hai ngày hợp lệ: {rangeError}
        </p>
      )}
      <AsyncBoundary
        isLoading={!rangeError && query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        data={query.data?.items}
        emptyProps={{ title: "Chưa có thay đổi phù hợp bộ lọc" }}
      >
        <Card className="min-w-0">
          <CardContent className="min-w-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Người thực hiện</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.items.map((log) => (
                  <AuditRow
                    key={log.id}
                    log={log}
                    names={actors.data?.names}
                    isExpanded={expandedId === log.id}
                    onToggle={() =>
                      setExpandedId((current) =>
                        current === log.id ? null : log.id,
                      )
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AsyncBoundary>
      <TablePagination
        totalItems={query.data?.total ?? 0}
        fixedPageSize={PAGE_SIZE}
      />
    </PageContainer>
  );
}

function AuditRow({
  log,
  names,
  isExpanded,
  onToggle,
}: {
  log: AuditLogRecord;
  names?: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasChanges = log.beforeData != null || log.afterData != null;
  const detailsId = `audit-details-${log.id}`;
  const roleLabel = log.actor ? actorRoleLabel(log.actor.role) : undefined;
  return (
    <Fragment>
      <TableRow>
        <TableCell className="whitespace-nowrap tabular-nums">
          {displayMoment(log.createdAt)}
        </TableCell>
        <TableCell className="font-medium">
          {auditActionLabel(log.action)}
        </TableCell>
        <TableCell>
          <div className="min-w-40 space-y-1">
            <Badge variant="outline">{auditEntityLabel(log.entityType)}</Badge>
            <p className="text-xs text-muted-foreground">
              Mã {log.entityId}
            </p>
          </div>
        </TableCell>
        <TableCell>
          {log.actor ? (
            <div className="min-w-44 space-y-1">
              <p>{log.actor.displayName ?? log.actor.email}</p>
              <p className="text-xs text-muted-foreground">
                {roleLabel ? `${roleLabel} · ` : ""}
                {log.actor.email}
              </p>
            </div>
          ) : (
            "Hệ thống"
          )}
        </TableCell>
        <TableCell>
          {hasChanges ? (
            <Button
              size="sm"
              variant="outline"
              aria-expanded={isExpanded}
              aria-controls={detailsId}
              onClick={onToggle}
            >
              {isExpanded ? "Thu gọn" : "Xem thay đổi"}
            </Button>
          ) : (
            <span className="text-muted-foreground">Không có</span>
          )}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow id={detailsId} className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={5} className="whitespace-normal">
            <AuditChangeDetails
              before={log.beforeData}
              after={log.afterData}
              names={names}
            />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
