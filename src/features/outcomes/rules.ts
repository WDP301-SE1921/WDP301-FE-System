import { actsAsManager, type WebRole } from "@/constants/roles";
import type {
  LearningTarget,
  OutcomeSet,
  OutcomeSetStatus,
} from "@/types/outcomes";

export const OUTCOME_SET_STATUS_TEXT: Record<OutcomeSetStatus, string> = {
  DRAFT: "Bản nháp",
  APPROVED: "Đã duyệt áp dụng",
};

/** Thao tác được phép theo quy tắc BE (`outcome.service.ts`); BE vẫn kiểm tra lại quyền. */
export function outcomeSetActions(
  set: OutcomeSet,
  user: { id: string; role: WebRole },
) {
  const isDraft = set.status === "DRAFT";
  return {
    canEditOutcomes:
      user.role === "curriculum_designer" && isDraft,
    canCopy: user.role === "curriculum_designer",
    canVerify: user.role === "teacher" && isDraft,
    canTechnicallyApprove: user.role === "teacher" && isDraft,
    canRequestChanges:
      actsAsManager(user.role) && set.status === "APPROVED",
  };
}

/** BE (`technicalApprove`) chỉ cho giáo viên duyệt bộ khi bộ có mục tiêu và mỗi mục tiêu có bài học (xác minh nguồn không bắt buộc). */
export function technicalApprovalBlockers(set: OutcomeSet): string[] {
  if (!set.outcomes.length) return ["Bộ chưa có mục tiêu nào."];
  return set.outcomes
    .filter((outcome) => !outcome.lessonLinks.length)
    .map((outcome) => `${outcome.code}: chưa gắn bài học nào.`);
}

/**
 * BE trả `learningTargets` là cả bộ CLO của bài; mục tiêu thật của bài là các CLO
 * mà câu hỏi gắn `outcomeId`, giữ thứ tự trong bộ.
 */
export function measuredLearningTargets(
  targets: LearningTarget[] | undefined,
  questions: { outcomeId?: string | null }[],
): LearningTarget[] {
  const measured = new Set(questions.map((question) => question.outcomeId));
  return (targets ?? []).filter((target) => measured.has(target.id));
}

export interface ProgramOption {
  id: string;
  label: string;
}
function uniquePrograms(
  rows: { programId: string; program?: { name: string } | null }[],
): ProgramOption[] {
  const seen = new Map<string, string>();
  for (const row of rows)
    if (!seen.has(row.programId))
      seen.set(row.programId, row.program?.name ?? `Khóa học ${row.programId}`);
  return [...seen].map(([id, label]) => ({ id, label }));
}
/** Khóa học của các lớp giáo viên đang dạy (điều kiện BE để xác minh CLO). */
export const programsFromClasses = uniquePrograms;
