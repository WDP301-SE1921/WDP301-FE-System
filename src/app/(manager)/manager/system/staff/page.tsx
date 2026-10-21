import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Nhân sự trung tâm đã thành tab Nhân viên trên màn Nhân sự. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(
    legacyHref(ROUTES.MANAGER.PEOPLE, { tab: "staff" }, await searchParams),
  );
}
