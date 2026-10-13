import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveStudentDetailView } from "@/features/directory/components/student-detail-view";

export const metadata: Metadata = { title: "Hồ sơ con" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveStudentDetailView id={id} />
    </Suspense>
  );
}
