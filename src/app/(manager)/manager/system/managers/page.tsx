import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Quản lý trung tâm đã thành tab Quản lý trên màn Nhân sự. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(
    legacyHref(ROUTES.MANAGER.PEOPLE, { tab: "managers" }, await searchParams),
  );
}
