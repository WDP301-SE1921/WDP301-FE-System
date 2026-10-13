import { z } from "zod"
import { FIELD_LIMITS } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/**
 * Zod schema cho form Tạo/Sửa bài tập (PROMPT T5B). Field name khớp
 * `src/types/assignment.ts` — `status` KHÔNG nằm trong schema vì được quyết định
 * bởi nút bấm ("Lưu bản nháp" | "Giao bài tập ngay") ở tầng component, không phải
 * input người dùng gõ.
 */

export const ASSIGNMENT_TYPE_VALUE = {
  PRACTICE: "practice",
  TEST: "test",
} as const

export const SUBMISSION_METHOD_VALUE = {
  ONLINE: "online",
  PHOTO_UPLOAD: "photo_upload",
} as const

export const QUESTION_TYPE_VALUE = {
  MULTIPLE_CHOICE: "multiple_choice",
  ESSAY: "essay",
} as const

const questionOptionSchema = z.object({
  id: z.string(),
  content: z.string().trim(),
  isCorrect: z.boolean(),
})

const questionFormSchema = z
  .object({
    id: z.string(),
    type: z.enum([QUESTION_TYPE_VALUE.MULTIPLE_CHOICE, QUESTION_TYPE_VALUE.ESSAY]),
    content: z.string().trim().min(1, VALIDATION_MSG.QUESTION_CONTENT_REQUIRED),
    points: z.number().min(0.25, VALIDATION_MSG.QUESTION_POINTS_REQUIRED),
    options: z.array(questionOptionSchema).optional(),
    sampleAnswer: z.string().trim().optional(),
  })
  .superRefine((question, ctx) => {
    if (question.type === QUESTION_TYPE_VALUE.MULTIPLE_CHOICE) {
      const options = question.options ?? []

      if (
        options.length !== 4 ||
        options.some((option) => option.content.trim().length === 0)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: VALIDATION_MSG.QUESTION_OPTIONS_REQUIRED,
        })
      }

      if (options.filter((option) => option.isCorrect).length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: VALIDATION_MSG.QUESTION_CORRECT_OPTION_REQUIRED,
        })
      }
    }

    if (
      question.type === QUESTION_TYPE_VALUE.ESSAY &&
      (!question.sampleAnswer || question.sampleAnswer.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["sampleAnswer"],
        message: VALIDATION_MSG.QUESTION_SAMPLE_ANSWER_REQUIRED,
      })
    }
  })

export const assignmentFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, VALIDATION_MSG.REQUIRED)
      .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
    classId: z.string().min(1, VALIDATION_MSG.REQUIRED),
    type: z.enum([ASSIGNMENT_TYPE_VALUE.PRACTICE, ASSIGNMENT_TYPE_VALUE.TEST]),
    description: z.string().trim(),
    submissionMethod: z.enum([
      SUBMISSION_METHOD_VALUE.ONLINE,
      SUBMISSION_METHOD_VALUE.PHOTO_UPLOAD,
    ]),
    openAt: z.string().min(1, VALIDATION_MSG.REQUIRED),
    dueDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
    allowLateSubmission: z.boolean(),
    latePenaltyPerHour: z.number().min(0).optional(),
    durationMinutes: z.number().min(0).optional(),
    questions: z.array(questionFormSchema).min(1, VALIDATION_MSG.QUESTIONS_REQUIRED),
  })
  .superRefine((values, ctx) => {
    if (values.openAt && values.dueDate && values.dueDate <= values.openAt) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: VALIDATION_MSG.DUE_DATE_AFTER_OPEN,
      })
    }
  })

export type AssignmentFormInput = z.infer<typeof assignmentFormSchema>
export type QuestionFormInput = AssignmentFormInput["questions"][number]
