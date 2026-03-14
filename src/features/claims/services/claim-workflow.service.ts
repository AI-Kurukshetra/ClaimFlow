import { randomUUID } from "crypto";

import {
  createClaim,
  createClaimInspection,
  createPhotoRecords,
  getClaimById,
  getEstimateByClaimId,
  isMissingClaimInspectionsTableError,
  updateClaimForClaimant,
  upsertEstimate,
  updateClaimForAdjuster,
} from "@/features/claims/repositories/claims.repository";
import { claimStatuses, type ClaimStatus } from "@/features/claims/services/claims.service";
import {
  formatInspectionProviderLabel,
  hasHigherAmountRevisionRequest,
  isClaimInspectionReason,
  isInspectionProviderType,
  type ClaimInspectionReason,
  type InspectionProviderType,
} from "@/features/claims/services/claim-inspection.service";
import { generateDamageAssessmentForClaim } from "@/features/claims/services/damage-assessment.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClaimSubmissionPayload = {
  description: string;
  incidentDate: string;
  photoFiles: File[];
  plateNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
};

export type AdjusterUpdatePayload = {
  adjusterNotes: string;
  claimId: string;
  redirectTo: string;
  status: ClaimStatus;
  totalAmountRaw: string;
};

export type ClaimantConfirmationPayload = {
  claimId: string;
  redirectTo: string;
};

export type ClaimantDetailsPayload = {
  additionalDetails: string;
  claimId: string;
  redirectTo: string;
};

export type ClaimantAmountRequestPayload = {
  claimId: string;
  providerType: InspectionProviderType;
  redirectTo: string;
  requestedAmountRaw: string;
  scheduledForLocal: string;
  timezoneName: string;
  timezoneOffsetMinutesRaw: string;
};

export type ClaimInspectionSchedulePayload = {
  claimId: string;
  providerType: InspectionProviderType;
  reason: ClaimInspectionReason;
  redirectTo: string;
  scheduledForLocal: string;
  timezoneName: string;
  timezoneOffsetMinutesRaw: string;
};

const claimPhotosBucket = "claim-photos";

function sanitizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeClaimStatus(value: FormDataEntryValue | null): ClaimStatus {
  if (typeof value !== "string") {
    return "Reviewing";
  }

  return claimStatuses.includes(value as ClaimStatus) ? (value as ClaimStatus) : "Reviewing";
}

function sanitizeInspectionProviderType(value: FormDataEntryValue | null): InspectionProviderType {
  if (typeof value !== "string" || !isInspectionProviderType(value.trim())) {
    return "adjuster";
  }

  return value.trim() as InspectionProviderType;
}

function sanitizeInspectionReason(value: FormDataEntryValue | null): ClaimInspectionReason {
  if (typeof value !== "string" || !isClaimInspectionReason(value.trim())) {
    return "additional_details";
  }

  return value.trim() as ClaimInspectionReason;
}

