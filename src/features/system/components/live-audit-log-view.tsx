"use client";
import { Fragment, useState } from "react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
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
import { directoryApi } from "@/features/directory/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  LiveSelect,
  displayMoment,
} from "@/features/academic/components/live-fields";
import { dateRangeSchema } from "@/lib/validators/web-workflows";
import { AuditChangeDetails } from "@/features/system/components/audit-change-details";
import { ROLE_LABEL } from "@/constants/roles";
import type { AuditLogRecord } from "@/types/academic-workflows";

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
/** SRS §5.14: history of teacher changes, substitutes, makeups, leaves, payment, … (BE audit log). */
export function LiveAuditLogView() {
  const [{ page, entityType, action, fromDate, toDate }, setFilters] =
    useQueryStates({
      page: parseAsInteger.withDefault(1),
      entityType: parseAsString.withDefault(ALL),
      action: parseAsString.withDefault(ALL),
      fromDate: parseAsString.withDefault(""),
      toDate: parseAsString.withDefault(""),
    });
  const hasRange = !!fromDate && !!toDate;
  const range = dateRangeSchema.safeParse({ fromDate, toDate });
  const rangeError =
    (fromDate || toDate) && !range.success
      ? range.error.issues[0]?.message
      : undefined;
  const filters = {
    page: Math.max(1, page),
    limit: PAGE_SIZE,
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
      <div className="grid gap-4 md:grid-cols-4">
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
  isExpanded,
  onToggle,
}: {
  log: AuditLogRecord;
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
            <AuditChangeDetails before={log.beforeData} after={log.afterData} />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
