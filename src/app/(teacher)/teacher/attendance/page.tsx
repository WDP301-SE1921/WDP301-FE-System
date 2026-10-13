import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveAttendanceList } from "@/features/attendance/components/live-attendance-view";

export const metadata: Metadata = { title: "Điểm danh" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveAttendanceList />
    </Suspense>
  );
}
