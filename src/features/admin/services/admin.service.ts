import { inviteAdjuster } from "@/features/admin/repositories/admin.repository";
import { getCurrentUser } from "@/features/auth/repositories/auth.repository";
import { isAdminUser } from "@/features/profiles/services/profile.service";

type InviteAdjusterResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

function sanitizeName(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function inviteAdjusterByAdmin(formData: FormData): Promise<InviteAdjusterResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { ok: false, error: "You must be signed in." };
  }

  const isAdmin = await isAdminUser(currentUser.id);

  if (!isAdmin) {
    return { ok: false, error: "Only admins can invite adjusters." };
  }

  const firstName = sanitizeName(formData.get("firstName"));
  const lastName = sanitizeName(formData.get("lastName"));
  const email = sanitizeEmail(formData.get("email"));

  if (!firstName || !lastName || !email) {
    return { ok: false, error: "First name, last name, and email are required." };
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

  const result = await inviteAdjuster({
    email,
    firstName,
    lastName,
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return {
    ok: true,
    message: `Invitation sent to ${email}. The adjuster can use the email link to activate access.`,
  };
}
