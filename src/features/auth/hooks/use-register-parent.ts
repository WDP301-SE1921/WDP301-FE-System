"use client";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { RegisterParentInput } from "@/lib/validators/auth";

export function useRegisterParent() {
  return useMutation({
    mutationFn: (input: RegisterParentInput) =>
      apiRequest<{ email: string }>("auth/register", {
        method: "POST",
        body: { email: input.email, password: input.password },
      }),
    retry: false,
  });
}
