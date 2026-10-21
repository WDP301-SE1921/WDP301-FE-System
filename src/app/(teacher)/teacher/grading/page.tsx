import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Hàng chờ chấm là bộ lọc Cần chấm của Bài tập & chấm bài. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(legacyHref(ROUTES.TEACHER.ASSIGNMENTS, { filter: "need-grading" }, await searchParams));
}
