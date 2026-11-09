import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { CurriculumUnitDetailView } from "@/features/curriculum/components/unit-detail-view";

export const metadata: Metadata = { title: "Duyệt nội dung giáo trình" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <CurriculumUnitDetailView key={id} unitId={id} />
    </Suspense>
  );
}
