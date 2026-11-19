// Danh sách kiểm tra trước khi gửi duyệt giáo trình. Hàm thuần, tính ngay ở web.

/** Số thứ tự của các bài có liên tục 1..N không (BE chặn `LESSON_SEQUENCE_GAP`). */
export function hasSequenceGap(sequences: readonly number[]): boolean {
  return [...sequences]
    .sort((a, b) => a - b)
    .some((sequence, index) => sequence !== index + 1);
}

export type SubmitCheckState = "ok" | "block" | "warn" | "unknown";

export interface SubmitCheck {
  key: "lessons" | "sequence" | "reviewers" | "outcomes";
  state: SubmitCheckState;
  label: string;
  /** Câu nói việc cần làm tiếp; rỗng khi đạt. */
  detail: string;
  /** Mục này có nút sửa nhanh ("Đánh số lại"). */
  fix?: "renumber";
}

export interface SubmitChecklistInput {
  /** Số thứ tự của các bài thường (kind LESSON). */
  sequences: readonly number[];
  /** `undefined` khi chưa tải xong hoặc lỗi tải. */
  reviewerCount: number | undefined;
  /** Số mục tiêu nháp chưa gắn bài; `undefined` khi chưa tải. */
  unlinkedOutcomes: number | undefined;
  /** Bài thường chưa gắn mục tiêu nào (BE chặn gửi duyệt: LESSON_OUTCOME_MISSING). */
  lessonsMissingOutcome?: readonly { sequence: number; title: string }[];
}

const MISSING_SHOWN = 5;

export function submitChecklist(input: SubmitChecklistInput): SubmitCheck[] {
  const count = input.sequences.length;
  const gap = count > 0 && hasSequenceGap(input.sequences);
  const checks: SubmitCheck[] = [
    {
      key: "lessons",
      state: count ? "ok" : "block",
      label: "Có ít nhất 1 bài học",
      detail: count ? "" : "Thêm bài học hoặc nhập bài từ file.",
    },
    {
      key: "sequence",
      state: gap ? "block" : "ok",
      label: "Thứ tự bài học liên tục",
      detail: gap
        ? "Thứ tự bài bị hở sau khi xóa hoặc nhập. Bấm Đánh số lại, hoặc bấm ↑ ↓ một lần."
        : "",
      fix: gap ? "renumber" : undefined,
    },
    {
      key: "reviewers",
      state:
        input.reviewerCount === undefined
          ? "unknown"
          : input.reviewerCount > 0
            ? "ok"
            : "block",
      label: "Có giáo viên duyệt nội dung",
      detail:
        input.reviewerCount === undefined
          ? "Chưa tải được danh sách giáo viên. Tải lại trang."
          : input.reviewerCount > 0
            ? ""
            : "Chưa có giáo viên nào đang hoạt động. Quản lý hãy tạo tài khoản giáo viên trong Nhân sự.",
    },
  ];
  const missing = input.lessonsMissingOutcome ?? [];
  if (missing.length) {
    const names = missing
      .slice(0, MISSING_SHOWN)
      .map((lesson) => `Bài ${lesson.sequence}: ${lesson.title}`)
      .join("; ");
    const more =
      missing.length > MISSING_SHOWN
        ? ` và ${missing.length - MISSING_SHOWN} bài khác`
        : "";
    checks.push({
      key: "outcomes",
      state: "block",
      label: "Mỗi bài đã gắn ít nhất 1 mục tiêu",
      detail: `Còn ${missing.length} bài chưa gắn mục tiêu: ${names}${more}. Vào bước “Gắn mục tiêu vào bài” để gắn.`,
    });
    return checks;
  }
  checks.push({
    key: "outcomes",
    state:
      input.unlinkedOutcomes === undefined
        ? "unknown"
        : input.unlinkedOutcomes > 0
          ? "warn"
          : "ok",
    label: "Mục tiêu đã gắn đủ vào bài",
    detail:
      input.unlinkedOutcomes && input.unlinkedOutcomes > 0
        ? `Còn ${input.unlinkedOutcomes} mục tiêu chưa gắn bài. Vẫn gửi được, nhưng giáo viên chỉ duyệt được mục tiêu khi đã có bài.`
        : "",
  });
  return checks;
}

/** Có mục chặn nào chưa đạt không (mục "unknown" không chặn cứng, BE kiểm lại khi gửi). */
export function hasBlockingCheck(checks: readonly SubmitCheck[]): boolean {
  return checks.some((check) => check.state === "block");
}
