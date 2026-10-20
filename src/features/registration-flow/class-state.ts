"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { RegistrationClass } from "@/types/backend";

/**
 * Mở / đóng đăng ký và ngừng / kích hoạt lớp (`PATCH classes/:id`). Dùng chung cho lưới
 * Lớp học và trang chi tiết lớp để hai nơi gọi đúng một API.
 */
export function useClassStateMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { isOpen?: boolean; isActive?: boolean };
    }) =>
      apiRequest<RegistrationClass>(`classes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
      }),
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["registration-classes"] });
      void client.invalidateQueries({ queryKey: ["registration-class"] });
      void client.invalidateQueries({ queryKey: ["academic-program"] });
    },
  });
}

/** Opening requires a configured course and a complete weekly schedule. */
export function canOpenRegistration(
  classroom: Pick<RegistrationClass, "isActive" | "weeklySchedules" | "program">,
) {
  return classroom.isActive !== false && classroom.program.sessionsPerWeek != null &&
    classroom.weeklySchedules.length === classroom.program.sessionsPerWeek;
}