function parseCurrency(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseScheduledForLocal(value: string, timezoneOffsetMinutesRaw: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const offsetMinutes = Number(timezoneOffsetMinutesRaw);

  if (!Number.isInteger(offsetMinutes) || offsetMinutes < -840 || offsetMinutes > 840) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const utcTimestamp =
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) + offsetMinutes * 60 * 1000;
  const parsedDate = new Date(utcTimestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function formatInspectionConfirmationDate(value: string, timeZone: string) {
  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };

  try {
    return new Intl.DateTimeFormat("en-US", {
      ...formatOptions,
      timeZone,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      ...formatOptions,
      timeZone: "UTC",
    }).format(new Date(value));
  }
}

function isClaimInspectionUnavailableError(message: string | undefined) {
  if (!message) {
    return false;
  }

  const lower = message.toLowerCase();

  return (
    lower.includes("claim_inspections") &&
    (
      lower.includes("schema cache") ||
      lower.includes("could not find the table") ||
      lower.includes("does not exist") ||
      lower.includes("row-level security") ||
      lower.includes("permission denied")
    )
  );
}

function buildInspectionScheduleNote(providerType: InspectionProviderType, scheduledFor: string, timezoneName: string) {
  const providerLabel = formatInspectionProviderLabel(providerType);
  const formattedDate = formatInspectionConfirmationDate(scheduledFor, timezoneName || "UTC");

  return `${providerLabel} virtual inspection scheduled for ${formattedDate}.`;
}

function normalizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function generateClaimRefNumber() {
  return `CLM-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function normalizeWorkflowStatus(status: string | null): ClaimStatus {
  if (!status) {
    return "Reviewing";
  }

  const normalized = status.toLowerCase();

  switch (normalized) {
    case "intake":
    case "reviewing":
      return "Reviewing";
    case "detailsrequested":
    case "details_requested":
      return "DetailsRequested";
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

function appendWorkflowNote(baseDescription: string | null, title: string, note: string) {
  const base = (baseDescription ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/\n{2,}/g, "\n");
  const timestamp = new Date().toISOString();
  const compactNote = note.trim().replace(/\s*\r?\n\s*/g, " ");
  const entry = `[${timestamp}] ${title}: ${compactNote}`;

  if (!base) {
    return entry;
  }

  return `${entry}\n${base}`;
}

function isLikelyStatusConstraintError(message: string | undefined) {
  if (!message) {
    return false;
  }

  const lower = message.toLowerCase();
  return lower.includes("claims_status_check") || lower.includes("check constraint") || lower.includes("violates check");
}

function isBucketNotFoundError(message: string | undefined) {
  if (!message) {
    return false;
  }

  return message.toLowerCase().includes("bucket not found");
}

function formatPhotoUploadError(message: string) {
  if (isBucketNotFoundError(message)) {
    return `Photo upload failed: storage bucket \"${claimPhotosBucket}\" was not found. Run the latest Supabase migrations and retry.`;
  }

  return `Photo upload failed: ${message}`;
}

function getDbStatusCandidates(selectedStatus: ClaimStatus, currentStatus: string | null) {
  const titleCaseStatus = selectedStatus;
  const lowerCaseStatus = selectedStatus.toLowerCase();

  const candidates =
    currentStatus && currentStatus === currentStatus.toLowerCase()
      ? [lowerCaseStatus, titleCaseStatus]
      : [titleCaseStatus, lowerCaseStatus];

  return Array.from(new Set(candidates));
}

function getOptionalSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

async function ensureClaimPhotosBucketExists(adminClient: NonNullable<ReturnType<typeof getOptionalSupabaseAdminClient>>) {
  const { error } = await adminClient.storage.createBucket(claimPhotosBucket, {
    public: false,
  });

  if (!error) {
    return null;
  }

  const normalizedMessage = error.message.toLowerCase();

  if (normalizedMessage.includes("already exists") || normalizedMessage.includes("duplicate")) {
    return null;
  }

  return error;
}

async function cleanupUploadedPhotos(
  adminClient: ReturnType<typeof getOptionalSupabaseAdminClient>,
  uploadedPaths: string[],
) {
  if (!adminClient || uploadedPaths.length === 0) {
    return;
  }

  await adminClient.storage.from(claimPhotosBucket).remove(uploadedPaths);
}

function mergeEstimateNotes(primaryNote: string, supplementalNote: string) {
  const notes = [primaryNote.trim(), supplementalNote.trim()].filter((note) => note.length > 0);
  return notes.length > 0 ? notes.join("\n") : null;
}

async function prepareAutomaticEstimateForClaim(input: {
  claimId: string;
  description: string | null;
  initialNote: string;
  refNumber: string | null;
  vehicleInfo: Record<string, unknown> | null;
}) {
  const assessment = await generateDamageAssessmentForClaim({
    claimId: input.claimId,
    description: input.description,
    refNumber: input.refNumber,
    vehicleInfo: input.vehicleInfo,
  });

  if (!assessment) {
    if (!input.initialNote.trim()) {
      return false;
    }

    const fallbackEstimate = await upsertEstimate({
      claimId: input.claimId,
      totalAmount: null,
      adjusterNotes: input.initialNote.trim(),
      lineItems: [],
    });

    return !fallbackEstimate.error;
  }

  const estimateResult = await upsertEstimate({
    claimId: input.claimId,
    totalAmount: assessment.totalAmount,
    adjusterNotes: mergeEstimateNotes(assessment.adjusterNotes, input.initialNote),
    lineItems: assessment.lineItems,
  });

  return !estimateResult.error;
}

