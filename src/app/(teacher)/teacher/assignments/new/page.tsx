import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveAssignmentEditor } from "@/features/assignments/components/live-assignment-editor";

export const metadata: Metadata = { title: "Tạo bài tập" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveAssignmentEditor />
    </Suspense>
  );
}
