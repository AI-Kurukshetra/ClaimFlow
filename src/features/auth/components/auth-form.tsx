import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";

type AuthFormProps = {
  action: (formData: FormData) => Promise<void>;
  description: string;
  footerHref: string;
  footerLabel: string;
  footerText: string;
  mode?: "login" | "signup";
  pendingLabel: string;
  submitLabel: string;
  title: string;
  error?: string;
  message?: string;
};

export function AuthForm({
  action,
  description,
  error,
  footerHref,
  footerLabel,
  footerText,
  message,
  mode = "login",
  pendingLabel,
  submitLabel,
  title,
}: AuthFormProps) {
  const isSignup = mode === "signup";

  return (
    <section className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">ClaimFlow</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <form action={action} className="auth-form">
        {isSignup ? (
          <div className="split-fields">
            <label>
              <span>First name</span>
              <input
                name="firstName"
                type="text"
                placeholder="First name"
                autoComplete="given-name"
                minLength={2}
                maxLength={50}
                required
              />
            </label>

            <label>
              <span>Last name</span>
              <input
                name="lastName"
                type="text"
                placeholder="Last name"
                autoComplete="family-name"
                minLength={2}
                maxLength={50}
                required
              />
            </label>
          </div>
        ) : null}

        <label>
          <span>Email</span>
          <input name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
        </label>

        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>

        {isSignup ? (
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
        ) : null}

        {error ? <p className="form-alert error">{error}</p> : null}
        {message ? <p className="form-alert success">{message}</p> : null}

        <SubmitButton idleLabel={submitLabel} pendingLabel={pendingLabel} />
      </form>

      <p className="auth-footer">
        {footerText} <Link href={footerHref}>{footerLabel}</Link>
      </p>
    </section>
  );
}
