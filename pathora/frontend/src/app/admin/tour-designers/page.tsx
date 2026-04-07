import { redirect } from "next/navigation";

export default function DeprecatedTourDesignersPage() {
  redirect("/admin/tour-managers");
}
