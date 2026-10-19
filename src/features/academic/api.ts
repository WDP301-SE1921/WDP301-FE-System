import { apiRequest, ApiError } from "@/lib/api/client";
import type { PaginatedList } from "@/types/backend";
import type {
  ScheduledSession,
  ScheduledSessionDetail,
} from "@/types/curriculum";
import type {
  AnnouncementRecord,
  AssignmentDetail,
  AssignmentImportPreview,
  AssignmentSummary,
  AttendanceSummary,
  ClassAttendanceSummary,
  CurriculumFeedbackRecord,
  EmailDelivery,
  EnrollmentRecord,
  GradeReview,
  GradingJob,
  LeaveRecord,
  LessonRecord,
  MakeupCandidate,
  MakeupRecord,
  MakeupSource,
  ReportRecord,
  QueuedEmailResult,
  SessionParticipant,
  SubmissionRecord,
  SubstituteCandidate,
} from "@/types/academic-workflows";
import {
  announcementSchema,
  assignmentSchema,
  attendanceSchema,
  endLeaveEarlySchema,
  feedbackSchema,
  gradeSchema,
  leaveSchema,
  makeupSchema,
  reasonSchema,
  recipientsSchema,
  reminderSchema,
  reportSchema,
  rescheduleMakeupSchema,
  resolveFeedbackSchema,
  submissionWindowSchema,
  substitutionSchema,
  transferSchema,
} from "@/lib/validators/web-workflows";
import { assignmentImportPreviewSchema } from "@/lib/validators/assignment-import";

export function queryPath(
  path: string,
  values: Record<string, string | number | undefined> = {},
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return query.size ? `${path}?${query}` : path;
}
export async function readArrayPages<T>(
  path: string,
  filters: Record<string, string | number | undefined> = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 1000; page++) {
    const batch = await apiRequest<T[]>(
      queryPath(path, { ...filters, page, limit: 100 }),
      { signal },
    );
    if (!Array.isArray(batch))
      throw new ApiError(
        "INVALID_API_RESPONSE",
        "Danh sách máy chủ không đúng định dạng.",
        502,
      );
    rows.push(...batch);
    if (batch.length < 100) return rows;
  }
  throw new ApiError(
    "LIST_TOO_LARGE",
    "Danh sách quá lớn. Hãy thu hẹp bộ lọc.",
    422,
  );
}
export async function readDirectoryPages<T>(
  path: string,
  filters: Record<string, string | number | undefined> = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 1000; page++) {
    const batch = await apiRequest<PaginatedList<T>>(
      queryPath(path, { ...filters, page, limit: 100 }),
      { signal },
    );
    if (!Array.isArray(batch.items) || !Number.isFinite(batch.total))
      throw new ApiError(
        "INVALID_API_RESPONSE",
        "Danh sách máy chủ không đúng định dạng.",
        502,
      );
    rows.push(...batch.items);
    if (page * batch.limit >= batch.total) return rows;
    if (!batch.items.length)
      throw new ApiError(
        "INVALID_API_RESPONSE",
        "Danh sách máy chủ thiếu dữ liệu. Vui lòng tải lại.",
        502,
      );
  }
  throw new ApiError(
    "LIST_TOO_LARGE",
    "Danh sách quá lớn. Hãy thu hẹp bộ lọc.",
    422,
  );
}
const itemPath = (collection: string, id: string) =>
  `academic/${collection}/${encodeURIComponent(id)}`;
/** BE hieu ngay YYYY-MM-DD la ca ngay theo UTC+7. */
export function attendanceRange(fromDate: string, toDate: string) {
  return { fromDate, toDate };
}
const command = <T = unknown>(path: string, body?: unknown) =>
  apiRequest<T>(path, { method: "POST", body });
