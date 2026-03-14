"use client";

import { useClaimantClaimsPayload } from "@/features/claims/components/claimant-claims-data";
import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import { formatClaimCurrency } from "@/features/claims/services/claim-display.service";
import { getClaimantClaimDetailHref } from "@/features/claims/services/claim-status-routing";

export default function PreviousClaimsPage() {
  const { payload, error, isLoading } = useClaimantClaimsPayload();
  const claims = payload?.closedClaims ?? [];
  const estimateTotal = claims.reduce((total, claim) => total + (claim.estimateTotal ?? 0), 0);

  return (
    <ClaimsWorkspace
      claims={claims}
      description={
        isLoading && !payload
          ? "Loading closed claims..."
          : "Closed claims stay here as your completed history. Use this page to review prior outcomes and reference past incidents."
      }
      emptyDescription="Completed claims will appear here after the workflow reaches the closed state."
      emptyTitle="No previous claims"
      error={error ?? undefined}
      getClaimHref={(claim) => getClaimantClaimDetailHref(claim.id, claim.status)}
      stats={[
        {
          label: "Closed claims",
          note: "Files that have completed the full lifecycle.",
          value: String(claims.length),
        },
        {
          label: "Resolved estimates",
          note: "Final estimated amount across closed claims.",
          value: formatClaimCurrency(estimateTotal, "$0"),
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
