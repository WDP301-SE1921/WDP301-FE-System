import type { ScheduledSession } from "@/types/curriculum";
import { vietnamLocalInput } from "@/features/curriculum/session-contract";

export function attendanceSessionStatus(
  session: Pick<ScheduledSession, "status" | "startsAt" | "endsAt">,
  now: number,
  today: string,
) {
  if (session.status === "COMPLETED") return "Đã chốt";
  if (session.status === "CANCELLED") return "Đã hủy";
  if (Date.parse(session.endsAt) <= now) return "Chưa điểm danh";
  return vietnamLocalInput(session.startsAt).slice(0, 10) === today
    ? "Hôm nay"
    : "Sắp tới";
}
