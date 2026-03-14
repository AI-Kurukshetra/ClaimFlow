import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClaimRecord = {
  id: string;
  claimant_id: string | null;
  adjuster_id: string | null;
  ref_number: string | null;
  status: string | null;
  description: string | null;
  vehicle_info: Record<string, unknown> | null;
  incident_date: string | null;
  fraud_score: string | null;
  created_at: string | null;
};

export type EstimateRecord = {
  id: string;
  claim_id: string;
  line_items: Record<string, unknown>[] | null;
  total_amount: number | null;
  adjuster_notes: string | null;
  created_at: string | null;
};

export type PhotoRecord = {
  id: string;
  claim_id: string;
  storage_path: string;
  analyzed_at: string | null;
};

export type ClaimInspectionRecord = {
  id: string;
  claim_id: string;
  scheduled_for: string;
  provider_type: string;
  requested_by: string;
  requested_by_role: string;
  reason: string;
  status: string;
  notes: string | null;
  requester_timezone: string | null;
  created_at: string | null;
};

export function isMissingClaimInspectionsTableError(message: string | undefined) {
  if (!message) {
    return false;
  }

  const lower = message.toLowerCase();

  return lower.includes("claim_inspections") && (lower.includes("schema cache") || lower.includes("could not find the table") || lower.includes("does not exist"));
}

export async function listClaimsForClaimant(claimantId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("claims")
    .select("id, claimant_id, adjuster_id, ref_number, status, description, vehicle_info, incident_date, fraud_score, created_at")
    .eq("claimant_id", claimantId)
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as ClaimRecord[], error };
}

export async function listClaimsForAdjuster(_adjusterId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("claims")
    .select("id, claimant_id, adjuster_id, ref_number, status, description, vehicle_info, incident_date, fraud_score, created_at")
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as ClaimRecord[], error };
}

export async function getClaimById(claimId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("claims")
    .select("id, claimant_id, adjuster_id, ref_number, status, description, vehicle_info, incident_date, fraud_score, created_at")
    .eq("id", claimId)
    .maybeSingle<ClaimRecord>();

  return { data, error };
}

