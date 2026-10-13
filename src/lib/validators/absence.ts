import { z } from "zod"
import { VALIDATION_MSG } from "@/constants/messages/validation"

/**
 * Zod schema cho toàn bộ luồng Nghỉ học & học bù. Field name khớp
 * `.claude/rules/data-contracts.md` (Enrollment, ClassSession, StudentProfile)
 * và các entity nghiệp vụ mới trong `src/types/absence.ts`.
 */

export const MAKEUP_KIND = {
  MAKEUP: "makeup",
  SWAP: "swap",
} as const

export const assignMakeupSchema = z.object({
  kind: z.enum([MAKEUP_KIND.MAKEUP, MAKEUP_KIND.SWAP]),
  studentProfileId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  enrollmentId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  originalSessionId: z.string().min(1, VALIDATION_MSG.SESSION_REQUIRED),
  makeupSessionId: z.string().min(1, VALIDATION_MSG.SESSION_REQUIRED),
  markOriginalAbsent: z.boolean(),
  note: z.string().trim().max(500, VALIDATION_MSG.MAX_LENGTH(500)),
})

export type AssignMakeupFormInput = z.infer<typeof assignMakeupSchema>

export const changeClassFormSchema = z.object({
  studentProfileId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  enrollmentId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  toClassId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  effectiveDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
  reason: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(500, VALIDATION_MSG.MAX_LENGTH(500)),
})

export type ChangeClassFormInput = z.infer<typeof changeClassFormSchema>

export const LONG_LEAVE_SCOPE = {
  ALL: "all",
  SELECTED: "selected",
} as const

export const createLongLeaveSchema = z
  .object({
    studentProfileId: z.string().min(1, VALIDATION_MSG.REQUIRED),
    scope: z.enum([LONG_LEAVE_SCOPE.ALL, LONG_LEAVE_SCOPE.SELECTED]),
    subjectIds: z.array(z.string()),
    startDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
    endDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
    reason: z
      .string()
      .trim()
      .min(1, VALIDATION_MSG.REQUIRED)
      .max(500, VALIDATION_MSG.MAX_LENGTH(500)),
  })
  .superRefine((values, ctx) => {
    if (values.scope === LONG_LEAVE_SCOPE.SELECTED && values.subjectIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectIds"],
        message: VALIDATION_MSG.SUBJECTS_REQUIRED,
      })
    }

    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: VALIDATION_MSG.END_DATE_AFTER_START,
      })
    }
  })

export type CreateLongLeaveFormInput = z.infer<typeof createLongLeaveSchema>

export const WITHDRAWAL_KIND = {
  SUBJECT: "subject",
  FULL: "full",
} as const

export const withdrawSchema = z
  .object({
    studentProfileId: z.string().min(1, VALIDATION_MSG.REQUIRED),
    kind: z.enum([WITHDRAWAL_KIND.SUBJECT, WITHDRAWAL_KIND.FULL]),
    enrollmentIds: z.array(z.string()),
    effectiveDate: z.string().min(1, VALIDATION_MSG.REQUIRED),
    reason: z
      .string()
      .trim()
      .min(1, VALIDATION_MSG.REQUIRED)
      .max(500, VALIDATION_MSG.MAX_LENGTH(500)),
  })
  .superRefine((values, ctx) => {
    if (values.kind === WITHDRAWAL_KIND.SUBJECT && values.enrollmentIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["enrollmentIds"],
        message: VALIDATION_MSG.ENROLLMENTS_REQUIRED,
      })
    }
  })

export type WithdrawFormInput = z.infer<typeof withdrawSchema>
