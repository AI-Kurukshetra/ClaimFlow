"use client";

import { useEffect, useState } from "react";

export type ClaimStatus = "Reviewing" | "DetailsRequested" | "Estimated" | "Approved" | "Closed";

export type DashboardClaimDto = {
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

type ClaimantClaimsTotals = {
  actionRequired: number;
  all: number;
  closed: number;
  estimateTotal: number;
  inProgress: number;
};

export type ClaimantClaimsPayload = {
  actionRequiredClaims: DashboardClaimDto[];
  claims: DashboardClaimDto[];
  closedClaims: DashboardClaimDto[];
  inProgressClaims: DashboardClaimDto[];
  recentClaims: DashboardClaimDto[];
  totals: ClaimantClaimsTotals;
};

let cachedPayload: ClaimantClaimsPayload | null = null;
let pendingPayloadRequest: Promise<ClaimantClaimsPayload> | null = null;

async function fetchClaimantClaimsPayload() {
  const response = await fetch("/api/claimant/claims", {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = `Failed to load claimant claims (${response.status}).`;

    try {
      const payload = (await response.json()) as { error?: string };

      if (typeof payload.error === "string" && payload.error.trim().length > 0) {
        errorMessage = payload.error;
      }
    } catch {
      // Ignore invalid JSON body and use default message.
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as ClaimantClaimsPayload;
}

async function loadClaimantClaimsPayload() {
  if (cachedPayload) {
    return cachedPayload;
  }

  if (!pendingPayloadRequest) {
    pendingPayloadRequest = fetchClaimantClaimsPayload()
      .then((payload) => {
        cachedPayload = payload;
        return payload;
      })
      .finally(() => {
        pendingPayloadRequest = null;
      });
  }

  return pendingPayloadRequest;
}

export function useClaimantClaimsPayload(enabled = true) {
  const [payload, setPayload] = useState<ClaimantClaimsPayload | null>(cachedPayload);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled && !cachedPayload);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let active = true;

    loadClaimantClaimsPayload()
      .then((data) => {
        if (!active) {
          return;
        }

        setPayload(data);
        setError(null);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Unable to load claimant data.");
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return {
    payload,
    error,
    isLoading,
  };
}