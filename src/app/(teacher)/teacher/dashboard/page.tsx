import type { Metadata } from "next"
import { TEACHER_DASHBOARD_MSG } from "@/constants/messages/events/teacher-portal"
import { TeacherDashboardView } from "@/features/dashboard/components/teacher-dashboard-view"

export const metadata: Metadata = { title: TEACHER_DASHBOARD_MSG.TITLE }

export default function TeacherDashboardPage() {
  return <TeacherDashboardView />
}
