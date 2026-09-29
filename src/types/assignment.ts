/**
 * Bài tập / Đề kiểm tra, câu hỏi và bài nộp của học sinh (PROMPT T5/T5B/T5C).
 * Domain hoàn toàn mới — chưa nằm trong `.claude/rules/data-contracts.md`, theo đúng
 * tiền lệ `types/absence.ts`/`types/teacher.ts` (business type mới có file riêng).
 */

export type AssignmentType = "practice" | "test"
export type AssignmentStatus = "draft" | "assigned" | "closed"
export type SubmissionMethod = "online" | "photo_upload"
export type QuestionType = "multiple_choice" | "essay"

export interface QuestionOption {
  id: string
  content: string
  isCorrect: boolean
}

export interface Question {
  id: string
  assignmentId: string
  order: number
  type: QuestionType
  content: string
  points: number
  /** Chỉ dùng cho `type === "multiple_choice"` — luôn đúng 4 lựa chọn. */
  options?: QuestionOption[]
  /** Chỉ dùng cho `type === "essay"` — đáp án mẫu / tiêu chí chấm cho giáo viên và AI. */
  sampleAnswer?: string
}

export interface Assignment {
  id: string
  classId: string
  title: string
  type: AssignmentType
  status: AssignmentStatus
  description?: string
  submissionMethod: SubmissionMethod
  /** ISO datetime — thời điểm mở bài. */
  openAt: string
  /** ISO datetime — hạn chót nộp bài. */
  dueDate: string
  allowLateSubmission: boolean
  /** Điểm trừ mỗi giờ nộp muộn — chỉ có ý nghĩa khi `allowLateSubmission`. */
  latePenaltyPerHour?: number
  /** Thời gian làm bài (phút), vd 15 cho "Kiểm tra 15 phút". */
  durationMinutes?: number
  createdAt: string
  /**
   * Nội dung câu hỏi do giáo viên soạn — dữ liệu GỐC được lưu cùng bài tập, KHÔNG
   * phải field tính được nên không đặt trong `features/assignments/selectors.ts`.
   */
  questions: Question[]
}

export type SubmissionStatus =
  | "not_submitted"
  | "pending"
  | "ai_grading"
  | "ai_graded"
  | "reviewed"
  | "published"

export interface AnswerRecord {
  questionId: string
  selectedOptionId?: string
  essayAnswer?: string
  aiScore?: number
  finalScore?: number
  teacherNote?: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentProfileId: string
  submittedAt?: string
  isLate?: boolean
  status: SubmissionStatus
  answers: AnswerRecord[]
  aiTotalScore?: number
  /** 0–100. */
  aiConfidence?: number
  aiComment?: string
  /** ISO datetime — thời điểm AI chấm xong (PROMPT T6 cột "Thời gian AI chấm"). */
  aiGradedAt?: string
  finalTotalScore?: number
  finalComment?: string
  reviewedAt?: string
  publishedAt?: string
}
