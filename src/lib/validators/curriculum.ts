import { z } from "zod";

const date = z.iso.date("Ngày không hợp lệ.");
const title = z
  .string()
  .trim()
  .min(1, "Nhập tiêu đề.")
  .max(255, "Tiêu đề tối đa 255 ký tự.");
const content = z
  .string()
  .trim()
  .min(1, "Nhập nội dung.")
  .max(50000, "Nội dung tối đa 50.000 ký tự.");
const range = { fromDate: date, toDate: date };

function validRange(value: { fromDate: string; toDate: string }) {
  const days =
    (Date.parse(value.toDate) - Date.parse(value.fromDate)) / 86400000;
  return days >= 0 && days <= 365;
}
const rangeError = {
  message: "Ngày kết thúc phải từ ngày bắt đầu, trong khoảng tối đa 366 ngày.",
  path: ["toDate"],
};

export const curriculumUnitSchema = z
  .object({
    programId: z.string().min(1, "Chọn chương trình."),
    title,
    ...range,
  })
  .refine(validRange, rangeError);
export const curriculumLessonSchema = z.object({
  sequence: z
    .number()
    .int("Thứ tự phải là số nguyên.")
    .min(1, "Thứ tự bắt đầu từ 1."),
  title,
  content,
});
export const monthlyTestSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Chọn tháng kiểm tra."),
  title,
  content,
});
export const scheduleRangeSchema = z
  .object({
    curriculumUnitId: z.string().min(1, "Chọn học phần đã duyệt."),
    previewId: z.string().min(1).optional(),
    ...range,
  })
  .refine(validRange, rangeError);

export type CurriculumUnitInput = z.infer<typeof curriculumUnitSchema>;
export type CurriculumLessonInput = z.infer<typeof curriculumLessonSchema>;
export type MonthlyTestInput = z.infer<typeof monthlyTestSchema>;
export type ScheduleRangeInput = z.infer<typeof scheduleRangeSchema>;

export const reviewReasonSchema = z.object({
  reason: z.string().trim().min(1, "Nhập lý do.").max(2000),
});
export const lessonOrderSchema = z.object({
  orderedLessonIds: z.array(z.string().min(1)).min(1),
  expectedRevision: z.number().int().min(1),
});
export const importCommitSchema = z.object({
  previewId: z.string().min(1),
  expectedRevision: z.number().int().min(1),
  mode: z.enum(["APPEND", "REPLACE"]),
  rows: z
    .array(
      z.object({
        rowNumber: z.number().int().min(1),
        kind: z.enum(["LESSON", "MONTHLY_TEST"]),
        sequence: z.number().int().min(1).nullable(),
        title: z.string().min(1).max(255),
        content: z.string().min(1).max(50000),
        monthKey: z
          .string()
          .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
          .nullable(),
      }),
    )
    .min(1)
    .max(1000),
});
export type ImportCommitInput = z.infer<typeof importCommitSchema>;
export const sessionCancelSchema = reviewReasonSchema.extend({
  expectedRevision: z.number().int().min(1),
});
export const sessionRescheduleSchema = sessionCancelSchema
  .extend({
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
  })
  .refine((value) => Date.parse(value.endsAt) > Date.parse(value.startsAt), {
    message: "Giờ kết thúc phải sau giờ bắt đầu.",
    path: ["endsAt"],
  });
export type SessionRescheduleInput = z.infer<typeof sessionRescheduleSchema>;
export type SessionCancelInput = z.infer<typeof sessionCancelSchema>;

export const sessionActionFormSchema = reviewReasonSchema.extend({
  startsAt: z.string(),
  endsAt: z.string(),
});
export type SessionActionFormInput = z.infer<typeof sessionActionFormSchema>;

export const curriculumImportFileSchema = z.object({
  mode: z.enum(["APPEND", "REPLACE"]),
  file: z
    .custom<FileList>(
      (value) =>
        !!value &&
        typeof value === "object" &&
        "length" in value &&
        value.length === 1,
      "Chọn một file CSV.",
    )
    .refine(
      (value) =>
        !value?.[0] || (value[0].size > 0 && value[0].size <= 5 * 1024 * 1024),
      "File phải có nội dung và tối đa 5 MiB.",
    ),
});
export type CurriculumImportFileInput = z.infer<
  typeof curriculumImportFileSchema
>;