export async function submitClaimByClaimant(payload: ClaimSubmissionPayload) {
  const { user } = await requireDashboardRole("claimant");

  if (!payload.description || !payload.incidentDate || !payload.vehicleMake || !payload.vehicleModel || !payload.vehicleYear) {
    return { ok: false, error: "Incident date, description, and full vehicle details are required." } as const;
  }

  const claimId = randomUUID();
  const supabase = await createSupabaseServerClient();
  const adminClient = getOptionalSupabaseAdminClient();
  const uploadedPaths: string[] = [];

  for (const file of payload.photoFiles) {
    if (!file || file.size <= 0) {
      continue;
    }

    const extensionSafeName = normalizeFileName(file.name || `${randomUUID()}.bin`);
    const storagePath = `${user.id}/${claimId}/${Date.now()}-${randomUUID()}-${extensionSafeName}`;

    let uploadErrorMessage: string | null = null;

    const uploadResult = await supabase.storage.from(claimPhotosBucket).upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadResult.error) {
      uploadErrorMessage = uploadResult.error.message;

      if (adminClient) {
        if (isBucketNotFoundError(uploadErrorMessage)) {
          const ensureBucketError = await ensureClaimPhotosBucketExists(adminClient);

          if (ensureBucketError) {
            uploadErrorMessage = ensureBucketError.message;
          }
        }

        if (uploadErrorMessage) {
          const adminUploadResult = await adminClient.storage.from(claimPhotosBucket).upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

          uploadErrorMessage = adminUploadResult.error ? adminUploadResult.error.message : null;
        }
      }
    }

    if (uploadErrorMessage) {
      await cleanupUploadedPhotos(adminClient, uploadedPaths);
      return { ok: false, error: formatPhotoUploadError(uploadErrorMessage) } as const;
    }

    uploadedPaths.push(storagePath);
  }

  const createResult = await createClaim({
    id: claimId,
    claimantId: user.id,
    adjusterId: null,
    description: payload.description,
    incidentDate: payload.incidentDate,
    refNumber: generateClaimRefNumber(),
    status: "Reviewing",
    vehicleInfo: {
      make: payload.vehicleMake,
      model: payload.vehicleModel,
      year: payload.vehicleYear,
      plate_number: payload.plateNumber || null,
    },
  });

  if (createResult.error || !createResult.data) {
    await cleanupUploadedPhotos(adminClient, uploadedPaths);
    return { ok: false, error: createResult.error?.message ?? "Unable to create the claim." } as const;
  }

  const claim = createResult.data;

  const photoInsertResult = await createPhotoRecords({
    claimId: claim.id,
    storagePaths: uploadedPaths,
  });

  if (photoInsertResult.error) {
    await cleanupUploadedPhotos(adminClient, uploadedPaths);
    return { ok: false, error: `Claim created, but photos could not be linked: ${photoInsertResult.error.message}` } as const;
  }

  return {
    ok: true,
    message: `Claim ${claim.ref_number ?? claim.id} submitted successfully.`,
  } as const;
}

export function getAdjusterUpdatePayload(formData: FormData): AdjusterUpdatePayload {
  return {
    claimId: sanitizeText(formData.get("claimId")),
    status: sanitizeClaimStatus(formData.get("status")),
    totalAmountRaw: sanitizeText(formData.get("totalAmount")),
    adjusterNotes: sanitizeText(formData.get("adjusterNotes")),
    redirectTo: sanitizeText(formData.get("redirectTo")) || "/dashboard/adjuster/reviewing",
  };
}

