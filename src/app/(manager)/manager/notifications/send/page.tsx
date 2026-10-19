import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Gửi thông báo đã gộp vào màn Thông báo (cột trái). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(legacyHref(ROUTES.MANAGER.NOTIFICATIONS, {}, await searchParams));
}
