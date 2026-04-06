import { redirect } from "next/navigation";

export default function DashboardCreateTourManagementPage() {
  redirect("/tour-management?create=true");
}
