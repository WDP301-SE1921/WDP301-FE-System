import { Badge } from "@/components/ui/badge";
import { displayDate, money } from "@/features/registration-flow/calendar";
import { paymentMethodLabel } from "@/features/billing/payment-method";
import type {
  PaymentMethod,
  PaymentRefund,
  TetDiscount,
} from "@/types/backend";

/** Giá gốc → giảm Tết → phải thu; không có Tết thì không hiện gì (bill cũ giữ nguyên). */
export function TetDiscountLines({
  listTotal,
  tetDiscount,
}: {
  listTotal?: string | number;
  tetDiscount?: TetDiscount | { amount: number; fromDate: string; toDate: string } | null;
}) {
  if (!tetDiscount) return null;
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-muted-foreground">Học phí theo số tháng</dt>
        <dd className="tabular-nums">{money(listTotal ?? 0)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted-foreground">
          Giảm 50% tháng có Tết ({displayDate(tetDiscount.fromDate)} –{" "}
          {displayDate(tetDiscount.toDate)})
        </dt>
        <dd className="tabular-nums text-emerald-700">
          −{money(tetDiscount.amount)}
        </dd>
      </div>
    </dl>
  );
}

const localDay = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(iso),
  );

const refundTotal = (refunds: PaymentRefund[], status: PaymentRefund["status"]) =>
  refunds
    .filter((refund) => refund.status === status)
    .reduce((sum, refund) => sum + Number(refund.amount), 0);

/** Hình thức thu và các lần hoàn của một phiếu thu. */
export function PaymentMethodAndRefunds({
  method,
  refunds = [],
  paidAmount,
}: {
  method?: PaymentMethod | null;
  refunds?: PaymentRefund[];
  paidAmount: string | number;
}) {
  const approved = refundTotal(refunds, "APPROVED");
  const pending = refunds.filter((refund) => refund.status === "PENDING");
  return (
    <div className="space-y-2 text-sm">
      <p>
        Hình thức: <strong>{paymentMethodLabel(method)}</strong>
      </p>
      {refunds
        .filter((refund) => refund.status === "APPROVED")
        .map((refund) => (
          <p key={refund.id} className="text-muted-foreground">
            Đã hoàn {money(refund.amount)} ({paymentMethodLabel(refund.method)})
            {refund.decidedAt ? ` ngày ${localDay(refund.decidedAt)}` : ""} ·{" "}
            {refund.reason}
          </p>
        ))}
      {pending.map((refund) => (
        <p key={refund.id}>
          <Badge variant="warning">Chờ Quản lý duyệt</Badge> Hoàn{" "}
          {money(refund.amount)} ({paymentMethodLabel(refund.method)})
        </p>
      ))}
      {approved > 0 && (
        <p className="font-medium">
          Thực thu sau hoàn: {money(Number(paidAmount) - approved)}
        </p>
      )}
    </div>
  );
}

/** Nhãn trạng thái hoàn cho biên lai / danh sách. */
export function refundState(
  refunds: PaymentRefund[] | undefined,
  paidAmount: string | number,
): { label: string; variant: "warning" | "secondary" | "destructive" } | null {
  if (!refunds?.length) return null;
  const approved = refundTotal(refunds, "APPROVED");
  if (refunds.some((refund) => refund.status === "PENDING"))
    return { label: "Chờ duyệt hoàn", variant: "warning" };
  if (approved <= 0) return null;
  return approved >= Number(paidAmount)
    ? { label: "Đã hoàn toàn bộ", variant: "destructive" }
    : { label: `Đã hoàn ${money(approved)}`, variant: "secondary" };
}
