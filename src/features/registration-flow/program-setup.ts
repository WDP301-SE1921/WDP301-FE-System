// Hàm thuần cho checklist "Chuẩn bị khóa" và thẻ "Lớp cần tạo lịch học".
// Không import alias `@/` để `node --test` chạy thẳng được (xem tests/program-setup.test.mjs).
import type { OutcomeSetStatus } from "../../types/outcomes";

export type SetupOwner = "MANAGER" | "DESIGNER" | "TEACHER";
export type SetupStatus = "done" | "current" | "blocked" | "todo";
export type SetupStepKey =
  "info" | "classes" | "outcomes" | "curriculum" | "schedule";
export type SetupActionKind =
  | "edit_program"
  | "create_class"
  | "fix_class"
  | "outcomes"
  | "curriculum"
  | "open_unit"
  | "create_schedule";

export interface SetupAction {
  kind: SetupActionKind;
  label: string;
  classId?: string;
  classIds?: string[];
  unitId?: string;
}

export interface SetupStep {
  key: SetupStepKey;
  status: SetupStatus;
  owner: SetupOwner;
  title: string;
  summary: string;
  /** Có khi bước còn việc; UI chỉ hiện nút nếu vai trò hiện tại là `owner`. */
  cta?: SetupAction;
  /** Cảnh báo nhẹ, không đổi trạng thái (vd kỳ hiện tại sắp hết). */
  warning?: string;
}

export interface SetupClass {
  id: string;
  name: string;
  isActive?: boolean;
  teacherId?: string | null;
  weeklySchedules?: { weekday: number }[];
  /** `YYYY-MM-DD` (UTC+7) của buổi cuối không bị hủy; `undefined` = BE cũ chưa trả. */
  scheduledUntil?: string | null;
}
export interface SetupUnit {
  id: string;
  status: string;
  fromDate: string;
  toDate: string;
  technicalReviewedAt?: string | null;
}
export interface SetupOutcomeSet {
  version: number;
  status: OutcomeSetStatus;
  outcomes: { lessonLinks?: unknown[] }[];
}
export interface ProgramSetupInput {
  sessionsPerWeek?: number | null;
  classes?: SetupClass[];
  units: SetupUnit[];
  outcomeSets: SetupOutcomeSet[];
  /** `YYYY-MM-DD` theo UTC+7. */
  today: string;
}

/** Thứ tự bước (Q2): mục tiêu khóa học đứng trước giáo trình. */
export const STEP_ORDER: SetupStepKey[] = [
  "info",
  "classes",
  "outcomes",
  "curriculum",
  "schedule",
];

const day = (value: string) => value.slice(0, 10);
const shift = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  );
/** Thứ trong tuần kiểu ISO: 1 = thứ Hai … 7 = Chủ nhật (khớp `weekday` của khung giờ lớp). */
const isoWeekday = (date: string) =>
  new Date(`${date}T00:00:00Z`).getUTCDay() || 7;

export interface ExcludedClass {
  id: string;
  name: string;
  reason: "NO_TEACHER" | "SCHEDULE_INCOMPLETE" | "UNKNOWN";
}

/** Lớp đang hoạt động đủ điều kiện tạo lịch (có giáo viên, đủ N khung giờ) và lớp bị loại kèm lý do. */
export function schedulableClasses(
  classes: SetupClass[] | undefined,
  sessionsPerWeek: number | null | undefined,
) {
  const eligible: SetupClass[] = [];
  const excluded: ExcludedClass[] = [];
  for (const item of (classes ?? []).filter((c) => c.isActive !== false)) {
    if (item.teacherId === undefined || item.weeklySchedules === undefined) {
      excluded.push({ id: item.id, name: item.name, reason: "UNKNOWN" });
    } else if (!item.teacherId) {
      excluded.push({ id: item.id, name: item.name, reason: "NO_TEACHER" });
    } else if (
      sessionsPerWeek == null ||
      item.weeklySchedules.length !== sessionsPerWeek
    ) {
      excluded.push({
        id: item.id,
        name: item.name,
        reason: "SCHEDULE_INCOMPLETE",
      });
    } else eligible.push(item);
  }
  return { eligible, excluded };
}

