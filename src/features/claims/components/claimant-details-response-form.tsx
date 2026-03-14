import { submitAdditionalDetailsByClaimantAction } from "@/features/claims/actions";

type ClaimantDetailsResponseFormProps = {
  claimId: string;
  redirectTo: string;
};

export function ClaimantDetailsResponseForm({ claimId, redirectTo }: ClaimantDetailsResponseFormProps) {
  return (
    <form action={submitAdditionalDetailsByClaimantAction} className="claim-form claim-form-compact">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <label>
        <span>Additional details</span>
        <textarea
          name="additionalDetails"
          rows={3}
          maxLength={2000}
          placeholder="Provide the requested details so adjuster can continue review."
          required
        />
      </label>

      <button className="primary-button" type="submit">
        Submit Details
      </button>
    </form>
  );
}
