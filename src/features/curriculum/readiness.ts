import type { RegistrationProgram, WeeklySchedule } from "@/types/backend";
import type { CurriculumReviewer } from "@/types/curriculum";
import { estimateLessons } from "./workspace-selectors";

/**
 * Số buổi một lớp có trong khoảng ngày (gồm cả hai đầu), giống `slotsForRange` của BE:
 * sinh lịch gán buổi thứ n = bài thứ n, nên đây cũng là số bài lớp đó cần.
 * `weekday` theo BE: 1 = Thứ 2 … 7 = Chủ nhật.
 */
export function sessionsInRange(
  schedules: readonly Pick<WeeklySchedule, "weekday">[],
  from: string,
  to: string,
): number {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let count = 0;
  for (let day = start; day <= end; day = new Date(day.getTime() + 86400000)) {
    const weekday = day.getUTCDay() || 7;
    count += schedules.filter((slot) => slot.weekday === weekday).length;
  }
  return count;
}

export interface ClassLessonNeed {
  id: string;
  name: string;
  perWeek: number;
  needed: number;
}

export interface CurriculumReadiness {
  activeClasses: number;
  /** `null` khi BE chưa trả `teacherId` của lớp (bản BE cũ). */
  classesWithTeacher: number | null;
  reviewers: CurriculumReviewer[];
  /** `null` khi BE chưa trả lịch tuần của lớp. */
  needs: ClassLessonNeed[] | null;
  maxNeeded: number;
  sessionsPerWeek: number | null;
  plannedNeed: number | null;
  /** Lý do chưa gửi thẩm định được; rỗng khi đủ điều kiện. */
  blockedReason: string;
}

export function curriculumReadiness(input: {
  program: RegistrationProgram | undefined;
  reviewers: CurriculumReviewer[] | undefined;
  fromDate: string;
  toDate: string;
}): CurriculumReadiness {
  const classes = (input.program?.classes ?? []).filter((row) => row.isActive);
  const knowsTeacher = classes.every((row) => row.teacherId !== undefined);
  const knowsSchedule = classes.every((row) => row.weeklySchedules !== undefined);
  const needs = knowsSchedule
    ? classes
        .filter((row) => row.weeklySchedules?.length)
        .map((row) => ({
          id: row.id,
          name: row.name,
          perWeek: row.weeklySchedules!.length,
          needed: sessionsInRange(row.weeklySchedules!, input.fromDate, input.toDate),
        }))
        .sort((a, b) => b.needed - a.needed || a.name.localeCompare(b.name, "vi"))
    : null;
  const reviewers = input.reviewers ?? [];
  const estimate = estimateLessons(input.fromDate.slice(0, 10), input.toDate.slice(0, 10), [], input.program?.sessionsPerWeek);
  const programName = input.program?.name ?? "này";
  const blockedReason = !classes.length
    ? `Khóa ${programName} chưa có lớp nào, nên chưa có giáo viên để thẩm định. Quản lý cần tạo lớp cho khóa và phân công giáo viên.`
    : input.reviewers && !reviewers.length
      ? `Các lớp của khóa ${programName} chưa có giáo viên phụ trách. Quản lý cần phân công giáo viên trước.`
      : "";
  return {
    activeClasses: classes.length,
    classesWithTeacher: knowsTeacher
      ? classes.filter((row) => row.teacherId).length
      : null,
    reviewers,
    needs,
    maxNeeded: Math.max(0, ...(needs ?? []).map((row) => row.needed)),
    sessionsPerWeek: input.program?.sessionsPerWeek ?? null,
    plannedNeed: estimate?.max ?? null,
    blockedReason,
  };
}
