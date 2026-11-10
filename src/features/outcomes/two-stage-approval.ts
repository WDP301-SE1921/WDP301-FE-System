// Duyệt giáo trình kèm bộ mục tiêu đi cùng (Q3, C28). Giáo trình vẫn duyệt hai bước (giáo viên
// rồi Quản lý). Bộ mục tiêu chỉ còn một bước từ BE PR #12: giáo viên duyệt là bộ `APPROVED`,
// dùng được ngay; Quản lý không duyệt bộ nữa. Nên khi giáo viên đồng ý nội dung giáo trình, các
// bộ đi cùng đủ điều kiện được duyệt luôn trong cùng lần bấm.
// Hàm thuần, chỉ import type để `node --test` nạp thẳng được.
import type { OutcomeSet } from "../../types/outcomes";

export type ApprovalRole = "teacher" | "center_manager";

export interface BlockedSet {
  set: OutcomeSet;
  /** Mã mục tiêu chưa có bài nào, theo thứ tự trong bộ. */
  codes: string[];
}

export interface ApprovalPlan {
  /** Bộ giáo viên duyệt ngay sau giáo trình. Luôn rỗng với Quản lý. */
  approvable: OutcomeSet[];
  /** Giáo viên: bộ nháp còn mục tiêu chưa gắn bài, bỏ qua lần này. */
  blocked: BlockedSet[];
  /** Quản lý: bộ đi cùng giáo viên chưa duyệt (còn bản nháp), chỉ để báo. */
  stillDraft: OutcomeSet[];
}

const unlinkedCodes = (set: OutcomeSet) =>
  set.outcomes.filter((o) => !o.lessonLinks.length).map((o) => o.code);

/**
 * Bộ cần duyệt cùng giáo trình. `companions` là bộ đi cùng (có mục tiêu gắn vào bài của giáo
 * trình). Giáo viên duyệt bộ `DRAFT` đủ điều kiện (có mục tiêu, mỗi mục tiêu có ít nhất một bài).
 * Quản lý không duyệt bộ nào, chỉ được báo bộ còn nháp. Bộ đã `APPROVED` thì bỏ qua.
 */
export function approvalPlan(
  role: ApprovalRole,
  companions: readonly OutcomeSet[],
): ApprovalPlan {
  const drafts = companions.filter((set) => set.status === "DRAFT");
  if (role === "center_manager")
    return { approvable: [], blocked: [], stillDraft: drafts };
  const blocked: BlockedSet[] = [];
  const approvable: OutcomeSet[] = [];
  for (const set of drafts) {
    const codes = unlinkedCodes(set);
    if (!set.outcomes.length || codes.length) blocked.push({ set, codes });
    else approvable.push(set);
  }
  return { approvable, blocked, stillDraft: [] };
}

/** Bản mới nhất đã duyệt trong số bộ của khóa, dùng cho câu "Mục tiêu giữ như bản N". */
export function latestApprovedVersion(sets: readonly OutcomeSet[]): number | null {
  const versions = sets.filter((s) => s.status === "APPROVED").map((s) => s.version);
  return versions.length ? Math.max(...versions) : null;
}

const label = (set: OutcomeSet) => `${set.level} · bản ${set.version}`;

/** Câu báo trước khi bấm duyệt; rỗng khi không có gì cần báo. */
export function approvalWarning(
  role: ApprovalRole,
  plan: ApprovalPlan,
  limit = 5,
): string {
  if (role === "teacher") {
    if (!plan.blocked.length) return "";
    const parts = plan.blocked.map(({ set, codes }) => {
      if (!set.outcomes.length) return `${label(set)} chưa có mục tiêu nào`;
      const shown = codes.slice(0, limit).join(", ");
      const rest = codes.length - limit;
      return `${label(set)}: ${shown}${rest > 0 ? ` và ${rest} mục tiêu khác` : ""}`;
    });
    return `Mục tiêu khóa học chưa duyệt được vì còn mục tiêu chưa gắn bài: ${parts.join("; ")}. Giáo trình vẫn được duyệt, phần mục tiêu đó bỏ qua lần này.`;
  }
  if (!plan.stillDraft.length) return "";
  return `Mục tiêu khóa học đi cùng chưa được giáo viên duyệt (${plan.stillDraft.map(label).join(", ")}). Giáo trình vẫn được duyệt; bộ mục tiêu dùng được khi giáo viên duyệt.`;
}

export interface SetFailure {
  setId: string;
  label: string;
  message: string;
}

/** Câu báo lỗi một phần: giáo trình đã xong, phần mục tiêu còn lỗi. */
export function partialFailureMessage(failures: readonly SetFailure[]): string {
  return `Đã duyệt giáo trình. Chưa duyệt được mục tiêu khóa học: ${failures
    .map((f) => `${f.label} (${f.message})`)
    .join("; ")}`;
}
