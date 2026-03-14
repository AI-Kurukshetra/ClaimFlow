import { requestHigherAmountByClaimantAction } from "@/features/claims/actions";

type ClaimantAmountRequestFormProps = {
  claimId: string;
  redirectTo: string;
};

export function ClaimantAmountRequestForm({ claimId, redirectTo }: ClaimantAmountRequestFormProps) {
  return (
    <form action={requestHigherAmountByClaimantAction} className="claim-form claim-form-compact">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="split-fields">
        <label>
          <span>Requested amount (USD)</span>
          <input name="requestedAmount" type="number" step="0.01" min={0} placeholder="1500" required />
        </label>
      </div>

      <label>
        <span>Justification</span>
        <textarea
          name="justification"
          rows={3}
          maxLength={2000}
          placeholder="Explain why a higher amount should be reviewed."
          required
        />
      </label>

      <button className="secondary-button" type="submit">
        Request Higher Amount
      </button>
    </form>
  );
}
