"use client";

import { useClaimantClaimsPayload } from "@/features/claims/components/claimant-claims-data";
import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import { formatClaimCurrency } from "@/features/claims/services/claim-display.service";
import { getClaimantClaimDetailHref } from "@/features/claims/services/claim-status-routing";

export default function InProgressClaimsPage() {
  const { payload, error, isLoading } = useClaimantClaimsPayload();
  const claims = payload?.inProgressClaims ?? [];
  const estimateTotal = claims.reduce((total, claim) => total + (claim.estimateTotal ?? 0), 0);

  return (
    <ClaimsWorkspace
      claims={claims}
      description={
        isLoading && !payload
          ? "Loading in-progress claims..."
          : "These claims are in adjuster hands for review or estimation."
      }
      emptyDescription="No claims are currently in progress."
      emptyTitle="No in-progress claims"
      error={error ?? undefined}
      getClaimHref={(claim) => getClaimantClaimDetailHref(claim.id, claim.status)}
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
          value: formatClaimCurrency(estimateTotal, "$0"),
        },
      ]}
      title="In Progress"
    />
  );
}
