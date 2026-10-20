import type { WebRole } from "@/constants/roles";
import type { RegistrationClass } from "@/types/backend";
import type { CurriculumLesson, CurriculumUnit } from "@/types/curriculum";

export function canCopyCurriculum(unit: CurriculumUnit) {
  return unit.status === "APPROVED" || (unit.status === "ARCHIVED" && !!unit.approvedAt);
}

/** Approval and being effective today are separate states. */
export function curriculumEffectiveLabel(unit: CurriculumUnit, today: string) {
  if (unit.status !== "APPROVED") return null;
  if (unit.fromDate.slice(0, 10) > today) return "Chờ ngày áp dụng";
  if (unit.toDate.slice(0, 10) < today) return "Đã hết hiệu lực";
  return "Đang áp dụng";
}

export function curriculumNeedsAction(
  unit: CurriculumUnit,
  role: WebRole | null,
  userId?: string,
) {
  if (role === "curriculum_designer")
    return unit.status === "DRAFT" && unit.designerId === userId;
  if (role === "teacher")
    return (
      unit.status === "PENDING_REVIEW" &&
      !unit.technicalReviewedAt &&
      unit.reviewerTeacherId === userId
    );
  return (
    role === "center_manager" &&
    unit.status === "PENDING_REVIEW" &&
    !!unit.technicalReviewedAt
  );
}

export function curriculumNextStep(unit: CurriculumUnit) {
  if (unit.status === "DRAFT")
    return unit.reviewNote || unit.technicalReviewNote
      ? "Người thiết kế sửa theo nhận xét, gửi lại thẩm định"
      : "Người thiết kế soạn bài, kiểm tra và gửi thẩm định";
  if (unit.status === "PENDING_REVIEW")
    return unit.technicalReviewedAt
      ? "Quản lý xác nhận áp dụng"
      : `${unit.reviewerTeacher?.displayName || unit.reviewerTeacher?.email || "Giáo viên được phân công"} thẩm định chuyên môn`;
  return unit.status === "ARCHIVED"
    ? "Đã lưu trữ"
    : "Có thể chuẩn bị giáo trình kỳ tiếp theo";
}

export function curriculumLabel(unit: CurriculumUnit) {
  const program =
    unit.program?.name ?? `${unit.track.subject} ${unit.track.grade}`;
  return `Giáo trình ${program} · ${unit.title}`;
}

export function groupCurricula(units: CurriculumUnit[]) {
  const groups = new Map<string, { name: string; units: CurriculumUnit[] }>();
  for (const unit of units) {
    const group = groups.get(unit.programId) ?? {
      name: unit.program?.name ?? `${unit.track.subject} ${unit.track.grade}`,
      units: [],
    };
    group.units.push(unit);
    groups.set(unit.programId, group);
  }
  return [...groups.entries()]
    .map(([id, group]) => ({
      id,
      ...group,
      units: [...group.units].sort(
        (a, b) =>
          b.fromDate.localeCompare(a.fromDate) ||
          b.version - a.version ||
          a.id.localeCompare(b.id),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

/** basedOnId is an existing Prisma scalar in the BE response, never a new request field. */
export function previousCurriculum(
  unit: CurriculumUnit,
  candidates: CurriculumUnit[],
) {
  const basedOnId = unit.basedOnId;
  if (basedOnId && basedOnId !== unit.id)
    return { id: basedOnId, inferred: false };
  const previous = candidates
    .filter(
      (candidate) =>
        candidate.id !== unit.id &&
        candidate.programId === unit.programId &&
        ["APPROVED", "ARCHIVED"].includes(candidate.status) &&
        candidate.toDate.slice(0, 10) < unit.fromDate.slice(0, 10),
    )
    .sort(
      (a, b) =>
        b.toDate.localeCompare(a.toDate) ||
        b.version - a.version ||
        a.id.localeCompare(b.id),
    )[0];
  return previous ? { id: previous.id, inferred: true } : null;
}

export type LessonChange =
  "new" | "modified" | "unchanged" | "removed" | "unavailable";
export const LESSON_CHANGE_LABELS: Record<LessonChange, string> = {
  new: "Mới",
  modified: "Đã sửa",
  unchanged: "Giữ nguyên",
  removed: "Đã bỏ",
  unavailable: "Chưa có bản đối chiếu",
};
export function compareLessons(
  current: CurriculumLesson[],
  previous?: CurriculumLesson[],
) {
  const old = new Map(
    previous
      ?.filter((lesson) => lesson.kind === "LESSON")
      .map((lesson) => [lesson.sequence, lesson]),
  );
  const rows: {
    lesson: CurriculumLesson;
    before?: CurriculumLesson;
    change: LessonChange;
  }[] = current
    .filter((lesson) => lesson.kind === "LESSON")
    .map((lesson) => {
      const before = old.get(lesson.sequence);
      old.delete(lesson.sequence);
      const change: LessonChange =
        previous === undefined
          ? "unavailable"
          : !before
            ? "new"
            : before.title === lesson.title && before.content === lesson.content
              ? "unchanged"
              : "modified";
      return { lesson, before, change };
    });
  for (const before of old.values())
    rows.push({ lesson: before, before, change: "removed" });
  return rows.sort((a, b) => a.lesson.sequence - b.lesson.sequence);
}

/** Estimate from real active-class schedules; varying schedules remain a range. */
export function estimateLessons(
  fromDate: string,
  toDate: string,
  classes: Pick<RegistrationClass, "isActive" | "weeklySchedules">[],
  sessionsPerWeek?: number | null,
) {
  const from = Date.parse(`${fromDate}T00:00:00Z`),
    to = Date.parse(`${toDate}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fromDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(toDate) ||
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    new Date(from).toISOString().slice(0, 10) !== fromDate ||
    new Date(to).toISOString().slice(0, 10) !== toDate ||
    to < from
  )
    return null;
  const weeks = Math.ceil(((to - from) / 86400000 + 1) / 7);
  const counts = classes
    .filter(
      (item) => item.isActive !== false && item.weeklySchedules.length > 0,
    )
    .map((item) => item.weeklySchedules.length);
  const source = counts.length ? "classes" : Number.isInteger(sessionsPerWeek) && sessionsPerWeek! > 0 ? "course" : "unconfigured";
  if (!counts.length && source === "course") counts.push(sessionsPerWeek!);
  if (!counts.length)
    return { weeks, min: null, max: null, minWeekly: null, maxWeekly: null, source };
  const minWeekly = Math.min(...counts),
    maxWeekly = Math.max(...counts);
  return {
    weeks,
    min: weeks * minWeekly,
    max: weeks * maxWeekly,
    minWeekly,
    maxWeekly,
    source,
  };
}
