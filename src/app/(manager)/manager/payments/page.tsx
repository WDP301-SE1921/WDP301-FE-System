import { Suspense } from "react"
import type { Metadata } from "next"
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets"
import { PageContainer } from "@/components/shared/layout/page-container"
import { PAYMENT_MSG } from "@/constants/messages/events/payment"
import { PaymentsView } from "@/features/payments/components/payments-view"

export const metadata: Metadata = {
  title: PAYMENT_MSG.TITLE,
}

export default function PaymentsPage() {
  // nuqs dùng `useSearchParams()` nên phải có Suspense khi prerender tĩnh.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <PaymentsView />
    </Suspense>
  )
}
