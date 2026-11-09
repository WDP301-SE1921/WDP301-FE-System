import type {
  RegistrationClass,
  RegistrationOrder,
  StudentProfile,
} from "./backend";
import type { LearningTarget } from "./outcomes";

export interface EnrollmentRecord {
  id: string;
  classId: string;
  studentProfileId?: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  packageMonths: number;
  class: RegistrationClass;
  studentProfile?: StudentProfile | null;
  placements: {
    classId: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    class?: RegistrationClass;
  }[];
  registrationOrder?: RegistrationOrder;
}
export interface SessionParticipant {
  id: string;
  enrollmentId: string;
  kind: "REGULAR" | "MAKEUP";
  attendance: "UNMARKED" | "PRESENT" | "ABSENT" | "EXCUSED";
  enrollment: {
    studentProfile: Pick<StudentProfile, "id" | "fullName"> | null;
  };
}
export interface LeaveRecord {
  id: string;
  enrollmentId: string;
  sessionId: string | null;
  kind: "SINGLE_ABSENCE" | "PERIOD_PAUSE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason: string;
  decisionNote: string | null;
  fromDate: string;
  toDate: string;
  enrollment: {
    id: string;
    status: string;
    studentProfile: StudentProfile | null;
    class: { id: string; name: string };
  };
}
export interface MakeupSource {
  id: string;
  enrollmentId: string;
  attendance: SessionParticipant["attendance"];
  enrollment: SessionParticipant["enrollment"];
  session: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    lesson: { id: string; title: string };
    class: { id: string; name: string };
  };
}
/** Eligibility and seats come from the same BE check as booking; it is a snapshot, not a hold. */
export interface MakeupCandidate {
  id: string;
  startsAt: string;
  endsAt: string;
  class: { name: string; capacity: number };
  eligible: boolean;
  availableSeats: number;
  reasonCodes: string[];
}
export interface MakeupRecord {
  id: string;
  status: "BOOKED" | "COMPLETED" | "MISSED" | "CANCELLED";
  originalParticipantId: string;
  replacementParticipantId: string;
  original: { sessionId: string; enrollmentId: string };
  replacement: {
    session: { id: string; classId: string; startsAt: string; endsAt: string };
  };
}
export interface AssignmentSummary {
  id: string;
  classId: string;
  title: string;
  dueAt: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  maxAttempts: number;
  kind: "HOMEWORK" | "TEST";
  testType: "FIFTEEN_MINUTES" | "ONE_PERIOD" | "MIDTERM" | "FINAL" | null;
  sessionId: string | null;
  session?: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
  } | null;
}
export interface AssignmentQuestion {
  id: string;
  kind: "MULTIPLE_CHOICE" | "ESSAY";
  prompt: string;
  choices: string[] | null;
  correctAnswer?: string;
  rubric?: string;
  maxScore: number;
  outcomeId?: string | null;
}
export interface AssignmentDetail extends AssignmentSummary {
  instructions: string;
  recipients: { id: string; enrollmentId: string }[];
  questions: AssignmentQuestion[];
  /** Bộ CLO đã duyệt mà bài đo; `null` khi bài không gắn CLO. */
  outcomeSetId?: string | null;
  learningTargets?: LearningTarget[];
}
export interface AssignmentImportPreview {
  fileName: string;
  format: "CSV" | "DOCX" | "PDF";
  title?: string;
  instructions?: string;
  questions: Omit<AssignmentQuestion, "id">[];
  warnings: string[];
  usedAi: boolean;
}
export interface GradeScore {
  questionId: string;
  score: number;
  feedback: string;
}
export interface GradeReview {
  id: string;
  revision: number;
  status: "DRAFT" | "APPROVED" | "PUBLISHED" | "SUPERSEDED";
  scores: GradeScore[];
  totalScore: number;
  feedback: string;
  publishedAt: string | null;
}
export interface SubmissionRecord {
  id: string;
  recipientId: string;
  attemptNo: number;
  submittedAt: string;
  answers: { questionId: string; answer: string }[];
  files: { fileId: string }[];
  grades: GradeReview[];
}
export interface GradingJob {
  id: string;
  submissionId: string;
  status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  result: { scores: GradeScore[] } | null;
  error: string | null;
}
export interface ReportRecord {
  id: string;
  classId: string;
  createdAt: string;
  /** Khoảng thời gian khi tạo (ngày `YYYY-MM-DD` hoặc ISO). */
  from?: string;
  to?: string;
  /** `null`: báo cáo cũ chưa lưu phạm vi. */
  scope?: "CLASS" | "STUDENT" | null;
  studentId?: string | null;
  studentName?: string | null;
}
/** `GET academic/students/:id/grades`: bài được giao kèm lần nộp mới nhất và điểm đã công bố. */
export interface StudentGradeRecord {
  id: string;
  title: string;
  kind: "HOMEWORK" | "TEST";
  testType: "FIFTEEN_MINUTES" | "ONE_PERIOD" | "MIDTERM" | "FINAL" | null;
  dueAt: string;
  status: "PUBLISHED" | "CLOSED";
  class: { id: string; name: string };
  maxScore: number;
  submission: { id: string; attemptNo: number; submittedAt: string } | null;
  grade: { totalScore: number; publishedAt: string | null } | null;
}
export interface CurriculumFeedbackRecord {
  id: string;
  lessonId: string;
  teacherId: string;
  content: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DECLINED";
  response: string | null;
  resolutionLessonId: string | null;
  createdAt: string;
}
export interface LessonRecord {
  id: string;
  programId: string;
  title: string;
  content: string;
  status: string;
  sequence: number;
  basedOnId: string | null;
}
export interface AnnouncementRecord {
  id: string;
  classId: string;
  title: string;
  content: string;
  createdAt: string;
}
export interface AttendanceHistoryRow {
  id: string;
  attendance: SessionParticipant["attendance"];
  enrollmentId: string;
  enrollment: { studentProfile: { id: string; fullName: string } | null };
  session: { id: string; classId: string; startsAt: string; endsAt: string };
  effectiveStatus: "PRESENT" | "ABSENT" | "MADE_UP" | "EXCUSED";
}
export interface AttendanceCounts {
  present: number;
  absent: number;
  madeUp: number;
  excused: number;
  required: number;
  attended: number;
}
export interface AttendanceSummary {
  range: { from: string | null; to: string | null };
  counts: AttendanceCounts;
  attendancePercent: number | null;
  history: AttendanceHistoryRow[];
  students: {
    studentId: string;
    fullName: string;
    counts: AttendanceCounts;
    attendancePercent: number | null;
  }[];
}
export interface QueuedEmailResult {
  results: { email: string; queued: boolean }[];
  automaticRetry: boolean;
}
export interface EmailDelivery {
  id: string;
  eventType: string;
  recipient: string;
  subject: string;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
}
export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
  } | null;
}
export interface AccountInvitation {
  id: string;
  email: string;
  role: "TEACHER" | "MANAGER";
  status: "INVITED" | "ACCEPTED" | "APPROVED" | "REJECTED" | "REVOKED";
  expiresAt: string;
  acceptedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  acceptedUser?: {
    id: string;
    displayName: string | null;
    email: string;
  } | null;
  /** Chi tra mot lan khi tao; BE cung xep email moi vao outbox. */
  acceptanceToken?: string;
}
export interface RoomRecord {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
}
export interface SubstituteCandidate {
  id: string;
  email: string;
  displayName: string | null;
}
export interface StudentSchedule {
  enrollmentId: string;
  classId: string;
  className: string;
  subject: string;
  grade: number;
  startDate: string;
  endDate: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
}

/** `GET academic/classes/:id/attendance-summary` (buổi đã chốt; `effectiveStatus` tính cả học bù). */
export interface ClassAttendanceSummary {
  counts: {
    present: number;
    absent: number;
    madeUp: number;
    excused: number;
    required: number;
    attended: number;
  };
  attendancePercent: number | null;
  students: {
    studentId: string;
    fullName: string;
    attendancePercent: number | null;
  }[];
  history: {
    id: string;
    attendance: SessionParticipant["attendance"];
    effectiveStatus: "PRESENT" | "ABSENT" | "EXCUSED" | "MADE_UP";
    session: { id: string; classId: string; startsAt: string; endsAt: string };
  }[];
}
