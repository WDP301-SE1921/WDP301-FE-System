import type { Metadata } from "next"
import { PARENT_MSG } from "@/constants/messages/events/parent"
import { ParentDetailView } from "@/features/parents/components/parent-detail-view"
import { RegistrationParentLookupView } from "@/features/registration-flow/components/parent-lookup-view"
import { getServerRole } from "@/lib/auth/server-role"

export const metadata: Metadata = {
  title: PARENT_MSG.DETAIL_TITLE,
}

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const role = await getServerRole()

  return role === "staff" || role === "center_manager" ? <RegistrationParentLookupView /> : <ParentDetailView parentAccountId={id} />
}