export async function updateClaimByAdjuster(payload: AdjusterUpdatePayload) {
  const { user } = await requireDashboardRole("adjuster");

  if (!payload.claimId) {
    return { ok: false, error: "Claim id is required." } as const;
  }

  const claimResult = await getClaimById(payload.claimId);

  if (claimResult.error || !claimResult.data) {
    return { ok: false, error: claimResult.error?.message ?? "Claim not found." } as const;
  }

  const claim = claimResult.data;

  if (claim.adjuster_id && claim.adjuster_id !== user.id) {
    return { ok: false, error: "This claim is assigned to another adjuster." } as const;
  }

  const currentStatus = normalizeWorkflowStatus(claim.status);

  if (currentStatus === "Approved" || currentStatus === "Closed" || currentStatus === "DetailsRequested") {
    return {
      ok: false,
      error: "This claim is waiting on claimant action. Adjuster updates are blocked until the claimant responds.",
    } as const;
  }

  const parsedAmount = parseCurrency(payload.totalAmountRaw);

  if (payload.totalAmountRaw && parsedAmount === null) {
    return { ok: false, error: "Estimate amount must be a valid non-negative number." } as const;
  }

  let targetStatus: ClaimStatus;

  if (currentStatus === "Estimated") {
    if (parsedAmount === null) {
      return { ok: false, error: "Estimate amount is required before sending to claimant approval." } as const;
    }

    const existingEstimateResult = await getEstimateByClaimId(payload.claimId);

    if (existingEstimateResult.error) {
      return { ok: false, error: existingEstimateResult.error.message } as const;
    }

    const estimateWriteResult = await upsertEstimate({
      claimId: payload.claimId,
      totalAmount: parsedAmount,
      adjusterNotes: payload.adjusterNotes || existingEstimateResult.data?.adjuster_notes || null,
      lineItems: existingEstimateResult.data?.line_items ?? [],
    });

    if (estimateWriteResult.error) {
      return { ok: false, error: estimateWriteResult.error.message } as const;
    }

    targetStatus = "Approved";
  } else {
    if (payload.status !== "Estimated" && payload.status !== "DetailsRequested") {
      return {
        ok: false,
        error: "From Reviewing, you can only move to Estimation or request additional details from claimant.",
      } as const;
    }

    if (payload.status === "DetailsRequested" && !payload.adjusterNotes) {
      return { ok: false, error: "Add a note so claimant knows what additional details are required." } as const;
    }

    targetStatus = payload.status;
  }

  const descriptionForStatusUpdate =
    targetStatus === "DetailsRequested"
      ? appendWorkflowNote(claim.description, "Adjuster additional details request", payload.adjusterNotes)
      : undefined;
  const statusCandidates = getDbStatusCandidates(targetStatus, claim.status);

  let updateErrorMessage: string | null = null;
  let updateSucceeded = false;

  for (const dbStatus of statusCandidates) {
    const updateResult = await updateClaimForAdjuster({
      claimId: payload.claimId,
      adjusterId: user.id,
      status: dbStatus,
      description: descriptionForStatusUpdate,
    });

    if (!updateResult.error) {
      updateSucceeded = true;
      break;
    }

    updateErrorMessage = updateResult.error.message;

    if (!isLikelyStatusConstraintError(updateResult.error.message)) {
      break;
    }
  }

  if (!updateSucceeded) {
    return { ok: false, error: updateErrorMessage ?? "Unable to update claim status." } as const;
  }

  if (currentStatus === "Estimated") {
    return {
      ok: true,
      message: "Estimate sent to claimant for approval.",
    } as const;
  }

  if (targetStatus === "DetailsRequested") {
    return {
      ok: true,
      message: "Requested additional details from claimant.",
    } as const;
  }

  const automaticEstimatePrepared = await prepareAutomaticEstimateForClaim({
    claimId: payload.claimId,
    description: claim.description,
    initialNote: payload.adjusterNotes,
    refNumber: claim.ref_number,
    vehicleInfo: claim.vehicle_info,
  });

  return {
    ok: true,
    message: automaticEstimatePrepared
      ? "Claim moved to Estimation. Photo-based damage assessment prepared."
      : "Claim moved to Estimation. Enter or revise the estimate manually.",
  } as const;
}

export function getClaimantConfirmationPayload(formData: FormData): ClaimantConfirmationPayload {
  return {
    claimId: sanitizeText(formData.get("claimId")),
    redirectTo: sanitizeText(formData.get("redirectTo")) || "/dashboard/claimant/action-required",
  };
}

export function getClaimantDetailsPayload(formData: FormData): ClaimantDetailsPayload {
  return {
    claimId: sanitizeText(formData.get("claimId")),
    additionalDetails: sanitizeText(formData.get("additionalDetails")),
    redirectTo: sanitizeText(formData.get("redirectTo")) || "/dashboard/claimant/action-required",
  };
}

export function getClaimantAmountRequestPayload(formData: FormData): ClaimantAmountRequestPayload {
  return {
    claimId: sanitizeText(formData.get("claimId")),
    providerType: sanitizeInspectionProviderType(formData.get("providerType")),
    requestedAmountRaw: sanitizeText(formData.get("requestedAmount")),
    redirectTo: sanitizeText(formData.get("redirectTo")) || "/dashboard/claimant/action-required",
    scheduledForLocal: sanitizeText(formData.get("scheduledForLocal")),
    timezoneName: sanitizeText(formData.get("timezoneName")) || "UTC",
    timezoneOffsetMinutesRaw: sanitizeText(formData.get("timezoneOffsetMinutes")),
  };
}

