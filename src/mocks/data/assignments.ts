import { ERROR_MSG } from "@/constants/messages/error"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { findClass } from "@/mocks/data/catalog"
import { MOCK_ENROLLMENTS } from "@/mocks/data/students"
import { MockError } from "@/mocks/utils/mock-query"
import type {
  AnswerRecord,
  Assignment,
  AssignmentStatus,
  AssignmentType,
  Question,
  QuestionOption,
  QuestionType,
  Submission,
  SubmissionMethod,
  SubmissionStatus,
} from "@/types/assignment"

/**
 * Bài tập/Đề kiểm tra + bài nộp giả lập cho giai đoạn MOCK-ONLY (PROMPT T5/T5B).
 * Xóa file này trong cùng PR nối endpoint bài tập thật.
 */

function buildMultipleChoiceOptions(
  idPrefix: string,
  contents: string[],
  correctIndex: number
): QuestionOption[] {
  return contents.map((content, index) => ({
    id: `${idPrefix}-${index + 1}`,
    content,
    isCorrect: index === correctIndex,
  }))
}

/**
 * Bài kiểm tra minh họa khớp ảnh Stitch — nội dung Toán 8 thật (phân tích đa
 * thức thành nhân tử), gắn vào lớp Toán 8A (`cls-math-8a`) mà `CURRENT_TEACHER_ID`
 * (`tch-001`, xem `catalog.ts`) đang phụ trách.
 */
const SEEDED_ASSIGNMENT_ID = "asg-seed-01"

const SEEDED_QUESTIONS: Question[] = [
  {
    id: `${SEEDED_ASSIGNMENT_ID}-q1`,
    assignmentId: SEEDED_ASSIGNMENT_ID,
    order: 1,
    type: "multiple_choice",
    content: "Phân tích đa thức x² - 4 thành nhân tử được kết quả là:",
    points: 2.5,
    options: buildMultipleChoiceOptions(
      `${SEEDED_ASSIGNMENT_ID}-q1-opt`,
      ["(x - 2)(x + 2)", "(x - 4)(x + 4)", "(x - 2)²", "(x + 2)²"],
      0
    ),
  },
  {
    id: `${SEEDED_ASSIGNMENT_ID}-q2`,
    assignmentId: SEEDED_ASSIGNMENT_ID,
    order: 2,
    type: "essay",
    content: "Tìm x biết: x(x - 3) + 2(x - 3) = 0",
    points: 3.5,
    sampleAnswer:
      "x(x - 3) + 2(x - 3) = 0 ⇔ (x - 3)(x + 2) = 0 ⇔ x - 3 = 0 hoặc x + 2 = 0 ⇔ x = 3 hoặc x = -2.",
  },
  {
    id: `${SEEDED_ASSIGNMENT_ID}-q3`,
    assignmentId: SEEDED_ASSIGNMENT_ID,
    order: 3,
    type: "essay",
    content:
      "Một mảnh vườn hình vuông có cạnh x (mét). Người ta mở rộng thành hình chữ nhật bằng cách tăng một cạnh thêm 4m và giảm cạnh còn lại đi 4m. a) Viết biểu thức tính diện tích mảnh vườn hình chữ nhật mới theo x. b) Chứng minh diện tích mảnh vườn mới luôn nhỏ hơn diện tích mảnh vườn ban đầu đúng 16m², với mọi x > 4.",
    points: 4,
    sampleAnswer:
      "a) Diện tích mới: S = (x + 4)(x - 4) = x² - 16 (m²). b) Diện tích ban đầu là x² (m²). Áp dụng hằng đẳng thức hiệu hai bình phương: x² - (x² - 16) = 16 (m²) với mọi x, nên diện tích mảnh vườn mới luôn nhỏ hơn diện tích ban đầu đúng 16m².",
  },
]

