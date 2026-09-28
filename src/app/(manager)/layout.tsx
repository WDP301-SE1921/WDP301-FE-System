import { AppShell } from "@/components/shared/layout/app-shell"
import { SessionExpiredModalContainer } from "@/features/auth/components/session-expired-modal-container"
import { ROLES } from "@/constants/roles"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppShell role={ROLES.MANAGER}>{children}</AppShell>
      <SessionExpiredModalContainer />
    </>
  )
}
