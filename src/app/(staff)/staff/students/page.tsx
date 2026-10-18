import { Suspense } from "react";
import { StaffStudentsHub } from "@/features/registration-flow/components/directory-list-view";
import { StudentWorkflowSheet } from "@/features/absences/components/live-staff-workflows";
export const metadata = { title: "Học sinh & phụ huynh" };
export default function StaffStudentsPage() {
  return (
    <Suspense fallback={<p className="p-6">Đang tải học sinh…</p>}>
      <StaffStudentsHub />
      <StudentWorkflowSheet />
    </Suspense>
  );
}
