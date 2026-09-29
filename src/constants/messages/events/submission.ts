/**
 * Message cho màn Bài nộp theo bài tập (PROMPT T5C). Trạng thái "không tìm thấy
 * bài tập" dùng chung `ASSIGNMENT_MSG.NOT_FOUND_TITLE/DESC` — cùng một khái niệm
 * "bài tập không tồn tại/không thuộc lớp bạn phụ trách", không tách riêng.
 */
export const SUBMISSION_MSG = {
  SUMMARY_SUBMITTED: (submitted: number, total: number) => `${submitted}/${total} đã nộp`,
  SUMMARY_DUE_DATE: "Hạn nộp",
  SUMMARY_CLASS: "Lớp",
  SUMMARY_COMPLETION: "Tỷ lệ hoàn thành",

  TAB_ALL: "Tất cả",
  TAB_PENDING: "Chờ chấm",
  TAB_AI_GRADED: "AI đã chấm – chờ duyệt",
  TAB_PUBLISHED: "Đã công bố",
  TAB_NOT_SUBMITTED: "Chưa nộp",

  COL_STUDENT: "Học sinh",
  COL_SUBMITTED_AT: "Thời gian nộp",
  COL_SCORE: "Điểm",
  COL_STATUS: "Trạng thái",
  SCORE_UNAVAILABLE: "—",

  ACTION_GRADE: "Chấm bài",
  ACTION_VIEW: "Xem",

  EMPTY_TITLE: "Không có bài nộp nào",
  EMPTY_DESC: "Chưa có học sinh nào thuộc trạng thái này.",
} as const
