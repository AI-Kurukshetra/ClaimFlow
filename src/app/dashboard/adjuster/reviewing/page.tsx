import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  claimStatusCopy,
  filterClaimsByStatus,
  getAdjusterClaims,
} from "@/features/claims/services/claims.service";
import { getAdjusterClaimDetailHref } from "@/features/claims/services/claim-status-routing";
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
      getClaimHref={(claim) => getAdjusterClaimDetailHref(claim.id, claim.status)}
      guides={[
        {
          description: "Open a claim and either move it to Estimation or request additional claimant details.",
          title: "Review decisions",
        },
        {
          description: "Check evidence quality and claim consistency before sending the file to estimating.",
          title: "Validation gate",
        },
      ]}
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