/** Câu hỏi minh họa cho các bài tập khác (không phải bài kiểm tra minh họa ở trên). */
function buildGenericQuestions(assignmentId: string, type: AssignmentType): Question[] {
  if (type === "test") {
    return [
      {
        id: `${assignmentId}-q1`,
        assignmentId,
        order: 1,
        type: "multiple_choice",
        content: "Chọn đáp án đúng cho câu hỏi trắc nghiệm số 1.",
        points: 5,
        options: buildMultipleChoiceOptions(
          `${assignmentId}-q1-opt`,
          ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          0
        ),
      },
      {
        id: `${assignmentId}-q2`,
        assignmentId,
        order: 2,
        type: "essay",
        content: "Trình bày lời giải chi tiết cho bài toán tự luận.",
        points: 5,
        sampleAnswer: "Đáp án mẫu: trình bày đầy đủ các bước biến đổi và kết luận.",
      },
    ]
  }

  return [
    {
      id: `${assignmentId}-q1`,
      assignmentId,
      order: 1,
      type: "essay",
      content: "Hoàn thành các bài tập trong SGK theo hướng dẫn của giáo viên.",
      points: 10,
      sampleAnswer:
        "Đáp án mẫu: học sinh trình bày lời giải theo từng bước đã học trên lớp.",
    },
  ]
}

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: SEEDED_ASSIGNMENT_ID,
    classId: "cls-math-8a",
    title: "Bài 12: Phân tích đa thức thành nhân tử",
    type: "test",
    status: "assigned",
    description:
      "Đề kiểm tra 15 phút, ôn tập các phương pháp phân tích đa thức thành nhân tử đã học.",
    submissionMethod: "online",
    openAt: "2026-09-15T15:00:00",
    dueDate: "2026-09-16T23:59:00",
    allowLateSubmission: false,
    durationMinutes: 15,
    createdAt: "2026-09-14T10:00:00",
    questions: SEEDED_QUESTIONS,
  },
  {
    id: "asg-002",
    classId: "cls-math-8a",
    title: "Bài tập về nhà tuần 3",
    type: "practice",
    status: "assigned",
    description: "Hoàn thành các bài tập ôn luyện nhân đơn thức, đa thức trong SGK.",
    submissionMethod: "photo_upload",
    openAt: "2026-09-14T08:00:00",
    dueDate: "2026-09-20T23:59:00",
    allowLateSubmission: true,
    latePenaltyPerHour: 0.5,
    createdAt: "2026-09-13T09:00:00",
    questions: buildGenericQuestions("asg-002", "practice"),
  },
  {
    id: "asg-003",
    classId: "cls-math-8a",
    title: "Ôn tập chương 1: Phép nhân và phép chia đa thức",
    type: "practice",
    status: "closed",
    description: "Ôn tập tổng hợp trước khi kiểm tra 1 tiết.",
    submissionMethod: "online",
    openAt: "2026-08-20T08:00:00",
    dueDate: "2026-08-27T23:59:00",
    allowLateSubmission: false,
    createdAt: "2026-08-19T09:00:00",
    questions: buildGenericQuestions("asg-003", "practice"),
  },
  {
    id: "asg-004",
    classId: "cls-math-7a",
    title: "Kiểm tra 15 phút - Hằng đẳng thức đáng nhớ",
    type: "test",
    status: "assigned",
    description: "Kiểm tra nhanh 3 hằng đẳng thức đáng nhớ đầu tiên.",
    submissionMethod: "online",
    openAt: "2026-09-15T07:00:00",
    dueDate: "2026-09-18T23:59:00",
    allowLateSubmission: false,
    durationMinutes: 15,
    createdAt: "2026-09-14T08:00:00",
    questions: buildGenericQuestions("asg-004", "test"),
  },
  {
    id: "asg-005",
    classId: "cls-math-10a",
    title: "Bài tập ôn chương 1",
    type: "practice",
    status: "draft",
    description: "Bản nháp — chưa giao cho học sinh.",
    submissionMethod: "photo_upload",
    openAt: "2026-09-20T08:00:00",
    dueDate: "2026-09-27T23:59:00",
    allowLateSubmission: true,
    latePenaltyPerHour: 1,
    createdAt: "2026-09-16T09:00:00",
    questions: buildGenericQuestions("asg-005", "practice"),
  },
  {
    id: "asg-006",
    classId: "cls-math-7a",
    title: "Kiểm tra giữa kỳ - Đại số 7",
    type: "test",
    status: "closed",
    description: "Kiểm tra giữa học kỳ I.",
    submissionMethod: "online",
    openAt: "2026-08-10T07:00:00",
    dueDate: "2026-08-14T23:59:00",
    allowLateSubmission: false,
    durationMinutes: 45,
    createdAt: "2026-08-09T09:00:00",
    questions: buildGenericQuestions("asg-006", "test"),
  },
  {
    id: "asg-007",
    classId: "cls-math-10a",
    title: "Bài tập rèn luyện phân tích đa thức",
    type: "practice",
    status: "assigned",
    description: "Rèn luyện thêm dạng bài phân tích đa thức thành nhân tử.",
    submissionMethod: "online",
    openAt: "2026-09-10T08:00:00",
    dueDate: "2026-09-19T23:59:00",
    allowLateSubmission: true,
    latePenaltyPerHour: 0.5,
    createdAt: "2026-09-09T09:00:00",
    questions: buildGenericQuestions("asg-007", "practice"),
  },
]

