/**
 * Message cho domain Chấm bài AI — hàng đợi (PROMPT T6), trạng thái đang xử lý
 * (PROMPT T6C, biến thể của T6) và chấm bài chi tiết/duyệt kết quả AI (PROMPT T6B).
 */
export const GRADING_MSG = {
  // Hàng đợi (T6)
  QUEUE_TITLE: "Chấm bài",
  QUEUE_DESC: "Kết quả AI luôn cần giáo viên kiểm tra trước khi công bố cho phụ huynh",

  TAB_PENDING_REVIEW: "Chờ duyệt",
  TAB_REVIEWED: "Đã duyệt – chưa công bố",
  TAB_PUBLISHED: "Đã công bố",

  FILTER_ALL_CLASSES: "Lớp: Tất cả",
  FILTER_ALL_ASSIGNMENTS: "Bài tập: Tất cả",

  ALERT_TITLE: "AI đã tự động chấm bài",
  ALERT_DESC: (count: number, avgConfidence: number) =>
    `${count} bài đang chờ duyệt, độ tin cậy AI trung bình ${avgConfidence}%. Vui lòng kiểm tra kỹ trước khi công bố cho phụ huynh.`,

  BULK_APPROVE_ACTION: (threshold: number) => `Duyệt nhanh tất cả bài AI tin cậy >${threshold}%`,
  CONFIGURE_AI_CRITERIA: "Cấu hình tiêu chí AI",
  FEATURE_IN_PROGRESS: "Tính năng đang phát triển",

  COL_STUDENT: "Học sinh",
  COL_ASSIGNMENT: "Bài tập",
  COL_CLASS: "Lớp",
  COL_AI_SCORE: "Điểm AI đề xuất",
  COL_GRADED_AT: "Thời gian AI chấm",

  ACTION_REVIEW: "Kiểm tra & duyệt",

  // Trạng thái đang xử lý (T6C — biến thể của bảng T6)
  AI_GRADING_TOOLTIP: "Bài tự luận, AI xử lý trong nền, có thể mất vài phút",

  EMPTY_TITLE: "Không có bài nào trong danh sách",
  EMPTY_DESC: "Chưa có bài nộp nào thuộc trạng thái này.",

  BULK_APPROVE_SUCCESS: (count: number) => `Đã duyệt nhanh ${count} bài nộp`,
  BULK_APPROVE_NONE_SELECTED: "Chưa có bài nào đủ điều kiện được chọn",

  // Chấm bài chi tiết (T6B)
  DETAIL_BREADCRUMB: (studentName: string, assignmentTitle: string) =>
    `${studentName} · ${assignmentTitle}`,
  DETAIL_ALERT_DESC: "Kết quả do AI đề xuất. Vui lòng kiểm tra trước khi công bố cho phụ huynh.",

  SECTION_STUDENT_ANSWER: "Câu trả lời của học sinh",
  SECTION_CORRECT_ANSWER: "Đáp án đúng",
  SECTION_SAMPLE_ANSWER: "Đáp án mẫu / Tiêu chí chấm",
  NO_ANSWER: "Học sinh chưa trả lời",
  POINTS_LABEL: (points: number) => `${points} điểm`,

  RESULT_CARD_TITLE: "Kết quả AI đề xuất",
  FIELD_AI_COMMENT: "Nhận xét AI",
  TOTAL_SCORE_LABEL: "Tổng điểm",

  ACTION_SAVE_CHANGES: "Lưu thay đổi",
  ACTION_PUBLISH: "Duyệt & công bố",
  ACTION_REVIEW_ONLY: "Duyệt nhưng chưa công bố",

  NAV_PREVIOUS: "‹ Học sinh trước",
  NAV_NEXT: "Học sinh sau ›",

  SAVE_SUCCESS: "Đã lưu kết quả chấm bài",
  PUBLISH_SUCCESS: "Đã công bố kết quả cho phụ huynh",
  REVIEW_ONLY_SUCCESS: "Đã duyệt, chưa công bố cho phụ huynh",

  NOT_FOUND_TITLE: "Không tìm thấy bài nộp",
  NOT_FOUND_DESC: "Bài nộp này không tồn tại hoặc không thuộc lớp bạn phụ trách.",
} as const
