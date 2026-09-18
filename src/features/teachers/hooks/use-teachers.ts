"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  findTeacherRow,
  getSubstituteCandidateSessions,
  getSubstituteHistory,
  getTeacherRows,
  getTeacherTotals,
  type SubstituteCandidateSession,
  type SubstituteHistoryRow,
  type TeacherRow,
  type TeacherTotals,
} from "@/features/teachers/selectors"
import { MOCK_TEACHER_INVITATIONS } from "@/mocks/data/teachers"
import {
  mockApproveInvitation,
  mockAssignSubstitute,
  mockChangeClassTeacher,
  mockInviteTeacher,
  mockRejectInvitation,
  type AssignSubstituteInput,
  type ChangeClassTeacherInput,
  type ChangeClassTeacherResult,
  type InviteTeacherInput,
} from "@/mocks/data/teachers"
import type { TeacherInvitation } from "@/types/teacher"

export interface TeachersData {
  rows: TeacherRow[]
  totals: TeacherTotals
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useTeachers() {
  return useQuery<TeachersData>({
    queryKey: ["teachers"],
    queryFn: () =>
      mockQuery(() => {
        const rows = getTeacherRows()
        return { rows, totals: getTeacherTotals(rows) }
      }),
  })
}

export function useTeacher(teacherId: string) {
  return useQuery<TeacherRow | null>({
    queryKey: ["teachers", teacherId],
    queryFn: () => mockQuery(() => findTeacherRow(teacherId)),
    enabled: teacherId.length > 0,
  })
}

export function useTeacherInvitations() {
  return useQuery<TeacherInvitation[]>({
    queryKey: ["teacher-invitations"],
    queryFn: () => mockQuery(() => [...MOCK_TEACHER_INVITATIONS]),
  })
}

export interface SubstituteData {
  sessions: SubstituteCandidateSession[]
  history: SubstituteHistoryRow[]
}

export function useSubstituteData() {
  return useQuery<SubstituteData>({
    queryKey: ["substitutes"],
    queryFn: () =>
      mockQuery(() => ({
        sessions: getSubstituteCandidateSessions(),
        history: getSubstituteHistory(),
      })),
  })
}

export function useInviteTeacher() {
  const queryClient = useQueryClient()

  return useMutation<TeacherInvitation, Error, InviteTeacherInput>({
    mutationFn: (input) => mockMutation(input, mockInviteTeacher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-invitations"] })
    },
  })
}

export function useReviewInvitation() {
  const queryClient = useQueryClient()

  return useMutation<
    TeacherInvitation,
    Error,
    { invitationId: string; approve: boolean }
  >({
    mutationFn: ({ invitationId, approve }) =>
      mockMutation(invitationId, (id) =>
        approve ? mockApproveInvitation(id) : mockRejectInvitation(id)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
    },
  })
}

export function useAssignSubstitute() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, AssignSubstituteInput>({
    mutationFn: (input) => mockMutation(input, mockAssignSubstitute),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitutes"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
    },
  })
}

export function useChangeClassTeacher() {
  const queryClient = useQueryClient()

  return useMutation<ChangeClassTeacherResult, Error, ChangeClassTeacherInput>({
    mutationFn: (input) => mockMutation(input, mockChangeClassTeacher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["teachers"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}
