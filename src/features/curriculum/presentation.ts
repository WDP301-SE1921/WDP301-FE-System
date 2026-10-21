import type { CurriculumUnit } from "@/types/curriculum";

/** Review stages are presentation labels; the API still uses PENDING_REVIEW. */
export function curriculumStage(
  unit: Pick<CurriculumUnit, "status" | "technicalReviewedAt">,
) {
  if (unit.status !== "PENDING_REVIEW") return unit.status;
  return unit.technicalReviewedAt
    ? "PENDING_MANAGER_CONFIRMATION"
    : "PENDING_TECHNICAL_REVIEW";
}

const IMPORT_DIAGNOSTIC_TEXT: Record<string, string> = {
  INVALID_KIND:
    "Chỉ nhập bài học (LESSON). Bài kiểm tra được tạo riêng theo buổi học.",
  MONTHLY_TEST_NOT_ALLOWED:
    "Bài kiểm tra đã được tách khỏi giáo trình. Tạo đề kiểm tra trong phần Bài tập / Đề kiểm tra.",
  TESTS_MANAGED_BY_TEACHER:
    "Bài kiểm tra được giáo viên tạo riêng theo buổi học, không nhập vào giáo trình.",
  INVALID_TITLE: "Tên nội dung bắt buộc, tối đa 255 ký tự.",
  INVALID_CONTENT: "Nội dung bắt buộc, tối đa 50.000 ký tự.",
  INVALID_SEQUENCE: "Số thứ tự bài phải liên tục theo chế độ nhập.",
  INVALID_MONTH: "Bài học không dùng trường tháng kiểm tra.",
};

const IMPORT_FIELD_TEXT: Record<string, string> = {
  kind: "Loại nội dung",
  title: "Tên nội dung",
  content: "Nội dung bài học",
  sequence: "Số thứ tự bài",
  monthKey: "Tháng kiểm tra",
};

export function curriculumImportDiagnosticText(diagnostic: {
  code: string;
  field?: string;
}): string {
  if (Object.hasOwn(IMPORT_DIAGNOSTIC_TEXT, diagnostic.code))
    return IMPORT_DIAGNOSTIC_TEXT[diagnostic.code];
  const field = diagnostic.field;
  return field && Object.hasOwn(IMPORT_FIELD_TEXT, field)
    ? `${IMPORT_FIELD_TEXT[field]} chưa hợp lệ. Kiểm tra lại thông tin trong CSV.`
    : "Dòng dữ liệu chưa hợp lệ. Kiểm tra lại thông tin trong CSV.";
}
