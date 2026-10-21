/** Stored worker errors are diagnostic data, never user-facing content. */
export function gradingJobFailureMessage(error: unknown): string {
  if (error === "Processing interrupted; request a new grading run")
    return "Quá trình chấm AI bị gián đoạn. Yêu cầu AI đề xuất lại hoặc chấm thủ công.";
  return "AI chưa thể đề xuất điểm cho bài này. Thử lại hoặc chấm thủ công; điểm chưa được tự lưu hay công bố.";
}
