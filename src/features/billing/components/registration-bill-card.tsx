"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RegistrationBill } from "@/types/backend";
import {
  displayDate,
  money,
  scheduleText,
} from "@/features/registration-flow/calendar";
import { paymentTime } from "../format";
import { printRegistrationDocument } from "@/features/registration-flow/print";

export function RegistrationBillCard({
  bill,
  onConfirm,
}: {
  bill: RegistrationBill;
  onConfirm: () => void;
}) {
  const status = {
    UNPAID: "Chưa thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
  } as const;
  return (
    <div className="space-y-3">
      <div className="flex justify-end print:hidden">
        <Button
          variant="outline"
          onClick={() => printRegistrationDocument("bill")}
        >
          In bill
        </Button>
      </div>
      <Card data-registration-bill>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Bill học phí</CardTitle>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {bill.billNumber}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lập lúc {paymentTime(bill.issuedAt)}
            </p>
          </div>
          <Badge
            variant={
              bill.status === "PAID"
                ? "success"
                : bill.status === "UNPAID"
                  ? "warning"
                  : "secondary"
            }
          >
            {status[bill.status]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Phụ huynh", bill.parent.displayName || bill.parent.email],
              ["Email phụ huynh", bill.parent.email],
              ["Điện thoại", bill.parent.phone || "—"],
              [
                "Học sinh",
                `${bill.student.fullName} · Khối ${bill.student.grade}`,
              ],
              ["Lớp / môn", `${bill.class.name} · ${bill.class.subject}`],
              [
                "Lịch tuần",
                scheduleText(bill.class.schedules) || "Chưa có lịch tuần",
              ],
              [
                "Kỳ học",
                bill.term.startDate && bill.term.endDate
                  ? `${displayDate(bill.term.startDate)} → trước ${displayDate(bill.term.endDate)}`
                  : "Chưa xác định",
              ],
              ["Gói học", `${bill.term.packageMonths} tháng`],
              [
                "Học phí tháng tại lúc lập bill",
                money(bill.pricing.monthlyFee),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-medium break-words">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-4">
            <span>
              {bill.status === "PAID"
                ? "Tổng học phí đã thu"
                : "Số tiền phải thu"}
            </span>
            <strong className="text-2xl text-primary">
              {money(bill.pricing.total)}
            </strong>
          </div>
          {bill.status === "UNPAID" && (
            <p className="text-sm text-muted-foreground">
              Khi chuyển khoản, dùng mã bill làm nội dung chuyển khoản. Chỉ xác
              nhận sau khi đã nhận đủ tiền.
            </p>
          )}
          {bill.status === "PAID" && bill.payment && (
            <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
              <p className="font-semibold">
                Biên lai {bill.payment.receiptNumber}
              </p>
              <p>
                Đã thu {money(bill.payment.paidAmount)} · Xác nhận lúc{" "}
                {paymentTime(bill.payment.confirmedAt)}
              </p>
              <p className="text-muted-foreground">
                Bill này chưa có thông tin phương thức thanh toán.
              </p>
            </div>
          )}
          {bill.status === "CANCELLED" && (
            <p className="text-sm text-muted-foreground">
              Bill đã hủy, không thể xác nhận thu tiền.
            </p>
          )}
          {bill.status === "UNPAID" && (
            <div className="flex justify-end print:hidden">
              <Button onClick={onConfirm}>Xác nhận thanh toán</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
