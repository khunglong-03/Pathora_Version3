import { redirect } from "next/navigation";

export default function DashboardPoliciesRoutePage() {
  // Redirect to Settings > Policies tab
  redirect("/dashboard/settings?tab=policies");
}
