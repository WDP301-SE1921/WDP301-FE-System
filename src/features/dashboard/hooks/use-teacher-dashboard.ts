"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import {
  getTodayAttendanceRows,
  type AttendanceSessionRow,
} from "@/features/attendance/selectors"
import {
  getRecentSubmissions,
  getTeacherClassCount,
  getTeacherPendingCounts,
  type RecentSubmissionRow,
  type TeacherPendingCounts,
} from "@/features/dashboard/teacher-selectors"

export interface TeacherDashboardData {
  todaySessions: AttendanceSessionRow[]
  classCount: number
  tasks: TeacherPendingCounts
  recentSubmissions: RecentSubmissionRow[]
}

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useTeacherDashboard(teacherId: string) {
  return useQuery<TeacherDashboardData>({
    queryKey: ["teacher-dashboard", teacherId],
    queryFn: () =>
      mockQuery(() => ({
        todaySessions: getTodayAttendanceRows(teacherId),
        classCount: getTeacherClassCount(teacherId),
        tasks: getTeacherPendingCounts(teacherId),
        recentSubmissions: getRecentSubmissions(teacherId),
      })),
  })
}
