"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockMutation, mockQuery } from "@/mocks/utils/mock-query"
import { getReportRows, type ReportRow } from "@/features/reports/selectors"
import { mockCreateTeacherReport, type CreateTeacherReportInput } from "@/mocks/data/reports"
import type { TeacherReport } from "@/types/report"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`/`mutationFn`. */
export function useTeacherReports() {
  return useQuery<ReportRow[]>({
    queryKey: ["reports"],
    queryFn: () => mockQuery(() => getReportRows()),
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation<TeacherReport, Error, CreateTeacherReportInput>({
    mutationFn: (input) => mockMutation(input, mockCreateTeacherReport),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
  })
}
