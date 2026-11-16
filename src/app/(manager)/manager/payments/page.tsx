import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonTable } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { ManagerPaymentsView } from "@/features/billing/components/manager-payments-view";

export const metadata: Metadata = { title: "Thu tiền & hoàn tiền" };

export default function Page() {
  // Tab và bộ lọc nằm trên URL (nuqs) nên cần Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonTable />
        </PageContainer>
      }
    >
      <ManagerPaymentsView />
    </Suspense>
  );
}
