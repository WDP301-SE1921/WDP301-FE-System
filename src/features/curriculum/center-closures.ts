/**
 * Hàm thuần cho ngày nghỉ trung tâm và hủy buổi theo lô (W12). Không import alias để
 * `node --test` chạy được. Ngày so sánh bằng chuỗi `YYYY-MM-DD` (giờ Việt Nam) như BE.
 */

/** Ngày dạng YYYY-MM-DD (dùng cho schema form ngày nghỉ). */
export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ClosureRange {
  fromDate: string;
  toDate: string;
}

/** BE: một ngày nghỉ tối đa 92 ngày (`CLOSURE_TOO_LONG`). */
export const MAX_CLOSURE_DAYS = 92;
/** BE: `bulk-cancel` tối đa 200 buổi mỗi lần. */
export const BULK_CANCEL_LIMIT = 200;

const DAY_MS = 86_400_000;
const isDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function isClosedDay(day: string, closures: readonly ClosureRange[]) {
  const key = day.slice(0, 10);
  return closures.some(
    (closure) =>
      key >= closure.fromDate.slice(0, 10) &&
      key <= closure.toDate.slice(0, 10),
  );
}

/** Số ngày của khoảng (gồm hai đầu); `null` khi ngày sai hoặc đảo ngược. */
export function closureLength(fromDate: string, toDate: string): number | null {
  if (!isDay(fromDate) || !isDay(toDate) || toDate < fromDate) return null;
  return (
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) /
      DAY_MS +
    1
  );
}

/** Lỗi nhập cho form ngày nghỉ; chuỗi rỗng khi hợp lệ. */
export function closureRangeError(fromDate: string, toDate: string): string {
  if (!isDay(fromDate) || !isDay(toDate)) return "Chọn ngày bắt đầu và ngày kết thúc.";
  const length = closureLength(fromDate, toDate);
  if (length === null) return "Ngày kết thúc phải từ ngày bắt đầu trở đi.";
  if (length > MAX_CLOSURE_DAYS)
    return `Mỗi lần nghỉ tối đa ${MAX_CLOSURE_DAYS} ngày. Chia thành hai lần.`;
  return "";
}

/**
 * Số buổi một lớp có trong khoảng ngày, bỏ ngày nghỉ. `weekday` theo BE: 1 = Thứ 2 … 7 = CN.
 */
export function countSlots(
  schedules: readonly { weekday: number }[],
  from: string,
  to: string,
  closures: readonly ClosureRange[] = [],
): number {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let count = 0;
  for (let day = start; day <= end; day = new Date(day.getTime() + DAY_MS)) {
    if (closures.length && isClosedDay(day.toISOString().slice(0, 10), closures))
      continue;
    const weekday = day.getUTCDay() || 7;
    count += schedules.filter((slot) => slot.weekday === weekday).length;
  }
  return count;
}

/** Số ngày nghỉ rơi vào khoảng [from, to] (không đếm trùng khi các ngày nghỉ chồng nhau). */
export function closedDaysInRange(
  from: string,
  to: string,
  closures: readonly ClosureRange[],
): number {
  const start = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  let count = 0;
  for (let t = start; t <= end; t += DAY_MS)
    if (isClosedDay(new Date(t).toISOString().slice(0, 10), closures)) count++;
  return count;
}

export interface CancelTarget {
  id: string;
  classId: string;
  startsAt: string;
}

/** Bỏ buổi đã bắt đầu (`startsAt <= now`): BE chặn chúng bằng `SESSION_LOCKED`. */
export function futureSessions<T extends CancelTarget>(
  sessions: readonly T[],
  now: number,
): T[] {
  return sessions.filter((session) => Date.parse(session.startsAt) > now);
}

export interface BulkPlan {
  /** Mỗi lô là danh sách id buổi, mọi buổi của một lớp nằm cùng lô, tối đa `limit`. */
  batches: string[][];
  /** Lớp riêng đã có hơn `limit` buổi: không chia được mà vẫn giữ trọn lớp. */
  oversizedClassIds: string[];
}

