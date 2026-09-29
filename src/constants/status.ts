export type StatusVariant =
  | "default"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "outline"

export interface StatusConfig {
  label: string
  variant: StatusVariant
}

export const STATUS_MAP: Record<string, Record<string, StatusConfig>> = {
  manager: {
    active: { label: "Đang hoạt động", variant: "success" },
    pending: { label: "Chờ kích hoạt", variant: "warning" },
    disabled: { label: "Vô hiệu hóa", variant: "danger" },
  },
  parentAccount: {
    activated: { label: "Đã kích hoạt", variant: "success" },
    pending_link: { label: "Chờ liên kết", variant: "warning" },
  },
  makeup: {
    pending: { label: "Chờ học bù", variant: "warning" },
    done: { label: "Đã học bù", variant: "success" },
    missed: { label: "Bỏ lỡ / Vắng", variant: "danger" },
  },
  class: {
    open: { label: "Đang mở", variant: "success" },
    ended: { label: "Đã kết thúc", variant: "neutral" },
  },
  // Giá trị khớp .claude/rules/data-contracts.md — AttendanceRecord.status
  attendance: {
    present: { label: "Có mặt", variant: "success" },
    absent: { label: "Vắng mặt", variant: "danger" },
    made_up: { label: "Đã học bù", variant: "info" },
    excused: { label: "Nghỉ có phép", variant: "neutral" },
  },
  student: {
    active: { label: "Đang học", variant: "success" },
    paused: { label: "Tạm nghỉ", variant: "neutral" },
    withdrawn: { label: "Đã nghỉ", variant: "danger" },
    pending_link: { label: "Chờ liên kết", variant: "warning" },
  },
  payment: {
    succeeded: { label: "Thành công", variant: "success" },
    pending: { label: "Chờ xử lý", variant: "warning" },
    failed: { label: "Thất bại", variant: "danger" },
  },
  enrollment: {
    active: { label: "Đang học", variant: "success" },
    reserved: { label: "Bảo lưu", variant: "warning" },
    dropped: { label: "Nghỉ hẳn", variant: "danger" },
  },
  linkCode: {
    active: { label: "Còn hạn", variant: "success" },
    used: { label: "Đã sử dụng", variant: "info" },
    expired: { label: "Hết hạn", variant: "danger" },
  },
  email: {
    sent: { label: "Đã gửi", variant: "success" },
    pending: { label: "Chờ gửi", variant: "warning" },
    failed: { label: "Gửi thất bại", variant: "danger" },
  },
  grading: {
    published: { label: "Đã công bố", variant: "success" },
    pending_review: { label: "Chờ duyệt", variant: "warning" },
    draft: { label: "Bản nháp", variant: "neutral" },
  },
  teacher: {
    active: { label: "Đang dạy", variant: "success" },
    on_leave: { label: "Nghỉ phép", variant: "warning" },
    inactive: { label: "Ngừng hợp tác", variant: "danger" },
  },
  session: {
    scheduled: { label: "Sắp diễn ra", variant: "info" },
    ongoing: { label: "Đang học", variant: "success" },
    completed: { label: "Đã hoàn thành", variant: "neutral" },
    cancelled: { label: "Đã hủy", variant: "danger" },
  },
  leave: {
    approved: { label: "Đã duyệt", variant: "success" },
    pending: { label: "Chờ duyệt", variant: "warning" },
    rejected: { label: "Từ chối", variant: "danger" },
  },
  // Trạng thái tính từ khoảng ngày của LongLeave (nghỉ dài hạn) so với hôm nay.
  longLeave: {
    active: { label: "Đang nghỉ", variant: "warning" },
    upcoming: { label: "Sắp tới", variant: "info" },
    ended: { label: "Đã kết thúc", variant: "neutral" },
  },
  // Suy từ Program.isActive — Switch "Đang sử dụng" ở modal Thêm/Sửa chương trình.
  program: {
    active: { label: "Đang sử dụng", variant: "success" },
    inactive: { label: "Ngừng sử dụng", variant: "neutral" },
  },
  // Suy từ Room.isActive.
  room: {
    active: { label: "Đang sử dụng", variant: "success" },
    inactive: { label: "Ngừng sử dụng", variant: "neutral" },
  },
  // Assignment.status (PROMPT T5/T5B) — xem `types/assignment.ts`.
  assignment: {
    draft: { label: "Nháp", variant: "neutral" },
    assigned: { label: "Đã giao", variant: "info" },
    closed: { label: "Đã đóng", variant: "secondary" },
  },
  // Submission.status (PROMPT T5C/T6/T6B/T6C) — "ai_grading" muốn màu tím theo
  // docs nhưng `StatusVariant` không có tím, tạm xấp xỉ bằng "info".
  submission: {
    not_submitted: { label: "Chưa nộp", variant: "neutral" },
    pending: { label: "Chờ chấm", variant: "warning" },
    ai_grading: { label: "AI đang chấm...", variant: "info" },
    ai_graded: { label: "AI đã chấm - Chờ duyệt", variant: "warning" },
    reviewed: { label: "Đã duyệt - Chưa công bố", variant: "info" },
    published: { label: "Đã công bố", variant: "success" },
  },
}
