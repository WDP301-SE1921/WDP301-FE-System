"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MOCK_DEFAULT_ACTOR_ID } from "@/mocks/data/auth"
import {
  mockCreateEnrollment,
  mockResendEnrollmentEmail,
  type EnrollmentResult,
} from "@/mocks/data/enrollments"
import { mockMutation } from "@/mocks/utils/mock-query"
import { useCurrentUser } from "@/hooks/use-current-role"
import type { EnrollmentInput } from "@/lib/validators/enrollment"
import type { EmailStatus } from "@/types/student"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `mutationFn`. */
export function useCreateEnrollment() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()

  return useMutation<EnrollmentResult, Error, EnrollmentInput>({
    mutationFn: (input) =>
      mockMutation(
        { ...input, confirmedBy: user?.id ?? MOCK_DEFAULT_ACTOR_ID },
        mockCreateEnrollment
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["parents"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useResendEnrollmentEmail() {
  return useMutation<EmailStatus, Error, string>({
    mutationFn: (enrollmentId) =>
      mockMutation(enrollmentId, mockResendEnrollmentEmail),
  })
}