/**
 * Chia buổi thành các lô theo lớp (C31): việc dời bài chạy theo từng lớp nên không cắt đôi một
 * lớp. Lớp xếp theo buổi sớm nhất; lớp nhiều buổi hơn `limit` bị loại ra `oversizedClassIds`.
 */
export function planBulkBatches(
  sessions: readonly CancelTarget[],
  limit = BULK_CANCEL_LIMIT,
): BulkPlan {
  const byClass = new Map<string, CancelTarget[]>();
  for (const session of sessions)
    byClass.set(session.classId, [...(byClass.get(session.classId) ?? []), session]);
  const groups = [...byClass.entries()]
    .map(([classId, rows]) => ({
      classId,
      ids: [...rows]
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id))
        .map((row) => row.id),
      first: rows.reduce((min, row) => (row.startsAt < min ? row.startsAt : min), rows[0].startsAt),
    }))
    .sort((a, b) => a.first.localeCompare(b.first) || a.classId.localeCompare(b.classId));
  const batches: string[][] = [];
  const oversizedClassIds: string[] = [];
  let current: string[] = [];
  for (const group of groups) {
    if (group.ids.length > limit) {
      oversizedClassIds.push(group.classId);
      continue;
    }
    if (current.length + group.ids.length > limit) {
      batches.push(current);
      current = [];
    }
    current = [...current, ...group.ids];
  }
  if (current.length) batches.push(current);
  return { batches, oversizedClassIds };
}

/** Bỏ các id bị chặn khỏi lô để xem trước lại (người dùng chọn bỏ qua). */
export function withoutBlocked(
  ids: readonly string[],
  blockers: readonly { sessionId: string }[],
): string[] {
  const blocked = new Set(blockers.map((row) => row.sessionId));
  return ids.filter((id) => !blocked.has(id));
}

/**
 * Id cần bỏ khỏi hàng đợi khi có blocker. Blocker của buổi trong hàng đợi thì bỏ đúng buổi đó.
 * `LESSON_SHIFT_BLOCKED` trỏ tới buổi SAU bị đổi bài (ngoài hàng đợi): bỏ cả lớp của buổi đó,
 * nếu không lô sẽ kẹt mãi vì không id nào bị bỏ. `classOf` trả lớp của một buổi (nếu biết).
 */
export function expandBlockedIds(
  queueIds: readonly string[],
  blockers: readonly { sessionId: string }[],
  classOf: (id: string) => string | undefined,
): { ids: string[]; classIds: string[] } {
  const inQueue = new Set(queueIds);
  const ids = new Set<string>();
  const classIds = new Set<string>();
  for (const blocker of blockers) {
    if (inQueue.has(blocker.sessionId)) ids.add(blocker.sessionId);
    else {
      const classId = classOf(blocker.sessionId);
      if (classId) classIds.add(classId);
    }
  }
  if (classIds.size)
    for (const id of queueIds) {
      const classId = classOf(id);
      if (classId && classIds.has(classId)) ids.add(id);
    }
  return { ids: [...ids], classIds: [...classIds] };
}

const BLOCKER_TEXT: Record<string, string> = {
  SESSION_NOT_FOUND: "Không còn tìm thấy buổi này.",
  SESSION_LOCKED: "Buổi đã bắt đầu, đã xong hoặc đã hủy.",
  MAKEUP_BOOKING_EXISTS: "Có học viên đã đặt học bù vào buổi này.",
  ATTENDANCE_RECORDED: "Buổi đã có điểm danh.",
  LEAVE_EXISTS: "Buổi có đơn xin nghỉ đang chờ hoặc đã duyệt.",
  LESSON_SHIFT_BLOCKED:
    "Dời bài làm đổi buổi có học viên đặt học bù. Xử lý lịch học bù trước.",
};
/** Câu tiếng Việt cho mã chặn trong `blockers[].code` (không đi qua `ERROR_TEXT`). */
export function blockerText(code: string): string {
  return BLOCKER_TEXT[code] ?? "Buổi này chưa hủy được.";
}
