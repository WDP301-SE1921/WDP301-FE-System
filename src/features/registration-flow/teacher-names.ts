"use client";
import { useQuery } from "@tanstack/react-query";
import type { RegistrationClass } from "@/types/backend";
import { registrationApi } from "./api";

/**
 * Tên giáo viên theo id. Danh sách lớp và danh sách buổi học chỉ trả `teacherId`, nên lấy tên
 * từ danh sách giáo viên đang hoạt động (chỉ Quản lý và Nhân viên được đọc API này).
 */
export function useTeacherNames(enabled = true) {
  const teachers = useQuery({
    queryKey: ["academic-teachers", "active"],
    queryFn: ({ signal }) => registrationApi.teachers(signal),
    enabled,
    retry: false,
  });
  const names = new Map(
    (teachers.data?.items ?? []).map((teacher) => [
      teacher.id,
      teacher.displayName || teacher.email,
    ]),
  );
  return { names, isPending: enabled && teachers.isPending };
}

/** Giáo viên phụ trách buổi bắt đầu lúc `startsAt` theo phân công của lớp (giống BE `assignedTeacherAt`). */
export function assignedTeacherAt(
  classroom: Pick<
    RegistrationClass,
    "teacherId" | "pendingTeacherId" | "pendingTeacherFrom"
  >,
  startsAt: string,
) {
  return classroom.pendingTeacherId &&
    classroom.pendingTeacherFrom &&
    Date.parse(classroom.pendingTeacherFrom) <= Date.parse(startsAt)
    ? classroom.pendingTeacherId
    : classroom.teacherId;
}

/**
 * BE không lưu cờ dạy thay. Buổi còn ở trạng thái đã lên lịch mà giáo viên khác giáo viên
 * phân công của lớp là buổi dạy thay. Buổi đã chốt/hủy không tính vì không còn lịch sử phân công.
 */
export function isSubstituteSession(
  session: { status: string; teacherId: string; startsAt: string },
  classroom: Pick<
    RegistrationClass,
    "teacherId" | "pendingTeacherId" | "pendingTeacherFrom"
  >,
) {
  if (session.status !== "SCHEDULED") return false;
  const assigned = assignedTeacherAt(classroom, session.startsAt);
  return !!assigned && session.teacherId !== assigned;
}
