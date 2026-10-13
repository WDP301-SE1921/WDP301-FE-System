"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import { getStudentRows, toStudentRow, type StudentRow } from "@/features/students/selectors"
import { findStudent } from "@/mocks/data/students"

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useStudents() {
  return useQuery<StudentRow[]>({
    queryKey: ["students"],
    queryFn: () => mockQuery(getStudentRows),
  })
}

export function useStudent(studentProfileId: string) {
  return useQuery<StudentRow | null>({
    queryKey: ["students", studentProfileId],
    queryFn: () =>
      mockQuery(() => {
        const student = findStudent(studentProfileId)
        return student ? toStudentRow(student) : null
      }),
    enabled: studentProfileId.length > 0,
  })
}
