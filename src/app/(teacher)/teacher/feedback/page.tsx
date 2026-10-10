import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveCurriculumFeedback } from "@/features/curriculum/components/live-feedback-view";

export const metadata: Metadata = { title: "Phản hồi giáo trình" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveCurriculumFeedback />
    </Suspense>
  );
}
