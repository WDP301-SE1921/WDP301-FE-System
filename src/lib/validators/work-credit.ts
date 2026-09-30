import { z } from "zod"
import { VALIDATION_MSG } from "@/constants/messages/validation"

const reasonField = z
  .string()
  .trim()
  .min(1, VALIDATION_MSG.REQUIRED)
  .max(500, VALIDATION_MSG.MAX_LENGTH(500))

/** Giáo viên báo nghỉ một buổi của mình. Field name khớp `TeacherAbsenceReport`. */
export const reportAbsenceSchema = z.object({
  classSessionId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  reason: reasonField,
})

export type ReportAbsenceFormInput = z.infer<typeof reportAbsenceSchema>

/** Quản lý trung tâm hủy một buổi học (giáo viên nghỉ mà không xếp được người dạy thay). */
export const cancelSessionSchema = z.object({
  classSessionId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  reason: reasonField,
})

export type CancelSessionFormInput = z.infer<typeof cancelSessionSchema>

/** Ghi nhận công thủ công cho buổi đã dạy nhưng chưa điểm danh. Field name khớp `WorkCreditAdjustment`. */
export const adjustWorkCreditSchema = z.object({
  classSessionId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  teacherId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  reason: reasonField,
})

export type AdjustWorkCreditFormInput = z.infer<typeof adjustWorkCreditSchema>
