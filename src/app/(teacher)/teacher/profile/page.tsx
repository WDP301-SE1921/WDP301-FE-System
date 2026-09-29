import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { TEACHER_PROFILE_MSG } from "@/constants/messages/events/teacher-portal"
import { TeacherProfileView } from "@/features/system/components/teacher-profile-view"

export const metadata: Metadata = {
  title: TEACHER_PROFILE_MSG.PROFILE_TITLE,
}

export default function TeacherProfilePage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonDetailHeader />
        </PageContainer>
      }
    >
      <TeacherProfileView />
    </Suspense>
  )
}
