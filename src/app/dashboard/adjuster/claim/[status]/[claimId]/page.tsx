import { redirect } from "next/navigation";

import { AdjusterClaimActionForm } from "@/features/claims/components/adjuster-claim-action-form";
import { ClaimDetailsView } from "@/features/claims/components/claim-details-view";
import type { DashboardClaim } from "@/features/claims/services/claims.service";
import { claimStatusCopy, getAdjusterClaims } from "@/features/claims/services/claims.service";
import {
  getAdjusterClaimDetailHref,
  getAdjusterClaimPhotosHref,
  getAdjusterQueueHrefForStatus,
  getStatusFromSlug,
} from "@/features/claims/services/claim-status-routing";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type AdjusterClaimDetailsPageProps = {
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

function getAdjusterActionContent(claim: DashboardClaim, redirectTo: string) {
  switch (claim.status) {
    case "Reviewing":
      return <AdjusterClaimActionForm claimId={claim.id} mode="reviewing" redirectTo={redirectTo} />;
    case "Estimated":
      return <AdjusterClaimActionForm claimId={claim.id} mode="estimated" redirectTo={redirectTo} />;
    case "DetailsRequested":
      return <p className="claim-action-note">Waiting for claimant to submit the requested additional details.</p>;
    case "Approved":
      return <p className="claim-action-note">Waiting for claimant confirmation or higher amount request.</p>;
    case "Closed":
      return <p className="claim-action-note">This claim is closed and read-only.</p>;
    default:
      return null;
  }
}

export default async function AdjusterClaimDetailsPage({ params, searchParams }: AdjusterClaimDetailsPageProps) {
  const [{ claimId, status }, query] = await Promise.all([params, searchParams]);
  const { user } = await requireDashboardRole("adjuster");
  const claims = await getAdjusterClaims(user.id);
  const claim = claims.find((entry) => entry.id === claimId);

  if (!claim) {
    redirect(buildRedirectPath("/dashboard/adjuster/reviewing", "error", "Claim not found."));
  }

  const error = getParamValue(query.error);
  const message = getParamValue(query.message);
  const statusFromPath = getStatusFromSlug(status);
  const canonicalHref = getAdjusterClaimDetailHref(claim.id, claim.status);

  if (statusFromPath !== claim.status) {
    redirect(appendFeedback(canonicalHref, error, message));
  }

  const queueHref = getAdjusterQueueHrefForStatus(claim.status);

  return (
    <ClaimDetailsView
      actionContent={getAdjusterActionContent(claim, canonicalHref)}
      backHref={queueHref}
      backLabel="Back to queue"
      claim={claim}
      description={claimStatusCopy[claim.status]}
      error={error}
      message={message}
      photosHref={getAdjusterClaimPhotosHref(claim.id, claim.status)}
      title={claim.refNumber ?? "Claim Details"}
    />
  );
}
