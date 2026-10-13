"use client";

import { useMutation } from "@tanstack/react-query";
import { accountApi } from "@/features/auth/api";
import type { ForgotPasswordInput } from "@/lib/validators/auth";

/**
 * BE always answers "accepted" (it never reveals whether the email exists) and mails a
 * one-time reset code valid for 30 minutes.
 */
export function useForgotPassword() {
  return useMutation<{ email: string }, Error, ForgotPasswordInput>({
    mutationFn: async (values) => {
      await accountApi.forgotPassword(values);
      return { email: values.email.trim().toLowerCase() };
    },
  });
}
