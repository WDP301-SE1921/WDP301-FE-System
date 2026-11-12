// Các bước của một bài tập ở web (Luồng 4, PLAN_GUIDED_WORKFLOWS.md): Soạn đề → Giao bài →
// Học sinh làm bài → Chấm bài → Trả điểm & đáp án. Hàm thuần, chỉ import type để `node --test`
// nạp thẳng được (xem tests/assignment-steps.test.mjs).
import type {
  FlowStep,
  FlowStepStatus,
} from "../../components/shared/workflows/flow-steps";

export type AssignmentStepKey =
  "compose" | "assign" | "collect" | "grade" | "return";

export const ASSIGNMENT_STEP_KEYS: AssignmentStepKey[] = [
  "compose",
  "assign",
  "collect",
  "grade",
  "return",
];

export interface AssignmentStepInput {
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  dueAt: string;
  answersPublishedAt?: string | null;
  questionCount: number;
  /** Từ `submissionSummary`: chỉ tính lần nộp mới nhất của mỗi học sinh. */
  summary: {
    assigned: number;
    submitted: number;
    ungraded: number;
    /** Đã chấm (DRAFT/APPROVED) nhưng chưa gửi điểm. */
    draft: number;
    published: number;
  };
  now: number;
}

export interface AssignmentStep extends FlowStep {
  key: AssignmentStepKey;
}

const step = (
  key: AssignmentStepKey,
  title: string,
  status: FlowStepStatus,
  summary?: string,
): AssignmentStep => ({ key, title, status, summary });

/**
 * Trạng thái 5 bước, tính từ dữ liệu BE. Chỉ bước đầu tiên chưa xong là "Đang làm"; bước sau mà
 * làm được trước (vd chấm bài khi chưa đóng nhận bài) là "Làm được".
 */
export function assignmentSteps(input: AssignmentStepInput): AssignmentStep[] {
  const { status, questionCount, summary } = input;
  const isDraft = status === "DRAFT";
  const isClosed = status === "CLOSED";
  const isOverdue = input.now >= Date.parse(input.dueAt);
  const answersVisible = !!input.answersPublishedAt;

  const compose = step(
    "compose",
    "Soạn đề",
    isDraft && !questionCount ? "current" : "done",
    questionCount ? `${questionCount} câu` : "Chưa có câu hỏi",
  );
  const assign = isDraft
    ? step(
        "assign",
        "Giao bài",
        questionCount ? "current" : "todo",
        "Chọn học sinh rồi giao",
      )
    : step(
        "assign",
        "Giao bài",
        "done",
        `Đã giao ${summary.assigned} học sinh`,
      );
  const submitted = `${summary.submitted}/${summary.assigned} đã nộp`;
  const collect = isDraft
    ? step("collect", "Học sinh làm bài", "todo")
    : isClosed
      ? step(
          "collect",
          "Học sinh làm bài",
          "done",
          `Đã đóng nhận bài · ${submitted}`,
        )
      : step(
          "collect",
          "Học sinh làm bài",
          "current",
          isOverdue ? `Đã hết hạn · ${submitted}` : submitted,
        );
  let grade: AssignmentStep;
  if (isDraft) grade = step("grade", "Chấm bài", "todo");
  else if (!summary.submitted)
    grade = isClosed
      ? step("grade", "Chấm bài", "done", "Không có bài nộp")
      : step("grade", "Chấm bài", "todo", "Chưa có bài nộp");
  else if (summary.ungraded)
    grade = step(
      "grade",
      "Chấm bài",
      "current",
      `Còn ${summary.ungraded} bài chưa chấm`,
    );
  else
    grade = step(
      "grade",
      "Chấm bài",
      "done",
      `Đã chấm ${summary.submitted}/${summary.submitted}`,
    );

  let back: AssignmentStep;
  const title = "Trả điểm & đáp án";
  if (isDraft) back = step("return", title, "todo");
  else if (summary.draft)
    back = step(
      "return",
      title,
      "current",
      `${summary.draft} bài chấm xong chưa gửi điểm`,
    );
  else if (!isClosed)
    back = step(
      "return",
      title,
      summary.published ? "available" : "todo",
      summary.published ? `Đã gửi ${summary.published} điểm` : undefined,
    );
  else if (!answersVisible)
    back = step("return", title, "current", "Chưa công bố đáp án");
  else
    back = step(
      "return",
      title,
      "done",
      `Đã gửi ${summary.published} điểm · đã công bố đáp án`,
    );

  let seen = false;
  return [compose, assign, collect, grade, back].map((item) => {
    if (item.status !== "current") return item;
    if (!seen) {
      seen = true;
      return item;
    }
    return { ...item, status: "available" };
  });
}

/** Bước mở mặc định: bước "Đang làm"; xong hết thì bước cuối. */
export function defaultAssignmentStep(
  steps: AssignmentStep[],
): AssignmentStepKey {
  return (
    steps.find((item) => item.status === "current")?.key ??
    steps[steps.length - 1].key
  );
}

/** Bài nộp mới nhất chưa chấm, theo thứ tự nộp sớm trước (để "Chấm bài tiếp theo"). */
export function nextUngraded<
  T extends { id: string; submittedAt: string; grades: unknown[] },
>(latest: T[], exceptId?: string): T | undefined {
  return [...latest]
    .filter((item) => !item.grades.length && item.id !== exceptId)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0];
}

export interface AssignmentFollowUp<T> {
  item: T;
  step: AssignmentStep;
  /** Số thứ tự của bước (1–5), để ghi "Bước 2/5". */
  position: number;
}

/**
 * Bài cần giáo viên làm tiếp ở Tổng quan (L4-d): nháp chưa giao, hết hạn mà chưa đóng nhận bài, chấm
 * xong chưa gửi điểm hoặc chưa công bố đáp án. Bỏ bài đang nhận bài còn hạn (chưa có việc) và bài chỉ
 * còn chấm (đã có khối "Cần chấm").
 */
export function assignmentFollowUps<T>(
  items: T[],
  toInput: (item: T) => AssignmentStepInput,
): AssignmentFollowUp<T>[] {
  return items.flatMap((item) => {
    const input = toInput(item);
    const steps = assignmentSteps(input);
    const index = steps.findIndex((entry) => entry.status === "current");
    if (index < 0) return [];
    const step = steps[index];
    if (step.key === "grade") return [];
    if (step.key === "collect" && input.now < Date.parse(input.dueAt))
      return [];
    return [{ item, step, position: index + 1 }];
  });
}
