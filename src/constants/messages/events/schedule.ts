export const SCHEDULE_MSG = {
  TITLE: "Lịch học tổng",
  DESC: "Theo dõi lịch biểu, quản lý phân bổ phòng học và điều phối giảng dạy toàn trung tâm",
  TERM_BADGE: "Kỳ Thu 2026",
  EXPORT: "Xuất lịch biểu",
  ADD_SESSION: "Thêm buổi học",

  TODAY: "Hôm nay",
  PREV: "Tuần trước",
  NEXT: "Tuần sau",

  VIEW_DAY: "Ngày",
  VIEW_WEEK: "Tuần",
  GROUP_BY_TIME: "Thời gian",
  GROUP_BY_ROOM: "Phòng học",

  FILTER_ALL_TEACHERS: "Tất cả giáo viên",
  FILTER_ALL_SUBJECTS: "Tất cả môn",
  FILTER_ALL_ROOMS: "Tất cả phòng",
  FILTER_ALL_CLASSES: "Tất cả lớp",
  FILTER_ALL_GRADES: "Tất cả khối",

  TOTAL_SESSIONS: (count: number) => `Tổng cộng: ${count} buổi trong tuần`,
  NEEDS_COORDINATION: (count: number) => `${count} buổi cần điều phối GV`,

  LEGEND_TITLE: "Trạng thái buổi học",
  LEGEND_MORNING: "Ca Sáng",
  LEGEND_AFTERNOON: "Ca Chiều",
  LEGEND_EVENING: "Ca Tối",

  DRAWER_TITLE: "Chi tiết buổi học",
  DRAWER_OPEN_CLASS: "Mở lớp & Điểm danh",

  EMPTY_TITLE: "Không có buổi học nào",
  EMPTY_DESC:
    "Không có buổi học nào khớp bộ lọc hiện tại. Thử đổi lớp, giáo viên, môn hoặc phòng.",

  EXPORT_SUCCESS: "Đã xuất lịch biểu",
  ADD_SESSION_SUCCESS: "Đã thêm buổi học",
} as const
