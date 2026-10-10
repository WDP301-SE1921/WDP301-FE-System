import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { AccountsView } from "@/features/directory/components/accounts-view";

export const metadata: Metadata = { title: "Nhân viên" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <AccountsView kind="staff" />
    </Suspense>
  );
}
