import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveParentDetailView } from "@/features/directory/components/parent-detail-view";

export const metadata: Metadata = { title: "Phụ huynh" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveParentDetailView id={id} />
    </Suspense>
  );
}
