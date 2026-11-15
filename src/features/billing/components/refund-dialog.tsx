"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import { ReasonSelect } from "@/components/shared/forms/reason-select";
import { REASON_PRESETS } from "@/constants/reason-presets";
import { PAYMENT_METHOD_OPTIONS } from "@/features/billing/payment-method";
import { registrationApi } from "@/features/registration-flow/api";
import { displayDate, money } from "@/features/registration-flow/calendar";
import { MoneyInput } from "@/features/registration-flow/components/money-input";
import {
  refundFormSchema,
  type RefundFormInput,
} from "@/lib/validators/refund";

export interface RefundTarget {
  paymentId: string;
  receiptNumber: string;
  studentName: string;
  /** Có ghi danh thì hiện đề xuất các tháng chưa bắt đầu. */
  enrollmentId?: string | null;
  /** Đã thu trừ đã hoàn (dùng khi không có đề xuất). */
  remaining: number;
}

/**
 * Ghi nhận hoàn tiền: hệ thống đề xuất các tháng chưa bắt đầu (tháng đang học không hoàn,
 * tháng Tết tính nửa giá); Nhân viên chọn số tiền thật đã trả và hình thức, Quản lý duyệt sau.
 */
export function RefundDialog({
  target,
  onClose,
}: {
  target: RefundTarget;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const quote = useQuery({
    queryKey: ["refund-quote", target.enrollmentId],
    queryFn: ({ signal }) =>
      registrationApi.refundQuote(target.enrollmentId!, signal),
    enabled: !!target.enrollmentId,
    retry: false,
  });
  const proposed = quote.data ? Number(quote.data.refundable) : null;
  const max = quote.data
    ? Number(quote.data.paidAmount) -
      Number(quote.data.refundedAmount) -
      Number(quote.data.pendingAmount)
    : target.remaining;
  const schema = useMemo(() => refundFormSchema(Math.max(0, max)), [max]);
  const form = useForm<RefundFormInput>({
    resolver: zodResolver(schema),
    values: {
      amount: proposed ?? Number.NaN,
      method: "CASH",
      reason: REASON_PRESETS.refund[0],
    },
    resetOptions: { keepDirtyValues: true },
  });
  const amount = useWatch({ control: form.control, name: "amount" });
  const save = useMutation({
    mutationFn: (input: RefundFormInput) =>
      registrationApi.createRefund(target.paymentId, {
        amount: String(input.amount),
        method: input.method,
        reason: input.reason.trim(),
      }),
    onSuccess: async () => {
      // Các bảng dùng `useLiveQuery` nằm dưới khóa "web-api"; biên lai trong Sheet dùng khóa riêng.
      await queryClient.invalidateQueries({ queryKey: ["web-api"] });
      await queryClient.invalidateQueries({ queryKey: ["registration-receipt"] });
      onClose();
    },
  });
  const overProposal = proposed !== null && Number.isFinite(amount) && amount > proposed;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
    >
      <DialogContent size="full" showCloseButton={!save.isPending}>
        <DialogHeader>
          <DialogTitle>Ghi nhận hoàn tiền</DialogTitle>
          <DialogDescription>
            Biên lai {target.receiptNumber} · {target.studentName}. Khoản hoàn
            chỉ trừ vào doanh thu sau khi Quản lý duyệt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-3" aria-label="Đề xuất số tiền hoàn">
            <h3 className="text-sm font-semibold">Đề xuất của hệ thống</h3>
            {!target.enrollmentId ? (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                Phiếu này không gắn ghi danh nên không có đề xuất. Còn có thể
                hoàn tối đa {money(target.remaining)}.
              </p>
            ) : quote.isPending ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : quote.isError ? (
              <ApiFeedback error={quote.error} retry={() => void quote.refetch()} />
            ) : (
              <>
                <ul className="divide-y rounded-xl border text-sm">
                  {quote.data.months.map((month) => (
                    <li
                      key={month.fromDate}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span>
                        {displayDate(month.fromDate)} – {displayDate(month.toDate)}
                        {month.tet && (
                          <Badge variant="info" className="ml-2">
                            Tết · nửa giá
                          </Badge>
                        )}
                      </span>
                      <span className="flex items-center gap-2 tabular-nums">
                        {money(month.price)}
                        <Badge variant={month.started ? "neutral" : "success"}>
                          {month.started ? "Đã/đang học" : "Chưa bắt đầu"}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Đã thu</dt>
                    <dd className="tabular-nums">{money(quote.data.paidAmount)}</dd>
                  </div>
                  {Number(quote.data.refundedAmount) > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Đã hoàn trước đó</dt>
                      <dd className="tabular-nums">
                        −{money(quote.data.refundedAmount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <dt>Đề xuất hoàn (tháng chưa bắt đầu)</dt>
                    <dd className="tabular-nums text-primary">
                      {money(quote.data.refundable)}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Tính đến {displayDate(quote.data.asOf)}. Tháng đang học không
                  hoàn.
                </p>
              </>
            )}
          </section>
          <form
            id="refund-form"
            className="space-y-4"
            onSubmit={(event) => void form.handleSubmit((input) => save.mutate(input))(event)}
          >
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Số tiền hoàn</Label>
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <MoneyInput
                    id="refund-amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={!!fieldState.error}
                    errorId="refund-amount-error"
                    disabled={save.isPending}
                  />
                )}
              />
              <div id="refund-amount-error">
                <FieldError message={form.formState.errors.amount?.message} />
              </div>
              {overProposal && (
                <p className="text-sm text-amber-700">
                  Cao hơn đề xuất {money(proposed)}. Quản lý sẽ xem lý do khi
                  duyệt.
                </p>
              )}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Hình thức hoàn</legend>
              <Controller
                control={form.control}
                name="method"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={save.isPending}
                    className="grid-cols-2 gap-3"
                    aria-label="Hình thức hoàn"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <Label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5"
                      >
                        <RadioGroupItem value={option.value} />
                        {option.label}
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              />
              <FieldError message={form.formState.errors.method?.message} />
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Lý do</Label>
              <Controller
                control={form.control}
                name="reason"
                render={({ field, fieldState }) => (
                  <ReasonSelect
                    id="refund-reason"
                    value={field.value}
                    onChange={field.onChange}
                    presets={REASON_PRESETS.refund}
                    invalid={!!fieldState.error}
                    disabled={save.isPending}
                  />
                )}
              />
              <FieldError message={form.formState.errors.reason?.message} />
            </div>
            <ApiFeedback error={save.error} />
          </form>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={save.isPending} onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="submit"
            form="refund-form"
            isLoading={save.isPending}
            disabled={max <= 0}
          >
            Gửi Quản lý duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
