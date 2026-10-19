import { z } from "zod";

export const requiredId = z
  .string()
  .trim()
  .min(1, "Vui lòng chọn một mục.")
  .max(191);
const requiredText = (max: number) =>
  z.string().trim().min(1, "Vui lòng nhập nội dung.").max(max);
export const accountCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ.").max(255),
  displayName: requiredText(255),
  password: z
    .string()
    .min(8, "Mật khẩu ít nhất 8 ký tự.")
    .max(72)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Mật khẩu tối đa 72 byte UTF-8.",
    ),
});
export const accountUpdateSchema = z.object({
  displayName: requiredText(255),
  status: z.enum(["ACTIVE", "DISABLED"]),
});
export const parentUpdateSchema = accountUpdateSchema.extend({
  phone: z.string().trim().max(32),
});
export const reasonSchema = z.object({ reason: requiredText(2000) });
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn ngày hợp lệ.")
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Ngày không hợp lệ.",
  );
export const dateRangeSchema = z
  .object({ fromDate: dateSchema, toDate: dateSchema })
  .refine((value) => value.fromDate <= value.toDate, {
    path: ["toDate"],
    message: "Ngày cuối phải từ ngày đầu trở đi.",
  });
/** Sửa hồ sơ con từ Web (`PATCH students/:id`); để trống ngày sinh thì xóa ngày sinh. */
export const studentUpdateSchema = z.object({
  fullName: requiredText(255),
  grade: z.coerce
    .number({ error: "Chọn khối." })
    .int()
    .min(6, "Khối từ 6 đến 9.")
    .max(9, "Khối từ 6 đến 9."),
  dateOfBirth: z
    .union([z.literal(""), z.null(), dateSchema])
    .transform((value) => value || null)
    .refine(
      (value) => !value || value <= todayLocalDate(),
      "Ngày sinh không được sau hôm nay.",
    ),
});
export const leaveSchema = z
  .object({
    enrollmentId: requiredId,
    kind: z.enum(["SINGLE_ABSENCE", "PERIOD_PAUSE"]),
    sessionId: requiredId.optional(),
    fromDate: dateSchema,
    toDate: dateSchema,
    reason: requiredText(2000),
  })
  .refine((value) => value.fromDate <= value.toDate, {
    path: ["toDate"],
    message: "Ngày kết thúc phải từ ngày bắt đầu trở đi.",
  })
  .refine(
    (value) =>
      value.kind === "SINGLE_ABSENCE"
        ? !!value.sessionId && value.fromDate === value.toDate
        : !value.sessionId,
    {
      path: ["sessionId"],
      message:
        "Nghỉ một buổi cần buổi học và một ngày; bảo lưu chỉ chọn khoảng ngày.",
    },
  );
export const makeupSchema = z.object({
  originalParticipantId: requiredId,
  targetSessionId: requiredId,
});
/** Today's calendar date at the center (UTC+7). */
export function todayLocalDate() {
  return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
}
export const endLeaveEarlySchema = z.object({
  effectiveDate: dateSchema.refine(
    (value) => value >= todayLocalDate(),
    "Ngày đi học lại phải từ hôm nay trở đi.",
  ),
  reason: requiredText(2000),
});
export const rescheduleMakeupSchema = z.object({
  targetSessionId: requiredId,
  reason: requiredText(2000),
});
export const substitutionSchema = z.object({
  teacherId: requiredId,
  expectedRevision: z.number().int().min(1),
  reason: requiredText(2000),
});
export const roomSchema = z.object({
  name: requiredText(191),
  capacity: z.coerce
    .number({ error: "Nhập sức chứa." })
    .int("Sức chứa là số nguyên.")
    .min(1, "Sức chứa ít nhất 1.")
    .max(10000, "Sức chứa tối đa 10000."),
});
export const roomUpdateSchema = roomSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });
export const teacherAssignmentSchema = z.object({
  teacherId: requiredId,
  effectiveAt: z.iso.datetime({ offset: true }),
  reason: requiredText(2000),
});
export const scheduleUnlockSchema = z.object({
  confirmed: z.literal(false),
  reason: requiredText(2000),
});
export const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ.").max(255),
});
export const reviewInvitationSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(2000).optional(),
});
export const transferSchema = z.object({
  targetClassId: requiredId,
  effectiveAt: z.iso.datetime({ offset: true }),
  reason: requiredText(2000),
});
export const attendanceSchema = z
  .object({
    items: z
      .array(
        z.object({
          participantId: requiredId,
          status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
        }),
      )
      .max(1000),
    summary: z.string().max(5000).optional(),
  })
  .refine(
    (value) =>
      new Set(value.items.map((item) => item.participantId)).size ===
      value.items.length,
    "Mỗi học viên chỉ có một kết quả.",
  );
export const questionSchema = z
  .object({
    kind: z.enum(["MULTIPLE_CHOICE", "ESSAY"]),
    prompt: requiredText(10000),
    choices: z.array(z.string().min(1)).min(2).max(10).optional(),
    correctAnswer: z.string().max(10000).optional(),
    rubric: z.string().max(10000).optional(),
    maxScore: z.coerce.number().min(0.01).max(100),
  })
  .superRefine((value, context) => {
    if (
      value.kind === "MULTIPLE_CHOICE" &&
      (!value.choices?.includes(value.correctAnswer ?? "") ||
        new Set(value.choices).size !== value.choices.length)
    )
      context.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Đáp án phải thuộc các lựa chọn khác nhau.",
      });
    if (value.kind === "ESSAY" && !value.rubric?.trim())
      context.addIssue({
        code: "custom",
        path: ["rubric"],
        message: "Bài tự luận cần tiêu chí chấm.",
      });
  });
