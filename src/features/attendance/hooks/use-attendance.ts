"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import {
  getAttendanceSessionDetail,
  getTodayAttendanceRows,
  type AttendanceSessionDetail,
  type AttendanceSessionRow,
} from "@/features/attendance/selectors"
import { mockSaveAttendance, type SaveAttendanceInput } from "@/mocks/data/attendance"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`/`mutationFn`. */
export function useTodayAttendance(teacherId: string) {
  return useQuery<AttendanceSessionRow[]>({
    queryKey: ["attendance", "today", teacherId],
    queryFn: () => mockQuery(() => getTodayAttendanceRows(teacherId)),
  })
}

export function useAttendanceSession(sessionId: string) {
  return useQuery<AttendanceSessionDetail | null>({
    queryKey: ["attendance", "session", sessionId],
    queryFn: () => mockQuery(() => getAttendanceSessionDetail(sessionId)),
    enabled: sessionId.length > 0,
  })
}

export interface SaveAttendanceVariables {
  sessionId: string
  records: SaveAttendanceInput[]
}

export function useSaveAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: SaveAttendanceVariables) =>
      mockMutation(variables, ({ sessionId, records }) =>
        mockSaveAttendance(sessionId, records)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["classes"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}
