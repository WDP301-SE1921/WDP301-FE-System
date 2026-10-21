import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { GradingWorkspace } from "@/features/grading/components/grading-workspace";

export const metadata: Metadata = { title: "Chấm bài nộp" };

export default async function Page({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <GradingWorkspace submissionId={submissionId} />
    </Suspense>
  );
}
