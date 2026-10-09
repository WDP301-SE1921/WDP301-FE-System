import { z } from "zod";

export const parentEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Nhập email hợp lệ.").max(255),
});
export const parentSearchSchema = z.object({
  email: z.string().trim().toLowerCase().min(2).max(255),
});
// Proposed BE search response. A suggestion is never trusted as a child-owner lookup.
export const parentSuggestionsSchema = z.array(
  z.object({
    id: z.string().min(1),
    email: z.string().email(),
    displayName: z.string().nullable(),
    status: z.enum(["ACTIVE", "DISABLED"]),
  }),
);
export const registrationSchema = z.object({
  targetStudentId: z.string().min(1, "Chọn hồ sơ con."),
  classId: z.string().min(1, "Chọn lớp học."),
  startDate: z.iso.date("Chọn ngày bắt đầu hợp lệ."),
  packageMonths: z
    .number()
    .int()
    .min(1, "Chọn từ 1 đến 12 tháng.")
    .max(12, "Chọn từ 1 đến 12 tháng."),
  hasReceivedPayment: z.boolean(),
  receiptNumber: z.string().trim().max(191, "Số biên lai tối đa 191 ký tự."),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;
export const programSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên chương trình.").max(255),
  subject: z.string().trim().min(1, "Nhập môn học.").max(100),
  grade: z.number().int().min(6).max(9),
});
export type ProgramInput = z.infer<typeof programSchema>;
const scheduleSchema = z
  .object({
    weekday: z.number().int().min(1).max(7),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Nhập giờ hợp lệ."),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Nhập giờ hợp lệ."),
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: "Giờ bắt đầu phải trước giờ kết thúc.",
    path: ["endTime"],
  });
export const schedulesSchema = z
  .object({ schedules: z.array(scheduleSchema).max(14) })
  .superRefine(({ schedules }, context) => {
    schedules.forEach((slot, index) => {
      if (
        schedules
          .slice(0, index)
          .some(
            (other) =>
              other.weekday === slot.weekday &&
              other.startTime < slot.endTime &&
              slot.startTime < other.endTime,
          )
      )
        context.addIssue({
          code: "custom",
          message: "Khung giờ bị trùng.",
          path: ["schedules", index, "startTime"],
        });
    });
  });
export type SchedulesInput = z.infer<typeof schedulesSchema>;
export const registrationClassSchema = z.object({
  programId: z.string().min(1, "Chọn chương trình."),
  name: z.string().trim().min(1, "Nhập tên lớp.").max(255),
  capacity: z.number().int().min(1).max(1000),
  monthlyFee: z.number().finite().min(0),
  teacherId: z.string().trim(),
});
export type RegistrationClassInput = z.infer<typeof registrationClassSchema>;