function sumDefined(values: Array<number | undefined>): number | undefined {
  const nums = values.filter((value): value is number => typeof value === "number")
  if (nums.length === 0) return undefined
  return Math.round(nums.reduce((sum, value) => sum + value, 0) * 100) / 100
}

/**
 * 3 bài nộp thật của lớp Toán 8A cho bài kiểm tra minh họa — khớp `MOCK_ENROLLMENTS`
 * của `cls-math-8a` (stu-001, stu-005, stu-009), KHÔNG dùng tên trong ảnh Stitch.
 * Trộn đủ trạng thái: đã công bố, đã duyệt (nộp muộn) và chưa nộp (đã quá hạn).
 */
const SEEDED_SUBMISSIONS: Submission[] = [
  {
    id: `${SEEDED_ASSIGNMENT_ID}-sub-stu-001`,
    assignmentId: SEEDED_ASSIGNMENT_ID,
    studentProfileId: "stu-001",
    submittedAt: "2026-09-16T20:10:00",
    isLate: false,
    status: "published",
    answers: [
      {
        questionId: `${SEEDED_ASSIGNMENT_ID}-q1`,
        selectedOptionId: `${SEEDED_ASSIGNMENT_ID}-q1-opt-1`,
        aiScore: 2.5,
        finalScore: 2.5,
      },
      {
        questionId: `${SEEDED_ASSIGNMENT_ID}-q2`,
        essayAnswer: "x(x - 3) + 2(x - 3) = 0 ⇔ (x - 3)(x + 2) = 0 ⇔ x = 3 hoặc x = -2.",
        aiScore: 3.5,
        finalScore: 3.5,
      },
      {
        questionId: `${SEEDED_ASSIGNMENT_ID}-q3`,
        essayAnswer:
          "S = (x + 4)(x - 4) = x² - 16. Diện tích giảm đúng 16m² theo hằng đẳng thức hiệu hai bình phương.",
        aiScore: 3,
        finalScore: 3,
      },
    ],
    aiTotalScore: 9,
    aiConfidence: 95,
    aiComment: "Bài làm đầy đủ, trình bày rõ ràng các bước biến đổi.",
    aiGradedAt: "2026-09-16T20:15:00",
    finalTotalScore: 9,
    reviewedAt: "2026-09-17T08:00:00",
    publishedAt: "2026-09-17T08:05:00",
  },
  {
    id: `${SEEDED_ASSIGNMENT_ID}-sub-stu-005`,
    assignmentId: SEEDED_ASSIGNMENT_ID,
    studentProfileId: "stu-005",
    submittedAt: "2026-09-17T08:00:00",
    isLate: true,
    status: "reviewed",
    answers: [
      {
        questionId: `${SEEDED_ASSIGNMENT_ID}-q1`,
        selectedOptionId: `${SEEDED_ASSIGNMENT_ID}-q1-opt-2`,
        aiScore: 0,
        finalScore: 0,
      },
      {
        questionId: `${SEEDED_ASSIGNMENT_ID}-q2`,
        essayAnswer: "(x - 3)(x + 2) = 0 nên x = 3.",
        aiScore: 2.5,
        finalScore: 2,
        teacherNote: "Thiếu nghiệm x = -2.",
      },
      {
        questionId: `${SEEDED_ASSIGNMENT_ID}-q3`,
        essayAnswer: "S = (x + 4)(x - 4).",
        aiScore: 2,
        finalScore: 2.5,
        teacherNote: "Chưa chứng minh phần b.",
      },
    ],
    aiTotalScore: 4.5,
    aiConfidence: 68,
    aiComment: "Cần giáo viên kiểm tra kỹ phần chứng minh ở câu 3, học sinh nộp muộn.",
    aiGradedAt: "2026-09-17T08:05:00",
    finalTotalScore: 4.5,
    reviewedAt: "2026-09-17T09:30:00",
  },
  {
    id: `${SEEDED_ASSIGNMENT_ID}-sub-stu-009`,
    assignmentId: SEEDED_ASSIGNMENT_ID,
    studentProfileId: "stu-009",
    status: "not_submitted",
    answers: [],
  },
]

