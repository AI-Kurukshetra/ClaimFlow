"use client";

import { useSearchParams } from "next/navigation";

import { useClaimantClaimsPayload } from "@/features/claims/components/claimant-claims-data";
import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import { formatClaimCurrency } from "@/features/claims/services/claim-display.service";
import { getClaimantClaimDetailHref } from "@/features/claims/services/claim-status-routing";

export default function ActionRequiredPage() {
  const searchParams = useSearchParams();
  const { payload, error, isLoading } = useClaimantClaimsPayload();
  const claims = payload?.actionRequiredClaims ?? [];
  const estimateTotal = claims.reduce((total, claim) => total + (claim.estimateTotal ?? 0), 0);
  const queryError = searchParams.get("error");
  const queryMessage = searchParams.get("message");

  return (
    <ClaimsWorkspace
      claims={claims}
      description={
        isLoading && !payload
          ? "Loading claims waiting for your response..."
          : "Handle claims waiting for your response: provide requested details or approve/request revision on estimates."
      }
      emptyDescription="No claims currently need your action."
      emptyTitle="No actions required"
      error={queryError ?? error ?? undefined}
      message={queryMessage ?? undefined}
      getClaimHref={(claim) => getClaimantClaimDetailHref(claim.id, claim.status)}
      stats={[
        {
          label: "Action required",
          note: "Claims waiting for your response.",
          value: String(claims.length),
        },
        {
          label: "Photos attached",
          note: "Supporting images across actionable claims.",
          value: String(claims.reduce((total, claim) => total + claim.photoCount, 0)),
        },
        {
          label: "Estimate value",
          note: "Total estimated value in this action queue.",
          value: formatClaimCurrency(estimateTotal, "$0"),
        },
      ]}
      title="Action Required"
    />
  );
}
