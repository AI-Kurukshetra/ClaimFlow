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

export default async function AdjusterApprovedPage({ searchParams }: AdjusterPageProps) {
  const { user } = await requireDashboardRole("adjuster");
  const claims = filterClaimsByStatus(await getAdjusterClaims(user.id), "Approved");
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={claims}
      description={claimStatusCopy.Approved}
      emptyDescription="Approved claims will stay here until the claimant confirms them."
      emptyTitle="No approved claims"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      guides={[
        {
          description: "This queue is read-only for adjusters and waits for claimant confirmation.",
          title: "Waiting state",
        },
        {
          description: "Once the claimant confirms, the claim moves automatically to Closed.",
          title: "Closure handoff",
        },
      ]}
      stats={[
        {
          label: "Approved claims",
          note: "Files waiting for claimant confirmation.",
          value: String(claims.length),
        },
        {
          label: "Approved value",
          note: "Combined estimate total in confirmation queue.",
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
        {
          label: "Awaiting confirmation",
          note: "Approved claims not yet closed by claimant.",
          value: String(claims.length),
        },
      ]}
      title="Approved"
    />
  );
}
