"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { persistSession } from "@/lib/auth/session";
import { apiRequest } from "@/lib/api/client";
import type { LoginInput } from "@/lib/validators/auth";
import type { LoginResult } from "@/types/auth";

/** Tokens are set as HttpOnly cookies by the web API; only the display profile reaches JS. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<LoginResult, Error, LoginInput>({
    mutationFn: (input) =>
      apiRequest("auth/login", { method: "POST", body: input }),
    retry: false,
    onSuccess: (result, input) => {
      queryClient.clear();
      persistSession(result.user, input.rememberMe);
    },
  });
}
