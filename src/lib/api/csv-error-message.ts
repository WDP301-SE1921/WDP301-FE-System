// Câu thông báo cho lỗi CSV của BE (`CSV_INVALID`, `details` theo C11). Hàm thuần.

interface CsvDetails {
  code?: unknown;
  rows?: unknown;
  rowErrorCount?: unknown;
}

const ROW_TEXT: Record<string, string> = {
  CSV_INVALID_HEADER:
    "dòng tiêu đề thiếu cột. Dùng file mẫu và không xóa dòng đầu.",
  CSV_INVALID_COLUMNS: "số ô không khớp dòng tiêu đề.",
  CSV_UNSUPPORTED_VERSION: "cột csvVersion phải là 1 hoặc để trống.",
  CSV_INVALID_QUOTE: "dấu ngoặc kép không hợp lệ.",
  CSV_UNCLOSED_QUOTE: "có dấu ngoặc kép chưa đóng.",
  CSV_EMPTY: "file chưa có dữ liệu.",
};

const NOT_SAVED = "File chưa được nhập, chưa có bài nào được lưu.";
const SAVE_AS = 'Lưu lại bằng "CSV UTF-8 (Comma delimited)" rồi chọn lại file.';

function asDetails(details: unknown): CsvDetails {
  return details && typeof details === "object" ? (details as CsvDetails) : {};
}

interface RowError {
  code: string;
  rowNumber: number;
}

function rowErrors(details: CsvDetails): RowError[] {
  if (!Array.isArray(details.rows)) return [];
  return details.rows.flatMap((row: unknown) => {
    if (!row || typeof row !== "object") return [];
    const { code, rowNumber } = row as Record<string, unknown>;
    return typeof code === "string" &&
      typeof rowNumber === "number" &&
      Number.isInteger(rowNumber) &&
      rowNumber > 0
      ? [{ code, rowNumber }]
      : [];
  });
}

/** Câu chính của lỗi `CSV_INVALID`; chi tiết từng dòng lấy từ `csvRowErrorLines`. */
export function csvInvalidMessage(details: unknown): string {
  const info = asDetails(details);
  if (info.code === "CSV_NOT_UTF8")
    return `${NOT_SAVED} File không phải UTF-8. Trong Excel chọn Lưu thành, kiểu "CSV UTF-8 (Comma delimited)", rồi chọn lại file.`;
  if (info.code === "CSV_TOO_LARGE")
    return `${NOT_SAVED} File quá lớn. Chia thành nhiều file nhỏ hơn.`;
  if (info.code === "CSV_TOO_MANY_ROWS")
    return `${NOT_SAVED} File có quá nhiều dòng. Chia thành nhiều file nhỏ hơn.`;
  if (rowErrors(info).length)
    return `${NOT_SAVED} Sửa các dòng dưới đây trong Excel rồi chọn lại file.`;
  return `${NOT_SAVED} Kiểm tra dòng tiêu đề và số cột. ${SAVE_AS}`;
}

/** "Dòng 7: …" cho từng dòng lỗi (BE cắt tối đa 20), thêm "Và N lỗi khác." nếu còn. */
export function csvRowErrorLines(details: unknown): string[] {
  const info = asDetails(details);
  const rows = rowErrors(info);
  const lines = rows.map(
    (row) =>
      `Dòng ${row.rowNumber}: ${ROW_TEXT[row.code] ?? "dòng chưa hợp lệ."}`,
  );
  const total =
    typeof info.rowErrorCount === "number" ? info.rowErrorCount : rows.length;
  if (total > rows.length) lines.push(`Và ${total - rows.length} lỗi khác.`);
  return lines;
}
