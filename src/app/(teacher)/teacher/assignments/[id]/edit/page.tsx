import type { Metadata } from "next"
import { ASSIGNMENT_MSG } from "@/constants/messages/events/assignment"
import { AssignmentFormView } from "@/features/assignments/components/assignment-form-view"

export const metadata: Metadata = { title: ASSIGNMENT_MSG.EDIT_TITLE }

export default async function TeacherAssignmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AssignmentFormView assignmentId={id} />
}
