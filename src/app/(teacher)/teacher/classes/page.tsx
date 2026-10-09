import type { Metadata } from "next";
import { Suspense } from "react";
import { TEACHER_CLASS_MSG } from "@/constants/messages/events/teacher-portal";
import { TeacherClassesView } from "@/features/classes/components/teacher-classes-view";

export const metadata: Metadata = { title: TEACHER_CLASS_MSG.LIST_TITLE };

export default function TeacherClassesPage() {
  return (
    <Suspense fallback={<p>Đang tải lớp học…</p>}>
      <TeacherClassesView />
    </Suspense>
  );
}
