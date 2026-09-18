"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { mockCreateClass, type CreateClassResult } from "@/mocks/data/classes"
import { mockMutation } from "@/mocks/utils/mock-query"
import type { ClassFormInput } from "@/lib/validators/class"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `mutationFn`. */
export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation<CreateClassResult, Error, ClassFormInput>({
    mutationFn: (input) => mockMutation(input, mockCreateClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}
