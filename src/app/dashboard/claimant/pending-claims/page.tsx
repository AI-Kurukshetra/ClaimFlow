import { redirect } from "next/navigation";

export default function PendingClaimsPage() {
  redirect("/dashboard/claimant/action-required");
}