/** Ngày học cuối cùng (≤ `toDate`) của lớp theo khung giờ hàng tuần; null nếu không có khung giờ. */
export function lastSlotDate(
  weekdays: number[],
  toDate: string,
): string | null {
  if (!weekdays.length) return null;
  for (let i = 0; i < 7; i++) {
    const date = shift(day(toDate), -i);
    if (weekdays.includes(isoWeekday(date))) return date;
  }
  return null;
}

/** Ngày bắt đầu tạo lịch: không lùi về quá khứ, không trùng buổi đã có. */
export function scheduleStartDate(
  unitFromDate: string,
  today: string,
  scheduledUntil?: string | null,
): string {
  let start = day(unitFromDate);
  const tomorrow = shift(today, 1);
  if (tomorrow > start) start = tomorrow;
  if (scheduledUntil) {
    const after = shift(day(scheduledUntil), 1);
    if (after > start) start = after;
  }
  return start;
}

export interface ScheduleRangePlan {
  unitId: string;
  title: string;
  fromDate: string;
  toDate: string;
}

/**
 * Giáo trình và khoảng ngày để tạo lịch cho một lớp (wizard tạo lớp, Luồng 2): giáo trình đã duyệt
 * sớm nhất còn ngày học từ ngày mai (và sau buổi cuối đã có) tới hết kỳ của giáo trình đó.
 * null khi khóa chưa có giáo trình đã duyệt còn hiệu lực.
 */
export function nextScheduleRange(
  units: {
    id: string;
    title: string;
    status: string;
    fromDate: string;
    toDate: string;
  }[],
  today: string,
  scheduledUntil?: string | null,
): ScheduleRangePlan | null {
  const approved = units
    .filter((unit) => unit.status === "APPROVED")
    .sort((a, b) => day(a.fromDate).localeCompare(day(b.fromDate)));
  for (const unit of approved) {
    const fromDate = scheduleStartDate(unit.fromDate, today, scheduledUntil);
    if (fromDate <= day(unit.toDate))
      return {
        unitId: unit.id,
        title: unit.title,
        fromDate,
        toDate: day(unit.toDate),
      };
  }
  return null;
}

/**
 * Trong các lớp đủ điều kiện: lớp chưa có buổi tới hết kỳ (`needs`) và lớp chưa biết
 * (`unknown`, BE cũ không trả `scheduledUntil`). So với ngày của khung giờ cuối trong kỳ,
 * không so thẳng với `toDate`.
 */
export function classesNeedingSchedule(
  eligible: SetupClass[],
  unitToDate: string,
) {
  const needs: SetupClass[] = [];
  const unknown: SetupClass[] = [];
  for (const item of eligible) {
    if (item.scheduledUntil === undefined) {
      unknown.push(item);
      continue;
    }
    const last = lastSlotDate(
      (item.weeklySchedules ?? []).map((w) => w.weekday),
      unitToDate,
    );
    if (last && (!item.scheduledUntil || item.scheduledUntil < last))
      needs.push(item);
  }
  return { needs, unknown };
}

/** Gom lớp theo ngày bắt đầu tạo lịch; nhóm có ngày sớm nhất đứng đầu. */
export function groupClassesByStart<
  T extends { id: string; name: string; scheduledUntil?: string | null },
>(
  classes: T[],
  unitFromDate: string,
  today: string,
): { startDate: string; classes: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of classes) {
    const start = scheduleStartDate(unitFromDate, today, item.scheduledUntil);
    groups.set(start, [...(groups.get(start) ?? []), item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startDate, list]) => ({ startDate, classes: list }));
}

/** Câu liệt kê lớp bị loại, mỗi lớp kèm lý do đúng. */
export function describeExcluded(excluded: ExcludedClass[]): string {
  const reason = {
    NO_TEACHER: "chưa có giáo viên",
    SCHEDULE_INCOMPLETE: "chưa đủ khung giờ",
    UNKNOWN: "chưa kiểm tra được",
  } as const;
  return excluded.map((c) => `${c.name} (${reason[c.reason]})`).join(", ");
}

