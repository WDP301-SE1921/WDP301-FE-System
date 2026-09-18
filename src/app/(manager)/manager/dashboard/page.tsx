import type { Metadata } from "next"
import { DASHBOARD_MSG } from "@/constants/messages/events/dashboard"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"

export const metadata: Metadata = {
  title: DASHBOARD_MSG.TITLE,
}

export default function DashboardPage() {
  return <DashboardView />
}
