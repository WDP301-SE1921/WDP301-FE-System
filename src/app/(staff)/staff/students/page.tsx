import { RegistrationParentLookupView } from "@/features/registration-flow/components/parent-lookup-view";
export const metadata = { title: "Tra cứu hồ sơ con" };
export default function StaffStudentsPage() {
  return <RegistrationParentLookupView students />;
}
