"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table/data-table";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { ReasonSelect } from "@/components/shared/forms/reason-select";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { REASON_PRESETS } from "@/constants/reason-presets";
import { displayMoment } from "@/features/academic/components/live-fields";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { paymentMethodLabel } from "@/features/billing/payment-method";
import { LivePaymentHistory } from "@/features/directory/components/payment-history";
import { registrationApi } from "@/features/registration-flow/api";
import { money } from "@/features/registration-flow/calendar";
import type { RefundListItem } from "@/types/backend";

const TABS = ["pending", "decided", "payments"] as const;
const PAGE_SIZE = 20;

const STATUS_BADGE: Record<
  RefundListItem["status"],
  { label: string; variant: "warning" | "success" | "neutral" }
> = {
  PENDING: { label: "Chờ duyệt", variant: "warning" },
  APPROVED: { label: "Đã duyệt", variant: "success" },
  REJECTED: { label: "Từ chối", variant: "neutral" },
};

/**
 * Thu tiền & hoàn tiền (Quản lý): duyệt các khoản hoàn Nhân viên ghi nhận; chỉ khoản đã duyệt
 * mới trừ vào doanh thu. Tab Phiếu thu chỉ đọc, có lọc tiền mặt / chuyển khoản.
 */
export function ManagerPaymentsView() {
  const [{ tab, page }, setParams] = useQueryStates({
    tab: parseAsStringLiteral(TABS).withDefault("pending"),
    page: parseAsInteger.withDefault(1),
  });
  const [deciding, setDeciding] = useState<{
    refund: RefundListItem;
    approve: boolean;
  } | null>(null);
  const refunds = useLiveQuery(
    ["refunds", tab, page],
    (signal) =>
      tab === "pending"
        ? registrationApi.refunds({ status: "PENDING", page, limit: PAGE_SIZE }, signal)
        : registrationApi.refunds({ page, limit: PAGE_SIZE }, signal),
    tab !== "payments",
  );
  const rows =
    tab === "decided"
      ? (refunds.data?.items ?? []).filter((row) => row.status !== "PENDING")
      : (refunds.data?.items ?? []);
  const columns: DataTableColumn<RefundListItem>[] = [
    {
      id: "receipt",
      header: "Phiếu thu",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium">{row.original.payment.receiptNumber}</p>
          <p className="text-xs text-muted-foreground">
            Đã thu {money(row.original.payment.amount)} ·{" "}
            {paymentMethodLabel(row.original.payment.method)}
          </p>
        </div>
      ),
    },
    {
      id: "student",
      header: "Học sinh / Lớp",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium">{row.original.payment.studentFullName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.payment.className}
          </p>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Số tiền hoàn",
      cell: ({ row }) => (
        <div className="space-y-1 text-right">
          <p className="font-semibold tabular-nums">{money(row.original.amount)}</p>
          <Badge variant="info">{paymentMethodLabel(row.original.method)}</Badge>
        </div>
      ),
    },
    { id: "reason", header: "Lý do", cell: ({ row }) => row.original.reason },
    {
      id: "requested",
      header: "Người ghi nhận",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p>{row.original.requestedBy?.displayName ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {displayMoment(row.original.requestedAt)}
          </p>
        </div>
      ),
    },
    tab === "pending"
      ? {
          id: "actions",
          header: "Thao tác",
          cell: ({ row }) => (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                aria-label={`Duyệt hoàn ${row.original.payment.receiptNumber}`}
                onClick={() => setDeciding({ refund: row.original, approve: true })}
              >
                Duyệt
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label={`Từ chối hoàn ${row.original.payment.receiptNumber}`}
                onClick={() => setDeciding({ refund: row.original, approve: false })}
              >
                Từ chối
              </Button>
            </div>
          ),
        }
      : {
          id: "result",
          header: "Kết quả",
          cell: ({ row }) => {
            const badge = STATUS_BADGE[row.original.status];
            return (
              <div className="space-y-1">
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <p className="text-xs text-muted-foreground">
                  {row.original.decidedBy?.displayName ?? ""}
                  {row.original.decidedAt
                    ? ` · ${displayMoment(row.original.decidedAt)}`
                    : ""}
                </p>
                {row.original.decisionNote && (
                  <p className="text-xs text-muted-foreground">
                    {row.original.decisionNote}
                  </p>
                )}
              </div>
            );
          },
        },
  ];
  const total = refunds.data?.total ?? 0;
  return (
    <PageContainer maxWidth="full" className="min-w-0 space-y-6">
      <PageHeader
        title="Thu tiền & hoàn tiền"
        description="Duyệt các khoản hoàn Nhân viên đã ghi nhận. Chỉ khoản đã duyệt mới trừ vào doanh thu."
      />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          void setParams({ tab: value as (typeof TABS)[number], page: null })
        }
      >
        <TabsList>
          <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="decided">Đã xử lý</TabsTrigger>
          <TabsTrigger value="payments">Phiếu thu</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "payments" ? (
        <LivePaymentHistory paymentsOnly defaultView="payments" />
      ) : (
        <Card className="min-w-0">
          <CardContent className="space-y-4 pt-6">
            <DataTable
              columns={columns}
              data={rows}
              isLoading={refunds.isPending}
              isError={refunds.isError}
              error={refunds.error}
              onRetry={() => void refunds.refetch()}
              emptyTitle={
                tab === "pending"
                  ? "Không có khoản hoàn nào chờ duyệt"
                  : "Chưa có khoản hoàn đã xử lý"
              }
              emptyDescription="Nhân viên ghi nhận hoàn tiền ở màn Đăng ký & biên lai hoặc khi cho học sinh nghỉ."
            />
            {total > PAGE_SIZE && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  disabled={page <= 1 || refunds.isFetching}
                  onClick={() => void setParams({ page: page - 1 })}
                >
                  Trang trước
                </Button>
                <span>
                  Trang {page} · {total} khoản
                </span>
                <Button
                  variant="outline"
                  disabled={page * PAGE_SIZE >= total || refunds.isFetching}
                  onClick={() => void setParams({ page: page + 1 })}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {deciding && (
        <DecisionDialog
          refund={deciding.refund}
          approve={deciding.approve}
          onClose={() => setDeciding(null)}
        />
      )}
    </PageContainer>
  );
}

