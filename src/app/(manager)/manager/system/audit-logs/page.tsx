import type { Metadata } from "next";
import { UnavailableFeature } from "@/components/shared/feedback/unavailable-feature";
export const metadata: Metadata = { title: "Lịch sử thay đổi" };
export default function Page() {
  return (
    <UnavailableFeature
      title="Lịch sử thay đổi"
      description="Lịch sử thay đổi chưa được hỗ trợ."
      href="/manager/profile"
      actionLabel="Xem tài khoản"
    />
  );
}
