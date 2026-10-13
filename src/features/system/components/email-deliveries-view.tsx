"use client";
import { parseAsInteger, useQueryState } from "nuqs";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { AsyncBoundary } from "@/components/shared/feedback/async-boundary";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { TablePagination } from "@/components/shared/data-table/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
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
  return (
    <PageContainer>
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
      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        data={query.data?.items}
        emptyProps={{ title: "Chưa có email nào được lưu" }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.items.map((email) => {
            const status = STATUS[email.status];
            const canRetry =
              email.status !== "SENT" &&
              email.status !== "PROCESSING" &&
              email.attemptCount < email.maxAttempts;
            return (
              <Card key={email.id}>
                <CardHeader>
                  <CardTitle>{email.subject || "(Không có tiêu đề)"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <p className="break-all">Người nhận: {email.recipient}</p>
                  <p>Loại: {EVENT_TEXT[email.eventType] ?? email.eventType}</p>
                  <p>
                    Số lần gửi: {email.attemptCount}/{email.maxAttempts}
                  </p>
                  <p>Tạo lúc {displayMoment(email.createdAt)}</p>
                  {email.sentAt && <p>Gửi lúc {displayMoment(email.sentAt)}</p>}
                  {email.status === "PENDING" && email.attemptCount > 0 && (
                    <p>Tự gửi lại lúc {displayMoment(email.nextAttemptAt)}</p>
                  )}
                  {email.lastError && (
                    <p className="break-words text-destructive">
                      Lỗi gần nhất: {email.lastError}
                    </p>
                  )}
                  {canRetry && (
                    <Button
                      variant="outline"
                      disabled={retry.isPending}
                      onClick={() =>
                        retry.mutate(() => academicApi.retryEmail(email.id), {
                          onSettled: () => void query.refetch(),
                        })
                      }
                    >
                      Gửi lại
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </AsyncBoundary>
      <TablePagination
        totalItems={query.data?.total ?? 0}
        fixedPageSize={PAGE_SIZE}
      />
    </PageContainer>
  );
}
