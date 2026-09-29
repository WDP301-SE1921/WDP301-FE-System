import type { Metadata } from "next"
import { GRADING_MSG } from "@/constants/messages/events/grading"
import { GradingDetailView } from "@/features/grading/components/grading-detail-view"

export const metadata: Metadata = { title: GRADING_MSG.QUEUE_TITLE }

export default async function TeacherGradingDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>
}) {
  const { submissionId } = await params

  return <GradingDetailView submissionId={submissionId} />
}
