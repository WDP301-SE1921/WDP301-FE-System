import type { Metadata } from "next";
import { UnavailableFeature } from "@/components/shared/feedback/unavailable-feature";
export const metadata: Metadata = { title: "Mời giáo viên" };
export default function Page() {
  return (
    <UnavailableFeature
      title="Mời giáo viên"
      description="Chức năng lời mời chưa được hỗ trợ. Quản lý có thể tạo tài khoản giáo viên trực tiếp."
      href="/manager/teachers"
      actionLabel="Tạo tài khoản giáo viên"
    />
  );
}
