/**
 * Lý do hay gặp cho ô "Lý do" của các thao tác. Ô chọn luôn thêm mục "Khác…" ở cuối để gõ tay;
 * giá trị gửi lên BE vẫn là chuỗi `reason` như trước (nhãn đã chọn hoặc chữ đã gõ).
 */
export const REASON_PRESETS = {
  leave: [
    "Ốm, điều trị dài ngày",
    "Về quê, đi xa",
    "Lịch ôn thi ở trường",
    "Khó khăn tài chính",
  ],
  endLeave: ["Đã khỏe, đi học lại", "Về sớm hơn dự kiến"],
  absence: ["Ốm", "Đi khám bệnh", "Việc gia đình", "Trùng lịch ở trường"],
  transfer: [
    "Trùng lịch học ở trường",
    "Đổi giờ cho tiện đưa đón",
    "Lớp hiện tại chưa hợp trình độ",
    "Muốn học giáo viên khác",
  ],
  end: [
    "Chuyển trường, chuyển nơi ở",
    "Không theo kịp chương trình",
    "Khó khăn tài chính",
    "Đã đạt mục tiêu",
  ],
  reactivate: ["Phụ huynh đăng ký lại", "Hết thời gian tạm nghỉ"],
  substitute: ["Giáo viên ốm", "Bận việc cá nhân", "Đi tập huấn, công tác"],
  teacher: [
    "Giáo viên nghỉ việc",
    "Nghỉ dài hạn (thai sản, ốm)",
    "Cân đối lịch dạy",
    "Phụ huynh phản hồi",
  ],
  cancelPendingTeacher: ["Giữ giáo viên hiện tại", "Đổi kế hoạch phân công"],
  approve: ["Đủ giấy tờ", "Đã liên hệ phụ huynh"],
  reject: ["Trùng lịch kiểm tra", "Thiếu thông tin"],
  cancelLeave: ["Phụ huynh rút đơn", "Ghi nhầm đơn"],
  reschedule: ["Phụ huynh đổi lịch", "Buổi bù cũ không còn phù hợp"],
} as const satisfies Record<string, readonly string[]>;

export type ReasonPresetKey = keyof typeof REASON_PRESETS;

/** Nhãn của mục cuối danh sách: chọn thì hiện ô gõ lý do. */
export const REASON_OTHER_LABEL = "Khác…";