export const academicApi = {
  sessions: (
    filters: Record<string, string | number | undefined> = {},
    signal?: AbortSignal,
  ) =>
    readArrayPages<ScheduledSession>(
      "academic/scheduled-sessions",
      filters,
      signal,
    ),
  session: (id: string, signal?: AbortSignal) =>
    apiRequest<ScheduledSessionDetail>(itemPath("scheduled-sessions", id), {
      signal,
    }),
  enrollments: (signal?: AbortSignal) =>
    readArrayPages<EnrollmentRecord>("academic/enrollments", {}, signal),
  roster: (id: string, signal?: AbortSignal) =>
    readArrayPages<SessionParticipant>(
      `${itemPath("sessions", id)}/roster`,
      {},
      signal,
    ),
  prepareRoster: (id: string) =>
    command<SessionParticipant[]>(`${itemPath("sessions", id)}/roster`),
  attendance: (id: string, body: unknown) =>
    command(
      `${itemPath("sessions", id)}/finalize-attendance`,
      attendanceSchema.parse(body),
    ),
  leaves: (
    filters: Record<string, string | number | undefined> = {},
    signal?: AbortSignal,
  ) => readArrayPages<LeaveRecord>("academic/leaves", filters, signal),
  createLeave: (body: unknown) =>
    command<LeaveRecord>("academic/leaves", leaveSchema.parse(body)),
  decideLeave: (id: string, approve: boolean, reason: string) =>
    command(`${itemPath("leaves", id)}/decide`, { approve, reason }),
  cancelLeave: (id: string) => command(`${itemPath("leaves", id)}/cancel`),
  /** Chuyên cần một học sinh trong một lớp (Giáo viên lớp đó; Quản lý, Nhân viên — BE-8). */
  classAttendance: (classId: string, studentId: string, signal?: AbortSignal) =>
    apiRequest<ClassAttendanceSummary>(
      `${itemPath("classes", classId)}/attendance-summary?${new URLSearchParams({ studentId })}`,
      { signal },
    ),
  /**
   * Trang đầu buổi vắng chờ xếp học bù của cả trung tâm (Nhân viên; không truyền `studentId`).
   * API không trả tổng nên chỉ đọc một trang; đủ `limit` dòng nghĩa là còn nữa.
   */
  pendingMakeupSources: (limit: number, signal?: AbortSignal) =>
    apiRequest<MakeupSource[]>(
      queryPath("academic/makeup-sources", { page: 1, limit }),
      { signal },
    ),
  makeupSources: (studentId: string, signal?: AbortSignal) =>
    readArrayPages<MakeupSource>(
      "academic/makeup-sources",
      { studentId },
      signal,
    ),
  makeupCandidates: (id: string, signal?: AbortSignal) =>
    readArrayPages<MakeupCandidate>(
      `${itemPath("participants", id)}/makeup-candidates`,
      {},
      signal,
    ),
  makeups: (signal?: AbortSignal) =>
    readArrayPages<MakeupRecord>("academic/makeups", {}, signal),
  bookMakeup: (body: unknown) =>
    command<MakeupRecord>("academic/makeups", makeupSchema.parse(body)),
  cancelMakeup: (id: string) => command(`${itemPath("makeups", id)}/cancel`),
  rescheduleMakeup: (id: string, body: unknown) =>
    command<MakeupRecord>(
      `${itemPath("makeups", id)}/reschedule`,
      rescheduleMakeupSchema.parse(body),
    ),
  endLeaveEarly: (id: string, body: unknown) =>
    command<LeaveRecord>(
      `${itemPath("leaves", id)}/end-early`,
      endLeaveEarlySchema.parse(body),
    ),
  transfer: (id: string, body: unknown) =>
    command(
      `${itemPath("enrollments", id)}/transfer`,
      transferSchema.parse(body),
    ),
  endEnrollment: (id: string) => command(`${itemPath("enrollments", id)}/end`),
  endStudent: (id: string) => command(`${itemPath("students", id)}/end-study`),
  reactivateStudent: (id: string, body: unknown) =>
    command(`${itemPath("students", id)}/reactivate`, reasonSchema.parse(body)),
  attendanceSummary: (
    classId: string,
    range: { fromDate: string; toDate: string },
    signal?: AbortSignal,
  ) =>
    apiRequest<AttendanceSummary>(
      queryPath(
        `${itemPath("classes", classId)}/attendance-summary`,
        attendanceRange(range.fromDate, range.toDate),
      ),
      { signal },
    ),
  /** `status` lọc một trạng thái; `total` là số dòng sau lọc (BE-12). */
  emailDeliveries: (
    page: number,
    limit: number,
    signal?: AbortSignal,
    status?: EmailDelivery["status"],
  ) =>
    apiRequest<PaginatedList<EmailDelivery>>(
      queryPath("academic/email-deliveries", { page, limit, status }),
      { signal },
    ),
  retryEmail: (id: string) =>
    command<EmailDelivery>(`${itemPath("email-deliveries", id)}/retry`),
  substituteCandidates: (sessionId: string, signal?: AbortSignal) =>
    apiRequest<SubstituteCandidate[]>(
      `${itemPath("sessions", sessionId)}/substitute-candidates`,
      { signal },
    ),
  substitute: (sessionId: string, body: unknown) =>
    command(
      `${itemPath("sessions", sessionId)}/substitutions`,
      substitutionSchema.parse(body),
    ),
  assignments: (signal?: AbortSignal) =>
    readArrayPages<AssignmentSummary>("academic/assignments", {}, signal),
  assignment: (id: string, signal?: AbortSignal) =>
    apiRequest<AssignmentDetail>(itemPath("assignments", id), { signal }),
  importAssignment: async (classId: string, file: File) => {
    const body = new FormData();
    body.set("classId", classId);
    body.set("file", file);
    const preview = await apiRequest<AssignmentImportPreview>(
      "academic/assignments/import-preview",
      { method: "POST", body },
    );
    const parsed = assignmentImportPreviewSchema.safeParse(preview);
    if (!parsed.success)
      throw new ApiError(
        "INVALID_API_RESPONSE",
        "Nội dung nhập từ file không hợp lệ. Vui lòng thử lại.",
        502,
      );
    return preview;
  },
  createAssignment: (body: unknown) =>
    command<AssignmentDetail>(
      "academic/assignments",
      assignmentSchema.parse(body),
    ),
  updateAssignment: (id: string, body: unknown) =>
    apiRequest<AssignmentDetail>(itemPath("assignments", id), {
      method: "PATCH",
      body: assignmentSchema.parse(body),
    }),
  publishAssignment: (id: string, body: unknown) =>
    command(
      `${itemPath("assignments", id)}/publish`,
      recipientsSchema.parse(body),
    ),
  closeAssignment: (id: string) =>
    command(`${itemPath("assignments", id)}/close`),
  reopenAssignment: (id: string, body: unknown) =>
    command(
      `${itemPath("assignments", id)}/reopen`,
      submissionWindowSchema.parse(body),
    ),
  publishAnswers: (id: string) =>
    command(`${itemPath("assignments", id)}/publish-answers`),
  submissions: (id: string, signal?: AbortSignal) =>
    readArrayPages<SubmissionRecord>(
      `${itemPath("assignments", id)}/submissions`,
      {},
      signal,
    ),
  grade: (id: string, body: unknown) =>
    command<GradeReview>(
      `${itemPath("submissions", id)}/grades`,
      gradeSchema.parse(body),
    ),
  gradeObjective: (id: string) =>
    command<GradeReview>(`${itemPath("submissions", id)}/grade-objective`),
  gradeAi: (id: string) =>
    command<GradingJob>(`${itemPath("submissions", id)}/grade-ai`),
  gradingJob: (id: string, signal?: AbortSignal) =>
    apiRequest<GradingJob>(itemPath("grading-jobs", id), { signal }),
  approveGrade: (id: string) =>
    command<GradeReview>(`${itemPath("grades", id)}/approve`),
  publishGrade: (id: string) =>
    command<GradeReview>(`${itemPath("grades", id)}/publish`),
  reports: (signal?: AbortSignal) =>
    readArrayPages<ReportRecord>("academic/reports", {}, signal),
  createReport: (body: unknown) =>
    command<ReportRecord>("academic/reports", reportSchema.parse(body)),
  file: (id: string) =>
    apiRequest<{ url: string; expiresIn: number }>(
      `${itemPath("files", id)}/download`,
    ),
  lessons: (signal?: AbortSignal) =>
    readArrayPages<LessonRecord>("academic/lessons", {}, signal),
  feedback: (signal?: AbortSignal) =>
    readArrayPages<CurriculumFeedbackRecord>("academic/feedback", {}, signal),
  createFeedback: (id: string, body: unknown) =>
    command(`${itemPath("lessons", id)}/feedback`, feedbackSchema.parse(body)),
  resolveFeedback: (id: string, body: unknown) =>
    command(
      `${itemPath("feedback", id)}/resolve`,
      resolveFeedbackSchema.parse(body),
    ),
  announcements: (signal?: AbortSignal) =>
    readArrayPages<AnnouncementRecord>("academic/announcements", {}, signal),
  recentAnnouncements: (signal?: AbortSignal) =>
    apiRequest<AnnouncementRecord[]>("academic/announcements?page=1&limit=5", {
      signal,
    }),
  createAnnouncement: (body: unknown) =>
    command<AnnouncementRecord>(
      "academic/announcements",
      announcementSchema.parse(body),
    ),
  sendAnnouncement: (id: string) =>
    command<QueuedEmailResult>(`${itemPath("announcements", id)}/send-email`),
  reminders: (body: unknown) =>
    command<QueuedEmailResult>(
      "academic/tuition-reminders/send-email",
      reminderSchema.parse(body),
    ),
};
export function currentEnrollmentClass(
  enrollment: Pick<EnrollmentRecord, "classId" | "placements">,
  at = Date.now(),
) {
  return (
    enrollment.placements.find(
      (placement) =>
        Date.parse(placement.effectiveFrom) <= at &&
        (!placement.effectiveTo || Date.parse(placement.effectiveTo) > at),
    )?.classId ?? enrollment.classId
  );
}
export async function findSubmission(
  submissionId: string,
  assignmentId?: string,
  signal?: AbortSignal,
) {
  const summaries = assignmentId
    ? [{ id: assignmentId }]
    : await academicApi.assignments(signal);
  for (const summary of summaries) {
    const submissions = await academicApi.submissions(summary.id, signal);
    const submission = submissions.find((item) => item.id === submissionId);
    if (submission)
      return {
        submission,
        assignment: await academicApi.assignment(summary.id, signal),
      };
  }
  throw new ApiError(
    "SUBMISSION_NOT_FOUND",
    "Không tìm thấy bài nộp thuộc lớp được phân công.",
    404,
  );
}
export async function teacherSubmissionQueue(signal?: AbortSignal) {
  const assignments = await academicApi.assignments(signal);
  const batches: {
    assignment: AssignmentDetail;
    submission: SubmissionRecord;
  }[][] = [];
  // Bound parallel requests because the current BE exposes submissions per assignment.
  for (let start = 0; start < assignments.length; start += 4) {
    batches.push(
      ...(await Promise.all(
        assignments.slice(start, start + 4).map(async ({ id }) => {
          const [assignment, submissions] = await Promise.all([
            academicApi.assignment(id, signal),
            academicApi.submissions(id, signal),
          ]);
          return submissions.map((submission) => ({ assignment, submission }));
        }),
      )),
    );
  }
  return batches
    .flat()
    .sort((left, right) =>
      right.submission.submittedAt.localeCompare(left.submission.submittedAt),
    );
}
