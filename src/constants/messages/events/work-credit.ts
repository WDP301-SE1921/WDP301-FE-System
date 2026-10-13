/** Công giáo viên: panel "Công" trong Chi tiết giáo viên (quản lý) và trang Điểm danh (giáo viên). */
export const WORK_CREDIT_MSG = {
  // Chung
  MONTH_LABEL: (month: string) => {
    const [year, monthNumber] = month.split("-")
    return `Tháng ${monthNumber}/${year}`
  },
  FILTER_MONTH_PLACEHOLDER: "Chọn tháng",
  RULE_TITLE: "Cách tính công",
  RULE_DESC:
    "Mỗi buổi có điểm danh bởi giáo viên = 1 công (kèm số giờ tham khảo). Giáo viên dạy thay được công, giáo viên gốc thì không. Buổi đã qua mà chưa điểm danh là “chưa chốt công” — quản lý trung tâm sẽ ghi nhận thủ công nếu giáo viên có dạy. Chưa tính tiền lương.",
  UNIT_CREDIT: "công",
  UNIT_HOUR: (hours: number) => `${hours} giờ`,

  // KPI
  KPI_CREDITS: "Tổng công",
  KPI_CREDITS_SUB: "Buổi đã chốt điểm danh",
  KPI_HOURS: "Số giờ dạy",
  KPI_HOURS_SUB: "Theo các buổi được tính công",
  KPI_SUBSTITUTE: "Dạy thay",
  KPI_SUBSTITUTE_SUB: "Buổi nhận dạy thay",
  KPI_ABSENT: "Nghỉ",
  KPI_ABSENT_SUB: (urgent: number) => `Trong đó ${urgent} đột xuất`,
  KPI_UNSETTLED: "Chưa chốt công",
  KPI_UNSETTLED_SUB: "Chưa điểm danh",

  // Bảng theo buổi
  COL_DATE: "Ngày",
  COL_SESSION: "Lớp / buổi",
  COL_HOURS: "Giờ",
  COL_STATUS: "Trạng thái",
  COL_CREDIT: "Công",
  COL_NOTE: "Ghi chú",
  EMPTY_TITLE: "Chưa có buổi nào trong tháng này",
  EMPTY_DESC: "Các buổi giáo viên được giao, đã dạy thay hoặc đã báo nghỉ trong tháng sẽ hiện ở đây.",

  PANEL_TITLE: "Công dạy",
  PANEL_DESC: "Công tính theo điểm danh, theo từng tháng",
  TEACHER_UNSETTLED_HINT: "Buổi chưa chốt: liên hệ quản lý trung tâm để được ghi nhận nếu bạn đã dạy.",

  // Chi tiết + ghi nhận công
  DETAIL_TITLE: (teacher: string, month: string) => `Công của ${teacher} — ${month}`,
  ADJUST_ACTION: "Ghi nhận công",
  ADJUST_MODAL_TITLE: "Ghi nhận công thủ công",
  ADJUST_MODAL_DESC:
    "Dùng khi giáo viên đã dạy nhưng chưa điểm danh. Thao tác được ghi vào Lịch sử thay đổi.",
  ADJUST_FIELD_REASON: "Lý do ghi nhận",
  ADJUST_FIELD_REASON_PLACEHOLDER: "Vd: Giáo viên đã dạy đủ buổi, quên điểm danh — xác nhận với phụ huynh",
  ADJUST_SUBMIT: "Xác nhận ghi nhận công",
  ADJUST_SUCCESS: (teacher: string) => `Đã ghi nhận 1 công cho ${teacher}`,
} as const
