import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonDetailHeader } from "@/components/shared/feedback/skeleton-presets";
import { AccountDetailView } from "@/features/directory/components/accounts-view";

export const metadata: Metadata = { title: "Tài khoản giáo viên" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SkeletonDetailHeader />}>
      <AccountDetailView kind="teachers" id={id} />
    </Suspense>
  );
}
