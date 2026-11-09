// Nhóm giáo viên duyệt nội dung theo `reason` của BE (B4). Hàm thuần.
import type {
  CurriculumReviewer,
  CurriculumReviewerReason,
} from "@/types/curriculum";

export const REVIEWER_REASON_LABEL: Record<CurriculumReviewerReason, string> = {
  PROGRAM: "Giáo viên đang dạy khóa này",
  SUBJECT: "Giáo viên dạy cùng môn",
  ANY: "Giáo viên khác (chưa có giáo viên dạy cùng môn)",
};

const ORDER: CurriculumReviewerReason[] = ["PROGRAM", "SUBJECT", "ANY"];

export interface ReviewerGroup {
  /** `null` khi BE cũ chưa trả `reason`: một nhóm phẳng, không nhãn. */
  reason: CurriculumReviewerReason | null;
  label: string | null;
  reviewers: CurriculumReviewer[];
}

/** Nhóm theo thứ tự PROGRAM, SUBJECT, ANY; trong nhóm giữ thứ tự BE trả về. */
export function groupReviewers(
  reviewers: readonly CurriculumReviewer[],
): ReviewerGroup[] {
  if (!reviewers.length) return [];
  if (reviewers.every((item) => !item.reason))
    return [{ reason: null, label: null, reviewers: [...reviewers] }];
  const groups: ReviewerGroup[] = ORDER.map((reason) => ({
    reason,
    label: REVIEWER_REASON_LABEL[reason],
    reviewers: reviewers.filter((item) => item.reason === reason),
  })).filter((group) => group.reviewers.length);
  const unknown = reviewers.filter(
    (item) => !item.reason || !ORDER.includes(item.reason),
  );
  if (unknown.length)
    groups.push({ reason: null, label: null, reviewers: unknown });
  return groups;
}

/** Người được chọn sẵn: người đầu tiên của nhóm đầu tiên. */
export function defaultReviewerId(
  reviewers: readonly CurriculumReviewer[],
): string {
  return groupReviewers(reviewers)[0]?.reviewers[0]?.id ?? "";
}
