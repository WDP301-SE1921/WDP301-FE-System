import { z } from "zod"
import { FIELD_LIMITS } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/** Field name khớp `Program` trong `src/types/catalog.ts` (trừ `grade` giữ dạng chuỗi vì Select trả `string`). */
export const programFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.PROGRAM_NAME_REQUIRED)
    .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
  subjectId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  grade: z.string().min(1, VALIDATION_MSG.REQUIRED),
  monthlyFee: z.number().min(1, VALIDATION_MSG.REQUIRED),
  description: z.string().trim().max(500, VALIDATION_MSG.MAX_LENGTH(500)),
  isActive: z.boolean(),
})

export type ProgramFormInput = z.infer<typeof programFormSchema>

/** Field name khớp `Lesson` trong `src/types/catalog.ts`. */
export const lessonFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
  description: z.string().trim().max(500, VALIDATION_MSG.MAX_LENGTH(500)),
})

export type LessonFormInput = z.infer<typeof lessonFormSchema>

/** Field name khớp `Room` trong `src/types/catalog.ts`. */
export const roomFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
  capacity: z.number().int().min(1, VALIDATION_MSG.REQUIRED),
  isActive: z.boolean(),
})

export type RoomFormInput = z.infer<typeof roomFormSchema>
