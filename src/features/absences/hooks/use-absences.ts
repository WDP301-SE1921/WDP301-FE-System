"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  mockAssignMakeup,
  mockCancelMakeup,
  mockChangeClass,
  mockChangeMakeupSession,
  mockCreateLongLeave,
  mockEndLongLeaveEarly,
  mockMarkAbsentOnly,
  mockWithdraw,
  type AssignMakeupInput,
  type ChangeClassInput,
  type CreateLongLeaveInput,
  type MarkAbsentOnlyInput,
  type WithdrawInput,
} from "@/mocks/data/absences"
import {
  getClassChangeContext,
  getLongLeaveRows,
  getLongLeaveTotals,
  getMakeupCandidates,
  getPendingMakeupRows,
  getReenrollRows,
  getReportableSessions,
  type ClassChangeContext,
  type LongLeaveRow,
  type LongLeaveTotals,
  type MakeupCandidateRow,
  type MakeupPendingRow,
  type ReenrollRow,
  type ReportableSessionRow,
} from "@/features/absences/selectors"
import type { MakeupKind } from "@/types/absence"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`/`mutationFn`. */

export function useReportableSessions(classId: string | null, futureOnly = false) {
  return useQuery<ReportableSessionRow[]>({
    queryKey: ["absences", "reportable-sessions", classId, futureOnly],
    queryFn: () => mockQuery(() => (classId ? getReportableSessions(classId, { futureOnly }) : [])),
    enabled: Boolean(classId),
  })
}

export function useMakeupCandidates(originalSessionId: string | null) {
  return useQuery<MakeupCandidateRow[]>({
    queryKey: ["absences", "makeup-candidates", originalSessionId],
    queryFn: () => mockQuery(() => (originalSessionId ? getMakeupCandidates(originalSessionId) : [])),
    enabled: Boolean(originalSessionId),
  })
}

export function usePendingMakeupRows(kind?: MakeupKind) {
  return useQuery<MakeupPendingRow[]>({
    queryKey: ["absences", "pending-makeup", kind ?? "all"],
    queryFn: () => mockQuery(() => getPendingMakeupRows(kind)),
  })
}

function invalidateMakeup(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["absences", "pending-makeup"] })
  queryClient.invalidateQueries({ queryKey: ["absences", "makeup-candidates"] })
}

export function useAssignMakeup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignMakeupInput) => mockMutation(input, mockAssignMakeup),
    onSuccess: () => invalidateMakeup(queryClient),
  })
}

export function useMarkAbsentOnly() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MarkAbsentOnlyInput) => mockMutation(input, mockMarkAbsentOnly),
    onSuccess: () => invalidateMakeup(queryClient),
  })
}

export function useChangeMakeupSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assignmentId, newSessionId }: { assignmentId: string; newSessionId: string }) =>
      mockMutation({ assignmentId, newSessionId }, ({ assignmentId: id, newSessionId: sessionId }) =>
        mockChangeMakeupSession(id, sessionId)
      ),
    onSuccess: () => invalidateMakeup(queryClient),
  })
}

export function useCancelMakeup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: string) => mockMutation(assignmentId, mockCancelMakeup),
    onSuccess: () => invalidateMakeup(queryClient),
  })
}

export function useClassChangeContext(enrollmentId: string | null) {
  return useQuery<ClassChangeContext | null>({
    queryKey: ["absences", "class-change-context", enrollmentId],
    queryFn: () => mockQuery(() => (enrollmentId ? getClassChangeContext(enrollmentId) : null)),
    enabled: Boolean(enrollmentId),
  })
}

export function useChangeClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ChangeClassInput) => mockMutation(input, mockChangeClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences", "class-change-context"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}

export interface LongLeaveData {
  rows: LongLeaveRow[]
  totals: LongLeaveTotals
}

export function useLongLeaves() {
  return useQuery<LongLeaveData>({
    queryKey: ["absences", "long-leaves"],
    queryFn: () =>
      mockQuery(() => {
        const rows = getLongLeaveRows()
        return { rows, totals: getLongLeaveTotals(rows) }
      }),
  })
}

export function useCreateLongLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateLongLeaveInput) => mockMutation(input, mockCreateLongLeave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences", "long-leaves"] })
    },
  })
}

export function useEndLongLeaveEarly() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => mockMutation(id, mockEndLongLeaveEarly),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences", "long-leaves"] })
    },
  })
}

export function useReenrollRows() {
  return useQuery<ReenrollRow[]>({
    queryKey: ["absences", "reenroll"],
    queryFn: () => mockQuery(() => getReenrollRows()),
  })
}

export function useWithdraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: WithdrawInput) => mockMutation(input, mockWithdraw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences", "reenroll"] })
      queryClient.invalidateQueries({ queryKey: ["students"] })
    },
  })
}
