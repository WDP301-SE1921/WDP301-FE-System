import { ROUTES } from "@/constants/routes";
import type { StudentAction } from "./components/live-staff-workflows";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Các trang cũ dưới /staff/absences đã gộp vào panel Xử lý trên màn Học sinh & phụ huynh.
 * Giữ học sinh, ghi danh và buổi đã chọn để liên kết cũ vẫn mở đúng chỗ.
 */
export function legacyAbsenceHref(
  action: StudentAction,
  searchParams: SearchParams,
) {
  const studentId = first(searchParams.studentId);
  if (!studentId) return ROUTES.STAFF.STUDENTS;
  return ROUTES.STAFF.STUDENT_ACTION({
    studentId,
    action,
    enrollmentId: first(searchParams.enrollmentId),
    sessionId: first(searchParams.sessionId),
  });
}
