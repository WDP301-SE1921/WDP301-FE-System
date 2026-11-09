"use client";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { FilterBar } from "@/components/shared/data-table/filter-bar";
import { DateRangePicker } from "@/components/shared/pickers/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { userFacingMessage } from "@/lib/api/error-message";
import { academicApi } from "@/features/academic/api";
import {
  useLiveCommand,
  useLiveQuery,
} from "@/features/academic/hooks/use-live-api";
import { displayMoment } from "@/features/academic/components/live-fields";
import type { EmailDelivery } from "@/types/academic-workflows";

const PAGE_SIZE = 20;
const STATUS: Record<
  EmailDelivery["status"],
  { label: string; variant: "outline" | "info" | "success" | "danger" }
> = {
  PENDING: { label: "Chờ gửi", variant: "outline" },
  PROCESSING: { label: "Đang gửi", variant: "info" },
  SENT: { label: "Đã gửi", variant: "success" },
  FAILED: { label: "Gửi thất bại", variant: "danger" },
};
const STATUS_FILTERS = ["ALL", "FAILED", "PENDING", "PROCESSING", "SENT"] as const;
const STATUS_FILTER_TEXT: Record<(typeof STATUS_FILTERS)[number], string> = {
  ALL: "Tất cả trạng thái",
  FAILED: "Gửi thất bại",
  PENDING: "Chờ gửi",
  PROCESSING: "Đang gửi",
  SENT: "Đã gửi",
};
const EVENT_TEXT: Record<string, string> = {
  PAYMENT_CONFIRMED: "Xác nhận thanh toán",
  ATTENDANCE_FINALIZED: "Kết quả điểm danh",
  LEAVE_REQUESTED: "Yêu cầu nghỉ học",
  LEAVE_DECIDED: "Duyệt yêu cầu nghỉ",
  LEAVE_CANCELLED: "Hủy yêu cầu nghỉ",
  LEAVE_ENDED_EARLY: "Kết thúc nghỉ sớm",
  MAKEUP_BOOKED: "Đặt học bù",
  MAKEUP_CANCELLED: "Hủy học bù",
  MAKEUP_RESCHEDULED: "Đổi buổi học bù",
  ENROLLMENT_TRANSFERRED: "Chuyển lớp",
  ENROLLMENT_ENDED: "Kết thúc môn học",
  STUDENT_STUDY_ENDED: "Nghỉ học tại trung tâm",
  ACCOUNT_INVITATION: "Lời mời tài khoản",
  EMAIL_VERIFICATION: "Xác minh email",
  PASSWORD_RESET: "Đặt lại mật khẩu",
  ANNOUNCEMENT: "Thông báo lớp",
  TUITION_REMINDER: "Nhắc gia hạn học phí",
};

/**
 * Persisted email deliveries (BE outbox) with automatic retry and a manual retry.
 * Gồm cả thông báo lớp, lời mời và email tài khoản trong outbox của BE.
 * Lọc trạng thái trên URL (`?emailStatus=`), BE trả `total` sau lọc (BE-12).
 */
