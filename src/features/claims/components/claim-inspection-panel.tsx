import type { ReactNode } from "react";

import type { ClaimInspectionRecord } from "@/features/claims/repositories/claims.repository";
import {
  formatInspectionProviderLabel,
  formatInspectionReasonLabel,
  formatInspectionStatusLabel,
} from "@/features/claims/services/claim-inspection.service";

function formatInspectionDateTime(value: string, timeZone: string | null) {
  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };

  try {
    return new Intl.DateTimeFormat("en-US", {
      ...formatOptions,
      timeZone: timeZone || "UTC",
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      ...formatOptions,
      timeZone: "UTC",
    }).format(new Date(value));
  }
}

type ClaimInspectionPanelProps = {
  actionContent?: ReactNode;
  inspections: ClaimInspectionRecord[];
};

export function ClaimInspectionPanel({ actionContent, inspections }: ClaimInspectionPanelProps) {
  return (
    <div className="inspection-stack">
      {inspections.length > 0 ? (
        <div className="inspection-grid">
          {inspections.map((inspection) => (
            <article key={inspection.id} className="inspection-card">
              <div className="inspection-card-head">
                <div>
                  <p className="claim-ref">{formatInspectionProviderLabel(inspection.provider_type)}</p>
                  <h5>{formatInspectionDateTime(inspection.scheduled_for, inspection.requester_timezone)}</h5>
                </div>
                <span className="inspection-chip">{formatInspectionStatusLabel(inspection.status)}</span>
              </div>

              <p className="inspection-card-meta">
                {formatInspectionReasonLabel(inspection.reason)} | {inspection.requester_timezone || "UTC"}
              </p>

              {inspection.notes ? <p className="inspection-card-copy">{inspection.notes}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <article className="empty-state inspection-empty-state">
          <h5>No inspections scheduled</h5>
          <p>No virtual inspection is booked for this claim yet.</p>
        </article>
      )}

      {actionContent ? <article className="inspection-action-card">{actionContent}</article> : null}
    </div>
  );
}