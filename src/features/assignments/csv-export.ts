import { csvChoices, csvText } from "@/lib/files/csv";
import { assignmentImportPreviewSchema } from "@/lib/validators/assignment-import";

interface QuestionContent {
  kind: "MULTIPLE_CHOICE" | "ESSAY";
  prompt: string;
  choices?: string | string[] | null;
  correctAnswer?: string | null;
  rubric?: string | null;
  maxScore: number;
}

const HEADERS = [
  "kind",
  "prompt",
  "choices",
  "correctAnswer",
  "rubric",
  "maxScore",
  "csvVersion",
] as const;

/** Content only: class, deadline, recipients and CLO mappings stay in the form. */
export function assignmentCsv(questions: readonly QuestionContent[]): string {
  if (!questions.length) throw new Error("Chưa có câu hỏi để xuất CSV.");
  const content = assignmentImportPreviewSchema.shape.questions.parse(
    questions.map((question) => ({
      kind: question.kind,
      prompt: question.prompt,
      ...(question.kind === "MULTIPLE_CHOICE"
        ? {
            choices:
              typeof question.choices === "string"
                ? question.choices
                    .split(/\r?\n/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                : question.choices,
            correctAnswer: question.correctAnswer ?? undefined,
          }
        : { rubric: question.rubric ?? undefined }),
      maxScore: question.maxScore,
    })),
  );
  return csvText(
    HEADERS,
    content.map((question) => [
      question.kind,
      question.prompt,
      csvChoices(question.choices ?? []),
      question.correctAnswer ?? "",
      question.rubric ?? "",
      question.maxScore,
      1,
    ]),
  );
}

export function assignmentCsvTemplate(): string {
  return assignmentCsv([
    {
      kind: "MULTIPLE_CHOICE",
      prompt: "2 + 3 bằng bao nhiêu?",
      choices: ["4", "5", "6"],
      correctAnswer: "5",
      maxScore: 2,
    },
    {
      kind: "ESSAY",
      prompt: "Giải thích tính chất giao hoán của phép cộng",
      rubric: "Nêu đúng tính chất và cho ví dụ minh họa",
      maxScore: 8,
    },
  ]);
}
