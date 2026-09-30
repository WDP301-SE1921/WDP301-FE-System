import { z } from "zod"
import { FIELD_LIMITS, REGEX } from "@/constants/validation"
import { VALIDATION_MSG } from "@/constants/messages/validation"

export const inviteTeacherSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.EMAIL_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.EMAIL_MAX))
    .regex(REGEX.EMAIL, VALIDATION_MSG.INVALID_EMAIL),
  name: z
    .string()
    .trim()
    .min(FIELD_LIMITS.FULL_NAME_MIN, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
  phone: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .regex(REGEX.PHONE_VN, VALIDATION_MSG.INVALID_PHONE),
  subjectIds: z.array(z.string()).min(1, VALIDATION_MSG.SUBJECTS_REQUIRED),
})

export type InviteTeacherFormInput = z.infer<typeof inviteTeacherSchema>

/** Chỉnh sửa hồ sơ giáo viên (quản lý trung tâm / admin). Email là định danh đăng nhập nên không sửa. */
export const updateTeacherSchema = z.object({
  name: z
    .string()
    .trim()
    .min(FIELD_LIMITS.FULL_NAME_MIN, VALIDATION_MSG.REQUIRED)
    .max(FIELD_LIMITS.FULL_NAME_MAX, VALIDATION_MSG.MAX_LENGTH(FIELD_LIMITS.FULL_NAME_MAX)),
  phone: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .refine((value) => REGEX.PHONE_VN.test(value.replace(/s/g, "")), VALIDATION_MSG.INVALID_PHONE),
  specialty: z.string().trim().max(255, VALIDATION_MSG.MAX_LENGTH(255)),
  subjectIds: z.array(z.string()).min(1, VALIDATION_MSG.SUBJECTS_REQUIRED),
})

export type UpdateTeacherFormInput = z.infer<typeof updateTeacherSchema>

export const assignSubstituteSchema = z.object({
  classSessionId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  substituteTeacherId: z.string().min(1, VALIDATION_MSG.SUBSTITUTE_TEACHER_REQUIRED),
  reason: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(500, VALIDATION_MSG.MAX_LENGTH(500)),
  notifyTeacher: z.boolean(),
  notifyParents: z.boolean(),
})

export type AssignSubstituteFormInput = z.infer<typeof assignSubstituteSchema>

export const changeClassTeacherSchema = z.object({
  classId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  teacherId: z.string().min(1, VALIDATION_MSG.REQUIRED),
  effectiveFrom: z.string().min(1, VALIDATION_MSG.REQUIRED),
  reason: z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.REQUIRED)
    .max(500, VALIDATION_MSG.MAX_LENGTH(500)),
  notifyTeacher: z.boolean(),
  notifyParents: z.boolean(),
})

export type ChangeClassTeacherFormInput = z.infer<typeof changeClassTeacherSchema>
