// Hàm thuần (chỉ import type) để `node --test` nạp thẳng được file này.
import type { RegistrationClass } from "@/types/backend";

type RegistrationReadiness = Pick<
  RegistrationClass,
  "isActive" | "isOpen" | "weeklySchedules"
> & {
  program: Pick<RegistrationClass["program"], "name" | "sessionsPerWeek">;
};

/** Lý do đầu tiên khiến lớp chưa mở đăng ký được; thứ tự là thứ tự người dùng phải sửa. */
export type OpenRegistrationBlocker =
  | { kind: "INACTIVE" }
  | { kind: "FREQUENCY_MISSING"; programName: string }
  | { kind: "SCHEDULE_EMPTY"; expected: number }
  | { kind: "SCHEDULE_SHORT"; count: number; expected: number }
  | { kind: "SCHEDULE_EXTRA"; count: number; expected: number };

/** Mở đăng ký cần khóa đã đặt số buổi/tuần và lịch tuần có đúng số khung giờ đó. */
export function canOpenRegistration(
  classroom: Pick<RegistrationClass, "isActive" | "weeklySchedules"> & {
    program: Pick<RegistrationClass["program"], "sessionsPerWeek">;
  },
) {
  return (
    classroom.isActive !== false &&
    classroom.program.sessionsPerWeek != null &&
    classroom.weeklySchedules.length === classroom.program.sessionsPerWeek
  );
}

/** Null khi lớp đang mở (nút là "Đóng đăng ký") hoặc đã đủ điều kiện mở. */
export function openRegistrationBlocker(
  classroom: RegistrationReadiness,
): OpenRegistrationBlocker | null {
  if (classroom.isOpen) return null;
  if (classroom.isActive === false) return { kind: "INACTIVE" };
  const expected = classroom.program.sessionsPerWeek;
  if (expected == null)
    return { kind: "FREQUENCY_MISSING", programName: classroom.program.name };
  const count = classroom.weeklySchedules.length;
  if (count === expected) return null;
  if (count === 0) return { kind: "SCHEDULE_EMPTY", expected };
  return count < expected
    ? { kind: "SCHEDULE_SHORT", count, expected }
    : { kind: "SCHEDULE_EXTRA", count, expected };
}
