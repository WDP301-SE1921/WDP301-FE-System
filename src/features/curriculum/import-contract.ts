import {
  importCommitSchema,
  type ImportCommitInput,
} from "@/lib/validators/curriculum";
import type { ImportPreview } from "@/types/curriculum";
export function importCommitFromPreview(
  preview: ImportPreview,
  mode: "APPEND" | "REPLACE",
): ImportCommitInput {
  if (
    preview.summary.invalidRows ||
    preview.rows.some((row) => row.errors.length)
  )
    throw new Error("Sửa các lỗi CSV rồi xem trước lại.");
  const input = importCommitSchema.parse({
    previewId: preview.previewId,
    expectedRevision: preview.expectedRevision,
    mode,
    rows: preview.rows,
  });
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 1024 * 1024)
    throw new Error(
      "Nội dung file quá lớn để nhập. Chia file nhỏ hơn và xem trước lại.",
    );
  return input;
}
