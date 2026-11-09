// Hàm thuần cho ô nhập tiền; không import lúc chạy để `node --test` nạp thẳng được file này.

/** Số tiền lớn nhất ô nhập nhận (12 chữ số; `formatMoneyInWords` đọc được tới hàng tỷ). */
export const MAX_MONEY_AMOUNT = 999_999_999_999;
const MAX_MONEY_DIGITS = 12;

/**
 * Bỏ đuôi thập phân của số dán vào ("1.500.000,00", "1,500,000.00"). Chỉ coi là thập phân khi
 * dấu cuối khác dấu ngăn cách nghìn đứng trước nó; không có dấu nào khác thì chỉ "," là thập
 * phân. Nhờ vậy xóa bớt chữ số trong "1.500.000" (thành "1.500.00") không bị hiểu nhầm là xu.
 */
function stripDecimalTail(text: string): string {
  const core = text.replace(/\D+$/, "");
  const match = /([.,])\d{1,2}$/.exec(core);
  if (!match) return core;
  const separator = match[1];
  const integerPart = core.slice(0, -match[0].length);
  const others = integerPart.match(/[.,]/g) ?? [];
  const isDecimal = others.length
    ? others.every((other) => other !== separator)
    : separator === ",";
  return isDecimal ? integerPart : core;
}

function moneyDigits(text: string): string {
  return stripDecimalTail(text).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

/** Chỉ giữ chữ số người dùng gõ hoặc dán ("1.500.000đ", "1,500,000"), tối đa 12 chữ số; ô trống trả `NaN`. */
export function parseMoneyText(text: string): number {
  const digits = moneyDigits(text).slice(0, MAX_MONEY_DIGITS);
  return digits ? Number(digits) : Number.NaN;
}

/** Người dùng gõ hoặc dán quá 12 chữ số (phần thừa bị cắt bỏ). */
export function isMoneyTextTooLong(text: string): boolean {
  return moneyDigits(text).length > MAX_MONEY_DIGITS;
}

/** 1500000 → "1.500.000"; giá trị không phải số (ô trống) → "". */
export function formatMoneyDigits(value: number): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)
    : "";
}

/** Vị trí con trỏ trong chuỗi đã định dạng, ngay sau chữ số thứ `digitsBefore`. */
export function caretAfterDigits(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted.charAt(index))) seen += 1;
    if (seen === digitsBefore) return index + 1;
  }
  return formatted.length;
}
