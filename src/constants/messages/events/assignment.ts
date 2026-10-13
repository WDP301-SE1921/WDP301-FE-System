/**
 * Message cho domain Bài tập / Đề kiểm tra (PROMPT T5 danh sách, T5B tạo/sửa).
 * Màn T5C (Bài nộp theo bài tập) sẽ bổ sung thêm ở batch sau, cùng file này.
 */
export const ASSIGNMENT_MSG = {
  // Danh sách (T5)
  LIST_TITLE: "Bài tập / Đề kiểm tra",
  LIST_DESC: (count: number) => `${count} bài tập / đề kiểm tra`,
  SEARCH_PLACEHOLDER: "Tìm tên bài tập...",
  CREATE: "Tạo bài tập",

  FILTER_ALL_CLASSES: "Lớp: Tất cả",
  FILTER_ALL_TYPES: "Loại: Tất cả",
  FILTER_ALL_STATUS: "Trạng thái: Tất cả",

  COL_TITLE: "Tên bài",
  COL_CLASS: "Lớp",
  COL_TYPE: "Loại",
  COL_OPEN_AT: "Ngày giao",
  COL_DUE_DATE: "Hạn nộp",
  COL_SUBMITTED: "Đã nộp",
  COL_STATUS: "Trạng thái",
  SUBMITTED_COUNT: (submitted: number, total: number) => `${submitted}/${total}`,

  TYPE_PRACTICE: "Bài tập",
  TYPE_TEST: "Kiểm tra",

  ACTION_EDIT: "Sửa",
  ACTION_VIEW_SUBMISSIONS: "Xem bài nộp",
  ACTION_CLOSE: "Đóng bài tập",

  CLOSE_CONFIRM_TITLE: "Đóng bài tập?",
  CLOSE_CONFIRM_DESC:
    "Học sinh sẽ không thể nộp bài mới sau khi đóng. Hành động này không thể hoàn tác.",
  CLOSE_SUCCESS: "Đã đóng bài tập",
  ALREADY_CLOSED_ERROR: "Bài tập này đã được đóng trước đó",

  EMPTY_TITLE: "Chưa có bài tập nào",
  EMPTY_DESC: "Tạo bài tập hoặc đề kiểm tra đầu tiên cho lớp bạn phụ trách.",

  // Tạo / Sửa (T5B)
  CREATE_TITLE: "Tạo bài tập",
  CREATE_DESC: "Soạn nội dung, câu hỏi và thời hạn nộp bài cho học sinh",
  EDIT_TITLE: "Sửa bài tập",
  EDIT_DESC: "Cập nhật nội dung, câu hỏi và thời hạn nộp bài",

  SECTION_INFO_TITLE: "Thông tin chung",
  SECTION_QUESTIONS_TITLE: "Câu hỏi & đáp án",
  SECTION_QUESTIONS_DESC: "Thêm ít nhất 1 câu hỏi, mỗi câu có thể trắc nghiệm hoặc tự luận",

  FIELD_TITLE: "Tên bài",
  FIELD_TITLE_PLACEHOLDER: "Bài 12: Phân tích đa thức thành nhân tử",
  FIELD_CLASS: "Lớp",
  FIELD_CLASS_PLACEHOLDER: "Chọn lớp",
  FIELD_TYPE: "Loại",
  FIELD_DESCRIPTION: "Mô tả / hướng dẫn",
  FIELD_DESCRIPTION_PLACEHOLDER: "Hướng dẫn làm bài cho học sinh (tùy chọn)",
  FIELD_OPEN_AT: "Ngày mở bài",
  FIELD_DUE_DATE: "Hạn nộp",
  FIELD_DURATION: "Thời gian làm bài (phút)",
  FIELD_DURATION_PLACEHOLDER: "Vd: 15",
  FIELD_SUBMISSION_METHOD: "Hình thức nộp bài",
  FIELD_ALLOW_LATE: "Cho phép nộp muộn",
  FIELD_LATE_PENALTY: "Điểm trừ mỗi giờ nộp muộn",

  TYPE_OPTION_PRACTICE: "Bài tập",
  TYPE_OPTION_TEST: "Kiểm tra",

  SUBMISSION_METHOD_ONLINE: "Trực tuyến trên web",
  SUBMISSION_METHOD_PHOTO: "Nộp ảnh chụp bài làm",

  QUESTION_LABEL: (order: number) => `Câu ${order}`,
  QUESTION_FIELD_CONTENT: "Nội dung câu hỏi",
  QUESTION_FIELD_CONTENT_PLACEHOLDER: "Nhập nội dung câu hỏi",
  QUESTION_FIELD_TYPE: "Loại câu hỏi",
  QUESTION_FIELD_POINTS: "Điểm",
  QUESTION_TYPE_MULTIPLE_CHOICE: "Trắc nghiệm",
  QUESTION_TYPE_ESSAY: "Tự luận",
  QUESTION_OPTION_LABEL: (index: number) => `Đáp án ${String.fromCharCode(65 + index)}`,
  QUESTION_OPTION_CORRECT_HINT: "Chọn đáp án đúng",
  QUESTION_FIELD_SAMPLE_ANSWER: "Đáp án mẫu / Tiêu chí chấm điểm",
  QUESTION_FIELD_SAMPLE_ANSWER_PLACEHOLDER:
    "Mô tả đáp án đúng và các bước cần có để AI/giáo viên chấm điểm",
  QUESTION_DELETE: "Xóa câu hỏi",
  QUESTION_ADD: "+ Thêm câu hỏi vào đề",
  QUESTION_TOTAL_POINTS: (total: number) => `Tổng điểm: ${total}`,

  IMPORT_WORD: "Import từ Word/PDF",
  QUESTION_BANK: "Từ ngân hàng đề",
  SHUFFLE_QUESTIONS: "Trộn câu hỏi",
  FEATURE_IN_PROGRESS: "Tính năng đang phát triển",

  CANCEL: "Hủy bỏ",
  SAVE_DRAFT: "Lưu bản nháp",
  ASSIGN_NOW: "Giao bài tập ngay cho học sinh",

  CREATE_SUCCESS: "Tạo bài tập thành công",
  UPDATE_SUCCESS: "Cập nhật bài tập thành công",
  DRAFT_SAVED: "Đã lưu bản nháp",

  NOT_FOUND_TITLE: "Không tìm thấy bài tập",
  NOT_FOUND_DESC: "Bài tập này không tồn tại hoặc không thuộc lớp bạn phụ trách.",
} as const
