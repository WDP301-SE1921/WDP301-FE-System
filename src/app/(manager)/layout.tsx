import { AppShell } from "@/components/shared/layout/app-shell"
import { ROLES } from "@/constants/roles"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell role={ROLES.MANAGER}>{children}</AppShell>
}
