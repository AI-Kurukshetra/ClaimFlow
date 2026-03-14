import type { ReactNode } from "react";
import type { DashboardClaim } from "@/features/claims/services/claims.service";

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
  renderClaimActions?: (claim: DashboardClaim) => ReactNode;
  topContent?: ReactNode;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Awaiting estimate";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatClaimDescription(value: string | null) {
  if (!value) {
    return "No incident description has been added yet.";
  }

  const normalized = value.replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return "No incident description has been added yet.";
  }

  const timestampedEntries: { line: string; timestamp: number }[] = [];
  const regularEntries: string[] = [];

  lines.forEach((line) => {
    const match = line.match(/^\[([^\]]+)\]\s/);

    if (!match) {
      regularEntries.push(line);
      return;
    }

    const parsed = Date.parse(match[1]);

    if (Number.isNaN(parsed)) {
      regularEntries.push(line);
      return;
    }

    timestampedEntries.push({ line, timestamp: parsed });
  });

  timestampedEntries.sort((a, b) => b.timestamp - a.timestamp);

  return [...timestampedEntries.map((entry) => entry.line), ...regularEntries].join("\n");
}

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
  renderClaimActions,
  topContent,
}: ClaimsWorkspaceProps) {
  return (
    <div className="workspace-stack">
      <section className="workspace-hero">
        <p className="eyebrow">Workspace</p>
        <h3>{title}</h3>
        <p>{description}</p>
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
          <div className="claims-list">
            {claims.map((claim) => (
              <article key={claim.id} className="claim-card">
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
                    <dd>{formatDate(claim.incidentDate)}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(claim.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Estimate</dt>
                    <dd>{formatCurrency(claim.estimateTotal)}</dd>
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

                {renderClaimActions ? <div className="claim-actions">{renderClaimActions(claim)}</div> : null}
              </article>
            ))}
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
