import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  claimStatusCopy,
  filterClaimsByStatus,
  getAdjusterClaims,
  sumEstimateTotals,
} from "@/features/claims/services/claims.service";
import { getAdjusterClaimDetailHref } from "@/features/claims/services/claim-status-routing";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type AdjusterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdjusterEstimatedPage({ searchParams }: AdjusterPageProps) {
  const { user } = await requireDashboardRole("adjuster");
  const claims = filterClaimsByStatus(await getAdjusterClaims(user.id), "Estimated");
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={claims}
      description={claimStatusCopy.Estimated}
      emptyDescription="Claims waiting for estimate amount entry will appear here."
      emptyTitle="No estimated claims"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      getClaimHref={(claim) => getAdjusterClaimDetailHref(claim.id, claim.status)}
      guides={[
        {
          description: "Open a claim to enter the final estimate amount and send it to client approval.",
          title: "Amount submission",
        },
        {
          description: "Use notes for rationale so the claimant has complete context before confirmation.",
          title: "Claim communication",
        },
      ]}
      stats={[
        {
          label: "Estimated claims",
          note: "Files waiting for amount entry.",
          value: String(claims.length),
        },
        {
          label: "Estimate total",
          note: "Combined value of prepared estimates.",
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
        {
          label: "Ready for approval",
          note: "Claims that will move to Approved after save.",
          value: String(claims.length),
        },
      ]}
      title="Estimation"
    />
  );
}
