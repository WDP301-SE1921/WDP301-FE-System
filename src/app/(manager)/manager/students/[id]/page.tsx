import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { STUDENT_MSG } from "@/constants/messages/events/student"
import { StudentDetailView } from "@/features/students/components/student-detail-view"
import { RegistrationParentLookupView } from "@/features/registration-flow/components/parent-lookup-view"
import { getServerRole } from "@/lib/auth/server-role"

export const metadata: Metadata = {
  title: STUDENT_MSG.DETAIL_TITLE,
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const role = await getServerRole()

  // nuqs (`?tab=`) dùng `useSearchParams()` nên phải có Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonDetailHeader />
        </PageContainer>
      }
    >
      {role === "staff" || role === "center_manager" ? <RegistrationParentLookupView students /> : <StudentDetailView studentProfileId={id} />}
    </Suspense>
  )
}
