"use server";

import { redirect } from "next/navigation";

import { inviteAdjusterByAdmin } from "@/features/admin/services/admin.service";

function buildRedirectPath(key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return `/dashboard?${params.toString()}`;
}

export async function inviteAdjusterAction(formData: FormData) {
  const result = await inviteAdjusterByAdmin(formData);

  if (!result.ok) {
    redirect(buildRedirectPath("error", result.error));
  }

  redirect(buildRedirectPath("message", result.message));
}
