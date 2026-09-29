import type { Metadata } from "next"
import { TEACHER_CLASS_MSG } from "@/constants/messages/events/teacher-portal"
import { TeacherClassesView } from "@/features/classes/components/teacher-classes-view"

export const metadata: Metadata = { title: TEACHER_CLASS_MSG.LIST_TITLE }

export default function TeacherClassesPage() {
  return <TeacherClassesView />
}
