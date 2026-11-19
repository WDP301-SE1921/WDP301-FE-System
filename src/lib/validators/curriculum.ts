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
/**
 * Giáo trình không có kỳ (đợt F, 2026-11-19): bản được duyệt áp dụng từ ngày duyệt tới khi
 * có bản mới. Ngày bắt đầu học chỉ nhập một lần, ở bước tạo lịch của lớp.
 */
export const curriculumUnitSchema = z.object({
  programId: z.string().min(1, "Chọn khóa học."),
  title,
});
export const curriculumLessonSchema = z.object({
  sequence: z
    .number()
    .int("Thứ tự phải là số nguyên.")
    .min(1, "Thứ tự bắt đầu từ 1."),
  title,
  content,
});
export const curriculumSubmitSchema = z.object({
  reviewerTeacherId: z.string().min(1, "Chọn giáo viên duyệt nội dung."),
});
export const curriculumTechnicalReviewSchema = z
  .object({
    approved: z.boolean(),
    note: z.string().trim().max(2000, "Ghi chú tối đa 2.000 ký tự.").optional(),
    expectedRevision: z.number().int().min(1),
  })
  .refine((value) => value.approved || !!value.note, {
    path: ["note"],
    message: "Nhập nội dung cần sửa trước khi trả lại giáo trình.",
  });
export const curriculumRevisionSchema = z.object({ title });
/**
 * Tạo lịch học: chỉ cần ngày bắt đầu; ngày kết thúc do BE tự tính theo số bài của giáo trình.
 * Bỏ trống giáo trình thì BE lấy bản lớp đang học, lớp chưa có buổi thì bản đang áp dụng (đợt F).
 */
export const scheduleRangeSchema = z.object({
  curriculumUnitId: z.string().min(1, "Chọn giáo trình đã duyệt áp dụng.").optional(),
  previewId: z.string().min(1).optional(),
  fromDate: date,
});

export type CurriculumUnitInput = z.infer<typeof curriculumUnitSchema>;
export type CurriculumLessonInput = z.infer<typeof curriculumLessonSchema>;
export type CurriculumSubmitInput = z.infer<typeof curriculumSubmitSchema>;
export type CurriculumTechnicalReviewInput = z.infer<
  typeof curriculumTechnicalReviewSchema
>;
export type CurriculumRevisionInput = z.infer<typeof curriculumRevisionSchema>;
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
        kind: z.literal("LESSON"),
        sequence: z.number().int().min(1).nullable(),
        title: z.string().min(1).max(255),
        content: z.string().min(1).max(50000),
        monthKey: z
          .string()
          .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
          .nullable(),
        // Mã mục tiêu của bài (cột "Mã mục tiêu"); file cũ không có cột này thì để rỗng.
        outcomeCodes: z.array(z.string().min(1).max(64)).max(50).default([]),
      }),
    )
    .min(1)
    .max(1000),
});
export type ImportCommitInput = z.infer<typeof importCommitSchema>;
const sessionRevisionSchema = reviewReasonSchema.extend({
  expectedRevision: z.number().int().min(1),
});
export const sessionRescheduleSchema = sessionRevisionSchema
  .extend({
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
  })
  .refine((value) => Date.parse(value.endsAt) > Date.parse(value.startsAt), {
    message: "Giờ kết thúc phải sau giờ bắt đầu.",
    path: ["endsAt"],
  });
export type SessionRescheduleInput = z.infer<typeof sessionRescheduleSchema>;

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
      "Chọn một file CSV hoặc Excel (.xlsx).",
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
