"use client";

import { useEffect, useState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { scheduleClaimInspectionByClaimantAction } from "@/features/claims/actions";
import type { ClaimInspectionReason } from "@/features/claims/services/claim-inspection.service";

type ClaimInspectionScheduleFormProps = {
  claimId: string;
  description: string;
  reason: ClaimInspectionReason;
  redirectTo: string;
  submitLabel: string;
  title: string;
};

function getMinDateTimeValue() {
  const now = new Date();
  const adjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
}

export function ClaimInspectionScheduleForm({
  claimId,
  description,
  reason,
  redirectTo,
  submitLabel,
  title,
}: ClaimInspectionScheduleFormProps) {
  const [timezoneName, setTimezoneName] = useState("UTC");
  const [timezoneOffsetMinutes, setTimezoneOffsetMinutes] = useState("0");
  const [minDateTimeValue, setMinDateTimeValue] = useState("");

  useEffect(() => {
    setTimezoneName(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setTimezoneOffsetMinutes(String(new Date().getTimezoneOffset()));
    setMinDateTimeValue(getMinDateTimeValue());
  }, []);

  return (
    <form action={scheduleClaimInspectionByClaimantAction} className="claim-form claim-form-compact">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="reason" value={reason} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="timezoneName" value={timezoneName} />
      <input type="hidden" name="timezoneOffsetMinutes" value={timezoneOffsetMinutes} />

      <div className="inspection-form-copy">
        <h5>{title}</h5>
        <p>{description}</p>
      </div>

      <div className="split-fields">
        <label>
          <span>Date and time</span>
          <input name="scheduledForLocal" type="datetime-local" min={minDateTimeValue || undefined} required />
        </label>

        <label>
          <span>Inspection with</span>
          <select name="providerType" defaultValue="adjuster">
            <option value="adjuster">Adjuster</option>
            <option value="third_party_appraiser">Third-Party Appraiser</option>
          </select>
        </label>
      </div>

      <p className="claim-field-note">Times are saved using your local timezone: {timezoneName}.</p>

      <SubmitButton idleLabel={submitLabel} pendingLabel="Scheduling..." />
    </form>
  );
}