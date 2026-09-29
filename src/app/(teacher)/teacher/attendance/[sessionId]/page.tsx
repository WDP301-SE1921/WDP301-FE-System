import type { Metadata } from "next"
import { TEACHER_ATTENDANCE_MSG } from "@/constants/messages/events/teacher-portal"
import { AttendanceSessionView } from "@/features/attendance/components/attendance-session-view"

export const metadata: Metadata = {
  title: TEACHER_ATTENDANCE_MSG.LIST_TITLE,
}

export default async function TeacherAttendanceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  return <AttendanceSessionView sessionId={sessionId} />
}
