// Tách ô "Dán nhiều mục tiêu" thành từng dòng. Hàm thuần để `node --test` nạp thẳng được.
export const PASTE_MAX_LINES = 50;
export const PASTE_TITLE_MAX = 255;

export interface PasteLine {
  /** Thứ tự dòng (từ 1) trong ô nhập, tính cả dòng trống bị bỏ. */
  row: number;
  text: string;
  error?: string;
}

export interface PasteParse {
  lines: PasteLine[];
  /** Có hơn `PASTE_MAX_LINES` dòng; chỉ giữ 50 dòng đầu. */
  tooMany: boolean;
}

/** Bỏ gạch đầu dòng, "1." hoặc "1)" ở đầu để người dán từ Word/Excel không phải sửa. */
export function cleanPasteLine(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:[-*•–]\s+|\d+\s*[.)]\s+)/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePasteLines(input: string): PasteParse {
  const all: PasteLine[] = [];
  input.split(/\r?\n/).forEach((raw, index) => {
    const text = cleanPasteLine(raw);
    if (!text) return;
    all.push({
      row: index + 1,
      text,
      error:
        text.length < 2
          ? "Mục tiêu cần ít nhất 2 ký tự."
          : text.length > PASTE_TITLE_MAX
            ? `Mục tiêu tối đa ${PASTE_TITLE_MAX} ký tự.`
            : undefined,
    });
  });
  return { lines: all.slice(0, PASTE_MAX_LINES), tooMany: all.length > PASTE_MAX_LINES };
}

/**
 * Mã cho `count` mục tiêu liên tiếp, tiếp sau các mã đã có. Trả mảng rỗng khi không gợi được
 * mã đầu (bộ trống mà thiếu mã môn hay khối): người dùng thêm một mục tiêu bằng tay trước.
 */
export function pasteCodes(
  nextCode: (existing: readonly string[]) => string,
  existingCodes: readonly string[],
  count: number,
): string[] {
  const used = [...existingCodes];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = nextCode(used);
    if (!code) return [];
    out.push(code);
    used.push(code);
  }
  return out;
}
