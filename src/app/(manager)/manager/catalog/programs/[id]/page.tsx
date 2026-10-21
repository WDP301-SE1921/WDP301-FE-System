import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Chi tiết khóa học mở thành Sheet trên tab Khóa học & giáo trình. */
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
      ROUTES.MANAGER.CURRICULUM,
      { tab: "programs", program: id },
      await searchParams,
      // Tab bên trong chi tiết khóa đổi tên để không đụng tab của màn gộp.
      { tab: "programTab" },
    ),
  );
}
