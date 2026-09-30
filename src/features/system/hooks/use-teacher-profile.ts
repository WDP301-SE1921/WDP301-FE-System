"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import { getCurrentTeacher } from "@/features/system/selectors"
import {
  mockUpdateTeacherProfile,
  type UpdateTeacherProfileInput,
} from "@/mocks/data/catalog"
import { mockChangePassword, type ChangePasswordInput } from "@/mocks/data/system"
import type { Teacher } from "@/types/catalog"

/**
 * Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. Đổi mật khẩu dùng
 * lại `mockChangePassword` (`mocks/data/system.ts`) — hàm đó chỉ tra cứu
 * theo email trong `MOCK_ACCOUNTS` nên vốn đã role-agnostic, không cần bản riêng
 * cho giáo viên.
 */
export function useCurrentTeacher() {
  return useQuery<Teacher | undefined>({
    queryKey: ["teachers", "current"],
    queryFn: () => mockQuery(() => getCurrentTeacher()),
  })
}

export function useUpdateTeacherProfile() {
  const queryClient = useQueryClient()

  return useMutation<Teacher, Error, UpdateTeacherProfileInput>({
    mutationFn: (input) => mockMutation(input, mockUpdateTeacherProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
    },
  })
}

export function useChangeTeacherPassword() {
  return useMutation<{ success: true }, Error, ChangePasswordInput>({
    mutationFn: (input) => mockMutation(input, mockChangePassword),
  })
}
