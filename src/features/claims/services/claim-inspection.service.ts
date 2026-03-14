export const inspectionProviderTypes = ["adjuster", "third_party_appraiser"] as const;
export const claimInspectionReasons = ["additional_details", "higher_amount_review"] as const;

export type InspectionProviderType = (typeof inspectionProviderTypes)[number];
export type ClaimInspectionReason = (typeof claimInspectionReasons)[number];

export function isInspectionProviderType(value: string): value is InspectionProviderType {
  return inspectionProviderTypes.includes(value as InspectionProviderType);
}

export function isClaimInspectionReason(value: string): value is ClaimInspectionReason {
  return claimInspectionReasons.includes(value as ClaimInspectionReason);
}

export function hasHigherAmountRevisionRequest(description: string | null) {
  return (description ?? "").includes("Claimant amount revision request");
}

export function formatInspectionProviderLabel(providerType: string | null) {
  switch (providerType) {
    case "adjuster":
      return "Adjuster";
    case "third_party_appraiser":
      return "Third-Party Appraiser";
    default:
      return "Virtual Inspection";
  }
}

export function formatInspectionReasonLabel(reason: string | null) {
  switch (reason) {
    case "additional_details":
      return "Additional details review";
    case "higher_amount_review":
      return "Higher amount review";
    default:
      return "Inspection review";
  }
}

export function formatInspectionStatusLabel(status: string | null) {
  switch (status) {
    case "Completed":
      return "Completed";
    case "Cancelled":
      return "Cancelled";
    case "Scheduled":
    default:
      return "Scheduled";
  }
}