"use server";

import { redirect } from "next/navigation";

import {
  confirmClaimByClaimant,
  getAdjusterUpdatePayload,
  getClaimantAmountRequestPayload,
  getClaimantConfirmationPayload,
  getClaimantDetailsPayload,
  requestHigherAmountByClaimant,
  submitAdditionalDetailsByClaimant,
  submitClaimByClaimant,
  updateClaimByAdjuster,
} from "@/features/claims/services/claim-workflow.service";

function buildRedirectPath(pathname: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return `${pathname}?${params.toString()}`;
}

export async function submitClaimAction(formData: FormData) {
  const photoFiles = formData
    .getAll("photos")
    .filter((value) => value instanceof File)
    .map((value) => value as File)
    .filter((file) => file.size > 0);

  const result = await submitClaimByClaimant({
    description: typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "",
    incidentDate: typeof formData.get("incidentDate") === "string" ? String(formData.get("incidentDate")).trim() : "",
    vehicleMake: typeof formData.get("vehicleMake") === "string" ? String(formData.get("vehicleMake")).trim() : "",
    vehicleModel: typeof formData.get("vehicleModel") === "string" ? String(formData.get("vehicleModel")).trim() : "",
    vehicleYear: typeof formData.get("vehicleYear") === "string" ? String(formData.get("vehicleYear")).trim() : "",
    plateNumber: typeof formData.get("plateNumber") === "string" ? String(formData.get("plateNumber")).trim() : "",
    photoFiles,
  });

  if (!result.ok) {
    redirect(buildRedirectPath("/dashboard/claimant/add-claims", "error", result.error));
  }

  redirect(buildRedirectPath("/dashboard/claimant/add-claims", "message", result.message));
}

export async function updateClaimByAdjusterAction(formData: FormData) {
  const payload = getAdjusterUpdatePayload(formData);
  const redirectTarget = payload.redirectTo || "/dashboard/adjuster/reviewing";
  const result = await updateClaimByAdjuster(payload);

  if (!result.ok) {
    redirect(buildRedirectPath(redirectTarget, "error", result.error));
  }

  redirect(buildRedirectPath(redirectTarget, "message", result.message));
}

export async function confirmClaimByClaimantAction(formData: FormData) {
  const payload = getClaimantConfirmationPayload(formData);
  const redirectTarget = payload.redirectTo || "/dashboard/claimant/action-required";
  const result = await confirmClaimByClaimant(payload);

  if (!result.ok) {
    redirect(buildRedirectPath(redirectTarget, "error", result.error));
  }

  redirect(buildRedirectPath(redirectTarget, "message", result.message));
}

export async function submitAdditionalDetailsByClaimantAction(formData: FormData) {
  const payload = getClaimantDetailsPayload(formData);
  const redirectTarget = payload.redirectTo || "/dashboard/claimant/action-required";
  const result = await submitAdditionalDetailsByClaimant(payload);

  if (!result.ok) {
    redirect(buildRedirectPath(redirectTarget, "error", result.error));
  }

  redirect(buildRedirectPath(redirectTarget, "message", result.message));
}

export async function requestHigherAmountByClaimantAction(formData: FormData) {
  const payload = getClaimantAmountRequestPayload(formData);
  const redirectTarget = payload.redirectTo || "/dashboard/claimant/action-required";
  const result = await requestHigherAmountByClaimant(payload);

  if (!result.ok) {
    redirect(buildRedirectPath(redirectTarget, "error", result.error));
  }

  redirect(buildRedirectPath(redirectTarget, "message", result.message));
}
