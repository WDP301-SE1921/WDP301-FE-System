// Các bước chuẩn bị nội dung một khóa học (Luồng 1, PLAN_GUIDED_WORKFLOWS.md): Mục tiêu khóa học →
// Bài học → Gắn mục tiêu vào bài → Kiểm tra và gửi duyệt → Giáo viên duyệt nội dung → Quản lý duyệt
// áp dụng. Hàm thuần, chỉ import type để `node --test` nạp thẳng được (tests/content-setup.test.mjs).
import type { FlowStep } from "../../components/shared/workflows/flow-steps";

export type ContentStepKey =
  "outcomes" | "lessons" | "mapping" | "submit" | "teacher" | "manager";
export const CONTENT_STEP_KEYS: ContentStepKey[] = [
  "outcomes",
  "lessons",
  "mapping",
  "submit",
  "teacher",
  "manager",
];
export type ContentOwner = "DESIGNER" | "TEACHER" | "MANAGER";

export interface ContentUnit {
  id: string;
  status: string;
  fromDate: string;
  toDate: string;
  version: number;
  technicalReviewedAt?: string | null;
  reviewerTeacher?: { displayName: string | null } | null;
}
export interface ContentOutcomeSet {
  id: string;
  version: number;
  status: string;
  outcomes: { lessonLinks?: unknown[] }[];
}
export interface ContentStep extends FlowStep {
  key: ContentStepKey;
  owner: ContentOwner;
}

const OWNER_LABEL: Record<ContentOwner, string> = {
  DESIGNER: "Thiết kế giáo trình",
  TEACHER: "giáo viên",
  MANAGER: "Quản lý",
};
const day = (value: string) => value.slice(0, 10);
const latestVersion = <T extends { version: number }>(items: T[]) =>
  [...items].sort((a, b) => b.version - a.version)[0];

/**
 * Giáo trình đang chuẩn bị của khóa: bản chờ duyệt, rồi bản nháp, rồi bản đã duyệt đang áp dụng
 * (hoặc áp dụng sớm nhất sắp tới), cuối cùng bản đã duyệt mới nhất. Bản lưu trữ bị bỏ qua.
 */
export function pickWorkingUnit<T extends ContentUnit>(
  units: T[],
  today: string,
): T | null {
  const pending = latestVersion(
    units.filter((u) => u.status === "PENDING_REVIEW"),
  );
  if (pending) return pending;
  const draft = latestVersion(units.filter((u) => u.status === "DRAFT"));
  if (draft) return draft;
  const approved = units.filter((u) => u.status === "APPROVED");
  const current = approved.find(
    (u) => day(u.fromDate) <= today && day(u.toDate) >= today,
  );
  const next = approved
    .filter((u) => day(u.fromDate) > today)
    .sort((a, b) => day(a.fromDate).localeCompare(day(b.fromDate)))[0];
  return current ?? next ?? latestVersion(approved) ?? null;
}

interface RawStep {
  key: ContentStepKey;
  title: string;
  owner: ContentOwner;
  state: "done" | "needs" | "available" | "todo";
  summary?: string;
}

/**
 * Trạng thái 6 bước theo dữ liệu BE. Bước đầu tiên còn việc là "Đang làm" nếu đúng vai trò đang
 * xem, không thì "Chờ <vai trò>". Mục tiêu không bắt buộc (Q2): đã có bài mà chưa có mục tiêu thì
 * bước mục tiêu chỉ còn "Làm được", không chặn các bước sau.
 */
