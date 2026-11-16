import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { legacyHref, type SearchParams } from "@/lib/legacy-href";

/** Xếp dạy thay nằm trong Sheet buổi học của Lịch học; `sessionId` cũ mở đúng buổi ở tab Dạy thay. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  redirect(
    legacyHref(
      ROUTES.MANAGER.SCHEDULE,
      query.sessionId
        ? { view: "week", sessionTab: "substitute" }
        : { view: "week" },
      query,
      { sessionId: "session", fromDate: "date" },
    ),
  );
}
