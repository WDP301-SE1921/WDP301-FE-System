"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationApi } from "@/features/registration-flow/api";
import { useCurrentUser } from "@/hooks/use-current-role";
import { ApiFeedback } from "@/components/shared/feedback/api-feedback";
import { toast } from "@/components/ui/toast";
import type { RegistrationReceipt, RegistrationOrder } from "@/types/backend";
import { ApiError } from "@/lib/api/client";
import { RegistrationBillCard } from "./registration-bill-card";
import { OfflinePaymentDialog } from "./offline-payment-dialog";

export function RegistrationBillPanel({
  registrationId,
  onPaid,
}: {
  registrationId: string;
  onPaid?: (receipt: RegistrationReceipt) => Promise<void>;
}) {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const bill = useQuery({
    queryKey: ["registration-bill", registrationId],
    queryFn: ({ signal }) => registrationApi.bill(registrationId, signal),
    retry: false,
    staleTime: 0,
  });
  return (
    <div className="space-y-4">
      {bill.isPending && <p>Đang tải bill…</p>}
      <ApiFeedback error={bill.error} retry={() => void bill.refetch()} />
      {bill.data && !bill.isError && (
        <RegistrationBillCard
          bill={bill.data}
          onConfirm={() => setOpen(true)}
        />
      )}
      {open && bill.data && user && !bill.isError && (
        <OfflinePaymentDialog
          key={`${user.id}:${registrationId}`}
          bill={bill.data}
          operatorId={user.id}
          onClose={() => setOpen(false)}
          onConfirm={async (attempt) => {
            const receipt = await registrationApi.confirm(
              registrationId,
              attempt.key,
              attempt.body,
            );
            if (
              receipt.registrationId !== registrationId ||
              receipt.status !== "COMPLETED"
            )
              throw new ApiError(
                "INVALID_API_RESPONSE",
                "Không đọc được kết quả thu tiền. Kiểm tra lại bill trước khi thử lại.",
                502,
              );
            queryClient.setQueryData(
              ["registration-receipt", registrationId],
              receipt,
            );
            queryClient.setQueryData(
              ["registration", registrationId],
              (order: RegistrationOrder | undefined) =>
                order ? { ...order, status: "COMPLETED" } : order,
            );
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["registration-bill", registrationId],
              }),
              queryClient.invalidateQueries({
                queryKey: ["registration", registrationId],
              }),
              queryClient.invalidateQueries({
                queryKey: ["registration-classes"],
              }),
            ]);
            await onPaid?.(receipt);
            toast.success("Đã xác nhận học phí và ghi danh cho con.");
          }}
        />
      )}
    </div>
  );
}
