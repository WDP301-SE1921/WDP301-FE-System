import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveAssignmentEditor } from "@/features/assignments/components/live-assignment-editor";

export const metadata: Metadata = { title: "Sửa bài tập" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveAssignmentEditor id={id} />
    </Suspense>
  );
}
