"use client"

import { useQuery } from "@tanstack/react-query"
import { mockQuery } from "@/mocks/utils/mock-query"
import {
  getPendingTaskCounts,
  getRecentPaymentRows,
  getTodaySessionRows,
} from "@/features/dashboard/selectors"
import { getStudentRows } from "@/features/students/selectors"
import { MOCK_CLASSES, MOCK_SUBJECTS } from "@/mocks/data/catalog"
import { MOCK_PAYMENTS } from "@/mocks/data/payments"
import { MOCK_WEEKLY_ATTENDANCE } from "@/mocks/data/attendance"

function buildDashboard() {
  const students = getStudentRows()
  const activeStudents = students.filter((row) => row.student.status === "active")
  const openClasses = MOCK_CLASSES.filter((item) => item.status === "open")
  const paymentsToday = MOCK_PAYMENTS.filter((item) =>
    item.confirmedAt.startsWith("2026-09-15")
  )
  const weekly = MOCK_WEEKLY_ATTENDANCE
  const weeklyAverage =
    Math.round(
      (weekly.reduce((sum, day) => sum + day.rate, 0) / weekly.length) * 10
    ) / 10

  return {
    activeStudentCount: activeStudents.length,
    openClassCount: openClasses.length,
    subjectCount: MOCK_SUBJECTS.length,
    paymentsToday,
    paymentsTodayTotal: paymentsToday.reduce((sum, item) => sum + item.amount, 0),
    weeklyAttendance: weekly,
    weeklyAverage,
    todaySessions: getTodaySessionRows(),
    recentPayments: getRecentPaymentRows(),
    tasks: getPendingTaskCounts(),
  }
}

export type DashboardData = ReturnType<typeof buildDashboard>

/** Chữ ký hook giữ nguyên khi nối backend — chỉ đổi `queryFn`. */
export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => mockQuery(buildDashboard),
  })
}
