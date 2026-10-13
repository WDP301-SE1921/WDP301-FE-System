export const CONFIRM_MSG = {
  DELETE_TITLE: "Xác nhận xóa?",
  DELETE_DESC: "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?",
  LEAVE_TITLE: "Xác nhận cho nghỉ hẳn?",
  LEAVE_DESC: "Học sinh sẽ bị xóa khỏi danh sách lớp. Vui lòng nhập đúng cụm từ bên dưới để xác nhận.",
  LEAVE_CONFIRM_WORD: "NGHĨ HẲN",
  UNSAVED_TITLE: "Rời khỏi trang?",
  UNSAVED_DESC: "Những thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn rời đi?",

  // Duyệt nhanh bài AI tin cậy cao (PROMPT T6)
  BULK_APPROVE_TITLE: "Duyệt nhanh các bài AI tin cậy cao?",
  BULK_APPROVE_DESC: (count: number, threshold: number) =>
    `Sẽ duyệt ${count} bài nộp có độ tin cậy AI trên ${threshold}%, giữ nguyên điểm AI đề xuất làm điểm cuối cùng. Bạn vẫn có thể mở lại từng bài để kiểm tra sau khi duyệt.`,
} as const
