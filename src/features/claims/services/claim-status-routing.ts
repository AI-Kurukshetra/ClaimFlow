export const workflowStatuses = ["Reviewing", "DetailsRequested", "Estimated", "Approved", "Closed"] as const;

export type WorkflowStatus = (typeof workflowStatuses)[number];

const statusToSlug: Record<WorkflowStatus, string> = {
  Reviewing: "reviewing",
  DetailsRequested: "details-requested",
  Estimated: "estimated",
  Approved: "approved",
  Closed: "closed",
};

const slugToStatus: Record<string, WorkflowStatus> = {
  reviewing: "Reviewing",
  "details-requested": "DetailsRequested",
  detailsrequested: "DetailsRequested",
  details_requested: "DetailsRequested",
  estimated: "Estimated",
  approved: "Approved",
  closed: "Closed",
};

export function getStatusSlug(status: WorkflowStatus) {
  return statusToSlug[status];
}

export function getStatusFromSlug(statusSlug: string): WorkflowStatus | null {
  return slugToStatus[statusSlug.toLowerCase()] ?? null;
}

export function getAdjusterQueueHrefForStatus(status: WorkflowStatus) {
  switch (status) {
    case "DetailsRequested":
      return "/dashboard/adjuster/details-requested";
    case "Estimated":
      return "/dashboard/adjuster/estimated";
    case "Approved":
      return "/dashboard/adjuster/approved";
    case "Closed":
      return "/dashboard/adjuster/closed";
    case "Reviewing":
    default:
      return "/dashboard/adjuster/reviewing";
  }
}

export function getClaimantQueueHrefForStatus(status: WorkflowStatus) {
  switch (status) {
    case "DetailsRequested":
    case "Approved":
      return "/dashboard/claimant/action-required";
    case "Closed":
      return "/dashboard/claimant/previous-claims";
    case "Reviewing":
    case "Estimated":
    default:
      return "/dashboard/claimant/in-progress";
  }
}

export function getAdjusterClaimDetailHref(claimId: string, status: WorkflowStatus) {
  return `/dashboard/adjuster/claim/${getStatusSlug(status)}/${claimId}`;
}

export function getClaimantClaimDetailHref(claimId: string, status: WorkflowStatus) {
  return `/dashboard/claimant/claim/${getStatusSlug(status)}/${claimId}`;
}

export function getAdjusterClaimPhotosHref(claimId: string, status: WorkflowStatus) {
  return `${getAdjusterClaimDetailHref(claimId, status)}/photos`;
}

export function getClaimantClaimPhotosHref(claimId: string, status: WorkflowStatus) {
  return `${getClaimantClaimDetailHref(claimId, status)}/photos`;
}

export function getDetailNavigationHref(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 5 || segments[0] !== "dashboard" || segments[2] !== "claim") {
    return null;
  }

  const role = segments[1];
  const status = getStatusFromSlug(segments[3]);

  if (!status) {
    return null;
  }

  if (role === "adjuster") {
    return getAdjusterQueueHrefForStatus(status);
  }

  if (role === "claimant") {
    return getClaimantQueueHrefForStatus(status);
  }

  return null;
}
