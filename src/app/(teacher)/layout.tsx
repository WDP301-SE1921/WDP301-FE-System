import { AppShell } from "@/components/shared/layout/app-shell"
import { SessionExpiredModalContainer } from "@/features/auth/components/session-expired-modal-container"
import { ROLES } from "@/constants/roles"
import { CURRENT_TEACHER_ID } from "@/mocks/data/catalog"
import { getTeacherPendingCounts } from "@/features/dashboard/teacher-selectors"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pending = getTeacherPendingCounts(CURRENT_TEACHER_ID)

  return (
    <>
      <AppShell
        role={ROLES.TEACHER}
        badgeCounts={{
          unmarkedSessionsToday: pending.unmarkedSessionsToday,
          ungradedSubmissions: pending.ungradedSubmissions,
          pendingAiReview: pending.pendingAiReview,
        }}
      >
        {children}
      </AppShell>
      <SessionExpiredModalContainer />
    </>
  )
}
