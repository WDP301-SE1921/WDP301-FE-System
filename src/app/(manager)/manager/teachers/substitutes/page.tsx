import type { Metadata } from "next";
import { UnavailableFeature } from "@/components/shared/feedback/unavailable-feature";
export const metadata: Metadata = { title: "Dạy thay" };
export default function Page() {
  return (
    <UnavailableFeature
      title="Dạy thay"
      description="Chức năng phân công dạy thay chưa được hỗ trợ."
      href="/manager/teachers"
      actionLabel="Xem giáo viên"
    />
  );
}
