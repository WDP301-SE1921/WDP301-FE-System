"use client";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { directoryApi } from "@/features/directory/api";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import {
  LiveSelect,
  displayMoment,
} from "@/features/academic/components/live-fields";
import { dateRangeSchema } from "@/lib/validators/web-workflows";

const PAGE_SIZE = 20;
const ALL = "all";
const ACTION_TEXT: Record<string, string> = {
  REGISTRATION_CONFIRM_PAYMENT: "Xác nhận thanh toán",
  REGISTRATION_CANCEL_DRAFT: "Hủy đăng ký nháp",
  ENROLLMENT_END: "Kết thúc môn học",
  STUDENT_END_STUDY: "Nghỉ hẳn",
  STUDENT_REACTIVATE: "Cho học lại",
  LEAVE_END_EARLY: "Kết thúc nghỉ dài hạn sớm",
  MAKEUP_RESCHEDULE: "Đổi buổi học bù",
  CLASS_TEACHER_ASSIGNED: "Đổi giáo viên phụ trách",
  SESSION_SUBSTITUTE_ASSIGNED: "Xếp giáo viên dạy thay",
  CLASS_SESSIONS_GENERATED: "Sinh buổi học",
  CLASS_SESSION_RESCHEDULED: "Đổi giờ buổi học",
  CLASS_SESSION_CANCELLED: "Hủy buổi học",
  CURRICULUM_UNIT_SUBMITTED: "Gửi duyệt giáo trình",
  CURRICULUM_UNIT_CHANGES_REQUESTED: "Yêu cầu sửa giáo trình",
  CURRICULUM_UNIT_APPROVED: "Duyệt giáo trình",
  PROGRAM_DELETE: "Xóa khóa học",
  PROFILE_UPDATED: "Cập nhật hồ sơ",
  PASSWORD_CHANGED: "Đổi mật khẩu",
  PARENT_ACCOUNT_UPDATE: "Cập nhật tài khoản phụ huynh",
  STAFF_ACCOUNT_CREATE: "Tạo tài khoản nhân viên",
  STAFF_ACCOUNT_UPDATE: "Cập nhật tài khoản nhân viên",
  TEACHER_ACCOUNT_CREATE: "Tạo tài khoản giáo viên",
  TEACHER_ACCOUNT_UPDATE: "Cập nhật tài khoản giáo viên",
  ACCOUNT_INVITATION_APPROVED: "Duyệt tài khoản được mời",
  ACCOUNT_INVITATION_REJECTED: "Từ chối tài khoản được mời",
};
const ENTITY_TEXT: Record<string, string> = {
  RegistrationOrder: "Đăng ký",
  Enrollment: "Ghi danh",
  StudentProfile: "Hồ sơ học sinh",
  LeaveRequest: "Đơn nghỉ",
  MakeupBooking: "Học bù",
  Class: "Lớp",
  ClassSession: "Buổi học",
  ScheduleGeneration: "Đợt sinh lịch",
  CurriculumUnit: "Giáo trình",
  Program: "Khóa học",
  User: "Tài khoản",
  AccountInvitation: "Lời mời",
};

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
  return (
    <PageContainer>
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
            ...Object.entries(ENTITY_TEXT).map(([value, label]) => ({
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
            ...Object.entries(ACTION_TEXT).map(([value, label]) => ({
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
        <div className="grid gap-4">
          {query.data?.items.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <CardTitle>{ACTION_TEXT[log.action] ?? log.action}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {ENTITY_TEXT[log.entityType] ?? log.entityType}
                  </Badge>
                  <Badge variant="secondary">
                    {displayMoment(log.createdAt)}
                  </Badge>
                </div>
                <p>
                  Người thực hiện:{" "}
                  {log.actor
                    ? `${log.actor.displayName ?? log.actor.email} (${log.actor.email})`
                    : "Hệ thống"}
                </p>
                <p className="break-all text-muted-foreground">
                  Mã đối tượng: {log.entityId}
                </p>
                {(log.beforeData != null || log.afterData != null) && (
                  <details className="rounded-xl border border-border p-3">
                    <summary className="cursor-pointer">
                      Chi tiết thay đổi
                    </summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      {[
                        ["Trước", log.beforeData],
                        ["Sau", log.afterData],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <p className="font-medium">{String(label)}</p>
                          <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs">
                            {value == null
                              ? "—"
                              : JSON.stringify(value, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncBoundary>
      <TablePagination
        totalItems={query.data?.total ?? 0}
        fixedPageSize={PAGE_SIZE}
      />
    </PageContainer>
  );
}
