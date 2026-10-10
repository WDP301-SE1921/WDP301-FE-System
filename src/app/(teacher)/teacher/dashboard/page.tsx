import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { LiveTeacherDashboard } from "@/features/dashboard/components/live-teacher-dashboard";

export const metadata: Metadata = { title: "Tổng quan giảng dạy" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <LiveTeacherDashboard />
    </Suspense>
  );
}
