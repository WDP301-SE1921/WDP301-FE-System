import { BUSINESS_RULES } from "@/constants/business-rules"
import { findClass, findSubject } from "@/mocks/data/catalog"
import { MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS, findAssignment, findSubmissionsByAssignment } from "@/mocks/data/assignments"
import { findStudent } from "@/mocks/data/students"
import { getAssignmentTotalPoints, getMyClassOptions } from "@/features/assignments/selectors"
import type { AnswerRecord, Assignment, Question, QuestionOption, Submission, SubmissionStatus } from "@/types/assignment"
import type { ClassRecord } from "@/types/catalog"
import type { StudentProfile } from "@/types/student"

/**
 * Selectors cho domain Chấm bài AI: bài nộp theo bài tập (PROMPT T5C), hàng đợi
 * chấm bài (PROMPT T6/T6C) và chấm bài chi tiết (PROMPT T6B). Cross-feature import
 * từ `features/assignments/selectors.ts` là tiền lệ đã có trong repo (vd
 * `features/enrollments` dùng lại `features/payments/selectors.ts`).
 */

// ---- T5C — Bài nộp theo bài tập ----

export interface SubmissionRow {
  submission: Submission
  student: StudentProfile
  totalPoints: number
}

export interface SubmissionRowFilters {
  /** Nhiều trạng thái cho 1 tab — vd tab "AI đã chấm – chờ duyệt" gồm cả `ai_graded` lẫn `reviewed`. */
  statuses?: SubmissionStatus[]
}

/** Bài nộp của 1 bài tập/đề kiểm tra, kèm hồ sơ học sinh (PROMPT T5C). */
export function getSubmissionRows(
  assignmentId: string,
  filters: SubmissionRowFilters = {}
): SubmissionRow[] {
  const assignment = findAssignment(assignmentId)
  if (!assignment) return []

  const totalPoints = getAssignmentTotalPoints(assignment)

  return findSubmissionsByAssignment(assignmentId)
    .map((submission) => {
      const student = findStudent(submission.studentProfileId)
      if (!student) return null
      const row: SubmissionRow = { submission, student, totalPoints }
      return row
    })
    .filter((row): row is SubmissionRow => Boolean(row))
    .filter((row) => !filters.statuses || filters.statuses.includes(row.submission.status))
}

export interface SubmissionCounts {
  total: number
  submitted: number
  graded: number
  pendingReview: number
  published: number
  notSubmitted: number
}

/** Tóm tắt số bài nộp cho card header T5C — "Chờ chấm" = `submitted - graded`. */
export function getSubmissionCounts(assignmentId: string): SubmissionCounts {
  const rows = getSubmissionRows(assignmentId)
  const notSubmitted = rows.filter((row) => row.submission.status === "not_submitted").length
  const published = rows.filter((row) => row.submission.status === "published").length
  const pendingReview = rows.filter(
    (row) => row.submission.status === "ai_graded" || row.submission.status === "reviewed"
  ).length

  return {
    total: rows.length,
    submitted: rows.length - notSubmitted,
    graded: pendingReview + published,
    pendingReview,
    published,
    notSubmitted,
  }
}

// ---- T6 — Hàng đợi chấm bài AI ----

export type GradingQueueTab = "pending_review" | "reviewed" | "published"

/** "Chờ duyệt" gồm cả bài AI đã chấm xong lẫn bài đang được AI xử lý (PROMPT T6C). */
const QUEUE_TAB_STATUSES: Record<GradingQueueTab, SubmissionStatus[]> = {
  pending_review: ["ai_graded", "ai_grading"],
  reviewed: ["reviewed"],
  published: ["published"],
}

export interface GradingQueueRow {
  submission: Submission
  student: StudentProfile
  assignment: Assignment
  classRecord?: ClassRecord
  subjectCode: string
  totalPoints: number
}

export interface GradingQueueFilters {
  classId?: string
  assignmentId?: string
  tab: GradingQueueTab
}

/** Lớp `CURRENT_TEACHER_ID` đang phụ trách — chặn không cho thấy bài nộp lớp khác. */
function getMyClassIds(): Set<string> {
  return new Set(getMyClassOptions().map((option) => option.value))
}

/** Hàng đợi chấm bài AI, chỉ gồm các lớp giáo viên hiện tại phụ trách (PROMPT T6). */
export function getGradingQueueRows(filters: GradingQueueFilters): GradingQueueRow[] {
  const myClassIds = getMyClassIds()
  const allowedStatuses = QUEUE_TAB_STATUSES[filters.tab]

  return MOCK_ASSIGNMENTS.filter((assignment) => myClassIds.has(assignment.classId))
    .filter((assignment) => !filters.assignmentId || assignment.id === filters.assignmentId)
    .filter((assignment) => !filters.classId || assignment.classId === filters.classId)
    .flatMap((assignment) => {
      const classRecord = findClass(assignment.classId)
      const totalPoints = getAssignmentTotalPoints(assignment)
      const subjectCode = classRecord ? (findSubject(classRecord.subjectId)?.code ?? "") : ""

      return findSubmissionsByAssignment(assignment.id)
        .filter((submission) => allowedStatuses.includes(submission.status))
        .map((submission) => {
          const student = findStudent(submission.studentProfileId)
          if (!student) return null
          const row: GradingQueueRow = {
            submission,
            student,
            assignment,
            classRecord,
            subjectCode,
            totalPoints,
          }
          return row
        })
        .filter((row): row is GradingQueueRow => Boolean(row))
    })
}

