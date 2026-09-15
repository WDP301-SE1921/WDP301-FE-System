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
