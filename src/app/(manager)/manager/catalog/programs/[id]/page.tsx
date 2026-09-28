import type { Metadata } from "next"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { ProgramDetailView } from "@/features/catalog/components/program-detail-view"

export const metadata: Metadata = {
  title: CATALOG_MSG.TAB_PROGRAMS,
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ProgramDetailView programId={id} />
}
