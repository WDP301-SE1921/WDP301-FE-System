import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Lịch sử email đã gộp vào màn Thông báo (cột phải). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(legacyHref(ROUTES.MANAGER.NOTIFICATIONS, {}, await searchParams));
}
