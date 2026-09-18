"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import {
  getClassDetail,
  getClassRows,
  getClassTotals,
  type ClassDetail,
  type ClassRow,
  type ClassTotals,
} from "@/features/classes/selectors"

export interface ClassesData {
  rows: ClassRow[]
  totals: ClassTotals
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useClasses() {
  return useQuery<ClassesData>({
    queryKey: ["classes"],
    queryFn: () =>
      mockQuery(() => {
        const rows = getClassRows()
        return { rows, totals: getClassTotals(rows) }
      }),
  })
}

export function useClassDetail(classId: string) {
  return useQuery<ClassDetail | null>({
    queryKey: ["classes", classId],
    queryFn: () => mockQuery(() => getClassDetail(classId)),
    enabled: classId.length > 0,
  })
}
