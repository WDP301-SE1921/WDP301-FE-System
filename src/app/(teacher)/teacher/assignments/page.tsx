import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveAssignmentsView } from "@/features/assignments/components/live-assignments-view";

export const metadata: Metadata = { title: "Bài tập" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveAssignmentsView />
    </Suspense>
  );
}
