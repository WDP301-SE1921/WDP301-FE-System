// Danh sách kiểm tra trước khi gửi duyệt giáo trình. Hàm thuần, tính ngay ở web.

/** Số thứ tự của các bài có liên tục 1..N không (BE chặn `LESSON_SEQUENCE_GAP`). */
export function hasSequenceGap(sequences: readonly number[]): boolean {
  return [...sequences]
    .sort((a, b) => a - b)
    .some((sequence, index) => sequence !== index + 1);
}

export type SubmitCheckState = "ok" | "block" | "warn" | "unknown";

export interface SubmitCheck {
  key: "lessons" | "sequence" | "reviewers" | "coverage" | "outcomes";
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
  /** Số buổi lớp cần nhiều nhất (hoặc dự kiến theo khóa); `null` khi chưa tính được. */
  neededLessons: number | null;
  /** Số mục tiêu nháp chưa gắn bài; `undefined` khi chưa tải. */
  unlinkedOutcomes: number | undefined;
}

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
  const short = input.neededLessons === null ? 0 : input.neededLessons - count;
  checks.push({
    key: "coverage",
    state:
      input.neededLessons === null ? "unknown" : short > 0 ? "warn" : "ok",
    label: "Đủ bài cho số buổi của kỳ",
    detail:
      input.neededLessons === null
        ? "Chưa tính được vì các lớp chưa có lịch tuần. Vẫn gửi được."
        : short > 0
          ? `Còn thiếu ${short} bài so với ${input.neededLessons} buổi cần. Vẫn gửi được.`
          : "",
  });
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
