import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { LiveDesignerDashboard } from "@/features/dashboard/components/live-designer-dashboard";
import { getServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = { title: "Tổng quan giáo trình" };

/** Tổng quan riêng của Thiết kế giáo trình; vai trò khác về danh sách giáo trình. */
export default async function CurriculumOverviewPage() {
  const role = await getServerRole();
  if (role !== "curriculum_designer") redirect(ROUTES.MANAGER.CURRICULUM);
  return <LiveDesignerDashboard />;
}
