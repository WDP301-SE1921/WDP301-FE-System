const MAX_CSV_BYTES = 5 * 1024 * 1024;
const FORMULA_START = /^[\s\uFEFF]*[=+\-@]/u;
type CsvCell = string | number | null | undefined;

function cellText(value: CsvCell): string {
  if (value == null) return "";
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "number" && !Number.isFinite(value))
  )
    throw new Error("Ô CSV phải là văn bản hoặc số hợp lệ.");
  let text = String(value);
  // csvVersion=1 lets the importer reverse this protection without changing text.
  if (text.startsWith("'") || FORMULA_START.test(text)) text = "'" + text;
  return /[",\r\n]/u.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function csvText(
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): string {
  if (!headers.length || rows.some((row) => row.length !== headers.length))
    throw new Error("Số cột CSV không hợp lệ.");
  const source =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(cellText).join(",")).join("\r\n") +
    "\r\n";
  if (new TextEncoder().encode(source).byteLength > MAX_CSV_BYTES)
    throw new Error(
      "Nội dung CSV vượt quá 5 MiB. Chia nội dung thành các phần nhỏ hơn trước khi xuất.",
    );
  return source;
}

export function csvFilename(title: string): string {
  const base = title
    .replace(/\.csv$/iu, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/gu, "-")
    .replace(/^[.\s]+|[.\s]+$/gu, "")
    .slice(0, 80);
  return `${base || "du-lieu"}.csv`;
}

export function downloadCsv(source: string, title: string): void {
  const url = URL.createObjectURL(
    new Blob([source], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = csvFilename(title);
  try {
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export function csvChoices(choices: readonly string[]): string {
  return choices
    .map((choice) => choice.replace(/\\/g, "\\\\").replace(/\|/g, "\\|"))
    .join("|");
}
