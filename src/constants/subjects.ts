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

/** Màu chấm nhận diện môn theo tên môn BE trả (chưa có mã môn thống nhất giữa các API). */
export function subjectDotClass(subjectName: string): string {
  const name = subjectName.toLocaleLowerCase("vi");
  if (name.startsWith("toán")) return "bg-blue-500";
  if (name.startsWith("vật l")) return "bg-cyan-500";
  if (name.startsWith("hóa") || name.startsWith("hoá")) return "bg-purple-500";
  if (name.startsWith("sinh")) return "bg-emerald-500";
  return "bg-zinc-400";
}

export const FALLBACK_SUBJECT: SubjectConfig = {
  code: "OTHER",
  name: "Môn khác",
  badgeVariant: "secondary",
}
