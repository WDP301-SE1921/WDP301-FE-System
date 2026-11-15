"use client";

import { BankIcon, Cash01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { useLiveQuery } from "@/features/academic/hooks/use-live-api";
import { registrationApi } from "@/features/registration-flow/api";
import { displayDate, money } from "@/features/registration-flow/calendar";
import { todayLocalDate } from "@/lib/validators/web-workflows";

/**
 * Đối soát cuối ca của chính Nhân viên: tiền mặt thu − tiền mặt hoàn (đã duyệt) = tiền phải có
 * trong két; chuyển khoản để khớp sao kê.
 */
export function ShiftSummaryCard() {
  const date = todayLocalDate();
  const summary = useLiveQuery(["shift-summary", date], (signal) =>
    registrationApi.shiftSummary({ date }, signal),
  );
  const data = summary.data;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Ca hôm nay của tôi · {displayDate(date)}</CardTitle>
      </CardHeader>
      <CardContent>
        {summary.isPending ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : summary.isError || !data ? (
          <ApiFeedback error={summary.error} retry={() => void summary.refetch()} />
        ) : (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3 rounded-xl border p-4">
              <HugeiconsIcon icon={Cash01Icon} className="mt-0.5 size-5 text-primary" aria-hidden />
              <div className="space-y-1 text-sm">
                <dt className="text-muted-foreground">Tiền mặt</dt>
                <dd>
                  Thu {money(data.collected.CASH.amount)} ({data.collected.CASH.count} phiếu)
                </dd>
                {Number(data.refunded.CASH.amount) > 0 && (
                  <dd className="text-muted-foreground">
                    Hoàn −{money(data.refunded.CASH.amount)}
                  </dd>
                )}
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border p-4">
              <HugeiconsIcon icon={BankIcon} className="mt-0.5 size-5 text-primary" aria-hidden />
              <div className="space-y-1 text-sm">
                <dt className="text-muted-foreground">Chuyển khoản</dt>
                <dd>
                  Thu {money(data.collected.BANK_TRANSFER.amount)} (
                  {data.collected.BANK_TRANSFER.count} phiếu)
                </dd>
                {Number(data.refunded.BANK_TRANSFER.amount) > 0 && (
                  <dd className="text-muted-foreground">
                    Hoàn −{money(data.refunded.BANK_TRANSFER.amount)}
                  </dd>
                )}
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-primary/5 p-4">
              <HugeiconsIcon icon={Wallet01Icon} className="mt-0.5 size-5 text-primary" aria-hidden />
              <div className="space-y-1 text-sm">
                <dt className="text-muted-foreground">Tiền mặt phải có trong két</dt>
                <dd className="text-xl font-semibold text-primary tabular-nums">
                  {money(data.cashInDrawer)}
                </dd>
                {data.collected.UNKNOWN.count > 0 && (
                  <dd className="text-xs text-muted-foreground">
                    {data.collected.UNKNOWN.count} phiếu chưa ghi hình thức
                  </dd>
                )}
              </div>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