const assessmentFields = {
  kind: z.enum(["HOMEWORK", "TEST"]).optional(),
  sessionId: requiredId.optional(),
  testType: z
    .enum(["FIFTEEN_MINUTES", "ONE_PERIOD", "MIDTERM", "FINAL"])
    .optional(),
};
function validateAssessment(
  value: { kind?: string; sessionId?: string; testType?: string },
  context: z.RefinementCtx,
) {
  if (value.kind === "TEST") {
    if (!value.sessionId)
      context.addIssue({
        code: "custom",
        path: ["sessionId"],
        message: "Chọn buổi học tổ chức kiểm tra.",
      });
    if (!value.testType)
      context.addIssue({
        code: "custom",
        path: ["testType"],
        message: "Chọn loại bài kiểm tra.",
      });
  } else if (value.testType) {
    context.addIssue({
      code: "custom",
      path: ["testType"],
      message: "Loại kiểm tra chỉ dùng cho bài kiểm tra.",
    });
  }
}
const assignmentBaseSchema = z.object({
  ...assessmentFields,
  classId: requiredId,
  title: requiredText(255),
  instructions: z.string().max(10000),
  dueAt: z.iso
    .datetime({ offset: true })
    .refine(
      (value) => Date.parse(value) > Date.now(),
      "Hạn nộp phải ở tương lai.",
    ),
  maxAttempts: z.coerce.number().int().min(1).max(10),
  questions: z.array(questionSchema).min(1).max(100),
});
export const assignmentSchema =
  assignmentBaseSchema.superRefine(validateAssessment);
export const submissionWindowSchema = assignmentBaseSchema.pick({
  dueAt: true,
  maxAttempts: true,
});
export const recipientsSchema = z.object({
  enrollmentIds: z
    .array(requiredId)
    .min(1, "Chọn ít nhất một học sinh.")
    .max(1000)
    .refine(
      (value) => new Set(value).size === value.length,
      "Không chọn ghi danh trùng.",
    ),
});
export const gradeSchema = z.object({
  scores: z
    .array(
      z.object({
        questionId: requiredId,
        score: z.coerce.number().min(0).max(100),
        feedback: z.string().max(5000),
      }),
    )
    .min(1)
    .max(100),
  feedback: z.string().max(5000),
});
export const reportSchema = z
  .object({
    classId: requiredId,
    studentId: requiredId.optional(),
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
    includeAi: z.boolean().optional(),
  })
  .refine(
    (value) =>
      Date.parse(value.from) <= Date.parse(value.to) &&
      Date.parse(value.to) - Date.parse(value.from) <= 366 * 86400000,
    { path: ["to"], message: "Khoảng báo cáo phải hợp lệ và tối đa 366 ngày." },
  );
export const feedbackSchema = z.object({ content: requiredText(5000) });
export const resolveFeedbackSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "DECLINED"]),
  response: requiredText(5000),
  resolutionLessonId: requiredId.optional(),
});
export const announcementSchema = z.object({
  classId: requiredId,
  title: requiredText(255),
  content: requiredText(10000),
});
export const reminderSchema = z.object({ through: dateSchema });
export const confirmationSchema = z.object({
  confirmed: z
    .boolean()
    .refine((value) => value, "Xác nhận trước khi thực hiện."),
});
export const localDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/,
    "Chọn ngày giờ hợp lệ.",
  )
  .refine(
    (value) =>
      dateSchema.safeParse(value.slice(0, 10)).success &&
      !Number.isNaN(Date.parse(`${value}:00+07:00`)),
    "Ngày giờ không hợp lệ.",
  );
export const assignmentEditorSchema = z
  .object({
    ...assessmentFields,
    kind: z.enum(["HOMEWORK", "TEST"]),
    classId: requiredId,
    title: assignmentSchema.shape.title,
    instructions: assignmentSchema.shape.instructions,
    dueAt: localDateTimeSchema.refine(
      (value) => Date.parse(`${value}:00+07:00`) > Date.now(),
      "Hạn nộp phải ở tương lai.",
    ),
    maxAttempts: z.number().int().min(1).max(10),
    questions: z
      .array(
        z
          .object({
            kind: z.enum(["MULTIPLE_CHOICE", "ESSAY"]),
            prompt: requiredText(10000),
            choices: z.string(),
            correctAnswer: z.string(),
            rubric: z.string(),
            maxScore: z.number().min(0.01).max(100),
          })
          .superRefine((value, context) => {
            const parsed = questionSchema.safeParse(toQuestionPayload(value));
            if (!parsed.success)
              for (const issue of parsed.error.issues)
                context.addIssue({
                  code: "custom",
                  path: issue.path,
                  message: issue.message,
                });
          }),
      )
      .min(1)
      .max(100),
  })
  .superRefine(validateAssessment);
export function toQuestionPayload(value: {
  kind: "MULTIPLE_CHOICE" | "ESSAY";
  prompt: string;
  choices: string;
  correctAnswer: string;
  rubric: string;
  maxScore: number;
}) {
  return {
    kind: value.kind,
    prompt: value.prompt,
    maxScore: value.maxScore,
    ...(value.kind === "MULTIPLE_CHOICE"
      ? {
          choices: value.choices
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          correctAnswer: value.correctAnswer.trim(),
        }
      : { rubric: value.rubric }),
  };
}
export function vietnamDateTime(value: string) {
  return new Date(`${value}:00+07:00`).toISOString();
}
export function localDateTime(value: string) {
  return new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16);
}
