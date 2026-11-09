// Đổi thứ tự bài học. Hàm thuần, không import gì để `node --test` nạp thẳng được.

/** Dời bài `id` lên (-1) hoặc xuống (+1) một vị trí. Trả null khi đã ở đầu/cuối hoặc không có bài. */
export function moveLessonBy(
  ids: readonly string[],
  id: string,
  direction: -1 | 1,
): string[] | null {
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Số hợp lệ cho "Chuyển tới vị trí": nguyên, từ 1 đến `count`. */
export function isLessonPosition(position: number, count: number): boolean {
  return Number.isInteger(position) && position >= 1 && position <= count;
}

/** Đưa bài `id` tới vị trí `position` (1 là đầu). Trả null khi số ngoài 1..N, trùng vị trí cũ hoặc không có bài. */
export function moveLessonTo(
  ids: readonly string[],
  id: string,
  position: number,
): string[] | null {
  const index = ids.indexOf(id);
  if (index < 0 || !isLessonPosition(position, ids.length)) return null;
  if (index === position - 1) return null;
  const next = ids.filter((item) => item !== id);
  next.splice(position - 1, 0, id);
  return next;
}

/** Số thứ tự cho bài mới: lớn nhất hiện có + 1 (không trùng kể cả khi có lỗ hổng). */
export function nextLessonSequence(sequences: readonly number[]): number {
  return Math.max(0, ...sequences) + 1;
}
