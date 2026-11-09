import { z } from "zod";
export const sessionsPerWeekSchema = z.number({ error: "Nhập số buổi/tuần từ 1 đến 14." }).int("Số buổi/tuần phải là số nguyên.").min(1, "Số buổi/tuần tối thiểu là 1.").max(14, "Số buổi/tuần tối đa là 14.");
export const academicSubjectSchema = z.object({
  code: z.string().trim().min(1, "Nhập mã môn.").max(64),
  name: z.string().trim().min(1, "Nhập tên môn.").max(191),
  isActive: z.boolean(),
});
export const academicProgramSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên khóa học.").max(255),
  subjectId: z.string().min(1, "Chọn môn học."),
  grade: z.number().int().min(6).max(9),
  sessionsPerWeek: sessionsPerWeekSchema.optional(),
  isActive: z.boolean(),
});
export type AcademicSubjectInput = z.infer<typeof academicSubjectSchema>;
export type AcademicProgramInput = z.infer<typeof academicProgramSchema>;
