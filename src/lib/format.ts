import { format as formatDateFns, formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

export function formatDate(date: Date | string | number, formatStr = "dd/MM/yyyy"): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  return formatDateFns(d, formatStr, { locale: vi })
}

export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, "HH:mm - dd/MM/yyyy")
}

export function formatTime(date: Date | string | number): string {
  return formatDate(date, "HH:mm")
}

export function formatRelativeDate(date: Date | string | number): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  return formatDistanceToNow(d, { addSuffix: true, locale: vi })
}

const ONES = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
]

const SCALES = ["", " nghìn", " triệu", " tỷ"]

/** Đọc một nhóm 3 chữ số; `hasPrefix` = còn nhóm lớn hơn phía trước. */
function readTriple(value: number, hasPrefix: boolean): string {
  const hundreds = Math.floor(value / 100)
  const tens = Math.floor((value % 100) / 10)
  const ones = value % 10
  const parts: string[] = []

  if (hundreds > 0 || hasPrefix) {
    parts.push(`${ONES[hundreds]} trăm`)
  }

  if (tens === 0) {
    if (ones > 0 && (hundreds > 0 || hasPrefix)) parts.push("lẻ", ONES[ones])
    else if (ones > 0) parts.push(ONES[ones])
  } else if (tens === 1) {
    parts.push("mười")
    if (ones === 1) parts.push("một")
    else if (ones === 5) parts.push("lăm")
    else if (ones > 0) parts.push(ONES[ones])
  } else {
    parts.push(`${ONES[tens]} mươi`)
    if (ones === 1) parts.push("mốt")
    else if (ones === 5) parts.push("lăm")
    else if (ones > 0) parts.push(ONES[ones])
  }

  return parts.join(" ")
}

/**
 * Đọc số tiền VND thành chữ cho biên lai.
 * Ví dụ: 1500000 → "Một triệu năm trăm nghìn đồng".
 */
export function formatMoneyInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "Không đồng"

  const triples: number[] = []
  let remaining = Math.floor(amount)

  while (remaining > 0) {
    triples.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const words = triples
    .map((triple, index) =>
      triple === 0 ? "" : `${readTriple(triple, index < triples.length - 1)}${SCALES[index] ?? ""}`
    )
    .filter(Boolean)
    .reverse()
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  return `${words.charAt(0).toUpperCase()}${words.slice(1)} đồng`
}
