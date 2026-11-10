import type { RegistrationProgram, WeeklySchedule } from "@/types/backend";
import type { CurriculumReviewer } from "@/types/curriculum";
import { countSlots, type ClosureRange } from "./center-closures";
import { estimateLessons } from "./workspace-selectors";

/**
 * Số buổi một lớp có trong khoảng ngày (gồm cả hai đầu), giống `slotsForRange` của BE:
 * sinh lịch gán buổi thứ n = bài thứ n, nên đây cũng là số bài lớp đó cần.
 * `weekday` theo BE: 1 = Thứ 2 … 7 = Chủ nhật. Ngày nghỉ trung tâm (`closures`) không có buổi.
 */
export function sessionsInRange(
  schedules: readonly Pick<WeeklySchedule, "weekday">[],
  from: string,
  to: string,
  closures: readonly ClosureRange[] = [],
): number {
  return countSlots(schedules, from, to, closures);
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
  /** Lý do chưa gửi duyệt được; rỗng khi đủ điều kiện. */
  blockedReason: string;
}

export function curriculumReadiness(input: {
  program: RegistrationProgram | undefined;
  reviewers: CurriculumReviewer[] | undefined;
  fromDate: string;
  toDate: string;
  closures?: readonly ClosureRange[];
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
          needed: sessionsInRange(row.weeklySchedules!, input.fromDate, input.toDate, input.closures),
        }))
        .sort((a, b) => b.needed - a.needed || a.name.localeCompare(b.name, "vi"))
    : null;
  const reviewers = input.reviewers ?? [];
  const estimate = estimateLessons(input.fromDate.slice(0, 10), input.toDate.slice(0, 10), [], input.program?.sessionsPerWeek, input.closures);
  // Khóa chưa có lớp vẫn có người duyệt (B4): chỉ chặn khi không có giáo viên nào đang hoạt động.
  const blockedReason =
    input.reviewers && !reviewers.length
      ? "Chưa có giáo viên nào đang hoạt động. Quản lý hãy tạo tài khoản giáo viên trong Nhân sự."
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
