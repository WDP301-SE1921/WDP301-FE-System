import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonCardList } from "@/components/shared/feedback/skeleton-presets";
import { PageContainer } from "@/components/shared/layout/page-container";
import { PageHeader } from "@/components/shared/layout/page-header";
import { ClassesBoard } from "@/features/registration-flow/components/classes-view";

export const metadata: Metadata = { title: "Lớp học" };

export default function StaffClassesPage() {
  // Bộ lọc và kiểu hiển thị nằm trên URL (nuqs) nên cần Suspense khi prerender.
  return (
    <Suspense
      fallback={
        <PageContainer>
          <SkeletonCardList />
        </PageContainer>
      }
    >
      <PageContainer maxWidth="full" className="min-w-0">
        <PageHeader
          title="Lớp học"
          description="Lớp, lịch tuần, giáo viên và sĩ số. Chọn Thêm học sinh để đăng ký học cho học sinh có hồ sơ trên ứng dụng."
        />
        <ClassesBoard role="staff" />
      </PageContainer>
    </Suspense>
  );
}
