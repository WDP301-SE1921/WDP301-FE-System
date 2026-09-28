import type { Metadata } from "next"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { MakeupWorkflowView } from "@/features/absences/components/makeup-workflow-view"
import { MAKEUP_KIND } from "@/lib/validators/absence"

export const metadata: Metadata = {
  title: ABSENCE_MSG.MAKEUP_TITLE,
}

export default function MakeupPage() {
  return <MakeupWorkflowView mode={MAKEUP_KIND.MAKEUP} />
}
