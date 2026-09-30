import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { DASHBOARD_MSG } from "@/constants/messages/events/dashboard"
import { ROLE_HOME_ROUTE } from "@/constants/role-access"
import { ROUTES } from "@/constants/routes"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"
import { getServerRole } from "@/lib/auth/server-role"

export const metadata: Metadata = {
  title: DASHBOARD_MSG.TITLE,
}

export default async function DashboardPage() {
  const role = await getServerRole()
  if (!role) redirect(ROUTES.AUTH.LOGIN)
  // Vai trò không có dashboard (vd thiết kế giáo trình) về trang chủ riêng.
  if (ROLE_HOME_ROUTE[role] !== ROUTES.MANAGER.DASHBOARD) redirect(ROLE_HOME_ROUTE[role])

  return <DashboardView role={role} />
}
