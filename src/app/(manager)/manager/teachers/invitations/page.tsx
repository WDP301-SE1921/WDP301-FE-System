import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Lời mời giáo viên đã thành tab Lời mời trên màn Nhân sự. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(
    legacyHref(
      ROUTES.MANAGER.PEOPLE,
      { tab: "invites" },
      await searchParams,
      { page: "teacherInvitesPage" },
    ),
  );
}
