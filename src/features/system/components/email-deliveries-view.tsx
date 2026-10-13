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
};

/**
 * Persisted email deliveries (BE outbox) with automatic retry and a manual retry.
 * Announcements sent from "Gửi thông báo" are delivered directly and are not listed here.
 */
export function EmailDeliveriesView() {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const query = useLiveQuery(["email-deliveries", page], (signal) =>
    academicApi.emailDeliveries(Math.max(1, page), PAGE_SIZE, signal),
  );
  const retry = useLiveCommand();
  return (
    <PageContainer>
      <PageHeader
        title="Lịch sử email"
        description="Email nghiệp vụ được lưu và tự gửi lại khi lỗi. Có thể gửi lại thủ công khi chưa hết số lần thử."
      />
      {retry.error instanceof ApiError && retry.error.status >= 500 ? (
        // BE currently answers an SMTP rejection with a 500; the attempt is still recorded.
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
