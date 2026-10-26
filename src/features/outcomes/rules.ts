import type { WebRole } from "@/constants/roles";
import type { OutcomeSet, OutcomeSetStatus } from "@/types/outcomes";

export const OUTCOME_SET_STATUS_TEXT: Record<OutcomeSetStatus, string> = {
  DRAFT: "Nháp",
  TECHNICALLY_APPROVED: "Chờ Quản lý duyệt",
  APPROVED: "Đã duyệt",
};

/** Thao tác được phép theo quy tắc BE (`outcome.service.ts`); BE vẫn kiểm tra lại quyền. */
export function outcomeSetActions(
  set: OutcomeSet,
  user: { id: string; role: WebRole },
) {
  const isDraft = set.status === "DRAFT";
  const isReviewed = set.status === "TECHNICALLY_APPROVED";
  return {
    canEditOutcomes:
      user.role === "curriculum_designer" &&
      set.designerId === user.id &&
      isDraft,
    canCopy: user.role === "curriculum_designer",
    canVerify: user.role === "teacher" && isDraft,
    canTechnicallyApprove: user.role === "teacher" && isDraft,
    canApprove: user.role === "center_manager" && isReviewed,
    canRequestChanges: user.role === "center_manager" && isReviewed,
  };
}

/** BE chỉ cho duyệt chuyên môn khi mọi CLO do chính giáo viên đó xác minh và có bài học. */
export function technicalApprovalBlockers(
  set: OutcomeSet,
  teacherId: string,
): string[] {
  if (!set.outcomes.length) return ["Bộ chưa có CLO nào."];
  return set.outcomes.flatMap((outcome) => [
    ...(outcome.sourceStatus === "VERIFIED" && outcome.verifiedById === teacherId
      ? []
      : [`${outcome.code}: bạn chưa tự xác minh nguồn.`]),
    ...(outcome.lessonLinks.length
      ? []
      : [`${outcome.code}: chưa gắn bài học nào.`]),
  ]);
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
/** Khóa học có giáo trình do Thiết kế GT soạn (điều kiện BE để tạo bộ CLO). */
export const programsFromUnits = uniquePrograms;
/** Khóa học của các lớp giáo viên đang dạy (điều kiện BE để xác minh CLO). */
export const programsFromClasses = uniquePrograms;
