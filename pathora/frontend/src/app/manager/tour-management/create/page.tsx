import { redirect } from "next/navigation";

export default function CreateTourPage() {
  redirect("/tour-management?create=true");
}