export function getClaimInspectionSchedulePayload(formData: FormData): ClaimInspectionSchedulePayload {
  return {
    claimId: sanitizeText(formData.get("claimId")),
    providerType: sanitizeInspectionProviderType(formData.get("providerType")),
    reason: sanitizeInspectionReason(formData.get("reason")),
    redirectTo: sanitizeText(formData.get("redirectTo")) || "/dashboard/claimant/action-required",
    scheduledForLocal: sanitizeText(formData.get("scheduledForLocal")),
    timezoneName: sanitizeText(formData.get("timezoneName")) || "UTC",
    timezoneOffsetMinutesRaw: sanitizeText(formData.get("timezoneOffsetMinutes")),
  };
}

export async function scheduleClaimInspectionByClaimant(payload: ClaimInspectionSchedulePayload) {
  const { user } = await requireDashboardRole("claimant");

  if (!payload.claimId) {
    return { ok: false, error: "Claim id is required." } as const;
  }

  if (!payload.scheduledForLocal) {
    return { ok: false, error: "Select a date and time for the virtual inspection." } as const;
  }

  const scheduledFor = parseScheduledForLocal(payload.scheduledForLocal, payload.timezoneOffsetMinutesRaw);

  if (!scheduledFor) {
    return { ok: false, error: "Inspection date and time could not be read. Try selecting it again." } as const;
  }

  if (new Date(scheduledFor).getTime() <= Date.now()) {
    return { ok: false, error: "Inspection time must be in the future." } as const;
  }

  const claimResult = await getClaimById(payload.claimId);

  if (claimResult.error || !claimResult.data) {
    return { ok: false, error: claimResult.error?.message ?? "Claim not found." } as const;
  }

  const claim = claimResult.data;

  if (claim.claimant_id !== user.id) {
    return { ok: false, error: "You can only schedule inspections for your own claims." } as const;
  }

  const status = normalizeWorkflowStatus(claim.status);

  if (payload.reason === "additional_details") {
    if (status !== "DetailsRequested") {
      return { ok: false, error: "Virtual inspections for additional details are only available while details are requested." } as const;
    }
  }

  if (payload.reason === "higher_amount_review") {
    if (status !== "Estimated" || !hasHigherAmountRevisionRequest(claim.description)) {
      return { ok: false, error: "Higher amount inspection scheduling is only available after a revision request returns to estimation." } as const;
    }
  }

  const createResult = await createClaimInspection({
    claimId: payload.claimId,
    notes: null,
    providerType: payload.providerType,
    reason: payload.reason,
    requestedBy: user.id,
    requestedByRole: "claimant",
    requesterTimezone: payload.timezoneName || "UTC",
    scheduledFor,
  });

  if (createResult.error) {
    if (isClaimInspectionUnavailableError(createResult.error.message)) {
      return {
        ok: false,
        error: "Virtual inspections are not available until the latest Supabase migrations are applied. Run the new claim_inspections migrations and retry.",
      } as const;
    }

    return { ok: false, error: createResult.error.message } as const;
  }

  const inspectionNote = buildInspectionScheduleNote(payload.providerType, scheduledFor, payload.timezoneName || "UTC");

  if (payload.reason === "additional_details") {
    const updateResult = await updateClaimForClaimant({
      claimId: payload.claimId,
      claimantId: user.id,
      expectedStatuses: ["DetailsRequested"],
      updates: {
        status: "Reviewing",
        description: appendWorkflowNote(claim.description, "Claimant virtual inspection scheduled", inspectionNote),
      },
    });

    if (updateResult.error || !updateResult.data) {
      return {
        ok: false,
        error: updateResult.error?.message ?? "Virtual inspection was scheduled, but claim could not be returned to Reviewing.",
      } as const;
    }

    return {
      ok: true,
      message: `${inspectionNote} Claim returned to Reviewing.`,
    } as const;
  }

  return {
    ok: true,
    message: inspectionNote,
  } as const;
}

