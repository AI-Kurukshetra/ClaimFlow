import { redirect } from "next/navigation";

import { ClaimantAmountRequestForm } from "@/features/claims/components/claimant-amount-request-form";
import { ClaimantClaimConfirmationForm } from "@/features/claims/components/claimant-claim-confirmation-form";
import { ClaimantDetailsResponseForm } from "@/features/claims/components/claimant-details-response-form";
import { ClaimDetailsView } from "@/features/claims/components/claim-details-view";
import type { DashboardClaim } from "@/features/claims/services/claims.service";
import { claimStatusCopy, getClaimantClaims } from "@/features/claims/services/claims.service";
import {
  getClaimantClaimDetailHref,
  getClaimantClaimPhotosHref,
  getClaimantQueueHrefForStatus,
  getStatusFromSlug,
} from "@/features/claims/services/claim-status-routing";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type ClaimantClaimDetailsPageProps = {
  params: Promise<{ claimId: string; status: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildRedirectPath(pathname: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return `${pathname}?${params.toString()}`;
}

function appendFeedback(pathname: string, error?: string, message?: string) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  if (message) {
    params.set("message", message);
  }

  return params.size ? `${pathname}?${params.toString()}` : pathname;
}

function getClaimantActionContent(claim: DashboardClaim, redirectTo: string) {
  switch (claim.status) {
    case "DetailsRequested":
      return <ClaimantDetailsResponseForm claimId={claim.id} redirectTo={redirectTo} />;
    case "Approved":
      return (
        <>
          <p className="claim-action-note">Approve to close, or request a higher amount with justification.</p>
          <ClaimantClaimConfirmationForm claimId={claim.id} redirectTo={redirectTo} />
          <ClaimantAmountRequestForm claimId={claim.id} redirectTo={redirectTo} />
        </>
      );
    case "Reviewing":
    case "Estimated":
      return <p className="claim-action-note">This claim is being handled by the adjuster right now.</p>;
    case "Closed":
      return <p className="claim-action-note">This claim is closed and no further action is required.</p>;
    default:
      return null;
  }
}

export default async function ClaimantClaimDetailsPage({ params, searchParams }: ClaimantClaimDetailsPageProps) {
  const [{ claimId, status }, query] = await Promise.all([params, searchParams]);
  const { user } = await requireDashboardRole("claimant");
  const claims = await getClaimantClaims(user.id);
  const claim = claims.find((entry) => entry.id === claimId);

  if (!claim) {
    redirect(buildRedirectPath("/dashboard/claimant/in-progress", "error", "Claim not found."));
  }

  const error = getParamValue(query.error);
  const message = getParamValue(query.message);
  const statusFromPath = getStatusFromSlug(status);
  const canonicalHref = getClaimantClaimDetailHref(claim.id, claim.status);

  if (statusFromPath !== claim.status) {
    redirect(appendFeedback(canonicalHref, error, message));
  }

  const queueHref = getClaimantQueueHrefForStatus(claim.status);

  return (
    <ClaimDetailsView
      actionContent={getClaimantActionContent(claim, canonicalHref)}
      backHref={queueHref}
      backLabel="Back to queue"
      claim={claim}
      description={claimStatusCopy[claim.status]}
      error={error}
      message={message}
      photosHref={getClaimantClaimPhotosHref(claim.id, claim.status)}
      title={claim.refNumber ?? "Claim Details"}
    />
  );
}
