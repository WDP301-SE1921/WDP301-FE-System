// Hàm thuần của hộp tạo khóa và form môn (chỉ import type, để `node --test` nạp thẳng được).
import type { AcademicSubject, RegistrationProgram } from "@/types/backend";

export const SESSIONS_PER_WEEK = { min: 1, max: 14, default: 2 } as const;

/** Tên khóa tự điền: "Toán" + khối 7 → "Toán 7". Chưa đủ môn và khối thì rỗng. */
export function suggestProgramName(
  subjectName: string | undefined,
  grade: number | undefined,
): string {
  const name = subjectName?.trim();
  return name && grade != null ? `${name} ${grade}` : "";
}

/** Mã môn gợi ý: viết liền, không dấu, chữ hoa ("Hóa học" → "HOAHOC"); BE cũng lưu mã chữ hoa. */
export function suggestSubjectCode(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "D")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 64);
}

/** Mã môn đã có (không phân biệt hoa thường), bỏ qua chính môn đang sửa. */
export function isSubjectCodeTaken(
  subjects: Pick<AcademicSubject, "id" | "code">[],
  code: string,
  exceptId?: string,
): boolean {
  const wanted = code.trim().toUpperCase();
  return (
    !!wanted &&
    subjects.some(
      (subject) =>
        subject.id !== exceptId && subject.code.trim().toUpperCase() === wanted,
    )
  );
}

/** Khóa khác đang dùng đã cùng môn và khối (chỉ để gợi ý, BE cho trùng). */
export function findSameSubjectGradeProgram(
  programs: Pick<
    RegistrationProgram,
    "id" | "name" | "grade" | "subject" | "subjectId" | "isActive"
  >[],
  subject: Pick<AcademicSubject, "id" | "name"> | undefined,
  grade: number | undefined,
  exceptId?: string,
) {
  if (!subject || grade == null) return undefined;
  return programs.find(
    (program) =>
      program.id !== exceptId &&
      program.isActive !== false &&
      program.grade === grade &&
      (program.subjectId
        ? program.subjectId === subject.id
        : program.subject === subject.name),
  );
}

/**
 * Chỉ các field người dùng đã đổi (`dirtyFields` của react-hook-form). Sửa khóa gửi riêng phần
 * này, để khóa có môn đã ngừng dùng vẫn đổi được số buổi/tuần mà không bị `SUBJECT_INACTIVE`.
 */
export function pickChangedFields<T extends object>(
  values: T,
  dirtyFields: Partial<Record<keyof T, unknown>>,
): Partial<T> {
  const changed: Partial<T> = {};
  for (const key of Object.keys(values) as (keyof T)[])
    if (dirtyFields[key] === true) changed[key] = values[key];
  return changed;
}

/**
 * `returnTo` chỉ nhận đường dẫn nội bộ của khu Quản lý ("/manager/..."), để link trên URL
 * không đưa người dùng sang trang ngoài (open redirect).
 */
export function safeManagerReturnPath(
  value: string | null | undefined,
): string | null {
  if (!value || !value.startsWith("/manager/")) return null;
  return /[\\\s]/.test(value) ? null : value;
}

/** Thêm dấu chấm cuối câu, trừ khi câu đã kết thúc bằng dấu câu (tên khóa "Toán 7 nâng cao."). */
export function withFinalPeriod(text: string): string {
  const trimmed = text.trimEnd();
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
