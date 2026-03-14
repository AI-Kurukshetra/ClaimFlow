import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  filterInProgressClaimantClaims,
  getClaimantClaims,
  sumEstimateTotals,
} from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

export default async function InProgressClaimsPage() {
  const { user } = await requireDashboardRole("claimant");
  const claims = filterInProgressClaimantClaims(await getClaimantClaims(user.id));

  return (
    <ClaimsWorkspace
      claims={claims}
      description="These claims are in adjuster hands for review or estimation."
      emptyDescription="No claims are currently in progress."
      emptyTitle="No in-progress claims"
      renderClaimActions={() => <p className="claim-action-note">Waiting for adjuster update.</p>}
      stats={[
        {
          label: "In progress",
          note: "Claims currently under review or estimation.",
          value: String(claims.length),
        },
        {
          label: "Photos attached",
          note: "Supporting images across in-progress claims.",
          value: String(claims.reduce((total, claim) => total + claim.photoCount, 0)),
        },
        {
          label: "Estimate pipeline",
          note: "Current estimated value across in-progress claims.",
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
      ]}
      title="In Progress"
    />
  );
}
