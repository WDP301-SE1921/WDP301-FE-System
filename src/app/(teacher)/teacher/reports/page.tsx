import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveReportsView } from "@/features/reports/components/live-reports-view";

export const metadata: Metadata = { title: "Báo cáo" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveReportsView />
    </Suspense>
  );
}
