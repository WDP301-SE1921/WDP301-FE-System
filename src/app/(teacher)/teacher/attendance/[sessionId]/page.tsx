import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Mở đúng buổi trong Lịch dạy dạng danh sách. */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { sessionId } = await params;
  redirect(legacyHref(ROUTES.TEACHER.SCHEDULE, { view: "list", session: sessionId }, await searchParams));
}
