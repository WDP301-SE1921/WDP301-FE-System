"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  getAssignmentDetail,
  getAssignmentRows,
  type AssignmentDetail,
  type AssignmentRow,
  type AssignmentRowFilters,
} from "@/features/assignments/selectors"
import {
  mockCloseAssignment,
  mockCreateAssignment,
  mockUpdateAssignment,
  type AssignmentInput,
} from "@/mocks/data/assignments"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`/`mutationFn`. */
export function useAssignments(filters: AssignmentRowFilters = {}) {
  return useQuery<AssignmentRow[]>({
    queryKey: ["assignments", filters],
    queryFn: () => mockQuery(() => getAssignmentRows(filters)),
  })
}

export function useAssignmentDetail(assignmentId: string) {
  return useQuery<AssignmentDetail | null>({
    queryKey: ["assignments", assignmentId],
    queryFn: () => mockQuery(() => getAssignmentDetail(assignmentId)),
    enabled: assignmentId.length > 0,
  })
}

function invalidateAssignmentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["assignments"] })
  queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignmentInput) =>
      mockMutation(input, (variables) => mockCreateAssignment(variables)),
    onSuccess: () => invalidateAssignmentQueries(queryClient),
  })
}

export interface UpdateAssignmentVariables {
  id: string
  input: AssignmentInput
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: UpdateAssignmentVariables) =>
      mockMutation(variables, ({ id, input }) => mockUpdateAssignment(id, input)),
    onSuccess: () => invalidateAssignmentQueries(queryClient),
  })
}

export function useCloseAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: string) =>
      mockMutation(assignmentId, (id) => mockCloseAssignment(id)),
    onSuccess: () => invalidateAssignmentQueries(queryClient),
  })
}
