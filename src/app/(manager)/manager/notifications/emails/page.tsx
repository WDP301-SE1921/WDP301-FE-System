import type { Metadata } from "next";
import { UnavailableFeature } from "@/components/shared/feedback/unavailable-feature";
export const metadata: Metadata = { title: "Lịch sử email" };
export default function Page() {
  return (
    <UnavailableFeature
      title="Lịch sử email"
      description="Lịch sử email chưa được hỗ trợ. Kết quả gửi được hiển thị tại màn hình thông báo."
      href="/manager/notifications/send"
      actionLabel="Gửi thông báo"
    />
  );
}
