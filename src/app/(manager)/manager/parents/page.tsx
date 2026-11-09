import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PARENT_MSG } from "@/constants/messages/events/parent";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

export const metadata: Metadata = {
  title: PARENT_MSG.LIST_TITLE,
};

/** Phụ huynh nằm ở tab Phụ huynh của màn Học sinh & phụ huynh; giữ đường dẫn cũ. */
export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(
    legacyHref(ROUTES.MANAGER.STUDENTS, { tab: "parents" }, await searchParams),
  );
}
