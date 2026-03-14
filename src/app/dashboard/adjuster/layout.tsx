import type { ReactNode } from "react";

import { logoutAction } from "@/features/auth/actions";
import { DashboardShell } from "@/features/claims/components/dashboard-shell";
import { buildAdjusterNavigation } from "@/features/claims/services/claims.service";
import { requireDashboardRole } from "@/features/claims/services/dashboard.service";

export default async function AdjusterDashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { profile, user } = await requireDashboardRole("adjuster");

  return (
    <main className="dashboard-page portal-dashboard-page">
      <DashboardShell
        email={user.email}
        fullName={profile?.full_name ?? "Adjuster"}
        navigationItems={buildAdjusterNavigation()}
        onSignOut={logoutAction}
        portalDescription="Work through assigned claims by status, keep estimates moving, and close files with a clean audit trail."
        portalTitle="Adjuster Desk"
      >
        {children}
      </DashboardShell>
    </main>
  );
}
