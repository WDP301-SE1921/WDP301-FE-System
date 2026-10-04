"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { displayDate, money, scheduleText, termLabel } from "../calendar";
import type { RegistrationReceipt as ReceiptData } from "@/types/backend";

export function RegistrationReceipt({ receipt }: { receipt: ReceiptData }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          In biên lai
        </Button>
      </div>
      <article
        data-registration-receipt
        className="space-y-6 rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex flex-wrap justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-sm font-semibold text-primary">EduGrade</p>
            <h2 className="text-xl font-semibold">Biên lai thu học phí</h2>
            <p className="text-sm text-muted-foreground">
              {receipt.payment.receiptNumber}
            </p>
          </div>
          <Badge variant="success">Đã thu đủ học phí</Badge>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {[
            [
              "Học sinh",
              `${receipt.student.fullName} · Khối ${receipt.student.grade}`,
            ],
            ["Phụ huynh", receipt.parentEmail],
            ["Lớp / môn", `${receipt.class.name} · ${receipt.class.subject}`],
            ["Lịch tuần", scheduleText(receipt.class.schedules)],
            [
              "Kỳ học",
              `${displayDate(receipt.term.startDate)} → trước ${displayDate(receipt.term.endDate)}`,
            ],
            [
              "Gói học",
              `${receipt.term.packageMonths} tháng · ${termLabel(receipt.term.startDate, receipt.term.endDate)}`,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-between gap-3 rounded-xl bg-muted p-4">
          <span>Tổng học phí đã thu</span>
          <strong className="text-lg text-primary">
            {money(receipt.payment.amount)}
          </strong>
        </div>
        <p className="text-xs text-muted-foreground">
          Thanh toán offline · Xác nhận{" "}
          {new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "Asia/Ho_Chi_Minh",
          }).format(new Date(receipt.payment.confirmedAt))}
        </p>
        <p className="text-xs text-muted-foreground break-all">
          Mã đăng ký: {receipt.registrationId} · Mã ghi danh:{" "}
          {receipt.enrollment.id}
        </p>
      </article>
    </div>
  );
}
