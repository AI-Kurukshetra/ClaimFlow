import { AdjusterClaimActionForm } from "@/features/claims/components/adjuster-claim-action-form";
import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  claimStatusCopy,
  filterClaimsByStatus,
  getAdjusterClaims,
} from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type AdjusterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdjusterReviewingPage({ searchParams }: AdjusterPageProps) {
  const { user } = await requireDashboardRole("adjuster");
  const claims = filterClaimsByStatus(await getAdjusterClaims(user.id), "Reviewing");
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={claims}
      description={claimStatusCopy.Reviewing}
      emptyDescription="Claims being actively validated will appear here."
      emptyTitle="No claims under review"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      guides={[
        {
          description: "Either move the claim to Estimation or request additional details from the claimant.",
          title: "Review decisions",
        },
        {
          description: "Check evidence quality and claim consistency before sending the file to estimating.",
          title: "Validation gate",
        },
      ]}
      renderClaimActions={(claim) => (
        <AdjusterClaimActionForm claimId={claim.id} mode="reviewing" redirectTo="/dashboard/adjuster/reviewing" />
      )}
      stats={[
        {
          label: "In review",
          note: "Claims currently being validated.",
          value: String(claims.length),
        },
        {
          label: "Photos in review",
          note: "Evidence assets available on these files.",
          value: String(claims.reduce((total, claim) => total + claim.photoCount, 0)),
        },
        {
          label: "High attention",
          note: "Claims with fraud score already present.",
          value: String(claims.filter((claim) => Boolean(claim.fraudScore)).length),
        },
      ]}
      title="Reviewing"
    />
  );
}

