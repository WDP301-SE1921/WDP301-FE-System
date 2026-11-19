import { csvText } from "@/lib/files/csv";
import { curriculumLessonSchema } from "@/lib/validators/curriculum";
import type { CurriculumLesson } from "@/types/curriculum";

/** outcomeId -> mã mục tiêu, dựng từ các bộ mục tiêu của khóa. */
export function outcomeCodeMap(
  sets: readonly { outcomes: readonly { id: string; code: string }[] }[],
): Map<string, string> {
  return new Map(sets.flatMap((set) => set.outcomes.map((o) => [o.id, o.code] as const)));
}

/** Xuất chỉ đúng khi mọi mục tiêu đã gắn đều có mã (tránh mất liên kết khi nhập lại). */
export function outcomeCodesReady(
  lessons: readonly LessonContent[],
  codeById: ReadonlyMap<string, string>,
): boolean {
  return lessons.every((lesson) =>
    (lesson.outcomeLinks ?? []).every((link) => codeById.has(link.outcomeId)),
  );
}

/** Bỏ mã trùng (không phân biệt hoa thường), giữ thứ tự. */
function uniqueCodes(codes: readonly (string | undefined)[]): string[] {
  const seen = new Set<string>();
  return codes.filter((code): code is string => {
    if (!code || seen.has(code.toUpperCase())) return false;
    seen.add(code.toUpperCase());
    return true;
  });
}

type LessonContent = Pick<
  CurriculumLesson,
  "kind" | "sequence" | "title" | "content" | "outcomeLinks"
>;
const HEADERS = [
  "kind",
  "sequence",
  "title",
  "content",
  "outcomeCodes",
  "monthKey",
  "csvVersion",
] as const;

/** All saved lessons, independent of comparison filters; never export monthly tests. */
export function curriculumCsv(
  lessons: readonly LessonContent[],
  /** outcomeId -> mã mục tiêu; thiếu thì cột Mã mục tiêu để trống. */
  codeById: ReadonlyMap<string, string> = new Map(),
): string {
  const content = lessons
    .filter((lesson) => lesson.kind === "LESSON")
    .sort((a, b) => a.sequence - b.sequence)
    .map((lesson) => ({
      ...curriculumLessonSchema.parse(lesson),
      codes: uniqueCodes(
        (lesson.outcomeLinks ?? []).map((link) => codeById.get(link.outcomeId)),
      ).join(", "),
    }));
  if (!content.length) throw new Error("Chưa có bài học đã lưu để xuất CSV.");
  if (content.length > 1000)
    throw new Error("Chỉ xuất tối đa 1.000 bài học trong một file CSV.");
  return csvText(
    HEADERS,
    content.map((lesson) => [
      "LESSON",
      lesson.sequence,
      lesson.title,
      lesson.content,
      lesson.codes,
      "",
      1,
    ]),
  );
}

export function curriculumCsvTemplate(): string {
  return curriculumCsv([
    {
      kind: "LESSON",
      sequence: 1,
      title: "Bài 1: Ôn tập kiến thức",
      content:
        "Mục tiêu: ôn tập kiến thức nền tảng.\nHoạt động: ví dụ và bài tập vận dụng.",
    },
    {
      kind: "LESSON",
      sequence: 2,
      title: "Bài 2: Luyện tập",
      content:
        "Mục tiêu: vận dụng kiến thức.\nHoạt động: luyện tập và giải đáp thắc mắc.",
    },
  ]);
}
