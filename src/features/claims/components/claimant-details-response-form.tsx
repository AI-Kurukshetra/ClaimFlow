import { ClaimInspectionScheduleForm } from "@/features/claims/components/claim-inspection-schedule-form";

type ClaimantDetailsResponseFormProps = {
  claimId: string;
  redirectTo: string;
};

export function ClaimantDetailsResponseForm({ claimId, redirectTo }: ClaimantDetailsResponseFormProps) {
  return (
    <ClaimInspectionScheduleForm
      claimId={claimId}
      description="A visual inspection is required before this claim can return to review. Choose a time with the adjuster or a third-party appraiser."
      reason="additional_details"
      redirectTo={redirectTo}
      submitLabel="Schedule Visual Inspection"
      title="Book the required inspection"
    />
  );
}