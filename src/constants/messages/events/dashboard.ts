export const DASHBOARD_MSG = {
  TITLE: "Dashboard",
  DESC: (todayLabel: string) => `Tổng quan hoạt động hôm nay, ${todayLabel}`,
  EXPORT_REPORT: "Xuất báo cáo",
  EXPORT_SUCCESS: "Đã xuất báo cáo tổng quan",

  // KPI
  KPI_ACTIVE_STUDENTS: "Học sinh đang học",
  KPI_ACTIVE_STUDENTS_SUB: "Tổng số đang theo học",
  KPI_OPEN_CLASSES: "Lớp đang mở",
  KPI_OPEN_CLASSES_SUB: (subjectCount: number) => `${subjectCount} khối`,
  KPI_PAYMENTS_TODAY: "Thanh toán hôm nay",
  KPI_PAYMENTS_TODAY_SUB: "Thu tiền mặt / Chuyển khoản",
  KPI_ATTENDANCE_RATE: "Tỷ lệ đi học tuần",
  KPI_ATTENDANCE_RATE_SUB: (target: number) => `Mục tiêu trung tâm ≥ ${target}%`,
  KPI_TRANSACTIONS: (count: number) => `${count} giao dịch`,

  // KPI kinh doanh (admin / quản lý trung tâm)
  KPI_MONTHLY_REVENUE: "Học phí thu trong tháng",
  KPI_MONTHLY_REVENUE_SUB: (count: number) => `${count} giao dịch đã xác nhận`,
  KPI_ACTIVE_TEACHERS: "Giáo viên đang dạy",
  KPI_ACTIVE_TEACHERS_SUB: "Đang hoạt động",
  KPI_ACTIVE_STAFF: "Nhân sự trung tâm",
  KPI_ACTIVE_STAFF_SUB: "Tài khoản đang hoạt động",

  // Buổi học hôm nay
  TODAY_SESSIONS_TITLE: "Buổi học hôm nay",
  TODAY_SESSIONS_COUNT: (count: number) => `${count} ca hôm nay`,
  TODAY_SESSIONS_LIVE: "Thời gian thực",
  COL_TIME: "Giờ học",
  COL_CLASS: "Lớp",
  COL_LESSON: "Bài học",
  COL_TEACHER: "Giáo viên",
  COL_ROOM: "Phòng",
  COL_ATTENDANCE: "Điểm danh",
  ATTENDANCE_MARKED: "Đã điểm danh",
  ATTENDANCE_UNMARKED: "Chưa điểm danh",
  ATTENDANCE_NO_TEACHER: "Chưa có giáo viên",
  VIEW_FULL_SCHEDULE: "Xem lịch học tổng",
  TODAY_SESSIONS_FOOTER: "Hiển thị lịch học trực tiếp tại cơ sở",

  // Việc cần xử lý
  TASKS_TITLE: "Việc cần xử lý",
  TASKS_COUNT: (count: number) => `${count} mục`,
  TASK_FAILED_EMAILS: "Email gửi thất bại",
  TASK_FAILED_EMAILS_DESC: "Sai hòm thư người nhận",
  TASK_EXPIRING_PACKAGES: "Học sinh sắp hết gói học phí",
  TASK_EXPIRING_PACKAGES_DESC: "Còn dưới 7 buổi",
  TASK_NO_TEACHER: "Buổi chưa có giáo viên",
  TASK_NO_TEACHER_DESC: "Cần xếp giáo viên dạy thay",
  TASK_ENDING_LEAVES: "Nghỉ dài hạn sắp kết thúc",
  TASK_ENDING_LEAVES_DESC: "Dự kiến quay lại tuần tới",

  // Thanh toán gần đây
  RECENT_PAYMENTS_TITLE: "Thanh toán gần đây",
  RECENT_PAYMENTS_BADGE: "Mới nhất",
  RECENT_PAYMENTS_VIEW_ALL: "Xem tất cả",
  RECENT_PAYMENTS_FOOTER: "Hóa đơn điện tử tự động lưu vào Sổ quỹ",
  PAYMENT_MONTHS: (months: number) => `Khóa ${months} tháng`,

  // Biểu đồ
  WEEKLY_CHART_TITLE: "Tỷ lệ đi học 7 ngày qua",
  WEEKLY_CHART_DESC: "Theo dõi tỷ lệ chuyên cần theo từng ngày",
  WEEKLY_CHART_AVERAGE: "Trung bình tuần",
  WEEKLY_CHART_TARGET: (target: number) => `Mục tiêu ${target}%`,
  WEEKLY_CHART_LEGEND_TODAY: "Hôm nay",
  WEEKLY_CHART_LEGEND_OTHER: "Các ngày khác",
  WEEKLY_CHART_FOOTER: (marked: number, total: number) =>
    `Số ca vắng hôm nay: ${marked}/${total}`,
} as const
