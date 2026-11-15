import type { PaymentMethod } from "@/types/backend";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
};

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  hint: string;
}[] = [
  { value: "CASH", label: "Tiền mặt", hint: "Tiền nhận tại quầy, cuối ca đếm vào két." },
  {
    value: "BANK_TRANSFER",
    label: "Chuyển khoản",
    hint: "Đã thấy giao dịch vào tài khoản trung tâm.",
  },
];

/** Nhãn hình thức; phiếu thu trước khi có trường này hiện "Chưa ghi". */
export function paymentMethodLabel(method: PaymentMethod | null | undefined) {
  return method ? PAYMENT_METHOD_LABELS[method] : "Chưa ghi";
}
