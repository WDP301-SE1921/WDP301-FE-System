import { redirect } from "next/navigation";
import { legacyAbsenceHref } from "@/features/absences/legacy-routes";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(legacyAbsenceHref("makeup", await searchParams));
}