function pluralClasses(n: number, what: string) {
  return `${n} lớp ${what}`;
}

export function programSetupSteps(input: ProgramSetupInput): SetupStep[] {
  const { sessionsPerWeek, classes, units, outcomeSets, today } = input;
  const active = (classes ?? []).filter((c) => c.isActive !== false);
  const approved = units.filter((u) => u.status === "APPROVED");
  const current = approved.find(
    (u) => day(u.fromDate) <= today && day(u.toDate) >= today,
  );
  const next = approved
    .filter((u) => day(u.fromDate) > today)
    .sort((a, b) => day(a.fromDate).localeCompare(day(b.fromDate)))[0];
  const appliedUnit = current ?? next;

  const info: SetupStep =
    sessionsPerWeek != null
      ? {
          key: "info",
          status: "done",
          owner: "MANAGER",
          title: "Thông tin khóa",
          summary: `${sessionsPerWeek} buổi mỗi tuần`,
        }
      : {
          key: "info",
          status: "current",
          owner: "MANAGER",
          title: "Thông tin khóa",
          summary: "Chưa có số buổi học mỗi tuần",
          cta: { kind: "edit_program", label: "Cập nhật số buổi mỗi tuần" },
        };

  const split = schedulableClasses(classes, sessionsPerWeek);
  const noTeacher = split.excluded.filter((c) => c.reason === "NO_TEACHER");
  const noSlots = split.excluded.filter(
    (c) => c.reason === "SCHEDULE_INCOMPLETE",
  );
  let classesStep: SetupStep;
  if (!active.length) {
    classesStep = {
      key: "classes",
      status: info.status === "done" ? "current" : "blocked",
      owner: "MANAGER",
      title: "Lớp & giáo viên",
      summary: "Chưa có lớp nào",
      cta:
        info.status === "done"
          ? { kind: "create_class", label: "Tạo lớp" }
          : undefined,
    };
  } else if (noTeacher.length || noSlots.length) {
    const parts = [
      noTeacher.length
        ? pluralClasses(noTeacher.length, "chưa có giáo viên")
        : "",
      noSlots.length ? pluralClasses(noSlots.length, "chưa đủ khung giờ") : "",
    ].filter(Boolean);
    const first = noTeacher[0] ?? noSlots[0];
    classesStep = {
      key: "classes",
      status: "current",
      owner: "MANAGER",
      title: "Lớp & giáo viên",
      summary: parts.join(", "),
      cta: {
        kind: "fix_class",
        label: `Sửa lớp ${first.name}`,
        classId: first.id,
      },
    };
  } else {
    classesStep = {
      key: "classes",
      status: "done",
      owner: "MANAGER",
      title: "Lớp & giáo viên",
      summary: `${active.length} lớp đang hoạt động`,
    };
  }

  const latest = [...outcomeSets].sort((a, b) => b.version - a.version)[0];
  const unlinkedCount = latest
    ? latest.outcomes.filter((o) => !o.lessonLinks?.length).length
    : 0;
  // C28: bộ mục tiêu được duyệt cùng giáo trình nên bước này "xong" khi đã có bộ để đi cùng.
  // Từ BE PR #12 bộ chỉ có DRAFT và APPROVED: giáo viên duyệt là xong, Quản lý không duyệt bộ.
  let outcomes: SetupStep;
  if (!latest) {
    outcomes = {
      key: "outcomes",
      status: "current",
      owner: "DESIGNER",
      title: "Mục tiêu khóa học",
      summary: "Chưa có mục tiêu khóa học",
      cta: { kind: "outcomes", label: "Soạn mục tiêu" },
    };
  } else if (latest.status === "APPROVED") {
    outcomes = {
      key: "outcomes",
      status: "done",
      owner: "TEACHER",
      title: "Mục tiêu khóa học",
      summary: `Bản ${latest.version} đã duyệt`,
    };
  } else if (appliedUnit && latest.outcomes.length && !unlinkedCount) {
    // Giáo trình đã áp dụng mà bộ còn nháp (vd giáo viên bỏ qua lúc duyệt): phụ huynh chưa thấy mục tiêu.
    outcomes = {
      key: "outcomes",
      status: "current",
      owner: "TEACHER",
      title: "Mục tiêu khóa học",
      summary: `Bản ${latest.version} chờ giáo viên duyệt`,
      cta: { kind: "outcomes", label: "Xem mục tiêu" },
    };
  } else if (latest.outcomes.length) {
    outcomes = {
      key: "outcomes",
      status: "done",
      owner: "DESIGNER",
      title: "Mục tiêu khóa học",
      summary: `Bản ${latest.version} đã soạn, duyệt cùng giáo trình`,
    };
  } else {
    outcomes = {
      key: "outcomes",
      status: "current",
      owner: "DESIGNER",
      title: "Mục tiêu khóa học",
      summary: `Bản ${latest.version} đang soạn, chưa có mục tiêu`,
      cta: { kind: "outcomes", label: "Tiếp tục soạn" },
    };
  }
  // Ghi chú ở bước Giáo trình khi bộ đi cùng chưa duyệt được.
  const outcomeNote =
    latest && latest.status === "DRAFT" && unlinkedCount
      ? `Mục tiêu khóa học: còn ${unlinkedCount} mục tiêu chưa gắn bài`
      : undefined;

  let curriculum: SetupStep;
  if (appliedUnit) {
    const left = current ? daysBetween(today, day(current.toDate)) : null;
    const warning =
      current && !next && left !== null && left < 14
        ? `Kỳ hiện tại còn ${left} ngày, chưa có giáo trình cho kỳ tới`
        : undefined;
    curriculum = {
      key: "curriculum",
      status: "done",
      owner: "MANAGER",
      title: "Giáo trình",
      summary: current
        ? "Giáo trình kỳ hiện tại đã áp dụng"
        : "Giáo trình kỳ tới đã áp dụng",
      warning: warning ?? outcomeNote,
      cta: warning
        ? { kind: "curriculum", label: "Soạn giáo trình kỳ tới" }
        : undefined,
    };
    if (warning) curriculum.owner = "DESIGNER";
  } else {
    const waiting = units.find((u) => u.status === "PENDING_REVIEW");
    if (waiting && !waiting.technicalReviewedAt) {
      curriculum = {
        key: "curriculum",
        status: "current",
        owner: "TEACHER",
        title: "Giáo trình",
        summary: "Chờ giáo viên duyệt nội dung",
        warning: outcomeNote,
        cta: { kind: "open_unit", label: "Xem giáo trình", unitId: waiting.id },
      };
    } else if (waiting) {
      curriculum = {
        key: "curriculum",
        status: "current",
        owner: "MANAGER",
        title: "Giáo trình",
        summary: "Chờ Quản lý duyệt áp dụng",
        warning: outcomeNote,
        cta: { kind: "open_unit", label: "Duyệt áp dụng", unitId: waiting.id },
      };
    } else {
      const draft = units.find((u) => u.status === "DRAFT");
      curriculum = {
        key: "curriculum",
        status: "current",
        owner: "DESIGNER",
        title: "Giáo trình",
        summary: draft ? "Giáo trình đang soạn" : "Chưa có giáo trình",
        warning: outcomeNote,
        cta: draft
          ? { kind: "open_unit", label: "Mở giáo trình", unitId: draft.id }
          : { kind: "curriculum", label: "Soạn giáo trình" },
      };
    }
  }

  const base = {
    key: "schedule",
    owner: "MANAGER",
    title: "Lịch học",
  } as const;
  let schedule: SetupStep;
  if (!appliedUnit || !active.length) {
    schedule = {
      ...base,
      status: "blocked",
      summary: !active.length
        ? "Chưa có lớp để tạo lịch học"
        : "Chưa có giáo trình áp dụng",
    };
  } else if (!split.eligible.length) {
    schedule = {
      ...base,
      status: "blocked",
      summary: "Chưa có lớp đủ điều kiện. Kiểm tra bước Lớp & giáo viên.",
    };
  } else {
    const { needs, unknown } = classesNeedingSchedule(
      split.eligible,
      appliedUnit.toDate,
    );
    if (needs.length) {
      schedule = {
        ...base,
        status: "current",
        summary: `${needs.length} lớp chưa có buổi học tới hết kỳ`,
        cta: {
          kind: "create_schedule",
          label: `Tạo lịch học cho ${needs.length} lớp`,
          classIds: needs.map((c) => c.id),
          unitId: appliedUnit.id,
        },
      };
    } else if (unknown.length) {
      schedule = {
        ...base,
        status: "todo",
        summary: "Chưa biết lịch học đã tạo đến ngày nào",
      };
    } else {
      schedule = {
        ...base,
        status: "done",
        summary: "Mọi lớp đã có buổi học tới hết kỳ",
      };
    }
  }

  const byKey: Record<SetupStepKey, SetupStep> = {
    info,
    classes: classesStep,
    outcomes,
    curriculum,
    schedule,
  };
  const steps = STEP_ORDER.map((key) => byKey[key]);
  // Bước đầu tiên chưa xong là "current"; các bước chưa xong còn lại là "todo" (trừ "blocked").
  let seen = false;
  return steps.map((step) => {
    if (step.status === "done" || step.status === "blocked") return step;
    if (!seen && step.status === "current") {
      seen = true;
      return step;
    }
    return step.status === "current"
      ? { ...step, status: "todo" as const }
      : step;
  });
}

