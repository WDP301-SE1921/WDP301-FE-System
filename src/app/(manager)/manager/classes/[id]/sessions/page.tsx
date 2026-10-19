import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Sinh lịch theo khóa, chọn sẵn lớp. */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  redirect(legacyHref(ROUTES.MANAGER.SESSIONS, { classId: id }, await searchParams));
}