export async function createClaim(input: {
  id?: string;
  claimantId: string;
  adjusterId: string | null;
  description: string;
  incidentDate: string;
  refNumber: string;
  status?: string;
  vehicleInfo: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();

  const insertPayload: {
    id?: string;
    claimant_id: string;
    adjuster_id: string | null;
    ref_number: string;
    status?: string;
    description: string;
    incident_date: string;
    vehicle_info: Record<string, unknown>;
  } = {
    claimant_id: input.claimantId,
    adjuster_id: input.adjusterId,
    ref_number: input.refNumber,
    description: input.description,
    incident_date: input.incidentDate,
    vehicle_info: input.vehicleInfo,
  };

  if (input.id) {
    insertPayload.id = input.id;
  }

  if (input.status) {
    insertPayload.status = input.status;
  }

  const { data, error } = await supabase
    .from("claims")
    .insert(insertPayload)
    .select("id, claimant_id, adjuster_id, ref_number, status, description, vehicle_info, incident_date, fraud_score, created_at")
    .single<ClaimRecord>();

  return { data, error };
}

export async function updateClaimForAdjuster(input: {
  claimId: string;
  adjusterId: string;
  status: string;
  description?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const updatePayload: {
    adjuster_id: string;
    status: string;
    description?: string;
  } = {
    adjuster_id: input.adjusterId,
    status: input.status,
  };

  if (typeof input.description === "string") {
    updatePayload.description = input.description;
  }

  const { data, error } = await supabase
    .from("claims")
    .update(updatePayload)
    .eq("id", input.claimId)
    .or(`adjuster_id.eq.${input.adjusterId},adjuster_id.is.null`)
    .select("id, claimant_id, adjuster_id, ref_number, status, description, vehicle_info, incident_date, fraud_score, created_at")
    .single<ClaimRecord>();

  return { data, error };
}

export async function updateClaimForClaimant(input: {
  claimId: string;
  claimantId: string;
  expectedStatuses: string[];
  updates: {
    status: string;
    description?: string;
  };
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("claims")
    .update(input.updates)
    .eq("id", input.claimId)
    .eq("claimant_id", input.claimantId);

  if (input.expectedStatuses.length === 1) {
    query = query.eq("status", input.expectedStatuses[0]);
  } else {
    query = query.in("status", input.expectedStatuses);
  }

  const { data, error } = await query
    .select("id, claimant_id, adjuster_id, ref_number, status, description, vehicle_info, incident_date, fraud_score, created_at")
    .single<ClaimRecord>();

  return { data, error };
}

export async function upsertEstimate(input: {
  claimId: string;
  adjusterNotes: string | null;
  lineItems: Record<string, unknown>[];
  totalAmount: number | null;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("estimates")
    .upsert(
      {
        claim_id: input.claimId,
        line_items: input.lineItems,
        total_amount: input.totalAmount,
        adjuster_notes: input.adjusterNotes,
      },
      { onConflict: "claim_id" },
    )
    .select("id, claim_id, line_items, total_amount, adjuster_notes, created_at")
    .single<EstimateRecord>();

  return { data, error };
}

export async function getEstimateByClaimId(claimId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("estimates")
    .select("id, claim_id, line_items, total_amount, adjuster_notes, created_at")
    .eq("claim_id", claimId)
    .maybeSingle<EstimateRecord>();

  return { data, error };
}

export async function createPhotoRecords(input: {
  claimId: string;
  storagePaths: string[];
}) {
  if (input.storagePaths.length === 0) {
    return { data: [] as PhotoRecord[], error: null };
  }

  const supabase = await createSupabaseServerClient();

  const payload = input.storagePaths.map((storagePath) => ({
    claim_id: input.claimId,
    storage_path: storagePath,
  }));

  const { data, error } = await supabase
    .from("photos")
    .insert(payload)
    .select("id, claim_id, storage_path, analyzed_at");

  return { data: (data ?? []) as PhotoRecord[], error };
}

export async function createClaimInspection(input: {
  claimId: string;
  notes: string | null;
  providerType: string;
  reason: string;
  requestedBy: string;
  requestedByRole: string;
  requesterTimezone: string;
  scheduledFor: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("claim_inspections")
    .insert({
      claim_id: input.claimId,
      notes: input.notes,
      provider_type: input.providerType,
      reason: input.reason,
      requested_by: input.requestedBy,
      requested_by_role: input.requestedByRole,
      requester_timezone: input.requesterTimezone,
      scheduled_for: input.scheduledFor,
    })
    .select(
      "id, claim_id, scheduled_for, provider_type, requested_by, requested_by_role, reason, status, notes, requester_timezone, created_at",
    )
    .single<ClaimInspectionRecord>();

  return { data, error };
}

export async function getClaimInspectionsByClaimId(claimId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("claim_inspections")
    .select(
      "id, claim_id, scheduled_for, provider_type, requested_by, requested_by_role, reason, status, notes, requester_timezone, created_at",
    )
    .eq("claim_id", claimId)
    .order("scheduled_for", { ascending: true });

  if (isMissingClaimInspectionsTableError(error?.message)) {
    return { data: [] as ClaimInspectionRecord[], error: null };
  }

  return { data: (data ?? []) as ClaimInspectionRecord[], error };
}

export async function listEstimatesForClaimIds(claimIds: string[]) {
  if (claimIds.length === 0) {
    return { data: [] as EstimateRecord[], error: null };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("estimates")
    .select("id, claim_id, line_items, total_amount, adjuster_notes, created_at")
    .in("claim_id", claimIds)
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as EstimateRecord[], error };
}

export async function listPhotosForClaimIds(claimIds: string[]) {
  if (claimIds.length === 0) {
    return { data: [] as PhotoRecord[], error: null };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("photos")
    .select("id, claim_id, storage_path, analyzed_at")
    .in("claim_id", claimIds);

  return { data: (data ?? []) as PhotoRecord[], error };
}

export async function listAdjusters() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "adjuster")
    .order("created_at", { ascending: true });

  return {
    data: (data ?? []) as { id: string }[],
    error,
  };
}