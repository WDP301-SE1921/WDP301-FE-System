export type SubjectTone =
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "amber"
  | "rose"
  | "indigo"
  | "teal"
  | "none"

export interface SubjectConfig {
  code: string
  name: string
  tone: SubjectTone
  badgeVariant:
    "math" | "physics" | "chemistry" | "biology" | "outline" | "secondary"
  /** Màu cho môn mới (badge `outline`); 4 môn đã biết dùng biến thể có sẵn của Badge. */
  badgeClassName: string
  dotClass: string
}

interface KnownSubject {
  tone: "math" | "physics" | "chemistry" | "biology"
  code: string
  name: string
  dotClass: string
  /** Mã đã chuẩn hóa (chữ thường) mà BE hoặc dữ liệu cũ dùng. */
  codes: readonly string[]
  /**
   * Khớp tên đã bỏ dấu, chữ thường. Tên đầy đủ khớp theo ranh giới từ ("toan 8 nang cao");
   * tên ngắn ("hoa", "sinh") chỉ khớp khi đứng một mình hoặc kèm số khối, để "sinh hoat lop" không bị nhận nhầm.
   */
  namePattern: RegExp
}

const KNOWN_SUBJECTS: readonly KnownSubject[] = [
  {
    tone: "math",
    code: "MATH",
    name: "Toán học",
    dotClass: "bg-blue-500",
    codes: ["math"],
    namePattern: /^toan(?: |$)/,
  },
  {
    tone: "physics",
    code: "PHYSICS",
    name: "Vật lý",
    dotClass: "bg-cyan-500",
    codes: ["phys", "physics"],
    namePattern: /^vat l[yi](?: |$)/,
  },
  {
    tone: "chemistry",
    code: "CHEMISTRY",
    name: "Hóa học",
    dotClass: "bg-purple-500",
    codes: ["chem", "chemistry"],
    namePattern: /^hoa(?: hoc(?: |$)| \d+$|$)/,
  },
  {
    tone: "biology",
    code: "BIOLOGY",
    name: "Sinh học",
    dotClass: "bg-emerald-500",
    codes: ["biol", "biology"],
    namePattern: /^sinh(?: hoc(?: |$)| \d+$|$)/,
  },
]

/** Màu cho môn Quản lý tạo thêm; chọn ổn định theo tên/mã nên mỗi môn luôn giữ một màu. */
const EXTRA_TONES = [
  {
    tone: "amber",
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  {
    tone: "rose",
    badgeClassName:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
  {
    tone: "indigo",
    badgeClassName:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
    dotClass: "bg-indigo-500",
  },
  {
    tone: "teal",
    badgeClassName:
      "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
    dotClass: "bg-teal-500",
  },
] as const satisfies readonly {
  tone: SubjectTone
  badgeClassName: string
  dotClass: string
}[]

const OTHER_SUBJECT: SubjectConfig = {
  code: "OTHER",
  name: "Môn khác",
  tone: "none",
  badgeVariant: "secondary",
  badgeClassName: "",
  dotClass: "bg-zinc-400",
}

function normalizeSubjectKey(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
}

/**
 * Nhãn và màu của một môn từ mã (`MATH`, `PHYSICS`, …) hoặc tên BE trả (`Hóa học`).
 * Môn ngoài 4 môn đã biết giữ tên thật và nhận một màu ổn định; rỗng thì là "Môn khác".
 */
export function resolveSubject(
  value: string | null | undefined,
): SubjectConfig {
  const label = value?.trim() ?? ""
  if (!label) return OTHER_SUBJECT
  const key = normalizeSubjectKey(label)
  const byCode = KNOWN_SUBJECTS.find((subject) => subject.codes.includes(key))
  const known =
    byCode ?? KNOWN_SUBJECTS.find((subject) => subject.namePattern.test(key))
  if (known)
    return {
      code: known.code,
      // Đưa vào mã thì dùng tên chuẩn; đưa vào tên thì giữ đúng tên Quản lý đặt ở danh mục.
      name: byCode ? known.name : label,
      tone: known.tone,
      badgeVariant: known.tone,
      badgeClassName: "",
      dotClass: known.dotClass,
    }
  const hash = [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0)
  const extra = EXTRA_TONES[hash % EXTRA_TONES.length]
  return {
    code: label,
    name: label,
    tone: extra.tone,
    badgeVariant: "outline",
    badgeClassName: extra.badgeClassName,
    dotClass: extra.dotClass,
  }
}

/** Màu chấm nhận diện môn theo mã hoặc tên môn BE trả. */
export function subjectDotClass(value: string): string {
  return resolveSubject(value).dotClass
}