function DecisionDialog({
  refund,
  approve,
  onClose,
}: {
  refund: RefundListItem;
  approve: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const decide = useMutation({
    mutationFn: () =>
      registrationApi.decideRefund(refund.id, {
        approve,
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["web-api"] });
      onClose();
    },
  });
  const needsNote = !approve && !note.trim();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !decide.isPending) onClose();
      }}
    >
      <DialogContent size="lg" showCloseButton={!decide.isPending}>
        <DialogHeader>
          <DialogTitle>{approve ? "Duyệt hoàn tiền" : "Từ chối hoàn tiền"}</DialogTitle>
          <DialogDescription>
            {refund.payment.studentFullName} · biên lai {refund.payment.receiptNumber}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Số tiền hoàn</dt>
            <dd className="font-semibold">{money(refund.amount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Hình thức</dt>
            <dd className="font-semibold">{paymentMethodLabel(refund.method)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Lý do của Nhân viên</dt>
            <dd>{refund.reason}</dd>
          </div>
        </dl>
        {approve ? (
          <p className="text-sm">
            Doanh thu sẽ giảm {money(refund.amount)}. Phụ huynh nhận email báo đã
            hoàn tiền.
          </p>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="refund-reject-note">Lý do từ chối</Label>
            <ReasonSelect
              id="refund-reject-note"
              value={note}
              onChange={setNote}
              presets={REASON_PRESETS.refundReject}
              disabled={decide.isPending}
            />
          </div>
        )}
        <ApiFeedback error={decide.error} />
        <DialogFooter>
          <Button variant="outline" disabled={decide.isPending} onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant={approve ? "default" : "destructive"}
            isLoading={decide.isPending}
            disabled={needsNote}
            onClick={() => decide.mutate()}
          >
            {approve ? "Duyệt hoàn tiền" : "Từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
