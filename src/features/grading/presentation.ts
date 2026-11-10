/** Stored worker errors are diagnostic data, never user-facing content. */
export function gradingJobFailureMessage(error: unknown): string {
  if (error === "Processing interrupted; request a new grading run")
    return "Quá trình chấm AI bị gián đoạn. Yêu cầu AI đề xuất lại hoặc chấm thủ công.";
  return "AI chưa thể đề xuất điểm cho bài này. Thử lại hoặc chấm thủ công; điểm chưa được tự lưu hay công bố.";
}

export function readingFailureMessage(code?: string | null): string {
  const messages: Record<string, string> = {
    AI_VISION_UNAVAILABLE: "Chưa cấu hình AI đọc ảnh/PDF.",
    AI_PAGE_LIMIT: "Tổng tệp vượt 10 trang; giáo viên kiểm tra tệp gốc.",
    AI_FILE_LIMIT:
      "Tệp vượt giới hạn xử lý AI (30 MB hoặc ảnh render quá lớn).",
    AI_READING_INVALID: "AI trả nội dung thiếu hoặc không khớp câu hỏi.",
    AI_READING_FAILED:
      "Không đọc được tệp, AI hết thời gian hoặc dịch vụ chưa sẵn sàng. Có thể thử lại.",
  };
  return code
    ? (messages[code] ?? "Chưa thể đọc tệp; kiểm tra bài gốc.")
    : "Đối chiếu nội dung và nguồn trang trước khi cho điểm.";
}
