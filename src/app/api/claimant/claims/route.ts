import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/services/auth.service";
import {
  filterActionRequiredClaimantClaims,
  filterClosedClaimantClaims,
  filterInProgressClaimantClaims,
  getClaimantClaims,
  sumEstimateTotals,
} from "@/features/claims/services/claims.service";
import { getUserProfile } from "@/features/profiles/services/profile.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(user.id);

  if (profile?.role !== "claimant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const claims = await getClaimantClaims(user.id);
  const actionRequiredClaims = filterActionRequiredClaimantClaims(claims);
  const inProgressClaims = filterInProgressClaimantClaims(claims);
  const closedClaims = filterClosedClaimantClaims(claims);

  return NextResponse.json(
    {
      claims,
      recentClaims: claims.slice(0, 8),
      actionRequiredClaims,
      inProgressClaims,
      closedClaims,
      totals: {
        all: claims.length,
        actionRequired: actionRequiredClaims.length,
        inProgress: inProgressClaims.length,
        closed: closedClaims.length,
        estimateTotal: sumEstimateTotals(claims),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

