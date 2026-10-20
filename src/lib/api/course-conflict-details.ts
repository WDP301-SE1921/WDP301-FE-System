import { ApiError } from "./client";

/** Render only known, non-sensitive domain metadata supplied by the API. */
export function courseConflictDetails(error: unknown): string[] {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") return [];
  const details = error.details as Record<string, unknown>;
  if (error.code === "CLASS_WEEKLY_SESSION_COUNT_MISMATCH") {
    return typeof details.expected === "number" && typeof details.actual === "number"
      ? [`Khóa yêu cầu ${details.expected} buổi/tuần; lịch hiện có ${details.actual} khung giờ.`] : [];
  }
  const rows = error.code === "PROGRAM_FREQUENCY_CHANGE_CONFLICT" ? details.conflictingClasses
    : error.code === "CURRICULUM_EFFECTIVE_PERIOD_CONFLICT" ? details.conflicts : null;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row: unknown) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    if (error.code === "PROGRAM_FREQUENCY_CHANGE_CONFLICT") {
      if (typeof item.name !== "string") return [];
      const count = item.actual ?? item.weeklyScheduleCount;
      return [`${item.name}${typeof count === "number" ? `: ${count} buổi/tuần` : ""}`];
    }
    return typeof item.title === "string" ? [item.title] : [];
  });
}
