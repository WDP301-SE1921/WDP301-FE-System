"use client";

import { useMutation } from "@tanstack/react-query";
import type { ForgotPasswordInput } from "@/lib/validators/auth";

/** Gửi link đặt lại mật khẩu. Đổi `mutationFn` khi có endpoint thật. */
export function useForgotPassword() {
  return useMutation<{ email: string }, Error, ForgotPasswordInput>({
    mutationFn: async () => {
      throw new Error(
        "Chức năng khôi phục mật khẩu chưa được hỗ trợ. Liên hệ quản lý trung tâm.",
      );
    },
  });
}
