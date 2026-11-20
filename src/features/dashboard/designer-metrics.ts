// Số liệu dashboard Thiết kế giáo trình (canvas 19/11/2026). Hàm thuần, chỉ import type và hàm
// thuần của content-setup để `node --test` nạp thẳng được (tests/designer-dashboard.test.cjs).
import type { CurriculumLesson, CurriculumUnit } from "@/types/curriculum";
import type {
  CurriculumFeedbackRecord,
  LessonRecord,
} from "@/types/academic-workflows";
import type { RegistrationProgram } from "@/types/backend";
import {
  contentSetupSteps,
  lessonsMissingOutcome,
  type ContentOutcomeSet,
  type ContentStepKey,
} from "@/features/curriculum/content-setup";

/** Chờ người duyệt quá số ngày này thì tô cam. */
export const WAIT_WARN_DAYS = 3;
/** Phản hồi mở quá số ngày này thì tô cam. */
export const FEEDBACK_WARN_DAYS = 5;
export const OPEN_FEEDBACK = ["OPEN", "IN_PROGRESS"] as const;

const DAY_MS = 86_400_000;

/** Số ngày trọn từ `iso` tới `now`; không có mốc thì null. */
export function daysSince(iso: string | null | undefined, now: number) {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return null;
  return Math.max(0, Math.floor((now - at) / DAY_MS));
}

export const ageText = (days: number) => (days === 0 ? "hôm nay" : `${days} ngày`);

export type CourseRowStatus = "returned" | "draft" | "pending" | "none";
export type StepTone = "done" | "active" | "warn" | "todo";

export interface CourseRow {
  key: string;
  programId: string;
  unitId: string | null;
  course: string;
  version: number | null;
  status: CourseRowStatus;
  /** Việc tiếp theo là của Thiết kế GT ("me") hay đang chờ giáo viên/Quản lý ("others"). */
  group: "me" | "others";
  steps: { key: ContentStepKey; title: string; tone: StepTone }[];
  /** Bước đang làm/đang chờ, đếm từ 1. */
  stepIndex: number;
  stepKey: ContentStepKey;
  stepTitle: string;
  /** Bài thường (không tính kiểm tra tháng); null khi chưa có giáo trình. */
  lessons: number | null;
  /** Bài thường chưa gắn mục tiêu; null khi chưa có giáo trình. */
  unmapped: number | null;
  /** Còn bài chưa gắn mục tiêu ở bản đã gửi duyệt hoặc bị trả lại: chặn duyệt. */
  unmappedWarn: boolean;
  /** "Bạn", tên giáo viên duyệt, hoặc "Quản lý". */
  waitingFor: string;
  ageDays: number | null;
  ageLabel: string | null;
  ageWarn: boolean;
  note: { by: string; at: string | null; text: string } | null;
}

export interface DesignerRowsInput {
  programs: Pick<RegistrationProgram, "id" | "name" | "isActive">[];
  units: CurriculumUnit[];
  /** Bài của từng giáo trình đang làm, theo unitId (chi tiết giáo trình). */
  lessonsByUnit: Map<string, CurriculumLesson[]>;
  /** Bộ mục tiêu theo programId. */
  setsByProgram: Map<string, ContentOutcomeSet[]>;
  now: number;
}

const isReturned = (unit: CurriculumUnit) =>
  unit.status === "DRAFT" && !!(unit.reviewNote || unit.technicalReviewNote);

/** Giáo trình đang làm: mọi bản nháp và chờ duyệt (không chỉ bản số lớn nhất mỗi khóa). */
export const inProgressUnits = (units: CurriculumUnit[]) =>
  units.filter(
    (unit) => unit.status === "DRAFT" || unit.status === "PENDING_REVIEW",
  );

/** Tên khóa: lấy từ danh sách khóa, rồi từ giáo trình, cuối cùng ghép môn + khối. */
export function programNames(
  programs: Pick<RegistrationProgram, "id" | "name">[],
  units: Pick<CurriculumUnit, "programId" | "program" | "track">[],
) {
  const names = new Map<string, string>();
  for (const unit of units)
    names.set(
      unit.programId,
      unit.program?.name ?? `${unit.track.subject} ${unit.track.grade}`,
    );
  for (const program of programs) names.set(program.id, program.name);
  return names;
}

