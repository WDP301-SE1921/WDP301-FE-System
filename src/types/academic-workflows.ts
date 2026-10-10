import type {
  RegistrationClass,
  RegistrationOrder,
  StudentProfile,
} from "./backend";

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
export interface MakeupCandidate {
  id: string;
  startsAt: string;
  endsAt: string;
  class: { name: string; capacity: number };
  _count: { participants: number };
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
}
export interface AssignmentQuestion {
  id: string;
  kind: "MULTIPLE_CHOICE" | "ESSAY";
  prompt: string;
  choices: string[] | null;
  correctAnswer?: string;
  rubric?: string;
  maxScore: number;
}
export interface AssignmentDetail extends AssignmentSummary {
  instructions: string;
  recipients: { id: string; enrollmentId: string }[];
  questions: AssignmentQuestion[];
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
