// Nhắc giáo viên bài kiểm tra tháng (Q5: chỉ nhắc, không chặn, mọi `testType`).
// Không import alias `@/` để `node --test` chạy thẳng được.

export interface MonthlyTestAssignment {
  classId: string;
  kind: string;
  dueAt: string;
  session?: { startsAt: string } | null;
}
export interface MonthlyTestClass {
  id: string;
  name: string;
  isActive?: boolean;
  /** `YYYY-MM-DD`; `null` hoặc trước đầu tháng nghĩa là lớp hết buổi, không nhắc. */
  scheduledUntil?: string | null;
}

/** Tháng `YYYY-MM` theo giờ Việt Nam (UTC+7) của một mốc thời gian ISO. */
export function monthKeyVietnam(iso: string): string {
  return new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 7);
}

/** Lớp chưa có bài `TEST` nào trong tháng (giao trong tháng, hoặc gắn với buổi trong tháng). */
export function classesMissingMonthlyTest(
  classes: MonthlyTestClass[],
  assignments: MonthlyTestAssignment[],
  today: string,
): MonthlyTestClass[] {
  const month = today.slice(0, 7);
  const covered = new Set(
    assignments
      .filter(
        (a) =>
          a.kind === "TEST" &&
          (monthKeyVietnam(a.dueAt) === month ||
            (!!a.session && monthKeyVietnam(a.session.startsAt) === month)),
      )
      .map((a) => a.classId),
  );
  return classes.filter((item) => {
    if (item.isActive === false || covered.has(item.id)) return false;
    // Có `scheduledUntil` (BE mới) mà không còn buổi trong tháng thì không nhắc.
    if (item.scheduledUntil !== undefined) {
      if (!item.scheduledUntil || item.scheduledUntil.slice(0, 7) < month) return false;
    }
    return true;
  });
}
