import { getPublicCenter } from "@/lib/api/public-center"
import {
  centerContactItems,
  type ContactItem,
} from "@/features/landing/center-contact"

export interface LandingData {
  contactItems: ContactItem[]
}

/** Dữ liệu động của landing page, đọc từ các API công khai của BE. */
export async function loadLandingData(): Promise<LandingData> {
  const center = await getPublicCenter()
  return { contactItems: centerContactItems(center) }
}
