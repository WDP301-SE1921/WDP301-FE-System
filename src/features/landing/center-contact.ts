import type { CenterInfo } from "@/types/backend"
import { LANDING_CONTENT } from "@/features/landing/content"

export interface ContactItem {
  iconName: "phone" | "mail" | "address" | "clock"
  label: string
  value: string
}

const CONTACT_FIELDS = [
  ["phone", "phone"],
  ["mail", "email"],
  ["address", "address"],
  ["clock", "openingHours"],
] as const satisfies readonly (readonly [
  ContactItem["iconName"],
  keyof CenterInfo,
])[]

/** Các mục liên hệ có giá trị, theo thứ tự hiển thị; trường trống thì bỏ. */
export function centerContactItems(center: CenterInfo | null): ContactItem[] {
  if (!center) return []
  return CONTACT_FIELDS.flatMap(([iconName, field]) => {
    const value = center[field]?.trim()
    return value
      ? [{ iconName, label: LANDING_CONTENT.CONTACT_LABELS[iconName], value }]
      : []
  })
}
