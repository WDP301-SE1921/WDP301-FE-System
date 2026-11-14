/**
 * Cách xem trang Lịch học. "Tuần" là bảng 7 cột theo ngày (trước đây gọi là Kanban);
 * lưới giờ theo tuần cũ đã bỏ vì trùng nội dung mà thiếu tên lớp, giáo viên và số buổi.
 */
export const CALENDAR_VIEWS = ["list", "week", "day"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const VIEW_LABELS: Record<CalendarView, string> = {
  list: "Danh sách",
  week: "Tuần",
  day: "Ngày",
};

/** Giáo viên: danh sách buổi + điểm danh (mặc định), Tuần, Ngày. Quản lý/Nhân viên: Tuần, Ngày. */
export const TEACHER_VIEWS: readonly CalendarView[] = ["list", "week", "day"];
export const BACK_OFFICE_VIEWS: readonly CalendarView[] = ["week", "day"];

/** Khóa cũ trong URL (`?view=board`) từ khi bảng tuần còn tên Kanban. */
const LEGACY_VIEWS: Record<string, CalendarView> = { board: "week" };

/** Cách xem từ `?view=`: khóa cũ đổi sang khóa mới; khóa trang không có thì dùng mặc định của trang. */
export function resolveCalendarView(
  value: string | null,
  defaultView: CalendarView,
  views: readonly CalendarView[],
): CalendarView {
  const key = value ? (LEGACY_VIEWS[value] ?? value) : defaultView;
  return views.find((view) => view === key) ?? defaultView;
}
