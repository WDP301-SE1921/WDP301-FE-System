import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Chi tiết giáo viên mở thành Sheet trên tab Giáo viên của màn Nhân sự. */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  redirect(
    legacyHref(
      ROUTES.MANAGER.PEOPLE,
      { tab: "teachers", person: id },
      await searchParams,
    ),
  );
}
