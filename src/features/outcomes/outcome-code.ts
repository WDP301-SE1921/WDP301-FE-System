// Gợi ý mã mục tiêu khóa học. Hàm thuần, không import gì để `node --test` nạp thẳng được.

/** Mẫu mã của seed: `<MÃ MÔN>-<KHỐI>-<SỐ>`, ví dụ `MATH-7-04`. */
const TRAILING_NUMBER = /^(.*?)(\d+)$/;

/**
 * Mã kế tiếp cho bộ mục tiêu: lấy mã có số cuối lớn nhất, tăng 1 và giữ số chữ số
 * (`MATH-7-04` → `MATH-7-05`, `MATH-7-99` → `MATH-7-100`). Bộ trống thì dựng
 * `<mã môn>-<khối>-01`. Không đủ thông tin (không có mã nào có số cuối, không biết mã
 * môn hay khối) thì trả chuỗi rỗng để người dùng tự gõ, không đoán.
 */
export function nextOutcomeCode(
  existingCodes: readonly string[],
  fallback?: { subjectCode?: string | null; grade?: number | null },
): string {
  let best: { prefix: string; value: number; width: number } | null = null;
  for (const code of existingCodes) {
    const match = TRAILING_NUMBER.exec(code.trim());
    if (!match) continue;
    const value = Number(match[2]);
    if (!best || value > best.value)
      best = { prefix: match[1], value, width: match[2].length };
  }
  if (best)
    return `${best.prefix}${String(best.value + 1).padStart(best.width, "0")}`;
  const subjectCode = fallback?.subjectCode?.trim();
  if (existingCodes.length || !subjectCode || !fallback?.grade) return "";
  return `${subjectCode.toUpperCase()}-${fallback.grade}-01`;
}
