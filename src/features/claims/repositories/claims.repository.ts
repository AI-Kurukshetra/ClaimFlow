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
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("claims")
    .update({
      adjuster_id: input.adjusterId,
      status: input.status,
    })
    .eq("id", input.claimId)
    .or(`adjuster_id.eq.${input.adjusterId},adjuster_id.is.null`)
    .select("id, claimant_id, adjuster_id, ref_number, status, description, vehicle_info, incident_date, fraud_score, created_at")
    .single<ClaimRecord>();

  return { data, error };
}

export async function updateClaimForClaimant(input: {
  claimId: string;
  claimantId: string;
  status: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("claims")
    .update({
      status: input.status,
    })
    .eq("id", input.claimId)
    .eq("claimant_id", input.claimantId)
    .eq("status", "Approved")
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
