import { z } from "zod";

/** Form ghi nhận hoàn tiền; `max` = số còn có thể hoàn (đã thu − đã hoàn − đang chờ duyệt). */
export function refundFormSchema(max: number) {
  return z.object({
    amount: z
      .number({ error: "Nhập số tiền hoàn." })
      .int("Số tiền là số nguyên đồng.")
      .positive("Số tiền hoàn phải lớn hơn 0.")
      .max(max, `Không quá ${new Intl.NumberFormat("vi-VN").format(max)} đ.`),
    method: z.enum(["CASH", "BANK_TRANSFER"], {
      error: "Chọn hình thức hoàn.",
    }),
    reason: z.string().trim().min(1, "Chọn lý do.").max(300),
  });
}
export type RefundFormInput = z.infer<ReturnType<typeof refundFormSchema>>;

export const refundDecisionSchema = z.object({
  note: z.string().trim().max(300),
});
