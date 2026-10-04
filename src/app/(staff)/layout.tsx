import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/layout/app-shell";
import { AuthSessionSync } from "@/features/auth/components/auth-session-sync";
import { SessionExpiredModalContainer } from "@/features/auth/components/session-expired-modal-container";
import { getServerRole } from "@/lib/auth/server-role";
import { ROUTES } from "@/constants/routes";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getServerRole();
  if (!role) redirect(ROUTES.AUTH.LOGIN);
  if (role !== "staff") redirect("/403");
  return (
    <>
      <AuthSessionSync role={role} />
      <AppShell role={role}>{children}</AppShell>
      <SessionExpiredModalContainer />
    </>
  );
}
