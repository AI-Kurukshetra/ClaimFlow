"use client";

import { useEffect, useState } from "react";

type AdjusterClaimsTotals = {
  approved: number;
  closed: number;
  detailsRequested: number;
  estimated: number;
  reviewing: number;
};

export type AdjusterClaimsPayload = {
  totals: AdjusterClaimsTotals;
};

let cachedPayload: AdjusterClaimsPayload | null = null;
let pendingPayloadRequest: Promise<AdjusterClaimsPayload> | null = null;

async function fetchAdjusterClaimsPayload() {
  const response = await fetch("/api/adjuster/claims", {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = `Failed to load adjuster claims (${response.status}).`;

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

  return (await response.json()) as AdjusterClaimsPayload;
}

async function loadAdjusterClaimsPayload() {
  if (cachedPayload) {
    return cachedPayload;
  }

  if (!pendingPayloadRequest) {
    pendingPayloadRequest = fetchAdjusterClaimsPayload()
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

export function useAdjusterClaimsPayload(enabled = true) {
  const [payload, setPayload] = useState<AdjusterClaimsPayload | null>(cachedPayload);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled && !cachedPayload);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let active = true;

    loadAdjusterClaimsPayload()
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

        setError(requestError instanceof Error ? requestError.message : "Unable to load adjuster data.");
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