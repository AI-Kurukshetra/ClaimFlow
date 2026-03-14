"use server";

import { redirect } from "next/navigation";

import { loginWithEmail, logout, registerWithEmail } from "@/features/auth/services/auth.service";

function buildRedirectPath(pathname: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return `${pathname}?${params.toString()}`;
}

export async function loginAction(formData: FormData) {
  const result = await loginWithEmail(formData);

  if (!result.ok) {
    redirect(buildRedirectPath("/login", "error", result.error));
  }

  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const result = await registerWithEmail(formData);

  if (!result.ok) {
    redirect(buildRedirectPath("/signup", "error", result.error));
  }

  if (result.requiresEmailConfirmation && result.message) {
    redirect(buildRedirectPath("/login", "message", result.message));
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const result = await logout();

  if (!result.ok) {
    redirect(buildRedirectPath("/login", "error", result.error));
  }

  redirect("/login");
}

