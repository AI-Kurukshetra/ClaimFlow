import { ClaimSubmissionForm } from "@/features/claims/components/claim-submission-form";
import { ClaimsWorkspace } from "@/features/claims/components/claims-workspace";
import { getClaimantClaims, sumEstimateTotals } from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type AddClaimsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddClaimsPage({ searchParams }: AddClaimsPageProps) {
  const { user } = await requireDashboardRole("claimant");
  const claims = await getClaimantClaims(user.id);
  const recentClaims = claims.slice(0, 5);
  const params = await searchParams;

  return (
    <ClaimsWorkspace
      claims={recentClaims}
      description="Use this area to submit a new claim with incident details, vehicle data, and photo evidence."
      emptyDescription="Once a claim is created, the most recent files will appear here for quick follow-up."
      emptyTitle="No recent claims yet"
      error={getParamValue(params.error)}
      message={getParamValue(params.message)}
      guides={[
        {
          description: "Capture incident date and a concise timeline before submission.",
          title: "Incident details",
        },
        {
          description: "Provide accurate vehicle make, model, year, and plate where available.",
          title: "Vehicle profile",
        },
        {
          description: "Upload clear photos from multiple angles to improve assessment speed.",
          title: "Photos and evidence",
        },
      ]}
      stats={[
        {
          label: "Recent claims",
          note: "Latest files created under your account.",
          value: String(recentClaims.length),
        },
        {
          label: "Total claims",
          note: "All claims currently on your profile.",
          value: String(claims.length),
        },
        {
          label: "Estimated value",
          note: "Combined estimates already prepared.",
          value: new Intl.NumberFormat("en-US", {
            currency: "USD",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(sumEstimateTotals(claims)),
        },
      ]}
      title="Add Claims"
      topContent={
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">New Submission</p>
              <h4>Create Claim</h4>
            </div>
            <p>Submit a new claim and it will be routed into the reviewing queue immediately.</p>
          </div>
          <div className="claim-form-wrap">
            <ClaimSubmissionForm />
          </div>
        </>
      }
    />
  );
}

