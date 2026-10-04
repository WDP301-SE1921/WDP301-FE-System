import type { Metadata } from "next"
import { CATALOG_MSG } from "@/constants/messages/events/catalog"
import { ProgramDetailView } from "@/features/catalog/components/program-detail-view"
import { redirect } from "next/navigation"
import { getServerRole } from "@/lib/auth/server-role"
import { ROUTES } from "@/constants/routes"

export const metadata: Metadata = {
  title: CATALOG_MSG.TAB_PROGRAMS,
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (await getServerRole() === "center_manager") redirect(ROUTES.MANAGER.CATALOG)

  return <ProgramDetailView programId={id} />
}
