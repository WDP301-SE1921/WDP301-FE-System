/** Khối lớp trung tâm dạy (SRS: khối 6–9). BE kiểm tra cùng khoảng này (`@Min(6) @Max(9)`). */
export const GRADES = [6, 7, 8, 9] as const

export type Grade = (typeof GRADES)[number]

export function gradeLabel(grade: number): string {
  return `Khối ${grade}`
}

/** Mục cho ô lọc khối: "Tất cả khối" rồi từng khối, khóa là chuỗi để dùng thẳng với `Select`. */
export const GRADE_FILTER_ITEMS: Record<string, string> = {
  all: "Tất cả khối",
  ...Object.fromEntries(GRADES.map((grade) => [String(grade), gradeLabel(grade)])),
}
