import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { AccountProfile } from "@/features/auth/components/account-profile";

export const metadata: Metadata = { title: "Tài khoản" };

export default function Page() {
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <AccountProfile />
    </Suspense>
  );
}
