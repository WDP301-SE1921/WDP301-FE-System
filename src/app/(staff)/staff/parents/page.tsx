import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Danh sách phụ huynh đã thành tab trên màn Học sinh & phụ huynh. */
export default async function StaffParentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams({ tab: "parents" });
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string" && key !== "tab") query.set(key, value);
  redirect(`${ROUTES.STAFF.STUDENTS}?${query}`);
}
