import { ClaimantAmountRequestForm } from "@/features/claims/components/claimant-amount-request-form";
import { ClaimantClaimConfirmationForm } from "@/features/claims/components/claimant-claim-confirmation-form";
import { ClaimantDetailsResponseForm } from "@/features/claims/components/claimant-details-response-form";
import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import {
  filterActionRequiredClaimantClaims,
  getClaimantClaims,
  sumEstimateTotals,
} from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type ActionRequiredPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ActionRequiredPage({ searchParams }: ActionRequiredPageProps) {
  const { user } = await requireDashboardRole("claimant");
  const claims = filterActionRequiredClaimantClaims(await getClaimantClaims(user.id));
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={claims}
      description="Handle claims waiting for your response: provide requested details or approve/request revision on estimates."
      emptyDescription="No claims currently need your action."
      emptyTitle="No actions required"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      renderClaimActions={(claim) => {
        if (claim.status === "DetailsRequested") {
          return <ClaimantDetailsResponseForm claimId={claim.id} redirectTo="/dashboard/claimant/action-required" />;
        }

        if (claim.status === "Approved") {
          return (
            <>
              <p className="claim-action-note">Approve this estimate to close, or request a higher amount with justification.</p>
              <ClaimantClaimConfirmationForm claimId={claim.id} redirectTo="/dashboard/claimant/action-required" />
              <ClaimantAmountRequestForm claimId={claim.id} redirectTo="/dashboard/claimant/action-required" />
            </>
          );
        }

        return null;
      }}
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
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
      ]}
      title="Action Required"
    />
  );
}
