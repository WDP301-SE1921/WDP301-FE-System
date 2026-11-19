export interface CurriculumLesson {
  id: string;
  unitId: string;
  title: string;
  content: string;
  sequence: number;
  kind: "LESSON" | "MONTHLY_TEST";
  monthKey: string | null;
  status: "DRAFT" | "APPROVED";
  /** Mục tiêu khóa học đã gắn vào bài (BE trả trong chi tiết giáo trình); thiếu ở BE cũ. */
  outcomeLinks?: { outcomeId: string }[];
}

export interface CurriculumUnit {
  id: string;
  programId: string;
  designerId: string;
  /** Existing BE lineage, populated by revise; absent on legacy responses. */
  basedOnId?: string | null;
  title: string;
  fromDate: string;
  toDate: string;
  version: number;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "ARCHIVED";
  revision: number;
  reviewNote: string | null;
  reviewerTeacherId: string | null;
  reviewerTeacher: CurriculumReviewer | null;
  technicalReviewedAt: string | null;
  technicalReviewNote: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  archivedAt?: string | null;
  archiveReason?: "MANUAL" | "SUPERSEDED" | null;
  supersededById?: string | null;
  program?: { id: string; name: string; subject: string; grade: number; sessionsPerWeek?: number | null };
  track: { id: string; grade: number; subject: string; subjectKey: string };
  _count?: { lessons: number };
}

/** Vì sao giáo viên này được chọn duyệt: dạy khóa này, dạy cùng môn, hoặc khóa chưa có ai cùng môn. */
export type CurriculumReviewerReason = "PROGRAM" | "SUBJECT" | "ANY";

export interface CurriculumReviewer {
  id: string;
  displayName: string | null;
  email: string;
  /** BE cũ chưa trả field này. */
  reason?: CurriculumReviewerReason;
}

export interface CurriculumUnitDetail extends CurriculumUnit {
  lessons: CurriculumLesson[];
}

export interface SessionReference {
  id: string;
  classId: string;
  startsAt: string;
  endsAt: string;
}

export interface SessionPreviewSlot {
  date: string;
  startsAt: string;
  endsAt: string;
  lessonId: string;
  lessonTitle: string;
  kind: "LESSON" | "MONTHLY_TEST";
  monthKey: string;
  conflicts: SessionReference[];
  makeupCandidates: SessionReference[];
}

export interface SessionPreview {
  previewId: string;
  expiresAt: string;
  summary: {
    total: number;
    lessons: number;
    monthlyTests: number;
    conflicts: number;
  };
  classId: string;
  curriculumUnitId: string;
  fromDate: string;
  /** = `endDate`. */
  toDate: string;
  /** Ngày của buổi cuối, BE tự tính theo số bài còn lại của giáo trình. */
  endDate?: string;
  /** Số bài (buổi) sẽ được xếp. */
  lessonCount?: number;
  /** FIRST_LESSON: lớp bắt đầu từ bài 1; CONTINUE: xếp tiếp sau buổi đã có. */
  mode?: "FIRST_LESSON" | "CONTINUE";
  startLesson?: number;
  slots: SessionPreviewSlot[];
}

export interface ScheduledSession extends SessionReference {
  teacherId: string;
  teacher?: { id: string; displayName: string | null } | null;
  cancelReason?: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  class: { name: string; program: { grade: number; subject: string } };
  lesson: {
    id: string;
    title: string;
    kind: "LESSON" | "MONTHLY_TEST";
    monthKey: string | null;
    unitId: string | null;
    content?: string;
    sequence?: number;
    /** CLO của bài học; chỉ có trong chi tiết buổi (`GET scheduled-sessions/:id`, nhân sự và giáo viên). */
    outcomes?: { id: string; code: string; title: string }[];
  } | null;
}

export interface ScheduledSessionDetail extends ScheduledSession {
  revision: number;
}

export type SessionMutationResult = Pick<
  ScheduledSessionDetail,
  | "id"
  | "classId"
  | "startsAt"
  | "endsAt"
  | "status"
  | "revision"
  | "cancelReason"
>;

export interface SessionGeneration {
  id: string;
  classId: string;
  unitId: string;
  fromDate: string;
  toDate: string;
  createdAt: string;
  unit?: {
    id: string;
    title: string;
    version: number;
    status: CurriculumUnit["status"];
  };
  _count?: { sessions: number };
  sessions: SessionReference[];
}

export interface CurriculumFilters {
  programId?: string;
  status?: CurriculumUnit["status"];
  search?: string;
  subject?: string;
  grade?: number;
  page?: number;
  limit?: number;
}
export interface CurriculumValidation {
  unitId: string;
  revision: number;
  ready: boolean;
  errors: { code: string; message: string }[];
  lessonCount: number;
  monthlyTestCount: number;
}
export interface ImportRow {
  rowNumber: number;
  kind: "LESSON" | "MONTHLY_TEST";
  sequence: number | null;
  title: string;
  content: string;
  monthKey: string | null;
  /** Mã mục tiêu ghi ở cột "Mã mục tiêu"; BE cũ không trả. */
  outcomeCodes?: string[];
}
export interface ImportPreview {
  previewId: string;
  unitId: string;
  expectedRevision: number;
  expiresAt: string;
  summary: { rows: number; validRows: number; invalidRows: number };
  rows: (Omit<ImportRow, "kind"> & {
    kind: string;
    errors: {
      code: string;
      field: string;
      rowNumber: number;
      codes?: string[];
    }[];
  })[];
}
