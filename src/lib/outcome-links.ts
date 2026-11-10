// Mục tiêu khóa học (CLO) chưa gắn bài. Hàm thuần, chỉ import type để `node --test` nạp thẳng được.
import type { OutcomeSet } from "@/types/outcomes";

/** Số mã hiện tối đa trong một câu; phần còn lại gộp thành "và N mục tiêu khác". */
export const OUTCOME_CODE_LIMIT = 5;

export interface UnlinkedOutcomeGroup {
  setId: string;
  level: string;
  version: number;
  /** Mã mục tiêu chưa có bài nào, theo thứ tự mã. */
  codes: string[];
}

/**
 * Mục tiêu thuộc bộ nháp mà chưa gắn bài nào, nhóm theo bộ. Giáo viên chỉ duyệt nội dung
 * được bộ mục tiêu khi mọi mục tiêu đã có ít nhất một bài (`technicalApprove` của BE).
 */
export function unlinkedDraftOutcomes(
  sets: readonly OutcomeSet[],
): UnlinkedOutcomeGroup[] {
  return sets
    .filter((set) => set.status === "DRAFT")
    .map((set) => ({
      setId: set.id,
      level: set.level,
      version: set.version,
      codes: set.outcomes
        .filter((outcome) => outcome.lessonLinks.length === 0)
        .map((outcome) => outcome.code)
        .sort((left, right) => left.localeCompare(right, "vi", { numeric: true })),
    }))
    .filter((group) => group.codes.length > 0)
    .sort(
      (left, right) =>
        left.level.localeCompare(right.level, "vi") || left.version - right.version,
    );
}

export function countUnlinked(groups: readonly UnlinkedOutcomeGroup[]): number {
  return groups.reduce((total, group) => total + group.codes.length, 0);
}

/** "A, B, C, D, E và 2 mục tiêu khác". */
export function listOutcomeCodes(
  codes: readonly string[],
  limit = OUTCOME_CODE_LIMIT,
): string {
  const shown = codes.slice(0, limit).join(", ");
  const rest = codes.length - limit;
  return rest > 0 ? `${shown} và ${rest} mục tiêu khác` : shown;
}

/**
 * Từng dòng mã cho khối cảnh báo. Một bộ nháp: một dòng chỉ có mã; từ hai bộ trở lên:
 * mỗi bộ một dòng có tiền tố "<cấp độ> · bản N:".
 */
export function unlinkedOutcomeLines(
  groups: readonly UnlinkedOutcomeGroup[],
): string[] {
  if (groups.length === 1) return [listOutcomeCodes(groups[0].codes)];
  return groups.map(
    (group) =>
      `${group.level} · bản ${group.version}: ${listOutcomeCodes(group.codes)}`,
  );
}

/** Lưu ý trong hộp gửi duyệt giáo trình; rỗng khi không còn mục tiêu nào chưa gắn bài. */
export function unlinkedOutcomeSubmitNote(
  groups: readonly UnlinkedOutcomeGroup[],
): string {
  const total = countUnlinked(groups);
  if (!total) return "";
  const codes = listOutcomeCodes(groups.flatMap((group) => group.codes));
  return `Lưu ý: còn ${total} mục tiêu chưa gắn bài (${codes}). Bạn vẫn gửi duyệt giáo trình được. Hãy gắn bài cho các mục tiêu này trước khi giáo viên duyệt bộ mục tiêu.`;
}

/** Trang Khóa học & giáo trình của Thiết kế GT (= `ROUTES.MANAGER.CURRICULUM`; lặp lại ở đây để file giữ thuần cho `node --test`). */
const OUTCOME_MATRIX_PATH = "/manager/curriculum";

/** Giá trị `?outcomeMatrix=` khi chưa chỉ định bộ: màn tự chọn bộ nháp đầu tiên của khóa. */
export const OUTCOME_MATRIX_FIRST_SET = "first";

/**
 * Link tới màn gắn bài hàng loạt (tab "Mục tiêu khóa học", `?outcomeMatrix=`).
 * Chỉ Thiết kế GT có tab này, nên chỉ dựng link cho vai trò đó. `setId` bỏ trống thì
 * màn tự chọn bộ nháp đầu tiên của khóa.
 */
export function buildOutcomeMatrixHref(programId: string, setId?: string): string {
  const query = new URLSearchParams({
    tab: "outcomes",
    outcomeProgram: programId,
    outcomeMatrix: setId || OUTCOME_MATRIX_FIRST_SET,
  });
  return `${OUTCOME_MATRIX_PATH}?${query}`;
}

/** Mọi mục tiêu đang gắn vào bài, ở mọi bộ và mọi trạng thái (C29). */
export function lessonOutcomeIds(
  sets: readonly OutcomeSet[],
  lessonId: string,
): string[] {
  return sets.flatMap((set) =>
    set.outcomes
      .filter((outcome) => outcome.lessonLinks.some((link) => link.lessonId === lessonId))
      .map((outcome) => outcome.id),
  );
}

/**
 * Danh sách gửi cho `PATCH academic/lessons/:id/outcomes`. BE xóa mọi liên kết không gửi (kể cả
 * tới bộ đã duyệt) nên gửi = liên kết hiện có (lấy lại ngay trước khi lưu) - phần bỏ chọn +
 * phần chọn thêm. Trả `null` khi người dùng không đổi gì: không gọi API.
 */
export function nextLessonOutcomeIds(
  existing: readonly string[],
  initial: readonly string[],
  current: readonly string[],
): string[] | null {
  const removed = new Set(initial.filter((id) => !current.includes(id)));
  const added = current.filter((id) => !initial.includes(id));
  if (!removed.size && !added.length) return null;
  return [...new Set([...existing.filter((id) => !removed.has(id)), ...added])];
}

/**
 * Bộ đi cùng giáo trình (C28): bộ của khóa có ít nhất một mục tiêu gắn vào bài của giáo trình
 * này. Giáo trình không có khóa ngoại tới bộ nên chỉ suy được từ liên kết bài.
 */
export function companionSets(
  sets: readonly OutcomeSet[],
  lessonIds: readonly string[],
): OutcomeSet[] {
  const lessons = new Set(lessonIds);
  return sets.filter((set) =>
    set.outcomes.some((outcome) =>
      outcome.lessonLinks.some((link) => lessons.has(link.lessonId)),
    ),
  );
}
