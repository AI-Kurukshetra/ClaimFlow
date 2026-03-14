import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  filterClosedClaimantClaims,
  getClaimantClaims,
  sumEstimateTotals,
} from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

export default async function PreviousClaimsPage() {
  const { user } = await requireDashboardRole("claimant");
  const claims = filterClosedClaimantClaims(await getClaimantClaims(user.id));

  return (
    <ClaimsWorkspace
      claims={claims}
      description="Closed claims stay here as your completed history. Use this page to review prior outcomes and reference past incidents."
      emptyDescription="Completed claims will appear here after the workflow reaches the closed state."
      emptyTitle="No previous claims"
      stats={[
        {
          label: "Closed claims",
          note: "Files that have completed the full lifecycle.",
          value: String(claims.length),
        },
        {
          label: "Resolved estimates",
          note: "Final estimated amount across closed claims.",
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
        {
          label: "Analyzed photos",
          note: "Images stored against archived claims.",
          value: String(claims.reduce((total, claim) => total + claim.photoCount, 0)),
        },
      ]}
      title="Previous Claims"
    />
  );
}
