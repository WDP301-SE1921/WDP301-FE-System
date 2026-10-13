import { AppShell } from "@/components/shared/layout/app-shell";
import { SessionExpiredModalContainer } from "@/features/auth/components/session-expired-modal-container";
import { AuthSessionSync } from "@/features/auth/components/auth-session-sync";
import { ROLES } from "@/constants/roles";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthSessionSync role={ROLES.TEACHER} />
      <AppShell role={ROLES.TEACHER}>{children}</AppShell>
      <SessionExpiredModalContainer />
    </>
  );
}
