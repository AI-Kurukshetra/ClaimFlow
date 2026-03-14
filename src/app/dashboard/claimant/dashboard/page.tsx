"use client";

import Link from "next/link";

import { useClaimantClaimsPayload } from "@/features/claims/components/claimant-claims-data";
import { formatClaimCurrency, formatClaimDate } from "@/features/claims/services/claim-display.service";
import { getClaimantClaimDetailHref } from "@/features/claims/services/claim-status-routing";

export default function ClaimantDashboardPage() {
  const { payload, error, isLoading } = useClaimantClaimsPayload();
  const recentClaims = payload?.recentClaims ?? [];

  return (
    <div className="dashboard-overview">
      <section className="dashboard-overview-hero">
        <div>
          <p className="eyebrow">Claimant Dashboard</p>
          <h3>Claim Overview</h3>
          <p>{isLoading && !payload ? "Loading your latest claims..." : "Track open work, total exposure, and jump into the latest claim files."}</p>
        </div>

        <div className="dashboard-overview-actions">
          <Link href="/dashboard/claimant/add-claims" prefetch={false} className="primary-button">
            Add Claim
          </Link>
          <Link href="/dashboard/claimant/action-required" prefetch={false} className="secondary-button dashboard-ghost-button">
            Open Action Required
          </Link>
        </div>
      </section>

      {error ? <p className="form-alert error">{error}</p> : null}

      <section className="dashboard-overview-stats" aria-label="Dashboard stats">
        <article className="overview-stat-card">
          <span>Total claims</span>
          <strong>{payload ? payload.totals.all : "--"}</strong>
        </article>
        <article className="overview-stat-card">
          <span>Action required</span>
          <strong>{payload ? payload.totals.actionRequired : "--"}</strong>
        </article>
        <article className="overview-stat-card">
          <span>In progress</span>
          <strong>{payload ? payload.totals.inProgress : "--"}</strong>
        </article>
        <article className="overview-stat-card">
          <span>Closed</span>
          <strong>{payload ? payload.totals.closed : "--"}</strong>
        </article>
        <article className="overview-stat-card overview-stat-card-wide">
          <span>Estimated value</span>
          <strong>{payload ? formatClaimCurrency(payload.totals.estimateTotal, "$0") : "--"}</strong>
        </article>
      </section>

      <section className="claims-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent Claims</p>
            <h4>{recentClaims.length ? `${recentClaims.length} in view` : "No recent claims"}</h4>
          </div>
          <p>Open any claim card to view details and next actions.</p>
        </div>

        {recentClaims.length ? (
          <div className="claim-queue-grid">
            {recentClaims.map((claim) => (
              <Link
                key={claim.id}
                href={getClaimantClaimDetailHref(claim.id, claim.status)}
                prefetch={false}
                className="claim-queue-box"
              >
                <h5 className="claim-queue-model">{claim.vehicleLabel}</h5>
                <p className="claim-queue-number">{claim.refNumber ?? "Reference pending"}</p>
                <div className="claim-queue-foot">
                  <p className="claim-queue-date">{formatClaimDate(claim.createdAt)}</p>
                  <span className={`status-pill status-${claim.status.toLowerCase()}`}>{claim.status}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <article className="empty-state">
            <h5>No claims yet</h5>
            <p>Create your first claim from Add Claims.</p>
          </article>
        )}
      </section>
    </div>
  );
}