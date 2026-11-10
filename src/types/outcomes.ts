/** Chuẩn đầu ra khóa học (CLO) — `GET academic/programs/:id/outcome-sets` của BE. */
export type OutcomeSetStatus = "DRAFT" | "APPROVED";
export type OutcomeSourceStatus = "CANDIDATE" | "VERIFIED";

export interface LearningOutcome {
  id: string;
  outcomeSetId: string;
  code: string;
  title: string;
  statement: string;
  /** Ba trường nguồn có thể null (B3, mục tiêu bản nhẹ). */
  sourceTitle: string | null;
  sourceUrl: string | null;
  sourceLocator: string | null;
  sourceStatus: OutcomeSourceStatus;
  sourceNote: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  required: boolean;
  /** Tăng mỗi lần sửa; gửi lại làm `expectedRevision` khi sửa. */
  revision: number;
  lessonLinks: { lessonId: string }[];
}

/** Một phiên bản bộ CLO của khóa học; `level` là nhãn tự do do trung tâm đặt. */
export interface OutcomeSet {
  id: string;
  programId: string;
  level: string;
  version: number;
  status: OutcomeSetStatus;
  designerId: string;
  reviewerId: string | null;
  reviewedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  reviewNote: string | null;
  outcomes: LearningOutcome[];
}

/** CLO mà một bài tập đo (`learningTargets` trong chi tiết bài tập). */
export interface LearningTarget {
  id: string;
  code: string;
  title: string;
  statement: string;
}
