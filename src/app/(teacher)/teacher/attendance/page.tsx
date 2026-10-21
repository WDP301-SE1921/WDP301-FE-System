import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Điểm danh nằm trong Lịch dạy (dạng danh sách). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(legacyHref(ROUTES.TEACHER.SCHEDULE, { view: "list" }, await searchParams));
}
