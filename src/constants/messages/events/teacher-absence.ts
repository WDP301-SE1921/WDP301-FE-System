import { BUSINESS_RULES } from "@/constants/business-rules"

/** Giáo viên báo nghỉ, quản lý xử lý (xếp dạy thay / hủy buổi) và công giáo viên (PROMPT P5). */
export const TEACHER_ABSENCE_MSG = {
  // Báo nghỉ (cổng giáo viên)
  REPORT_ACTION: "Báo nghỉ",
  REPORT_MODAL_TITLE: "Báo nghỉ buổi học",
  REPORT_MODAL_DESC:
    "Quản lý trung tâm sẽ xếp giáo viên dạy thay hoặc hủy buổi. Lịch do trung tâm xếp cố định — báo nghỉ chỉ là thông báo, không phải xin đổi lịch.",
  REPORT_FIELD_REASON: "Lý do nghỉ",
  REPORT_FIELD_REASON_PLACEHOLDER: "Vd: Sốt cao, có xác nhận của bác sĩ",
  REPORT_URGENT_HINT: `Báo nghỉ trong vòng ${BUSINESS_RULES.TEACHER_ABSENCE_URGENT_HOURS} giờ trước giờ học được ghi nhận là nghỉ đột xuất.`,
  REPORT_SUBMIT: "Gửi báo nghỉ",
  REPORT_SUCCESS: "Đã gửi báo nghỉ tới quản lý trung tâm",
  REPORTED_BADGE: "Đã báo nghỉ — chờ xử lý",
  SCHEDULE_FIXED_NOTE:
    "Lịch dạy do quản lý trung tâm xếp cố định. Cần nghỉ đột xuất, hãy bấm Báo nghỉ trên buổi học.",
  NOT_YOUR_SESSION: "Chỉ giáo viên được giao buổi này mới báo nghỉ được",
  SESSION_NOT_REPORTABLE: "Chỉ báo nghỉ được buổi chưa diễn ra, chưa điểm danh và chưa bị hủy",
  ALREADY_REPORTED: "Buổi này đã có báo nghỉ đang chờ xử lý",

  // Xử lý (quản lý trung tâm) — trong trang Dạy thay
  PENDING_TITLE: "Báo nghỉ chờ xử lý",
  PENDING_DESC: "Giáo viên báo nghỉ: xếp giáo viên dạy thay, hoặc hủy buổi nếu không tìm được người.",
  PENDING_EMPTY_TITLE: "Không có báo nghỉ nào chờ xử lý",
  PENDING_EMPTY_DESC: "Khi giáo viên báo nghỉ, buổi học sẽ hiện ở đây.",
  COL_SESSION: "Buổi học",
  COL_TEACHER: "Giáo viên báo nghỉ",
  COL_REASON: "Lý do",
  COL_REPORTED_AT: "Báo lúc",
  COL_STATUS: "Trạng thái",
  URGENT_BADGE: "Đột xuất",
  ACTION_ASSIGN: "Xếp dạy thay",
  ACTION_CANCEL_SESSION: "Hủy buổi",
  CANCEL_MODAL_TITLE: "Hủy buổi học?",
  CANCEL_MODAL_DESC: (session: string) =>
    `${session} sẽ bị hủy. Học sinh trong lớp được ghi nhận nghỉ có phép và cần xếp học bù; giáo viên không được tính công buổi này.`,
  CANCEL_FIELD_REASON: "Lý do hủy buổi",
  CANCEL_FIELD_REASON_PLACEHOLDER: "Vd: Giáo viên nghỉ đột xuất, không có giáo viên dạy thay phù hợp",
  CANCEL_SUBMIT: "Xác nhận hủy buổi",
  CANCEL_SUCCESS: (students: number) =>
    `Đã hủy buổi học, ${students} học sinh cần xếp học bù`,
  CANCEL_NOT_ALLOWED: "Chỉ hủy được buổi chưa điểm danh và chưa bị hủy",
  ADJUST_NOT_ALLOWED:
    "Chỉ ghi nhận công cho buổi đã qua, chưa điểm danh, chưa hủy và chưa được ghi nhận",
  CANCELLED_ATTENDANCE_NOTE: "Trung tâm hủy buổi — chờ xếp học bù",
  SUBSTITUTE_REASON_PREFIX: (teacher: string) => `${teacher} báo nghỉ`,

  // Học bù cho buổi bị hủy (nhân viên)
  CANCELLED_MAKEUP_TITLE: "Buổi bị hủy chờ xếp học bù",
  CANCELLED_MAKEUP_DESC:
    "Học sinh của các buổi trung tâm hủy chưa được xếp học bù. Bấm tên học sinh để mở luồng xếp học bù với buổi đã chọn sẵn.",
  CANCELLED_MAKEUP_EMPTY: "Không có buổi bị hủy nào cần xếp học bù",

  // Audit
  AUDIT_REASON_ADJUST: (reason: string) => reason,
} as const
