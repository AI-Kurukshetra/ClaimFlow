import type { ReactNode } from "react";
import Link from "next/link";

import type { DashboardClaim } from "@/features/claims/services/claims.service";
import { formatClaimDate } from "@/features/claims/services/claim-display.service";

type WorkspaceStat = {
  label: string;
  note?: string;
  value: string;
};

type WorkspaceGuide = {
  description: string;
  title: string;
};

type ClaimsWorkspaceProps = {
  claims: DashboardClaim[];
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  error?: string;
  message?: string;
  guides?: WorkspaceGuide[];
  stats: WorkspaceStat[];
  title: string;
  getClaimHref?: (claim: DashboardClaim) => string;
  topContent?: ReactNode;
};

export function ClaimsWorkspace({
  claims,
  description,
  emptyDescription,
  emptyTitle,
  error,
  message,
  guides,
  stats,
  title,
  getClaimHref,
  topContent,
}: ClaimsWorkspaceProps) {
  return (
    <div className="workspace-stack">
      <section className="workspace-hero">
        <p className="eyebrow">Workspace</p>
        <h3>{title}</h3>
        <p className="workspace-hero-copy">{description}</p>
      </section>

      {error ? <p className="form-alert error">{error}</p> : null}
      {message ? <p className="form-alert success">{message}</p> : null}

      {topContent ? <section className="claims-section">{topContent}</section> : null}

      <section className="workspace-grid" aria-label="Dashboard summary">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <span className="stat-label">{stat.label}</span>
            <strong>{stat.value}</strong>
            {stat.note ? <p>{stat.note}</p> : null}
          </article>
        ))}
      </section>

      {guides?.length ? (
        <section className="guide-grid" aria-label="Workflow guidance">
          {guides.map((guide) => (
            <article key={guide.title} className="guide-card">
              <h4>{guide.title}</h4>
              <p>{guide.description}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="claims-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Claim Queue</p>
            <h4>{claims.length ? `${claims.length} claim${claims.length === 1 ? "" : "s"}` : emptyTitle}</h4>
          </div>
          <p>{claims.length ? "Live records from the claims workspace." : emptyDescription}</p>
        </div>

        {claims.length ? (
          <div className="claim-queue-grid">
            {claims.map((claim) => {
              const content = (
                <>
                  <h5 className="claim-queue-model">{claim.vehicleLabel}</h5>
                  <p className="claim-queue-number">{claim.refNumber ?? "Reference pending"}</p>
                  <p className="claim-queue-date">{formatClaimDate(claim.createdAt)}</p>
                </>
              );

              if (!getClaimHref) {
                return (
                  <article key={claim.id} className="claim-queue-box">
                    {content}
                  </article>
                );
              }

              return (
                <Link key={claim.id} href={getClaimHref(claim)} className="claim-queue-box">
                  {content}
                </Link>
              );
            })}
          </div>
        ) : (
          <article className="empty-state">
            <h5>{emptyTitle}</h5>
            <p>{emptyDescription}</p>
          </article>
        )}
      </section>
    </div>
  );
}

