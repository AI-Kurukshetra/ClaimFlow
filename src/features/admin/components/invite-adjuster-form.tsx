import { SubmitButton } from "@/components/submit-button";

type InviteAdjusterFormProps = {
  action: (formData: FormData) => Promise<void>;
  error?: string;
  message?: string;
};

export function InviteAdjusterForm({
  action,
  error,
  message,
}: InviteAdjusterFormProps) {
  return (
    <section className="invite-card">
      <div className="invite-copy">
        <p className="eyebrow">Admin</p>
        <h2>Invite Adjuster</h2>
        <p>Send an adjuster invitation email. The invited user will be provisioned with the adjuster role.</p>
      </div>

      <form action={action} className="auth-form">
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

        <label>
          <span>Email</span>
          <input name="email" type="email" placeholder="adjuster@company.com" autoComplete="email" required />
        </label>

        {error ? <p className="form-alert error">{error}</p> : null}
        {message ? <p className="form-alert success">{message}</p> : null}

        <SubmitButton idleLabel="Send invite" pendingLabel="Sending invite..." />
      </form>
    </section>
  );
}
