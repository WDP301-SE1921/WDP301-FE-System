import { z } from "zod"
import { BUSINESS_RULES } from "@/constants/business-rules"
import { FIELD_LIMITS } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

export const classFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, VALIDATION_MSG.REQUIRED)
      .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
    subjectId: z.string().min(1, VALIDATION_MSG.REQUIRED),
    grade: z.string().min(1, VALIDATION_MSG.REQUIRED),
    programId: z.string().min(1, VALIDATION_MSG.REQUIRED),
    capacity: z
      .number()
      .int()
      .min(1, VALIDATION_MSG.REQUIRED)
      .max(BUSINESS_RULES.CLASS_CAPACITY_MAX, VALIDATION_MSG.CAPACITY_RANGE),
    /** Nhãn thứ trong tuần, vd ["T2", "T4", "T6"]. */
    weekdays: z.array(z.string()).min(1, VALIDATION_MSG.WEEKDAYS_REQUIRED),
    startTime: z.string().min(1, VALIDATION_MSG.REQUIRED),
    endTime: z.string().min(1, VALIDATION_MSG.REQUIRED),
    startDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
    /** Tùy chọn: lớp có thể tạo trước, quản lý trung tâm gán giáo viên sau. */
    teacherId: z.string(),
    room: z.string().min(1, VALIDATION_MSG.REQUIRED),
  })
  .superRefine((values, ctx) => {
    if (values.startTime && values.endTime && values.endTime <= values.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: VALIDATION_MSG.END_TIME_AFTER_START,
      })
    }
  })

export type ClassFormInput = z.infer<typeof classFormSchema>