/** Số dòng theo từng tab — dùng cho badge đếm trên `StatusTabs` của T6. */
export function getGradingQueueCounts(
  filters: Omit<GradingQueueFilters, "tab"> = {}
): Record<GradingQueueTab, number> {
  return {
    pending_review: getGradingQueueRows({ ...filters, tab: "pending_review" }).length,
    reviewed: getGradingQueueRows({ ...filters, tab: "reviewed" }).length,
    published: getGradingQueueRows({ ...filters, tab: "published" }).length,
  }
}

export interface GradingQueueSummary {
  pendingReviewCount: number
  aiGradingInProgressCount: number
  averageConfidence: number
  /** Id các bài nộp "ai_graded" có độ tin cậy trên `BUSINESS_RULES.AI_HIGH_CONFIDENCE_THRESHOLD". */
  highConfidenceSubmissionIds: string[]
}

/** Số liệu cho banner cảnh báo đầu trang T6 ("N bài đang chờ duyệt, tin cậy TB X%"). */
export function getGradingQueueSummary(): GradingQueueSummary {
  const rows = getGradingQueueRows({ tab: "pending_review" })
  const confidences = rows
    .map((row) => row.submission.aiConfidence)
    .filter((value): value is number => typeof value === "number")

  const highConfidenceSubmissionIds = rows
    .filter(
      (row) =>
        row.submission.status === "ai_graded" &&
        (row.submission.aiConfidence ?? 0) > BUSINESS_RULES.AI_HIGH_CONFIDENCE_THRESHOLD
    )
    .map((row) => row.submission.id)

  return {
    pendingReviewCount: rows.length,
    aiGradingInProgressCount: rows.filter((row) => row.submission.status === "ai_grading").length,
    averageConfidence:
      confidences.length === 0
        ? 0
        : Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length),
    highConfidenceSubmissionIds,
  }
}

// ---- T6B — Chấm bài chi tiết ----

export interface QuestionReviewRow {
  question: Question
  answer?: AnswerRecord
  correctOption?: QuestionOption
}

export interface GradingDetail {
  submission: Submission
  assignment: Assignment
  classRecord?: ClassRecord
  student: StudentProfile
  totalPoints: number
  questionRows: QuestionReviewRow[]
  previousId?: string
  nextId?: string
}

function tabForStatus(status: SubmissionStatus): GradingQueueTab | null {
  if (status === "ai_graded" || status === "ai_grading") return "pending_review"
  if (status === "reviewed") return "reviewed"
  if (status === "published") return "published"
  return null
}

export interface AdjacentSubmissionIds {
  previousId?: string
  nextId?: string
}

/** Bài trước/sau trong cùng bài tập + cùng tab hàng đợi (chấm liên tục cả lớp, PROMPT T6B). */
export function getAdjacentSubmissionIds(submissionId: string): AdjacentSubmissionIds {
  const submission = MOCK_SUBMISSIONS.find((item) => item.id === submissionId)
  const tab = submission ? tabForStatus(submission.status) : null
  if (!submission || !tab) return {}

  const queue = getGradingQueueRows({ assignmentId: submission.assignmentId, tab })
  const index = queue.findIndex((row) => row.submission.id === submissionId)
  if (index === -1) return {}

  return {
    previousId: index > 0 ? queue[index - 1].submission.id : undefined,
    nextId: index < queue.length - 1 ? queue[index + 1].submission.id : undefined,
  }
}

/** Chi tiết 1 bài nộp để duyệt kết quả AI (PROMPT T6B). */
export function getGradingDetail(submissionId: string): GradingDetail | null {
  const submission = MOCK_SUBMISSIONS.find((item) => item.id === submissionId)
  if (!submission) return null

  const assignment = findAssignment(submission.assignmentId)
  const student = findStudent(submission.studentProfileId)
  if (!assignment || !student) return null

  const totalPoints = getAssignmentTotalPoints(assignment)
  const answersByQuestion = new Map(submission.answers.map((answer) => [answer.questionId, answer]))

  const questionRows: QuestionReviewRow[] = assignment.questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((question) => ({
      question,
      answer: answersByQuestion.get(question.id),
      correctOption: question.options?.find((option) => option.isCorrect),
    }))

  return {
    submission,
    assignment,
    classRecord: findClass(assignment.classId),
    student,
    totalPoints,
    questionRows,
    ...getAdjacentSubmissionIds(submissionId),
  }
}