/** Chuỗi trạng thái lặp lại để sinh dữ liệu ổn định, không dùng random. */
const SUBMISSION_STATUS_CYCLE: SubmissionStatus[] = [
  "published",
  "reviewed",
  "ai_graded",
  "pending",
  "not_submitted",
  "ai_grading",
]

/**
 * Độ tin cậy AI cố định cho từng bài nộp "ai_graded" sinh tự động (PROMPT T6) —
 * key theo đúng id sinh ra ở `buildGenericSubmissions` (`${assignmentId}-sub-${studentId}`).
 * Đủ đa dạng để demo hàng đợi T6: có bài trên ngưỡng `BUSINESS_RULES.AI_HIGH_CONFIDENCE_THRESHOLD`
 * (đủ điều kiện "Duyệt nhanh") và có bài dưới ngưỡng (cần giáo viên tự kiểm tra).
 */
const GENERIC_AI_CONFIDENCE_OVERRIDES: Record<string, number> = {
  "asg-002-sub-stu-009": 97,
  "asg-003-sub-stu-005": 83,
  "asg-004-sub-stu-007": 91,
}

type SubmissionStage = "none" | "submitted" | "graded" | "final"

function stageForStatus(status: SubmissionStatus): SubmissionStage {
  switch (status) {
    case "not_submitted":
      return "none"
    case "ai_graded":
      return "graded"
    case "reviewed":
    case "published":
      return "final"
    default:
      return "submitted"
  }
}

function buildAnswersForStage(questions: Question[], stage: SubmissionStage): AnswerRecord[] {
  if (stage === "none") return []

  return questions.map((question) => {
    const answer: AnswerRecord = { questionId: question.id }

    if (question.type === "multiple_choice") {
      answer.selectedOptionId = question.options?.find((option) => option.isCorrect)?.id
    } else {
      answer.essayAnswer = "Học sinh đã hoàn thành bài làm theo hướng dẫn của giáo viên."
    }

    if (stage === "graded" || stage === "final") {
      answer.aiScore = question.points
    }
    if (stage === "final") {
      answer.finalScore = question.points
    }

    return answer
  })
}

/**
 * Bài nộp cho các bài tập/đề kiểm tra KHÔNG phải bài kiểm tra minh họa — cùng kỹ
 * thuật lệch pha tất định của `mocks/data/attendance.ts` (chỉ số buổi + chỉ số học
 * sinh). Bài "Nháp" chưa giao nên chưa sinh bài nộp nào.
 */
