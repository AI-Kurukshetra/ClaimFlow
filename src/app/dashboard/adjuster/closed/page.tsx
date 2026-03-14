import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  claimStatusCopy,
  filterClaimsByStatus,
  getAdjusterClaims,
  sumEstimateTotals,
} from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type AdjusterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdjusterClosedPage({ searchParams }: AdjusterPageProps) {
  const { user } = await requireDashboardRole("adjuster");
  const claims = filterClaimsByStatus(await getAdjusterClaims(user.id), "Closed");
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={claims}
      description={claimStatusCopy.Closed}
      emptyDescription="Completed files will appear here once claimant confirmation is done."
      emptyTitle="No closed claims"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      stats={[
        {
          label: "Closed files",
          note: "Claims fully completed in your assignment queue.",
          value: String(claims.length),
        },
        {
          label: "Resolved amount",
          note: "Total estimate value across closed claims.",
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
        {
          label: "Archived photos",
          note: "Images retained with closed records.",
          value: String(claims.reduce((total, claim) => total + claim.photoCount, 0)),
        },
      ]}
      title="Closed"
    />
  );
}
