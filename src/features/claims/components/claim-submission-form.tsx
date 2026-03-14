import { SubmitButton } from "@/components/submit-button";
import { submitClaimAction } from "@/features/claims/actions";

export function ClaimSubmissionForm() {
  return (
    <form action={submitClaimAction} className="claim-form">
      <div className="split-fields">
        <label>
          <span>Incident date</span>
          <input name="incidentDate" type="date" required />
        </label>
        <label>
          <span>Vehicle year</span>
          <input name="vehicleYear" type="number" min={1980} max={2100} placeholder="2024" required />
        </label>
      </div>

      <div className="split-fields">
        <label>
          <span>Vehicle make</span>
          <input name="vehicleMake" type="text" placeholder="Toyota" maxLength={60} required />
        </label>
        <label>
          <span>Vehicle model</span>
          <input name="vehicleModel" type="text" placeholder="Camry" maxLength={60} required />
        </label>
      </div>

      <label>
        <span>Plate number (optional)</span>
        <input name="plateNumber" type="text" placeholder="ABC-1234" maxLength={20} />
      </label>

      <label>
        <span>Incident description</span>
        <textarea
          name="description"
          rows={5}
          placeholder="Describe what happened, where it happened, and visible damage."
          maxLength={2000}
          required
        />
      </label>

      <label>
        <span>Damage photos</span>
        <input name="photos" type="file" accept="image/*" multiple />
      </label>

      <SubmitButton idleLabel="Submit Claim" pendingLabel="Submitting Claim..." />
    </form>
  );
}

