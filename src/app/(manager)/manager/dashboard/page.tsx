import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveManagerDashboard } from "@/features/dashboard/components/live-manager-dashboard";

export const metadata: Metadata = { title: "Tổng quan trung tâm" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveManagerDashboard />
    </Suspense>
  );
}
