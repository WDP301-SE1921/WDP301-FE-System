import type { Metadata } from "next";
import { LiveStaffDashboard } from "@/features/dashboard/components/live-staff-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function StaffDashboardPage() {
  return <LiveStaffDashboard />;
}
