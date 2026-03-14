"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
    const confirmPassword =
      typeof formData.get("confirmPassword") === "string" ? String(formData.get("confirmPassword")) : "";

    if (!password || !confirmPassword) {
      setError("Password and confirm password are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <section className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">ClaimFlow</p>
        <h1>Set Password</h1>
        <p>Create your password to finish setting up your account.</p>
      </div>

      <form
        action={async (formData) => {
          await handleSubmit(formData);
        }}
        className="auth-form"
      >
        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label>
          <span>Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {error ? <p className="form-alert error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving password..." : "Save password"}
        </button>
      </form>
    </section>
  );
}