export interface RunningOutClass {
  id: string;
  name: string;
  programId: string;
  /** null: lớp chưa có buổi học nào (lớp mới tạo sau khi giáo trình đã được duyệt áp dụng). */
  scheduledUntil: string | null;
  daysLeft: number;
  /** Giáo trình đã duyệt sớm nhất còn phủ phần sau buổi cuối: màn tạo lịch chọn sẵn bản này. */
  unitId: string;
}

/**
 * Lớp đang hoạt động cần Quản lý bấm "Tạo lịch học": chưa có buổi nào (và đã có lịch tuần), hoặc
 * buổi cuối cách hôm nay dưới `days` ngày; kèm giáo trình đã duyệt còn phủ phần sau đó (nếu không
 * thì tạo lịch cũng vô ích). Lớp chưa có buổi đứng đầu: Nhân viên ghi danh được vào lớp đó mà phụ
 * huynh chưa thấy buổi nào trên ứng dụng. Lớp chưa trả `scheduledUntil` (BE cũ) bị bỏ qua.
 */
export function classesRunningOut(input: {
  classes: {
    id: string;
    name: string;
    programId: string;
    isActive?: boolean;
    scheduledUntil?: string | null;
    weeklySchedules?: unknown[];
  }[];
  units: {
    id: string;
    programId: string;
    status: string;
    fromDate: string;
    toDate: string;
  }[];
  today: string;
  days?: number;
}): RunningOutClass[] {
  const limit = input.days ?? 14;
  const out: RunningOutClass[] = [];
  for (const item of input.classes) {
    if (item.isActive === false || item.scheduledUntil === undefined) continue;
    if (item.scheduledUntil === null && item.weeklySchedules?.length === 0)
      continue;
    const until =
      item.scheduledUntil === null ? null : day(item.scheduledUntil);
    const daysLeft = until === null ? 0 : daysBetween(input.today, until);
    if (daysLeft >= limit) continue;
    // Chưa có buổi nào thì giáo trình chỉ cần còn kỳ sau hôm nay.
    const after = until ?? input.today;
    const covering = input.units
      .filter(
        (u) =>
          u.programId === item.programId &&
          u.status === "APPROVED" &&
          day(u.toDate) > after,
      )
      .sort((a, b) => day(a.fromDate).localeCompare(day(b.fromDate)))[0];
    if (covering)
      out.push({
        id: item.id,
        name: item.name,
        programId: item.programId,
        scheduledUntil: until,
        daysLeft: Math.max(daysLeft, 0),
        unitId: covering.id,
      });
  }
  return out.sort((a, b) =>
    (a.scheduledUntil ?? "").localeCompare(b.scheduledUntil ?? ""),
  );
}
