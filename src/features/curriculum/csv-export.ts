import { csvText } from "@/lib/files/csv";
import { curriculumLessonSchema } from "@/lib/validators/curriculum";
import type { CurriculumLesson } from "@/types/curriculum";

type LessonContent = Pick<
  CurriculumLesson,
  "kind" | "sequence" | "title" | "content"
>;
const HEADERS = [
  "kind",
  "sequence",
  "title",
  "content",
  "monthKey",
  "csvVersion",
] as const;

/** All saved lessons, independent of comparison filters; never export monthly tests. */
export function curriculumCsv(lessons: readonly LessonContent[]): string {
  const content = lessons
    .filter((lesson) => lesson.kind === "LESSON")
    .map((lesson) => curriculumLessonSchema.parse(lesson))
    .sort((a, b) => a.sequence - b.sequence);
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
