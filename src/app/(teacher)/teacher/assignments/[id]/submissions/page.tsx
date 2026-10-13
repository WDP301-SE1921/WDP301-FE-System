import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveAssignmentSubmissions } from "@/features/assignments/components/live-assignments-view";

export const metadata: Metadata = { title: "Bài nộp và giao bài" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveAssignmentSubmissions id={id} />
    </Suspense>
  );
}
