import { redirect } from "next/navigation";

import { ClaimPhotosView } from "@/features/claims/components/claim-photos-view";
import { getSignedPhotosForClaim } from "@/features/claims/services/claim-photos.service";
import { getClaimantClaims } from "@/features/claims/services/claims.service";
import {
  getClaimantClaimDetailHref,
  getClaimantClaimPhotosHref,
  getStatusFromSlug,
} from "@/features/claims/services/claim-status-routing";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type ClaimantClaimPhotosPageProps = {
  params: Promise<{ claimId: string; status: string }>;
};

export default async function ClaimantClaimPhotosPage({ params }: ClaimantClaimPhotosPageProps) {
  const { claimId, status } = await params;
  const { user } = await requireDashboardRole("claimant");
  const claims = await getClaimantClaims(user.id);
  const claim = claims.find((entry) => entry.id === claimId);

  if (!claim) {
    redirect("/dashboard/claimant/in-progress?error=Claim%20not%20found.");
  }

  const statusFromPath = getStatusFromSlug(status);

  if (statusFromPath !== claim.status) {
    redirect(getClaimantClaimPhotosHref(claim.id, claim.status));
  }

  const photos = await getSignedPhotosForClaim(claim.id);

  return (
    <ClaimPhotosView
      backHref={getClaimantClaimDetailHref(claim.id, claim.status)}
      claimRef={claim.refNumber ?? "Claim Photos"}
      photos={photos}
    />
  );
}
