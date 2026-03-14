import {
  getCurrentUser,
  signInWithPassword,
  signOutUser,
  signUpWithPassword,
} from "@/features/auth/repositories/auth.repository";

type AuthActionResult =
  | {
      ok: true;
      message?: string;
      requiresEmailConfirmation?: boolean;
    }
  | {
      ok: false;
      error: string;
    };

type SanitizedCredentials =
  | {
      email: string;
      password: string;
    }
  | {
      error: string;
    };

function sanitizeCredentials(input: { email: FormDataEntryValue | null; password: FormDataEntryValue | null }): SanitizedCredentials {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  return { email, password };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeName(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function loginWithEmail(formData: FormData): Promise<AuthActionResult> {
  const credentials = sanitizeCredentials({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if ("error" in credentials) {
    return { ok: false, error: credentials.error };
  }

  const result = await signInWithPassword(credentials);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}

export async function registerWithEmail(formData: FormData): Promise<AuthActionResult> {
  const firstName = sanitizeName(formData.get("firstName"));
  const lastName = sanitizeName(formData.get("lastName"));
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")).trim() : "";
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmPassword =
    typeof formData.get("confirmPassword") === "string" ? String(formData.get("confirmPassword")) : "";

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return { ok: false, error: "All fields are required." };
  }

  if (firstName.length < 2 || lastName.length < 2) {
    return { ok: false, error: "First name and last name must be at least 2 characters." };
  }

  if (firstName.length > 50 || lastName.length > 50) {
    return { ok: false, error: "First name and last name must be 50 characters or less." };
  }

  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Password and confirm password must match." };
  }

  const result = await signUpWithPassword({
    firstName,
    lastName,
    email,
    password,
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  if (!result.hasSession) {
    return {
      ok: true,
      message: "Account created. Check your inbox to confirm your email before signing in.",
      requiresEmailConfirmation: true,
    };
  }

  return { ok: true };
}

export async function logout() {
  const result = await signOutUser();

  if (result.error) {
    return { ok: false, error: result.error.message } satisfies AuthActionResult;
  }

  return { ok: true } satisfies AuthActionResult;
}

export async function getAuthenticatedUser() {
  return getCurrentUser();
}
