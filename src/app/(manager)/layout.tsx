import { redirect } from "next/navigation"
import { AppShell } from "@/components/shared/layout/app-shell"
import { SessionExpiredModalContainer } from "@/features/auth/components/session-expired-modal-container"
import { AuthSessionSync } from "@/features/auth/components/auth-session-sync"
import { ROUTES } from "@/constants/routes"
import { getServerRole } from "@/lib/auth/server-role"

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // `proxy.ts` đã chặn role không hợp lệ; nhánh này chỉ là lưới an toàn cho lần render trực tiếp.
  const role = await getServerRole()
  if (!role) redirect(ROUTES.AUTH.LOGIN)

  return (
    <>
      <AuthSessionSync role={role} />
      <AppShell role={role}>{children}</AppShell>
      <SessionExpiredModalContainer />
    </>
  )
}
