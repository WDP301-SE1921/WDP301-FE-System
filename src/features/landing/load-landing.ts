import type { PublicSubject } from "@/types/backend"
import { getPublicCenter, getPublicSubjects } from "@/lib/api/public-center"
import {
  centerContactItems,
  type ContactItem,
} from "@/features/landing/center-contact"
import {
  landingStats,
  type LandingStat,
} from "@/features/landing/landing-stats"

export interface LandingData {
  contactItems: ContactItem[]
  subjects: PublicSubject[]
  stats: LandingStat[]
}

/** Dữ liệu động của landing page, đọc từ các API công khai của BE. */
export async function loadLandingData(): Promise<LandingData> {
  const [center, subjects] = await Promise.all([
    getPublicCenter(),
    getPublicSubjects(),
  ])
  return {
    contactItems: centerContactItems(center),
    subjects,
    stats: landingStats(subjects.length),
  }
}
