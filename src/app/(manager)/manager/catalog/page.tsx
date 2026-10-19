import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Danh mục (môn học, khóa học) đã thành tab trên màn Khóa học & giáo trình. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  // Trang cũ dùng `?tab=subjects|programs`; giữ đúng tab đang mở.
  const tab = query.tab === "programs" ? "programs" : "subjects";
  redirect(legacyHref(ROUTES.MANAGER.CURRICULUM, { tab }, query));
}