export function contentSetupSteps(input: {
  working: ContentUnit | null;
  /** Số bài của giáo trình đang chuẩn bị (đọc từ chi tiết giáo trình). */
  lessonCount: number;
  outcomeSets: ContentOutcomeSet[];
  viewer: ContentOwner | null;
}): ContentStep[] {
  const { working: w, lessonCount: lessons, viewer } = input;
  const latest = latestVersion(input.outcomeSets);
  const hasOutcomes = !!latest && latest.outcomes.length > 0;
  const unlinked = hasOutcomes
    ? latest.outcomes.filter((o) => !o.lessonLinks?.length).length
    : 0;
  const submitted =
    !!w && (w.status === "PENDING_REVIEW" || w.status === "APPROVED");
  const reviewer = w?.reviewerTeacher?.displayName;

  const outcomes: RawStep = {
    key: "outcomes",
    title: "Mục tiêu khóa học",
    owner: "DESIGNER",
    ...(hasOutcomes
      ? {
          state: "done",
          summary: `Bản ${latest.version} · ${latest.outcomes.length} mục tiêu`,
        }
      : submitted
        ? { state: "done", summary: "Không dùng mục tiêu" }
        : lessons > 0
          ? { state: "available", summary: "Chưa có (không bắt buộc)" }
          : { state: "needs", summary: "Chưa có (không bắt buộc)" }),
  };
  const lessonsStep: RawStep = {
    key: "lessons",
    title: "Bài học",
    owner: "DESIGNER",
    ...(!w
      ? { state: "needs", summary: "Chưa có giáo trình" }
      : lessons === 0 && !submitted
        ? { state: "needs", summary: "Giáo trình chưa có bài" }
        : { state: "done", summary: `${lessons} bài` }),
  };
  let mapping: RawStep;
  const mappingBase = {
    key: "mapping",
    title: "Gắn mục tiêu vào bài",
    owner: "DESIGNER",
  } as const;
  if (!hasOutcomes)
    mapping = {
      ...mappingBase,
      state: submitted || lessons > 0 ? "done" : "todo",
      summary:
        submitted || lessons > 0 ? "Không có mục tiêu để gắn" : undefined,
    };
  else if (latest.status === "APPROVED")
    mapping = {
      ...mappingBase,
      state: "done",
      summary: "Bộ mục tiêu đã duyệt",
    };
  else if (lessons === 0) mapping = { ...mappingBase, state: "todo" };
  else if (unlinked)
    mapping = {
      ...mappingBase,
      // Đã gửi duyệt: mục tiêu chưa gắn không chặn giáo trình (C28), chỉ nhắc.
      state: submitted ? "available" : "needs",
      summary: `Còn ${unlinked} mục tiêu chưa gắn bài`,
    };
  else mapping = { ...mappingBase, state: "done", summary: "Đã gắn đủ" };

  const submit: RawStep = {
    key: "submit",
    title: "Kiểm tra và gửi duyệt",
    owner: "DESIGNER",
    ...(submitted
      ? {
          state: "done",
          summary: reviewer ? `Đã gửi ${reviewer}` : "Đã gửi duyệt",
        }
      : w && lessons > 0
        ? { state: "needs", summary: "Sẵn sàng gửi duyệt" }
        : { state: "todo" }),
  };
  const teacher: RawStep = {
    key: "teacher",
    title: "Giáo viên duyệt nội dung",
    owner: "TEACHER",
    ...(w?.status === "PENDING_REVIEW" && !w.technicalReviewedAt
      ? { state: "needs", summary: reviewer ?? undefined }
      : w &&
          (w.status === "APPROVED" ||
            (w.status === "PENDING_REVIEW" && w.technicalReviewedAt))
        ? {
            state: "done",
            summary: reviewer ? `${reviewer} đã đồng ý` : "Đã đồng ý",
          }
        : { state: "todo" }),
  };
  const manager: RawStep = {
    key: "manager",
    title: "Quản lý duyệt áp dụng",
    owner: "MANAGER",
    ...(w?.status === "PENDING_REVIEW" && w.technicalReviewedAt
      ? { state: "needs" }
      : w?.status === "APPROVED"
        ? { state: "done", summary: "Đã áp dụng" }
        : { state: "todo" }),
  };

  let seen = false;
  return [outcomes, lessonsStep, mapping, submit, teacher, manager].map(
    (step) => {
      const base = {
        key: step.key,
        title: step.title,
        owner: step.owner,
        summary: step.summary,
      };
      if (step.state === "done") return { ...base, status: "done" as const };
      if (step.state === "available")
        return { ...base, status: "available" as const };
      if (step.state === "needs" && !seen) {
        seen = true;
        return step.owner === viewer
          ? { ...base, status: "current" as const }
          : {
              ...base,
              status: "waiting" as const,
              waitingFor: OWNER_LABEL[step.owner],
            };
      }
      // Bước sau còn việc: Thiết kế GT làm trước được khi giáo trình còn là bản nháp.
      const early =
        step.state === "needs" && step.owner === viewer && !submitted;
      return {
        ...base,
        status: early ? ("available" as const) : ("todo" as const),
      };
    },
  );
}
