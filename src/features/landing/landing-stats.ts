import { LANDING_CONTENT } from "@/features/landing/content"

export interface LandingStat {
  value: string
  label: string
}

/** Dải số liệu ở hero; mục "Môn học chính" đếm theo số môn BE trả, không có môn thì bỏ. */
export function landingStats(subjectCount: number): LandingStat[] {
  const fixed = LANDING_CONTENT.STATS.map((stat) => ({ ...stat }))
  return subjectCount > 0
    ? [
        {
          value: String(subjectCount),
          label: LANDING_CONTENT.STAT_SUBJECTS_LABEL,
        },
        ...fixed,
      ]
    : fixed
}
