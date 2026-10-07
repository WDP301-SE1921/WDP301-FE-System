import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { StudentsView } from "@/features/students/components/students-view"
import { RegistrationStudentsView } from "@/features/registration-flow/components/directory-list-view"
import { getServerRole } from "@/lib/auth/server-role"

export const metadata: Metadata = {
  title: STUDENT_MSG.LIST_TITLE,
}

export default async function StudentsPage() {
  const role = await getServerRole()
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      {role === "staff" || role === "center_manager" ? (
        <RegistrationStudentsView />
      ) : (
        <StudentsView />
      )}
    </Suspense>
  )
}
