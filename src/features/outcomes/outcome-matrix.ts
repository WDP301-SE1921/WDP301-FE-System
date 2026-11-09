// Tính toán cho màn gắn bài hàng loạt. Hàm thuần, chỉ import type để `node --test` nạp thẳng được.
import type { OutcomeSet } from "@/types/outcomes";

/** Lựa chọn hiện tại: bài → các mục tiêu của bộ nháp đang được tick. */
export type MatrixSelection = ReadonlyMap<string, ReadonlySet<string>>;

/** Giáo trình lưu trữ thì BE trả LESSON_LOCKED: không cho tick. */
export function isUnitLocked(status: string): boolean {
  return status === "ARCHIVED";
}

/** Lựa chọn ban đầu của một bộ nháp, đọc từ `lessonLinks` của từng mục tiêu. */
export function initialSelection(
  draftSet: OutcomeSet,
  lessonIds: readonly string[],
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>(
    lessonIds.map((id) => [id, new Set<string>()]),
  );
  for (const outcome of draftSet.outcomes)
    for (const link of outcome.lessonLinks)
      result.get(link.lessonId)?.add(outcome.id);
  return result;
}

/**
 * Số mục tiêu của bộ chưa có bài nào được tick. Mục tiêu đã gắn bài nằm ngoài ma trận
 * (bài của giáo trình lưu trữ) vẫn tính là đã có bài.
 */
export function countUnlinkedAfterEdit(
  draftSet: OutcomeSet,
  selection: MatrixSelection,
  matrixLessonIds: ReadonlySet<string>,
): number {
  const used = new Set<string>();
  for (const ids of selection.values()) for (const id of ids) used.add(id);
  return draftSet.outcomes.filter(
    (outcome) =>
      !used.has(outcome.id) &&
      !outcome.lessonLinks.some((link) => !matrixLessonIds.has(link.lessonId)),
  ).length;
}

/** Các bài có tick khác lúc mở màn (hoặc lần lưu thành công gần nhất). */
export function changedLessonIds(
  baseline: MatrixSelection,
  current: MatrixSelection,
): string[] {
  const changed: string[] = [];
  for (const [lessonId, ids] of current) {
    const before = baseline.get(lessonId) ?? new Set<string>();
    if (before.size !== ids.size || [...ids].some((id) => !before.has(id)))
      changed.push(lessonId);
  }
  return changed;
}

/**
 * `outcomeIds` gửi cho `PATCH academic/lessons/:id/outcomes` (API thay toàn bộ liên kết của bài):
 * các ô đã tick của bộ nháp + liên kết sẵn có của bài tới mục tiêu của bộ khác. Phải dựng từ
 * danh sách bộ mới nhất, không dùng dữ liệu cũ, để không xóa liên kết người khác vừa gắn.
 */
export function outcomeIdsToSave(
  lessonId: string,
  ticked: ReadonlySet<string>,
  allSets: readonly OutcomeSet[],
  draftSetId: string,
): string[] {
  const ids = new Set(ticked);
  for (const set of allSets) {
    if (set.id === draftSetId) continue;
    for (const outcome of set.outcomes)
      if (outcome.lessonLinks.some((link) => link.lessonId === lessonId))
        ids.add(outcome.id);
  }
  return [...ids];
}

export interface MatrixLesson {
  sequence: number;
  kind: "LESSON" | "MONTHLY_TEST";
  monthKey: string | null;
}

/** "YYYY-MM" → "MM/YYYY"; giá trị lạ thì giữ nguyên. */
function monthText(monthKey: string | null): string {
  const match = monthKey ? /^(\d{4})-(\d{2})$/.exec(monthKey) : null;
  return match ? `${match[2]}/${match[1]}` : (monthKey ?? "");
}

/** Nhãn hàng: bài học là "Bài N"; bài kiểm tra tháng có dãy số riêng nên ghi theo tháng. */
export function lessonLabel(lesson: MatrixLesson): string {
  if (lesson.kind !== "MONTHLY_TEST") return `Bài ${lesson.sequence}`;
  const month = monthText(lesson.monthKey);
  return month ? `Kiểm tra tháng ${month}` : "Kiểm tra tháng";
}

/** Bài học theo số thứ tự, rồi các bài kiểm tra tháng theo tháng. */
export function orderLessons<T extends MatrixLesson>(lessons: readonly T[]): T[] {
  return [...lessons].sort(
    (left, right) =>
      Number(left.kind === "MONTHLY_TEST") - Number(right.kind === "MONTHLY_TEST") ||
      (left.kind === "MONTHLY_TEST"
        ? (left.monthKey ?? "").localeCompare(right.monthKey ?? "") ||
          left.sequence - right.sequence
        : left.sequence - right.sequence),
  );
}
