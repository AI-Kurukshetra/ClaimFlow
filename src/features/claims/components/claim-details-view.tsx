import type { ReactNode } from "react";
import Link from "next/link";

import type { DashboardClaim } from "@/features/claims/services/claims.service";
import {
  formatClaimCurrency,
  formatClaimDate,
  formatClaimDescription,
} from "@/features/claims/services/claim-display.service";

type ClaimDetailsViewProps = {
  actionContent?: ReactNode;
  backHref: string;
  backLabel: string;
  claim: DashboardClaim;
  description: string;
  error?: string;
  insightContent?: ReactNode;
  inspectionContent?: ReactNode;
  message?: string;
  photosHref?: string;
  title: string;
};

export function ClaimDetailsView({
  actionContent,
  backHref,
  backLabel,
  claim,
  description,
  error,
  insightContent,
  inspectionContent,
  message,
  photosHref,
  title,
}: ClaimDetailsViewProps) {
  return (
    <div className="workspace-stack">
      <section className="workspace-hero">
        <p className="eyebrow">Claim Details</p>
        <h3>{title}</h3>
        <p className="workspace-hero-copy">{description}</p>

        <div className="claim-detail-link-row">
          <Link href={backHref} prefetch={false} className="claim-detail-back-link">
            {backLabel}
          </Link>

          {photosHref ? (
            <a href={photosHref} target="_blank" rel="noopener noreferrer" className="secondary-button claim-detail-photo-button">
              View Photos
            </a>
          ) : null}
        </div>
      </section>

      {error ? <p className="form-alert error">{error}</p> : null}
      {message ? <p className="form-alert success">{message}</p> : null}

      <section className="claims-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Record</p>
            <h4>Claim Overview</h4>
          </div>
          <p>Review claim details, message history, and current estimate context.</p>
        </div>

        <article className="claim-card claim-card-detail">
          <div className="claim-card-header">
            <div>
              <p className="claim-ref">{claim.refNumber ?? "Reference pending"}</p>
              <h5>{claim.vehicleLabel}</h5>
            </div>
            <span className={`status-pill status-${claim.status.toLowerCase()}`}>{claim.status}</span>
          </div>

          <p className="claim-description">{formatClaimDescription(claim.description)}</p>

          <dl className="claim-meta">
            <div>
              <dt>Incident date</dt>
              <dd>{formatClaimDate(claim.incidentDate)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatClaimDate(claim.createdAt)}</dd>
            </div>
            <div>
              <dt>Estimate</dt>
              <dd>{formatClaimCurrency(claim.estimateTotal)}</dd>
            </div>
            <div>
              <dt>Photos</dt>
              <dd>{claim.photoCount}</dd>
            </div>
            <div>
              <dt>Fraud score</dt>
              <dd>{claim.fraudScore ?? "Pending"}</dd>
            </div>
          </dl>
        </article>
      </section>

      {insightContent ? (
        <section className="claims-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Estimate</p>
              <h4>Damage Assessment</h4>
            </div>
            <p>Structured estimate data generated from claim handling and uploaded photo evidence.</p>
          </div>
          {insightContent}
        </section>
      ) : null}

      {inspectionContent ? (
        <section className="claims-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Calendar</p>
              <h4>Virtual Inspections</h4>
            </div>
            <p>Schedule or review remote inspections with adjusters and third-party appraisers.</p>
          </div>
          {inspectionContent}
        </section>
      ) : null}

      {actionContent ? (
        <section className="claims-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Actions</p>
              <h4>Next Step</h4>
            </div>
            <p>Available actions for the current workflow status.</p>
          </div>
          <div className="claim-detail-actions">{actionContent}</div>
        </section>
      ) : null}
    </div>
  );
}