export function EmailDeliveriesTable() {
  const [
    { page, emailStatus, emailSearch, emailType, emailFrom, emailTo },
    setFilters,
  ] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    emailStatus: parseAsStringLiteral(STATUS_FILTERS).withDefault("ALL"),
    emailSearch: parseAsString.withDefault(""),
    emailType: parseAsString.withDefault(""),
    emailFrom: parseAsString.withDefault(""),
    emailTo: parseAsString.withDefault(""),
  });
  const status = emailStatus === "ALL" ? undefined : emailStatus;
  // Lọc ở BE (người nhận, loại, ngày tạo theo UTC+7) để `total` và phân trang đúng.
  const filters = {
    search: emailSearch.trim() || undefined,
    eventType: emailType || undefined,
    fromDate: emailFrom || undefined,
    toDate: emailTo || undefined,
  };
  const hasFilters = Object.values(filters).some(Boolean);
  const query = useLiveQuery(
    ["email-deliveries", page, emailStatus, filters],
    (signal) =>
      academicApi.emailDeliveries(
        Math.max(1, page),
        PAGE_SIZE,
        signal,
        status,
        filters,
      ),
    true,
    (value) =>
      value.items.some(
        (email) => email.status === "PENDING" || email.status === "PROCESSING",
      ),
  );
  const retry = useLiveCommand();
  const columns: DataTableColumn<EmailDelivery>[] = [
    {
      id: "email",
      header: "Email",
      cell: ({ row: { original: email } }) => (
        <div className="max-w-72 min-w-48 space-y-1 whitespace-normal">
          <p className="font-medium">
            {email.subject || "(Không có tiêu đề)"}
          </p>
          <p className="text-xs break-all">{email.recipient}</p>
          <p className="text-xs text-muted-foreground">
            {EVENT_TEXT[email.eventType] ?? "Email nghiệp vụ khác"} · tạo{" "}
            {displayMoment(email.createdAt)}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row: { original: email } }) => (
        <div className="max-w-60 min-w-36 space-y-1 whitespace-normal">
          <Badge variant={STATUS[email.status].variant}>
            {STATUS[email.status].label}
          </Badge>
          <p className="text-xs text-muted-foreground tabular-nums">
            Lần gửi {email.attemptCount}/{email.maxAttempts}
            {email.sentAt ? ` · gửi ${displayMoment(email.sentAt)}` : ""}
          </p>
          {email.status === "PENDING" && email.attemptCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Tự gửi lại lúc {displayMoment(email.nextAttemptAt)}
            </p>
          )}
          {email.lastError && (
            <p className="text-xs break-words text-destructive">
              Lỗi gần nhất:{" "}
              {userFacingMessage(
                email.lastError,
                "Chưa gửi được email. Kiểm tra địa chỉ người nhận hoặc liên hệ quản trị để kiểm tra cấu hình gửi email.",
              )}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row: { original: email } }) =>
        email.status !== "SENT" &&
        email.status !== "PROCESSING" &&
        email.attemptCount < email.maxAttempts ? (
          <Button
            size="sm"
            variant="outline"
            disabled={retry.isPending}
            aria-label={`Gửi lại email ${email.subject || ""} tới ${email.recipient}`}
            onClick={() =>
              retry.mutate(() => academicApi.retryEmail(email.id), {
                onSettled: () => void query.refetch(),
              })
            }
          >
            Gửi lại
          </Button>
        ) : null,
    },
  ];
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Lịch sử email</CardTitle>
            <CardDescription>
              Email nghiệp vụ được lưu và tự gửi lại khi lỗi. Có thể gửi lại
              thủ công khi chưa hết số lần thử.
            </CardDescription>
          </div>
          <Select
            items={STATUS_FILTER_TEXT}
            value={emailStatus}
            onValueChange={(value) =>
              void setFilters({
                emailStatus:
                  STATUS_FILTERS.find((key) => key === value && key !== "ALL") ??
                  null,
                page: null,
              })
            }
          >
            <SelectTrigger className="w-44" aria-label="Lọc trạng thái email">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((key) => (
                <SelectItem key={key} value={key}>
                  {STATUS_FILTER_TEXT[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <FilterBar
          searchParamKey="emailSearch"
          searchPlaceholder="Tìm email người nhận…"
          showClearButton={false}
          onSearchChange={() => void setFilters({ page: null })}
        >
          <Select
            items={{ ALL: "Mọi loại email", ...EVENT_TEXT }}
            value={emailType || "ALL"}
            onValueChange={(value) =>
              void setFilters({
                emailType: value && value !== "ALL" ? String(value) : null,
                page: null,
              })
            }
          >
            <SelectTrigger className="w-52" aria-label="Lọc loại email">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi loại email</SelectItem>
              {Object.entries(EVENT_TEXT).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker
            fromParamKey="emailFrom"
            toParamKey="emailTo"
            placeholder="Ngày tạo email"
            onChange={() => void setFilters({ page: null })}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-muted-foreground"
              onClick={() =>
                void setFilters({
                  emailSearch: null,
                  emailType: null,
                  emailFrom: null,
                  emailTo: null,
                  page: null,
                })
              }
            >
              Xóa bộ lọc
            </Button>
          )}
        </FilterBar>
        {retry.error instanceof ApiError && retry.error.status >= 500 ? (
          // BE đã lưu lần thử trước khi trả lỗi gửi email.
          <p role="alert" className="text-sm text-destructive">
            Gửi lại không thành công. Xem lỗi gần nhất của email trong danh
            sách.
          </p>
        ) : (
          <ApiFeedback error={retry.error} />
        )}
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          emptyTitle={
            hasFilters
              ? "Không có email khớp bộ lọc"
              : status
                ? "Không có email ở trạng thái này"
                : "Chưa có email nào được lưu"
          }
        />
        <TablePagination
          totalItems={query.data?.total ?? 0}
          fixedPageSize={PAGE_SIZE}
        />
      </CardContent>
    </Card>
  );
}
