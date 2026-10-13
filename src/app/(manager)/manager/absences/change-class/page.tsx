import type { Metadata } from "next"
import { ABSENCE_MSG } from "@/constants/messages/events/absence"
import { ChangeClassView } from "@/features/absences/components/change-class-view"

export const metadata: Metadata = {
  title: ABSENCE_MSG.CHANGE_CLASS_TITLE,
}

export default function ChangeClassPage() {
  return <ChangeClassView />
}
