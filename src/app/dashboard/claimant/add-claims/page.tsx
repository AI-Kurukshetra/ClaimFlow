import { ClaimSubmissionForm } from "@/features/claims/components/claim-submission-form";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

type AddClaimsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddClaimsPage({ searchParams }: AddClaimsPageProps) {
  await requireDashboardRole("claimant");
  const params = await searchParams;

  return (
    <div className="workspace-stack">
      <section className="workspace-hero">
        <p className="eyebrow">New Submission</p>
        <h3>Add Claim</h3>
        <p className="workspace-hero-copy">Submit a new claim with incident details, vehicle data, and photo evidence.</p>
      </section>

      {getParamValue(params.error) ? <p className="form-alert error">{getParamValue(params.error)}</p> : null}
      {getParamValue(params.message) ? <p className="form-alert success">{getParamValue(params.message)}</p> : null}

      <section className="claims-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Claim Form</p>
            <h4>Create Claim</h4>
          </div>
          <p>After submission, the claim will be routed to the adjuster reviewing queue.</p>
        </div>
        <div className="claim-form-wrap">
          <ClaimSubmissionForm />
        </div>
      </section>
    </div>
  );
}
