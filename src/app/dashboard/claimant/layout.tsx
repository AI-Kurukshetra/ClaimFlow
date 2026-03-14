import type { ReactNode } from "react";

import { logoutAction } from "@/features/auth/actions";
import { DashboardShell } from "@/features/claims/components/dashboard-shell";
import { buildClaimantNavigation, getClaimantClaims } from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

export default async function ClaimantDashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { profile, user } = await requireDashboardRole("claimant");
  const claims = await getClaimantClaims(user.id);

  return (
    <main className="dashboard-page portal-dashboard-page">
      <DashboardShell
        email={user.email}
        fullName={profile?.full_name ?? "Claimant"}
        navigationItems={buildClaimantNavigation(claims)}
        onSignOut={logoutAction}
        portalDescription="Track submissions, monitor pending updates, and keep your completed claims organized."
        portalTitle="Claimant Portal"
      >
        {children}
      </DashboardShell>
    </main>
  );
}
