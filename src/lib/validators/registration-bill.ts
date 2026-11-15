import { z } from "zod";

// Keep Decimal amounts as strings from BE. Never re-price an issued bill on the client.
const decimalAmount = z.string().regex(/^\d{1,12}(?:\.\d{1,2})?$/);
export const paymentMethodSchema = z.enum(["CASH", "BANK_TRANSFER"]);
export const paymentRefundSchema = z.object({
  id: z.string().min(1),
  amount: decimalAmount,
  method: paymentMethodSchema,
  reason: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  requestedAt: z.iso.datetime({ offset: true }),
  decidedAt: z.iso.datetime({ offset: true }).nullable(),
});
const billPayment = z.object({
  receiptNumber: z.string().min(1),
  paidAmount: decimalAmount,
  confirmedAt: z.iso.datetime({ offset: true }),
  // BE cũ chưa trả hai trường dưới: coi như chưa rõ hình thức, chưa hoàn.
  method: paymentMethodSchema.nullable().optional(),
  refunds: z.array(paymentRefundSchema).optional(),
});
const tetDiscount = z.object({
  amount: decimalAmount,
  fromDate: z.iso.date(),
  toDate: z.iso.date(),
});
export const registrationBillSchema = z
  .object({
    billNumber: z.string().min(1),
    registrationId: z.string().min(1),
    status: z.enum(["UNPAID", "PAID", "CANCELLED"]),
    issuedAt: z.iso.datetime({ offset: true }),
    parent: z.object({
      displayName: z.string().nullable(),
      email: z.string().email(),
      phone: z.string().nullable(),
    }),
    student: z.object({
      id: z.string().min(1).nullable(),
      fullName: z.string().min(1),
      grade: z.number().int().min(6).max(9),
    }),
    class: z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      subject: z.string().min(1),
      grade: z.number().int().min(6).max(9),
      schedules: z.array(
        z.object({
          weekday: z.number().int().min(1).max(7),
          startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        }),
      ),
    }),
    term: z.object({
      packageMonths: z.number().int().min(1).max(12),
      startDate: z.iso.date().nullable(),
      endDate: z.iso.date().nullable(),
    }),
    pricing: z.object({
      monthlyFee: decimalAmount,
      packageMonths: z.number().int().min(1).max(12),
      total: decimalAmount,
      currency: z.literal("VND"),
      listTotal: decimalAmount.optional(),
      tetDiscount: tetDiscount.nullable().optional(),
    }),
    payment: billPayment.nullable(),
  })
  .superRefine((bill, context) => {
    if ((bill.status === "PAID") !== (bill.payment !== null))
      context.addIssue({
        code: "custom",
        path: ["payment"],
        message: "Trạng thái bill và thanh toán không khớp.",
      });
    if (bill.billNumber !== bill.registrationId)
      context.addIssue({
        code: "custom",
        path: ["billNumber"],
        message: "Mã bill không khớp đăng ký.",
      });
  });

export const offlineConfirmationSchema = z.object({
  method: z.enum(["CASH", "BANK_TRANSFER"], {
    error: "Chọn hình thức thanh toán.",
  }),
  receiptNumber: z.string().trim().max(191, "Số biên lai tối đa 191 ký tự."),
  hasReceivedPayment: z
    .boolean()
    .refine(Boolean, "Xác nhận đã nhận đủ học phí."),
});
export type OfflineConfirmationInput = z.infer<
  typeof offlineConfirmationSchema
>;
