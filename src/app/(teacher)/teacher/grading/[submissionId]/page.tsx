import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveGradingDetail } from "@/features/grading/components/live-grading-view";

export const metadata: Metadata = { title: "Chấm bài nộp" };

export default async function Page({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveGradingDetail submissionId={submissionId} />
    </Suspense>
  );
}
