import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Phòng học đã thành tab trên màn Lớp học. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(
    legacyHref(ROUTES.MANAGER.CLASSES, { tab: "rooms" }, await searchParams),
  );
}