const STATUS_ORDER: Record<CourseRowStatus, number> = {
  returned: 0,
  draft: 1,
  none: 2,
  pending: 3,
};

export function designerRows(input: DesignerRowsInput) {
  const { programs, units, lessonsByUnit, setsByProgram, now } = input;
  const names = programNames(programs, units);
  const rows: CourseRow[] = [];

  for (const unit of inProgressUnits(units)) {
    const lessonRows = lessonsByUnit.get(unit.id);
    const lessonCount = lessonRows
      ? lessonRows.filter((lesson) => lesson.kind === "LESSON").length
      : (unit._count?.lessons ?? 0);
    const steps = contentSetupSteps({
      working: unit,
      lessonCount,
      lessonRows,
      outcomeSets: setsByProgram.get(unit.programId) ?? [],
      viewer: "DESIGNER",
    });
    const returned = isReturned(unit);
    const activeIndex = steps.findIndex(
      (step) => step.status === "current" || step.status === "waiting",
    );
    const index = activeIndex === -1 ? steps.length - 1 : activeIndex;
    const active = steps[index];
    const mine = active.status === "current";
    const reviewer = unit.reviewerTeacher?.displayName ?? "Giáo viên";
    const waitingFor = mine
      ? "Bạn"
      : active.owner === "TEACHER"
        ? reviewer
        : "Quản lý";

    // Mốc tuổi: bị trả lại tính từ lúc trả; chờ giáo viên từ lúc gửi; chờ Quản lý từ lúc giáo viên đồng ý.
    const since = returned
      ? (unit.reviewedAt ?? null)
      : unit.status === "PENDING_REVIEW"
        ? unit.technicalReviewedAt ?? unit.submittedAt ?? null
        : null;
    const ageDays = daysSince(since, now);
    const ageLabel =
      ageDays === null
        ? null
        : returned
          ? `trả lại ${ageText(ageDays)}`
          : ageText(ageDays);

    const unmapped = lessonRows ? lessonsMissingOutcome(lessonRows).length : null;
    const noteText = unit.reviewNote || unit.technicalReviewNote;
    rows.push({
      key: unit.id,
      programId: unit.programId,
      unitId: unit.id,
      course: names.get(unit.programId) ?? unit.title,
      version: unit.version,
      status: returned
        ? "returned"
        : unit.status === "PENDING_REVIEW"
          ? "pending"
          : "draft",
      group: mine ? "me" : "others",
      steps: steps.map((step, i) => ({
        key: step.key,
        title: step.title,
        tone:
          step.status === "done"
            ? "done"
            : i === index
              ? returned
                ? "warn"
                : "active"
              : "todo",
      })),
      stepIndex: index + 1,
      stepKey: active.key,
      stepTitle: active.title,
      lessons: lessonCount,
      unmapped,
      unmappedWarn:
        !!unmapped && (unit.status === "PENDING_REVIEW" || returned),
      waitingFor,
      ageDays,
      ageLabel,
      ageWarn:
        !returned &&
        !mine &&
        ageDays !== null &&
        ageDays > WAIT_WARN_DAYS,
      note:
        returned && noteText
          ? {
              by: unit.reviewNote ? "Quản lý" : reviewer,
              at: unit.reviewedAt ?? null,
              text: noteText,
            }
          : null,
    });
  }

  // Khóa đang mở chưa có giáo trình nào (bỏ qua bản đã lưu trữ).
  const active = programs.filter((program) => program.isActive !== false);
  for (const program of active) {
    const own = units.filter(
      (unit) => unit.programId === program.id && unit.status !== "ARCHIVED",
    );
    if (own.length) continue;
    const steps = contentSetupSteps({
      working: null,
      lessonCount: 0,
      outcomeSets: setsByProgram.get(program.id) ?? [],
      viewer: "DESIGNER",
    });
    const activeIndex = steps.findIndex(
      (step) => step.status === "current" || step.status === "waiting",
    );
    const index = activeIndex === -1 ? 0 : activeIndex;
    rows.push({
      key: `program-${program.id}`,
      programId: program.id,
      unitId: null,
      course: program.name,
      version: null,
      status: "none",
      group: "me",
      steps: steps.map((step, i) => ({
        key: step.key,
        title: step.title,
        tone: step.status === "done" ? "done" : i === index ? "active" : "todo",
      })),
      stepIndex: index + 1,
      stepKey: steps[index].key,
      stepTitle: steps[index].title,
      lessons: null,
      unmapped: null,
      unmappedWarn: false,
      waitingFor: "Bạn",
      ageDays: null,
      ageLabel: null,
      ageWarn: false,
      note: null,
    });
  }

  rows.sort(
    (a, b) =>
      (a.group === b.group ? 0 : a.group === "me" ? -1 : 1) ||
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (b.ageDays ?? -1) - (a.ageDays ?? -1) ||
      a.course.localeCompare(b.course, "vi"),
  );

  const busyPrograms = new Set(rows.map((row) => row.programId));
  const stable = active.filter(
    (program) =>
      !busyPrograms.has(program.id) &&
      units.some(
        (unit) => unit.programId === program.id && unit.status === "APPROVED",
      ),
  ).length;

  return { rows, activeCourses: active.length, stableCourses: stable };
}

