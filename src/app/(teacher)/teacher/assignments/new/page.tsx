import type { Metadata } from "next"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { AssignmentFormView } from "@/features/assignments/components/assignment-form-view"

export const metadata: Metadata = { title: ASSIGNMENT_MSG.CREATE_TITLE }

export default function TeacherAssignmentNewPage() {
  return <AssignmentFormView />
}
