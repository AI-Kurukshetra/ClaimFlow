import { redirect } from "next/navigation";

import { ClaimPhotosView } from "@/features/claims/components/claim-photos-view";
import { getSignedPhotosForClaim } from "@/features/claims/services/claim-photos.service";
import { getAdjusterClaims } from "@/features/claims/services/claims.service";
import {
  getAdjusterClaimDetailHref,
  getAdjusterClaimPhotosHref,
  getStatusFromSlug,
} from "@/features/claims/services/claim-status-routing";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type AdjusterClaimPhotosPageProps = {
  params: Promise<{ claimId: string; status: string }>;
};

export default async function AdjusterClaimPhotosPage({ params }: AdjusterClaimPhotosPageProps) {
  const { claimId, status } = await params;
  const { user } = await requireDashboardRole("adjuster");
  const claims = await getAdjusterClaims(user.id);
  const claim = claims.find((entry) => entry.id === claimId);

  if (!claim) {
    redirect("/dashboard/adjuster/reviewing?error=Claim%20not%20found.");
  }

  const statusFromPath = getStatusFromSlug(status);

  if (statusFromPath !== claim.status) {
    redirect(getAdjusterClaimPhotosHref(claim.id, claim.status));
  }

  const photos = await getSignedPhotosForClaim(claim.id);

  return (
    <ClaimPhotosView
      backHref={getAdjusterClaimDetailHref(claim.id, claim.status)}
      claimRef={claim.refNumber ?? "Claim Photos"}
      photos={photos}
    />
  );
}
