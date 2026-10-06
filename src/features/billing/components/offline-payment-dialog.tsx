"use client";

import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ApiFeedback,
  FieldError,
} from "@/components/shared/feedback/api-feedback";
import {
  offlineConfirmationSchema,
  type OfflineConfirmationInput,
} from "@/lib/validators/registration-bill";
import {
  getPaymentAttempt,
  readPaymentAttempt,
  type PaymentAttempt,
} from "@/features/registration-flow/storage";
import { money } from "@/features/registration-flow/calendar";
import type { RegistrationBill } from "@/types/backend";

// This uses the released receiptNumber contract. Payment method, received time and bank reference are not stored by BE yet.
export function OfflinePaymentDialog({
  bill,
  operatorId,
  onClose,
  onConfirm,
}: {
  bill: RegistrationBill;
  operatorId: string;
  onClose: () => void;
  onConfirm: (attempt: PaymentAttempt) => Promise<void>;
}) {
  const lock = useRef(false);
  const [restored] = useState(() => {
    try {
      return {
        attempt: readPaymentAttempt(operatorId, bill.registrationId),
        error: null,
      };
    } catch (error) {
      return { attempt: null, error };
    }
  });
  const [attempt, setAttempt] = useState(restored.attempt);
  const [error, setError] = useState<unknown>(restored.error);
  const form = useForm<OfflineConfirmationInput>({
    resolver: zodResolver(offlineConfirmationSchema),
    defaultValues: {
      receiptNumber: restored.attempt?.body.receiptNumber ?? "",
      hasReceivedPayment: false,
    },
  });
  const verified = useWatch({
    control: form.control,
    name: "hasReceivedPayment",
  });
  const pending = form.formState.isSubmitting;
  async function confirm(input: OfflineConfirmationInput) {
    if (lock.current || restored.error || bill.status !== "UNPAID") return;
    lock.current = true;
    setError(null);
    try {
      const saved = getPaymentAttempt(
        operatorId,
        bill.registrationId,
        input.receiptNumber,
      );
      setAttempt(saved);
      await onConfirm(saved);
      onClose();
    } catch (failure) {
      setError(failure);
    } finally {
      lock.current = false;
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent size="lg" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
          <DialogDescription>
            Bill {bill.billNumber} · {bill.student.fullName} ·{" "}
            {money(bill.pricing.total)}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            void form.handleSubmit(confirm)(event);
          }}
        >
          <p className="rounded-xl bg-muted p-4 text-sm">
            Kiểm tra tiền mặt đã nhận hoặc giao dịch chuyển khoản đã vào tài
            khoản trung tâm, đúng số tiền và mã bill.
          </p>
          <p className="text-sm text-muted-foreground">
            Bước này xác nhận thu tiền offline và tạo biên lai. Phương thức
            thanh toán, thời gian thu và mã giao dịch ngân hàng chưa được hỗ trợ
            lưu.
          </p>
          <div className="space-y-2">
            <Label htmlFor="registration-receipt-number">
              Số biên lai (không bắt buộc)
            </Label>
            <Input
              id="registration-receipt-number"
              placeholder="Để trống để hệ thống tự tạo số biên lai"
              disabled={pending || !!attempt || !!restored.error}
              {...form.register("receiptNumber")}
            />
            <FieldError
              message={form.formState.errors.receiptNumber?.message}
            />
          </div>
          <div className="flex items-start gap-3">
            <Controller
              control={form.control}
              name="hasReceivedPayment"
              render={({ field }) => (
                <Checkbox
                  id="registration-received"
                  checked={field.value}
                  disabled={pending || !!restored.error}
                  onCheckedChange={(value) => field.onChange(value === true)}
                />
              )}
            />
            <Label htmlFor="registration-received" className="leading-relaxed">
              Tôi đã kiểm tra và nhận đủ {money(bill.pricing.total)} cho bill
              này.
            </Label>
          </div>
          <FieldError
            message={form.formState.errors.hasReceivedPayment?.message}
          />
          {attempt && (
            <p className="text-sm text-muted-foreground">
              Thử lại giữ nguyên số biên lai và khóa xác nhận đã lưu.
            </p>
          )}
          <ApiFeedback error={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={
                pending ||
                !verified ||
                !!restored.error ||
                bill.status !== "UNPAID"
              }
              isLoading={pending}
            >
              {attempt ? "Thử xác nhận lại" : "Đã thanh toán"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
