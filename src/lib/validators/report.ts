import { z } from "zod"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/**
 * Zod schema cho form "Tạo báo cáo mới" (PROMPT T7). Field name khớp
 * `src/types/report.ts` — `name`/`teacherId`/`createdAt`/`fileSizeLabel` do
 * `mockCreateTeacherReport` tự sinh, không nằm trong input người dùng nhập.
 */
export const createReportSchema = z
  .object({
    classIds: z.array(z.string()).min(1, VALIDATION_MSG.CLASSES_REQUIRED),
    studentProfileIds: z.array(z.string()).optional(),
    fromDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
    toDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
    includeScores: z.boolean(),
    includeAttendance: z.boolean(),
    includeProgress: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.fromDate && values.toDate && values.toDate < values.fromDate) {
      ctx.addIssue({
        code: "custom",
        path: ["toDate"],
        message: VALIDATION_MSG.END_DATE_AFTER_START,
      })
    }
  })

export type CreateReportFormInput = z.infer<typeof createReportSchema>
