import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { SYSTEM_MSG } from "@/constants/messages/events/system"
import { ProfileView } from "@/features/system/components/profile-view"

export const metadata: Metadata = {
  title: SYSTEM_MSG.PROFILE_TITLE,
}

export default function ProfilePage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonDetailHeader />
        </PageContainer>
      }
    >
      <ProfileView />
    </Suspense>
  )
}
