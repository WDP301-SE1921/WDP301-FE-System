import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Chi tiết phụ huynh mở thành Sheet trên tab Phụ huynh của màn Học sinh & phụ huynh. */
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
      ROUTES.MANAGER.STUDENTS,
      { tab: "parents", parentId: id },
      await searchParams,
    ),
  );
}
