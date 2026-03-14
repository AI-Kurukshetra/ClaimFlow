import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/features/auth/services/auth.service";
import { filterClaimsByStatus, getAdjusterClaims } from "@/features/claims/services/claims.service";
import { getUserProfile } from "@/features/profiles/services/profile.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(user.id);

  if (profile?.role !== "adjuster") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const claims = await getAdjusterClaims(user.id);

  const reviewingCount = filterClaimsByStatus(claims, "Reviewing").length;
  const detailsRequestedCount = filterClaimsByStatus(claims, "DetailsRequested").length;
  const estimatedCount = filterClaimsByStatus(claims, "Estimated").length;
  const approvedCount = filterClaimsByStatus(claims, "Approved").length;
  const closedCount = filterClaimsByStatus(claims, "Closed").length;

  return NextResponse.json(
    {
      totals: {
        reviewing: reviewingCount,
        detailsRequested: detailsRequestedCount,
        estimated: estimatedCount,
        approved: approvedCount,
        closed: closedCount,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
