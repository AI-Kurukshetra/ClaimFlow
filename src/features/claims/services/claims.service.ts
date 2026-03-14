import { cache } from "react";

import {
  listClaimsForAdjuster,
  listClaimsForClaimant,
  listEstimatesForClaimIds,
  listPhotosForClaimIds,
} from "@/features/claims/repositories/claims.repository";

export const claimStatuses = ["Reviewing", "Estimated", "Approved", "Closed"] as const;

export type ClaimStatus = (typeof claimStatuses)[number];

export type DashboardClaim = {
  createdAt: string | null;
  description: string | null;
  estimateTotal: number | null;
  fraudScore: string | null;
  id: string;
  incidentDate: string | null;
  photoCount: number;
  refNumber: string | null;
  status: ClaimStatus;
  vehicleLabel: string;
};

type DashboardNavigationItem = {
  count?: number;
  description: string;
  href: string;
  label: string;
};

export const claimStatusCopy: Record<ClaimStatus, string> = {
  Reviewing: "Claim is being reviewed and validated.",
  Estimated: "Damage and cost estimates are prepared.",
  Approved: "Claim is approved and waiting for claimant confirmation.",
  Closed: "Claim process is finished and archived.",
};

function normalizeClaimStatus(status: string | null): ClaimStatus {
  if (!status) {
    return "Reviewing";
  }

  if (claimStatuses.includes(status as ClaimStatus)) {
    return status as ClaimStatus;
  }

  const normalized = status.toLowerCase();

  switch (normalized) {
    case "intake":
    case "reviewing":
      return "Reviewing";
    case "estimated":
      return "Estimated";
    case "approved":
      return "Approved";
    case "closed":
      return "Closed";
    default:
      return "Reviewing";
  }
}

function formatVehicleLabel(vehicleInfo: Record<string, unknown> | null) {
  if (!vehicleInfo) {
    return "Vehicle details pending";
  }

  const year = typeof vehicleInfo.year === "string" || typeof vehicleInfo.year === "number" ? String(vehicleInfo.year) : null;
  const make = typeof vehicleInfo.make === "string" ? vehicleInfo.make : null;
  const model = typeof vehicleInfo.model === "string" ? vehicleInfo.model : null;
  const registration =
    typeof vehicleInfo.registration_number === "string"
      ? vehicleInfo.registration_number
      : typeof vehicleInfo.plate_number === "string"
        ? vehicleInfo.plate_number
        : null;

  const label = [year, make, model].filter(Boolean).join(" ");

  if (label && registration) {
    return `${label} - ${registration}`;
  }

  return label || registration || "Vehicle details pending";
}

function enrichClaims(
  claims: Awaited<ReturnType<typeof listClaimsForClaimant>>["data"],
  estimateMap: Map<string, number | null>,
  photoCountMap: Map<string, number>,
) {
  return claims.map((claim) => ({
    createdAt: claim.created_at,
    description: claim.description,
    estimateTotal: estimateMap.get(claim.id) ?? null,
    fraudScore: claim.fraud_score,
    id: claim.id,
    incidentDate: claim.incident_date,
    photoCount: photoCountMap.get(claim.id) ?? 0,
    refNumber: claim.ref_number,
    status: normalizeClaimStatus(claim.status),
    vehicleLabel: formatVehicleLabel(claim.vehicle_info),
  }));
}

async function getEnrichedClaims(fetchClaims: () => ReturnType<typeof listClaimsForClaimant>) {
  const { data: claims } = await fetchClaims();
  const claimIds = claims.map((claim) => claim.id);
  const [{ data: estimates }, { data: photos }] = await Promise.all([
    listEstimatesForClaimIds(claimIds),
    listPhotosForClaimIds(claimIds),
  ]);

  const estimateMap = new Map<string, number | null>();

  estimates.forEach((estimate) => {
    if (!estimateMap.has(estimate.claim_id)) {
      estimateMap.set(estimate.claim_id, estimate.total_amount);
    }
  });

  const photoCountMap = new Map<string, number>();

  photos.forEach((photo) => {
    photoCountMap.set(photo.claim_id, (photoCountMap.get(photo.claim_id) ?? 0) + 1);
  });

  return enrichClaims(claims, estimateMap, photoCountMap);
}

export const getClaimantClaims = cache(async (claimantId: string) =>
  getEnrichedClaims(() => listClaimsForClaimant(claimantId)),
);

export const getAdjusterClaims = cache(async (adjusterId: string) =>
  getEnrichedClaims(() => listClaimsForAdjuster(adjusterId)),
);

export function filterClaimsByStatus(claims: DashboardClaim[], status: ClaimStatus) {
  return claims.filter((claim) => claim.status === status);
}

export function filterActiveClaimantClaims(claims: DashboardClaim[]) {
  return claims.filter((claim) => claim.status !== "Closed");
}

export function filterClosedClaimantClaims(claims: DashboardClaim[]) {
  return claims.filter((claim) => claim.status === "Closed");
}

export function sumEstimateTotals(claims: DashboardClaim[]) {
  return claims.reduce((total, claim) => total + (claim.estimateTotal ?? 0), 0);
}

export function buildClaimantNavigation(claims: DashboardClaim[]): DashboardNavigationItem[] {
  const activeClaims = filterActiveClaimantClaims(claims);
  const closedClaims = filterClosedClaimantClaims(claims);

  return [
    {
      description: "Start a new incident file and review the required evidence.",
      href: "/dashboard/claimant/add-claims",
      label: "Add Claims",
    },
    {
      count: activeClaims.length,
      description: "Track claims that are still moving through review, estimating, and approval.",
      href: "/dashboard/claimant/pending-claims",
      label: "Pending Claims",
    },
    {
      count: closedClaims.length,
      description: "Review archived claims that have been fully completed.",
      href: "/dashboard/claimant/previous-claims",
      label: "Previous Claims",
    },
  ];
}

export function buildAdjusterNavigation(claims: DashboardClaim[]): DashboardNavigationItem[] {
  return claimStatuses.map((status) => ({
    count: filterClaimsByStatus(claims, status).length,
    description: claimStatusCopy[status],
    href: `/dashboard/adjuster/${status.toLowerCase()}`,
    label: status,
  }));
}
