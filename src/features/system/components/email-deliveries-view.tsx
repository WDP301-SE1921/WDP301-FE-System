"use client";
import { parseAsInteger, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
 * Gom ca thong bao lop, loi moi va email tai khoan trong outbox cua BE.
 */
export function EmailDeliveriesView() {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const query = useLiveQuery(
    ["email-deliveries", page],
    (signal) =>
      academicApi.emailDeliveries(Math.max(1, page), PAGE_SIZE, signal),
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
        <div className="max-w-80 min-w-56 space-y-1 whitespace-normal">
          <p className="font-medium">
            {email.subject || "(Không có tiêu đề)"}
          </p>
          <p className="text-xs text-muted-foreground">
            {EVENT_TEXT[email.eventType] ?? "Email nghiệp vụ khác"}
          </p>
        </div>
      ),
    },
    {
      id: "recipient",
      header: "Người nhận",
      cell: ({ row }) => (
        <span>{row.original.recipient}</span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row: { original: email } }) => (
        <div className="max-w-72 min-w-40 space-y-1 whitespace-normal">
          <Badge variant={STATUS[email.status].variant}>
            {STATUS[email.status].label}
          </Badge>
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
      id: "attempts",
      header: "Lần gửi",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.attemptCount}/{row.original.maxAttempts}
        </span>
      ),
    },
    {
      id: "time",
      header: "Thời gian",
      cell: ({ row: { original: email } }) => (
        <div className="min-w-36 space-y-1 text-sm">
          <p>Tạo {displayMoment(email.createdAt)}</p>
          {email.sentAt && (
            <p className="text-muted-foreground">
              Gửi {displayMoment(email.sentAt)}
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
    <PageContainer maxWidth="full" className="min-w-0">
      <PageHeader
        title="Lịch sử email"
        description="Email nghiệp vụ được lưu và tự gửi lại khi lỗi. Có thể gửi lại thủ công khi chưa hết số lần thử."
      />
      {retry.error instanceof ApiError && retry.error.status >= 500 ? (
        // BE da luu lan thu truoc khi tra loi gui email.
        <p role="alert" className="text-sm text-destructive">
          Gửi lại không thành công. Xem lỗi gần nhất của email trong danh sách.
        </p>
      ) : (
        <ApiFeedback error={retry.error} />
      )}
      <Card className="min-w-0">
        <CardContent className="min-w-0 space-y-4">
          <DataTable
            columns={columns}
            data={query.data?.items ?? []}
            isLoading={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            emptyTitle="Chưa có email nào được lưu"
          />
          <TablePagination
            totalItems={query.data?.total ?? 0}
            fixedPageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