function buildGenericSubmissions(): Submission[] {
  const submissions: Submission[] = []

  const assignmentsWithRoster = MOCK_ASSIGNMENTS.filter(
    (assignment) => assignment.id !== SEEDED_ASSIGNMENT_ID && assignment.status !== "draft"
  )

  assignmentsWithRoster.forEach((assignment, assignmentIndex) => {
    const studentIds = MOCK_ENROLLMENTS.filter(
      (enrollment) =>
        enrollment.classId === assignment.classId && enrollment.status === "active"
    ).map((enrollment) => enrollment.studentProfileId)

    studentIds.forEach((studentProfileId, studentIndex) => {
      const status =
        SUBMISSION_STATUS_CYCLE[
          (assignmentIndex + studentIndex) % SUBMISSION_STATUS_CYCLE.length
        ]
      const stage = stageForStatus(status)
      const answers = buildAnswersForStage(assignment.questions, stage)
      const hasScore = stage === "graded" || stage === "final"
      const dueDay = assignment.dueDate.slice(0, 10)
      const submissionId = `${assignment.id}-sub-${studentProfileId}`

      submissions.push({
        id: submissionId,
        assignmentId: assignment.id,
        studentProfileId,
        submittedAt: stage === "none" ? undefined : `${dueDay}T09:00:00`,
        isLate: false,
        status,
        answers,
        aiTotalScore: hasScore ? sumDefined(answers.map((answer) => answer.aiScore)) : undefined,
        aiConfidence: hasScore ? (GENERIC_AI_CONFIDENCE_OVERRIDES[submissionId] ?? 90) : undefined,
        aiComment: hasScore ? "AI đã chấm dựa trên đáp án mẫu của giáo viên." : undefined,
        aiGradedAt: hasScore ? `${dueDay}T09:05:00` : undefined,
        finalTotalScore:
          stage === "final" ? sumDefined(answers.map((answer) => answer.finalScore)) : undefined,
        reviewedAt: stage === "final" ? `${dueDay}T15:00:00` : undefined,
        publishedAt: status === "published" ? `${dueDay}T16:00:00` : undefined,
      })
    })
  })

  return submissions
}

export const MOCK_SUBMISSIONS: Submission[] = [
  ...SEEDED_SUBMISSIONS,
  ...buildGenericSubmissions(),
]

export function findAssignment(assignmentId: string): Assignment | undefined {
  return MOCK_ASSIGNMENTS.find((item) => item.id === assignmentId)
}

export function findSubmissionsByAssignment(assignmentId: string): Submission[] {
  return MOCK_SUBMISSIONS.filter((item) => item.assignmentId === assignmentId)
}

/**
 * Mutation giả lập cho Bài tập / Đề kiểm tra (PROMPT T5B).
 * Xóa cùng các hàm find/mock khác trong file này khi nối endpoint bài tập thật.
 */

export interface AssignmentQuestionInput {
  id: string
  type: QuestionType
  content: string
  points: number
  options?: QuestionOption[]
  sampleAnswer?: string
}

export interface AssignmentInput {
  title: string
  classId: string
  type: AssignmentType
  description?: string
  submissionMethod: SubmissionMethod
  openAt: string
  dueDate: string
  allowLateSubmission: boolean
  latePenaltyPerHour?: number
  durationMinutes?: number
  status: AssignmentStatus
  questions: AssignmentQuestionInput[]
}

function toQuestions(assignmentId: string, questions: AssignmentQuestionInput[]): Question[] {
  return questions.map((question, index) => ({
    id: question.id,
    assignmentId,
    order: index + 1,
    type: question.type,
    content: question.content.trim(),
    points: question.points,
    options: question.options,
    sampleAnswer: question.sampleAnswer?.trim() || undefined,
  }))
}

let assignmentSequence = MOCK_ASSIGNMENTS.length

