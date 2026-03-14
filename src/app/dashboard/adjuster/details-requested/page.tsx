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

export default async function AdjusterDetailsRequestedPage({ searchParams }: AdjusterPageProps) {
  const { user } = await requireDashboardRole("adjuster");
  const claims = filterClaimsByStatus(await getAdjusterClaims(user.id), "DetailsRequested");
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={claims}
      description={claimStatusCopy.DetailsRequested}
      emptyDescription="Claims waiting for claimant response will appear here."
      emptyTitle="No claims awaiting details"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      getClaimHref={(claim) => getAdjusterClaimDetailHref(claim.id, claim.status)}
      guides={[
        {
          description: "These files are paused until claimant submits the requested details.",
          title: "Waiting state",
        },
        {
          description: "Once claimant responds, the claim returns to Reviewing automatically.",
          title: "Return to review",
        },
      ]}
      stats={[
        {
          label: "Awaiting details",
          note: "Claims currently waiting for claimant response.",
          value: String(claims.length),
        },
        {
          label: "Photos attached",
          note: "Evidence assets already available on these files.",
          value: String(claims.reduce((total, claim) => total + claim.photoCount, 0)),
        },
        {
          label: "Needs claimant action",
          note: "Files blocked until claimant submits details.",
          value: String(claims.length),
        },
      ]}
      title="Awaiting Details"
    />
  );
}
