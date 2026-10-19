import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Danh sách giáo viên đã thành tab trên màn Nhân sự. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(
    legacyHref(ROUTES.MANAGER.PEOPLE, { tab: "teachers" }, await searchParams),
  );
}
