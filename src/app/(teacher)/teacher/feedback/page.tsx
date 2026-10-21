import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Phản hồi giáo trình là một tab của Giáo trình. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(legacyHref(ROUTES.TEACHER.CURRICULUM, { tab: "feedback" }, await searchParams));
}
