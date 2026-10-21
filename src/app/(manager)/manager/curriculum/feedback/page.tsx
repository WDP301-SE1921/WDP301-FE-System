import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Phản hồi giáo trình đã thành tab trên màn Khóa học & giáo trình. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  redirect(
    legacyHref(
      ROUTES.MANAGER.CURRICULUM,
      { tab: "feedback" },
      await searchParams,
    ),
  );
}
