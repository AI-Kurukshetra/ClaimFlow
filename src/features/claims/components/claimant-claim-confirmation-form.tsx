import { SubmitButton } from "@/components/submit-button";
import { confirmClaimByClaimantAction } from "@/features/claims/actions";

type ClaimantClaimConfirmationFormProps = {
  claimId: string;
  redirectTo: string;
};

export function ClaimantClaimConfirmationForm({ claimId, redirectTo }: ClaimantClaimConfirmationFormProps) {
  return (
    <form action={confirmClaimByClaimantAction} className="claim-form claim-form-compact">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <SubmitButton idleLabel="Approve & Close Claim" pendingLabel="Approving..." />
    </form>
  );
}
