import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveAttendanceSession } from "@/features/attendance/components/live-attendance-view";

export const metadata: Metadata = { title: "Điểm danh buổi học" };

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveAttendanceSession sessionId={sessionId} />
    </Suspense>
  );
}
