"use client"

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  getCancelledSessionMakeupNeeds,
  getPendingAbsenceRows,
  getPendingAbsenceSessionIds,
  getTeacherWorkCredits,
  type CancelledSessionMakeupRow,
  type TeacherAbsenceRow,
  type TeacherWorkCredits,
} from "@/features/work-credits/selectors"
import {
  mockAdjustWorkCredit,
  mockCancelSession,
  mockReportTeacherAbsence,
  type AdjustWorkCreditInput,
  type CancelSessionInput,
  type CancelSessionResult,
  type ReportTeacherAbsenceInput,
} from "@/mocks/data/teachers"
import type { TeacherAbsenceReport, WorkCreditAdjustment } from "@/types/teacher"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`/`mutationFn`. */
export function useTeacherWorkCredits(teacherId: string, month: string) {
  return useQuery<TeacherWorkCredits>({
    queryKey: ["work-credits", "teacher", teacherId, month],
    queryFn: () => mockQuery(() => getTeacherWorkCredits(teacherId, month)),
  })
}

export function usePendingAbsences() {
  return useQuery<TeacherAbsenceRow[]>({
    queryKey: ["teacher-absences", "pending"],
    queryFn: () => mockQuery(getPendingAbsenceRows),
  })
}

/** Id các buổi giáo viên đã báo nghỉ và chờ xử lý (ẩn nút "Báo nghỉ" ở lịch dạy). */
export function useMyPendingAbsenceSessionIds(teacherId: string) {
  return useQuery<string[]>({
    queryKey: ["teacher-absences", "mine", teacherId],
    queryFn: () => mockQuery(() => getPendingAbsenceSessionIds(teacherId)),
  })
}

export function useCancelledSessionMakeupNeeds() {
  return useQuery<CancelledSessionMakeupRow[]>({
    queryKey: ["cancelled-session-makeup"],
    queryFn: () => mockQuery(getCancelledSessionMakeupNeeds),
  })
}

/** Báo nghỉ / hủy buổi / ghi nhận công đều đổi lịch, công, danh sách chờ xử lý và nhật ký. */
function invalidateWorkData(queryClient: QueryClient) {
  ;[
    "work-credits",
    "teacher-absences",
    "cancelled-session-makeup",
    "schedule",
    "classes",
    "substitutes",
    "teachers",
    "attendance",
    "dashboard",
    "teacher-dashboard",
    "audit-log",
  ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
}

export function useReportTeacherAbsence() {
  const queryClient = useQueryClient()

  return useMutation<TeacherAbsenceReport, Error, ReportTeacherAbsenceInput>({
    mutationFn: (input) => mockMutation(input, mockReportTeacherAbsence),
    onSuccess: () => invalidateWorkData(queryClient),
  })
}

export function useCancelSession() {
  const queryClient = useQueryClient()

  return useMutation<CancelSessionResult, Error, CancelSessionInput>({
    mutationFn: (input) => mockMutation(input, mockCancelSession),
    onSuccess: () => invalidateWorkData(queryClient),
  })
}

export function useAdjustWorkCredit() {
  const queryClient = useQueryClient()

  return useMutation<WorkCreditAdjustment, Error, AdjustWorkCreditInput>({
    mutationFn: (input) => mockMutation(input, mockAdjustWorkCredit),
    onSuccess: () => invalidateWorkData(queryClient),
  })
}
