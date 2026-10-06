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
    ...range,
  })
  .refine(validRange, rangeError);

export type CurriculumUnitInput = z.infer<typeof curriculumUnitSchema>;
export type CurriculumLessonInput = z.infer<typeof curriculumLessonSchema>;
export type MonthlyTestInput = z.infer<typeof monthlyTestSchema>;
export type ScheduleRangeInput = z.infer<typeof scheduleRangeSchema>;
