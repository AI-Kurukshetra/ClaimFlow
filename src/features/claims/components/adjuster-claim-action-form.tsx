import { SubmitButton } from "@/components/submit-button";
import { updateClaimByAdjusterAction } from "@/features/claims/actions";

type AdjusterClaimActionFormProps = {
  claimId: string;
  mode: "reviewing" | "estimated";
  redirectTo: string;
};

export function AdjusterClaimActionForm({ claimId, mode, redirectTo }: AdjusterClaimActionFormProps) {
  return (
    <form action={updateClaimByAdjusterAction} className="claim-form claim-form-compact">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {mode === "reviewing" ? (
        <>
          <label>
            <span>Notes for claimant</span>
            <textarea
              name="adjusterNotes"
              rows={3}
              maxLength={2000}
              placeholder="If requesting more details, specify exactly what claimant should add."
            />
          </label>

          <div className="split-fields">
            <button className="secondary-button" type="submit" name="status" value="DetailsRequested">
              Request Additional Details
            </button>
            <button className="primary-button" type="submit" name="status" value="Estimated">
              Move to Estimation
            </button>
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="status" value="Approved" />

          <label>
            <span>Estimate amount (USD)</span>
            <input name="totalAmount" type="number" step="0.01" min={0} placeholder="1200" required />
          </label>

          <label>
            <span>Estimate notes (optional)</span>
            <textarea
              name="adjusterNotes"
              rows={3}
              maxLength={2000}
              placeholder="Breakdown notes or rationale for this estimate."
            />
          </label>

          <SubmitButton idleLabel="Send to Client Approval" pendingLabel="Sending..." />
        </>
      )}
    </form>
  );
}