export function mockCreateAssignment(input: AssignmentInput): Assignment {
  if (!findClass(input.classId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  assignmentSequence += 1
  const id = `asg-new-${assignmentSequence}`

  const assignment: Assignment = {
    id,
    classId: input.classId,
    title: input.title.trim(),
    type: input.type,
    status: input.status,
    description: input.description?.trim() || undefined,
    submissionMethod: input.submissionMethod,
    openAt: input.openAt,
    dueDate: input.dueDate,
    allowLateSubmission: input.allowLateSubmission,
    latePenaltyPerHour: input.allowLateSubmission ? input.latePenaltyPerHour : undefined,
    durationMinutes: input.durationMinutes,
    createdAt: new Date().toISOString(),
    questions: toQuestions(id, input.questions),
  }

  MOCK_ASSIGNMENTS.unshift(assignment)

  return assignment
}

export function mockUpdateAssignment(assignmentId: string, input: AssignmentInput): Assignment {
  const assignment = findAssignment(assignmentId)
  if (!assignment) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (!findClass(input.classId)) throw new MockError(ERROR_MSG.NOT_FOUND)

  assignment.title = input.title.trim()
  assignment.classId = input.classId
  assignment.type = input.type
  assignment.status = input.status
  assignment.description = input.description?.trim() || undefined
  assignment.submissionMethod = input.submissionMethod
  assignment.openAt = input.openAt
  assignment.dueDate = input.dueDate
  assignment.allowLateSubmission = input.allowLateSubmission
  assignment.latePenaltyPerHour = input.allowLateSubmission ? input.latePenaltyPerHour : undefined
  assignment.durationMinutes = input.durationMinutes
  assignment.questions = toQuestions(assignmentId, input.questions)

  return assignment
}

export function mockCloseAssignment(assignmentId: string): Assignment {
  const assignment = findAssignment(assignmentId)
  if (!assignment) throw new MockError(ERROR_MSG.NOT_FOUND)
  if (assignment.status === "closed") {
    throw new MockError(ASSIGNMENT_MSG.ALREADY_CLOSED_ERROR)
  }

  assignment.status = "closed"

  return assignment
}

/**
 * Mutation giả lập cho Chấm bài AI (PROMPT T6/T6B/T6C) — duyệt điểm giáo viên chỉnh
 * sửa lại trên đề xuất của AI. Xóa cùng các hàm khác trong file này khi nối endpoint
 * chấm bài thật.
 */

export interface GradingReviewInput {
  scores: Array<{ questionId: string; finalScore: number }>
  finalComment?: string
}

function findSubmission(submissionId: string): Submission {
  const submission = MOCK_SUBMISSIONS.find((item) => item.id === submissionId)
  if (!submission) throw new MockError(ERROR_MSG.NOT_FOUND)
  return submission
}

function applyGradingReview(submission: Submission, input: GradingReviewInput): void {
  const scoreByQuestion = new Map(input.scores.map((score) => [score.questionId, score.finalScore]))

  submission.answers.forEach((answer) => {
    const nextScore = scoreByQuestion.get(answer.questionId)
    if (nextScore !== undefined) answer.finalScore = nextScore
  })
  submission.finalTotalScore = sumDefined(submission.answers.map((answer) => answer.finalScore))
  submission.finalComment = input.finalComment?.trim() || undefined
}

/** Lưu điểm/nhận xét đã chỉnh sửa, chuyển trạng thái sang "Đã duyệt" — KHÔNG công bố. */
export function mockSaveGradingReview(submissionId: string, input: GradingReviewInput): Submission {
  const submission = findSubmission(submissionId)

  applyGradingReview(submission, input)
  submission.status = "reviewed"
  submission.reviewedAt = new Date().toISOString()

  return submission
}

/** Lưu (nếu có chỉnh sửa) rồi công bố kết quả cho phụ huynh/học sinh xem. */
export function mockPublishGrading(submissionId: string, input?: GradingReviewInput): Submission {
  const submission = findSubmission(submissionId)

  if (input) applyGradingReview(submission, input)
  submission.status = "published"
  submission.reviewedAt = submission.reviewedAt ?? new Date().toISOString()
  submission.publishedAt = new Date().toISOString()

  return submission
}

/**
 * Duyệt nhanh hàng loạt — giữ nguyên điểm AI đề xuất làm điểm cuối cùng, chuyển
 * sang "Đã duyệt" (chưa công bố), để giáo viên vẫn có thể mở lại kiểm tra sau.
 */
export function mockBulkApproveHighConfidence(submissionIds: string[]): Submission[] {
  return submissionIds.map((submissionId) => {
    const submission = findSubmission(submissionId)

    submission.answers.forEach((answer) => {
      if (answer.aiScore !== undefined) answer.finalScore = answer.aiScore
    })
    submission.finalTotalScore = submission.aiTotalScore
    submission.status = "reviewed"
    submission.reviewedAt = new Date().toISOString()

    return submission
  })
}