const oldest = (values: (number | null)[]) => {
  const known = values.filter((value): value is number => value !== null);
  return known.length ? Math.max(...known) : null;
};

/** Số trên 4 thẻ, tính từ chính các dòng của bảng để hai nơi luôn khớp. */
export function designerKpis(
  rows: CourseRow[],
  feedback: CurriculumFeedbackRecord[],
  now: number,
) {
  const returned = rows.filter((row) => row.status === "returned");
  const drafting = rows.filter((row) => row.status === "draft");
  const pending = rows.filter((row) => row.status === "pending");
  const open = feedback.filter((item) =>
    (OPEN_FEEDBACK as readonly string[]).includes(item.status),
  );
  const pendingOldest = oldest(pending.map((row) => row.ageDays));
  const feedbackOldest = oldest(open.map((item) => daysSince(item.createdAt, now)));
  return {
    returned: {
      count: returned.length,
      courses: returned.map((row) => row.course),
      oldestDays: oldest(returned.map((row) => row.ageDays)),
    },
    drafting: {
      count: drafting.length,
      courses: drafting.map((row) => row.course),
    },
    pending: {
      count: pending.length,
      // Giáo viên duyệt nội dung trước, rồi Quản lý duyệt áp dụng.
      atTeacher: pending.filter((row) => row.stepKey === "teacher").length,
      atManager: pending.filter((row) => row.stepKey === "manager").length,
      atDesigner: pending.filter((row) => row.group === "me").length,
      oldestDays: pendingOldest,
      oldestWarn: pendingOldest !== null && pendingOldest > WAIT_WARN_DAYS,
    },
    feedback: {
      count: open.length,
      fresh: open.filter((item) => item.status === "OPEN").length,
      inProgress: open.filter((item) => item.status === "IN_PROGRESS").length,
      oldestDays: feedbackOldest,
      oldestWarn: feedbackOldest !== null && feedbackOldest > FEEDBACK_WARN_DAYS,
    },
  };
}

export interface FeedbackRow {
  id: string;
  status: CurriculumFeedbackRecord["status"];
  course: string | null;
  lesson: string;
  text: string;
  ageDays: number | null;
  ageWarn: boolean;
}

/** Phản hồi đang mở, cũ nhất trước, kèm khóa › bài. */
export function openFeedbackRows(
  feedback: CurriculumFeedbackRecord[],
  lessons: Pick<LessonRecord, "id" | "programId" | "title" | "sequence">[],
  names: Map<string, string>,
  now: number,
  limit = 5,
): FeedbackRow[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return feedback
    .filter((item) =>
      (OPEN_FEEDBACK as readonly string[]).includes(item.status),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit)
    .map((item) => {
      const lesson = byId.get(item.lessonId);
      const ageDays = daysSince(item.createdAt, now);
      return {
        id: item.id,
        status: item.status,
        course: lesson ? (names.get(lesson.programId) ?? null) : null,
        lesson: lesson ? `Bài ${lesson.sequence} · ${lesson.title}` : "Bài không còn",
        text: item.content,
        ageDays,
        ageWarn: ageDays !== null && ageDays > FEEDBACK_WARN_DAYS,
      };
    });
}
