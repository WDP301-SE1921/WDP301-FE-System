import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { CLASS_MSG } from "@/constants/messages/events/class"
import { ClassFormView } from "@/features/classes/components/class-form-view"
import { RegistrationClassEditor } from "@/features/registration-flow/components/class-editor"
import { getServerRole } from "@/lib/auth/server-role"

export const metadata: Metadata = {
  title: CLASS_MSG.CREATE_TITLE,
}

export default async function NewClassPage() {
  const role = await getServerRole()
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonCardList />
        </PageContainer>
      }
    >
      {role === "center_manager" ? <RegistrationClassEditor /> : <ClassFormView />}
    </Suspense>
  )
}
