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
/** Bài của giáo trình, đủ để biết bài đã gắn mục tiêu chưa (`outcomeLinks` do BE trả trong chi tiết giáo trình). */
export interface ContentLesson {
  id: string;
  kind: string;
  outcomeLinks?: unknown[];
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
/** Các bài thường (không tính bài kiểm tra tháng) chưa gắn mục tiêu nào; BE chặn gửi duyệt khi còn bài này. */
export function lessonsMissingOutcome<T extends ContentLesson>(lessons: T[]): T[] {
  return lessons.filter(
    (lesson) => lesson.kind === "LESSON" && !lesson.outcomeLinks?.length,
  );
}
const day = (value: string) => value.slice(0, 10);
const latestVersion = <T extends { version: number }>(items: T[]) =>
  [...items].sort((a, b) => b.version - a.version)[0];

/**
 * Giáo trình đang chuẩn bị của khóa: bản chờ duyệt, rồi bản nháp, rồi bản đã duyệt đang áp dụng
 * (hoặc áp dụng sớm nhất sắp tới), cuối cùng bản đã duyệt mới nhất. Bản lưu trữ bị bỏ qua.
 */
export function pickWorkingUnit<T extends ContentUnit>(units: T[]): T | null {
  const pending = latestVersion(
    units.filter((u) => u.status === "PENDING_REVIEW"),
  );
  if (pending) return pending;
  const draft = latestVersion(units.filter((u) => u.status === "DRAFT"));
  if (draft) return draft;
  // Giáo trình không còn kỳ (đợt F): bản đã duyệt mới nhất là bản đang áp dụng.
  const approved = units
    .filter((u) => u.status === "APPROVED")
    .sort(
      (a, b) =>
        day(b.fromDate).localeCompare(day(a.fromDate)) || b.version - a.version,
    );
  return approved[0] ?? null;
}

/**
 * Giáo trình đang hiển thị trên trang một trang: bản có id `unitId` (mọi trạng thái, kể cả lưu trữ),
 * không có hoặc id lạ thì rơi về bản đang soạn (`working`).
 */
export function pickViewedUnit<T extends ContentUnit>(
  units: T[],
  unitId: string | null | undefined,
): { viewed: T | null; working: T | null } {
  const working = pickWorkingUnit(units);
  const chosen = unitId ? units.find((u) => u.id === unitId) : undefined;
  return { viewed: chosen ?? working, working };
}

/** Bước mở sẵn khi vào một giáo trình theo trạng thái của nó. */
export function unitStepKey(
  unit: Pick<ContentUnit, "status" | "technicalReviewedAt">,
): ContentStepKey {
  if (unit.status === "PENDING_REVIEW")
    return unit.technicalReviewedAt ? "manager" : "teacher";
  if (unit.status === "APPROVED") return "manager";
  return "lessons";
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
 * xem, không thì "Chờ <vai trò>". Mục tiêu BẮT BUỘC (W12, đảo Q2): chưa có mục tiêu thì chưa tạo được
 * giáo trình mới; mỗi bài phải gắn ≥1 mục tiêu thì mới tới bước gửi duyệt. Giáo trình cũ đã gửi duyệt
 * trước quy định này không bị đòi lại.
 */
export function contentSetupSteps(input: {
  working: ContentUnit | null;
  /** Số bài của giáo trình đang chuẩn bị (đọc từ chi tiết giáo trình). */
  lessonCount: number;
  /** Bài của giáo trình đang chuẩn bị, kèm liên kết mục tiêu; thiếu thì coi như chưa biết bài nào thiếu. */
  lessonRows?: ContentLesson[];
  outcomeSets: ContentOutcomeSet[];
  viewer: ContentOwner | null;
}): ContentStep[] {
  const { working: w, lessonCount: lessons, viewer } = input;
  // BE chỉ cần một bộ (nháp hoặc đã duyệt) có ≥1 mục tiêu (OUTCOMES_REQUIRED).
  const latest = latestVersion(
    input.outcomeSets.filter((set) => set.outcomes.length > 0),
  );
  const hasOutcomes = !!latest;
  const missing = lessonsMissingOutcome(input.lessonRows ?? []).length;
  const submitted =
    !!w &&
    (w.status === "PENDING_REVIEW" ||
      w.status === "APPROVED" ||
      w.status === "ARCHIVED");
  // Bản đã duyệt hoặc lưu trữ từ trước quy định mục tiêu bắt buộc: không đòi lại.
  const legacy = w?.status === "APPROVED" || w?.status === "ARCHIVED";
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
      : legacy
        ? { state: "done", summary: "Giáo trình cũ chưa có mục tiêu" }
        : { state: "needs", summary: "Chưa có mục tiêu (bắt buộc)" }),
  };
  const lessonsStep: RawStep = {
    key: "lessons",
    title: "Bài học",
    owner: "DESIGNER",
    ...(!w
      ? hasOutcomes
        ? { state: "needs", summary: "Chưa có giáo trình" }
        : // Mở được để thấy lý do, nhưng nút tạo giáo trình bị khóa tới khi có mục tiêu.
          { state: "available", summary: "Tạo mục tiêu trước" }
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
  if (w?.status === "ARCHIVED")
    mapping = { ...mappingBase, state: "done", summary: "Bản đã lưu trữ" };
  else if (!hasOutcomes)
    mapping = {
      ...mappingBase,
      state: legacy ? "done" : "todo",
      summary: legacy ? "Giáo trình cũ chưa có mục tiêu" : "Tạo mục tiêu trước",
    };
  else if (lessons === 0) mapping = { ...mappingBase, state: "todo" };
  else if (missing)
    mapping = {
      ...mappingBase,
      // Đã duyệt (bản cũ): chỉ nhắc. Chờ duyệt: BE chặn giáo viên và Quản lý duyệt tới khi mọi bài đã gắn.
      state: legacy ? "available" : "needs",
      summary:
        w?.status === "PENDING_REVIEW"
          ? `Còn ${missing} bài chưa gắn mục tiêu: chưa duyệt được`
          : `Còn ${missing} bài chưa gắn mục tiêu`,
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
      : w && lessons > 0 && hasOutcomes && !missing
        ? { state: "needs", summary: "Sẵn sàng gửi duyệt" }
        : w && lessons > 0
          ? {
              state: "todo",
              summary: hasOutcomes
                ? "Gắn mục tiêu vào mọi bài trước"
                : "Tạo mục tiêu trước",
            }
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
            w.status === "ARCHIVED" ||
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
        : w?.status === "ARCHIVED"
          ? { state: "done", summary: "Đã lưu trữ" }
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
