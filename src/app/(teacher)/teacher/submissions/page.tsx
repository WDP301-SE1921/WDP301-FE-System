import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveGradingQueue } from "@/features/grading/components/live-grading-view";

export const metadata: Metadata = { title: "Bài nộp" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveGradingQueue />
    </Suspense>
  );
}
