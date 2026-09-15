import type { BadgeProps } from "@/components/ui/badge"

export interface SubjectConfig {
  code: string
  name: string
  badgeVariant: NonNullable<BadgeProps["variant"]>
}

// TODO: Align subject codes with Backend API category definitions when finalized
export const SUBJECT_MAP: Record<string, SubjectConfig> = {
  MATH: {
    code: "MATH",
    name: "Toán học",
    badgeVariant: "math",
  },
  PHYS: {
    code: "PHYS",
    name: "Vật lý",
    badgeVariant: "physics",
  },
  CHEM: {
    code: "CHEM",
    name: "Hóa học",
    badgeVariant: "chemistry",
  },
  BIOL: {
    code: "BIOL",
    name: "Sinh học",
    badgeVariant: "biology",
  },
}

export const FALLBACK_SUBJECT: SubjectConfig = {
  code: "OTHER",
  name: "Môn khác",
  badgeVariant: "secondary",
}
