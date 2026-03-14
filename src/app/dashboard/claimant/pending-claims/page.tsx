import { ClaimantClaimConfirmationForm } from "@/features/claims/components/claimant-claim-confirmation-form";
import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  filterActiveClaimantClaims,
  getClaimantClaims,
  sumEstimateTotals,
} from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type PendingClaimsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PendingClaimsPage({ searchParams }: PendingClaimsPageProps) {
  const { user } = await requireDashboardRole("claimant");
  const claims = filterActiveClaimantClaims(await getClaimantClaims(user.id));
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={claims}
      description="These claims are still active in the workflow. Track progress from reviewing through approval, then confirm to close."
      emptyDescription="You do not have any open claims at the moment."
      emptyTitle="No pending claims"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      renderClaimActions={(claim) =>
        claim.status === "Approved" ? (
          <ClaimantClaimConfirmationForm claimId={claim.id} redirectTo="/dashboard/claimant/pending-claims" />
        ) : (
          <p className="claim-action-note">Waiting for adjuster updates.</p>
        )
      }
      stats={[
        {
          label: "Open claims",
          note: "All claims that are not yet closed.",
          value: String(claims.length),
        },
        {
          label: "Photos attached",
          note: "Supporting images available for active claims.",
          value: String(claims.reduce((total, claim) => total + claim.photoCount, 0)),
        },
        {
          label: "Estimate pipeline",
          note: "Current estimated value across active claims.",
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
      ]}
      title="Pending Claims"
    />
  );
}