export async function confirmClaimByClaimant(payload: ClaimantConfirmationPayload) {
  const { user } = await requireDashboardRole("claimant");

  if (!payload.claimId) {
    return { ok: false, error: "Claim id is required." } as const;
  }

  const claimResult = await getClaimById(payload.claimId);

  if (claimResult.error || !claimResult.data) {
    return { ok: false, error: claimResult.error?.message ?? "Claim not found." } as const;
  }

  const claim = claimResult.data;

  if (claim.claimant_id !== user.id) {
    return { ok: false, error: "You can only approve your own claims." } as const;
  }

  const status = normalizeWorkflowStatus(claim.status);

  if (status !== "Approved") {
    return { ok: false, error: "Only claims awaiting claimant approval can be closed." } as const;
  }

  const updateResult = await updateClaimForClaimant({
    claimId: payload.claimId,
    claimantId: user.id,
    expectedStatuses: ["Approved"],
    updates: {
      status: "Closed",
    },
  });

  if (updateResult.error || !updateResult.data) {
    return { ok: false, error: updateResult.error?.message ?? "Unable to close this claim." } as const;
  }

  return {
    ok: true,
    message: `Claim ${updateResult.data.ref_number ?? updateResult.data.id} approved and moved to Closed.`,
  } as const;
}

export async function submitAdditionalDetailsByClaimant(_payload: ClaimantDetailsPayload): Promise<{ ok: false; error: string } | { ok: true; message: string }> {
  return {
    ok: false,
    error: "A virtual inspection is required before this claim can return to Reviewing. Schedule the inspection instead of submitting comments.",
  } as const;
}

export async function requestHigherAmountByClaimant(payload: ClaimantAmountRequestPayload) {
  const { user } = await requireDashboardRole("claimant");

  if (!payload.claimId) {
    return { ok: false, error: "Claim id is required." } as const;
  }

  const requestedAmount = parseCurrency(payload.requestedAmountRaw);

  if (requestedAmount === null || requestedAmount <= 0) {
    return { ok: false, error: "Requested amount must be a valid positive number." } as const;
  }

  if (!payload.scheduledForLocal) {
    return { ok: false, error: "Schedule a visual inspection before requesting a higher amount." } as const;
  }

  const scheduledFor = parseScheduledForLocal(payload.scheduledForLocal, payload.timezoneOffsetMinutesRaw);

  if (!scheduledFor) {
    return { ok: false, error: "Inspection date and time could not be read. Try selecting it again." } as const;
  }

  if (new Date(scheduledFor).getTime() <= Date.now()) {
    return { ok: false, error: "Inspection time must be in the future." } as const;
  }

  const claimResult = await getClaimById(payload.claimId);

  if (claimResult.error || !claimResult.data) {
    return { ok: false, error: claimResult.error?.message ?? "Claim not found." } as const;
  }

  const claim = claimResult.data;

  if (claim.claimant_id !== user.id) {
    return { ok: false, error: "You can only request changes on your own claims." } as const;
  }

  const status = normalizeWorkflowStatus(claim.status);

  if (status !== "Approved") {
    return { ok: false, error: "Higher amount requests are only allowed during claimant approval." } as const;
  }

  const createResult = await createClaimInspection({
    claimId: payload.claimId,
    notes: null,
    providerType: payload.providerType,
    reason: "higher_amount_review",
    requestedBy: user.id,
    requestedByRole: "claimant",
    requesterTimezone: payload.timezoneName || "UTC",
    scheduledFor,
  });

  if (createResult.error) {
    if (isClaimInspectionUnavailableError(createResult.error.message)) {
      return {
        ok: false,
        error: "Visual inspections for higher amount requests are not available until the latest Supabase migrations are applied. Run the new claim_inspections migrations and retry.",
      } as const;
    }

    return { ok: false, error: createResult.error.message } as const;
  }

  const inspectionNote = buildInspectionScheduleNote(payload.providerType, scheduledFor, payload.timezoneName || "UTC");
  const note = `Requested amount: ${requestedAmount.toFixed(2)}. ${inspectionNote}`;
  const updatedDescription = appendWorkflowNote(claim.description, "Claimant amount revision request", note);

  const updateResult = await updateClaimForClaimant({
    claimId: payload.claimId,
    claimantId: user.id,
    expectedStatuses: ["Approved"],
    updates: {
      status: "Estimated",
      description: updatedDescription,
    },
  });

  if (updateResult.error || !updateResult.data) {
    return {
      ok: false,
      error: updateResult.error?.message ?? "Visual inspection was scheduled, but the amount revision request could not be completed.",
    } as const;
  }

  return {
    ok: true,
    message: "Amount revision request submitted and visual inspection scheduled. Claim moved to Estimation.",
  } as const;
}