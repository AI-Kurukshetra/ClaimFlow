import { redirect } from "next/navigation";

import { inviteAdjusterAction } from "@/features/admin/actions";
import { InviteAdjusterForm } from "@/features/admin/components/invite-adjuster-form";
import { logoutAction } from "@/features/auth/actions";
import { getDashboardContext, getDashboardHomeHref } from "@/features/claims/services/dashboard.service";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { profile, role } = await getDashboardContext();
  const params = await searchParams;

  if (role === "admin") {
    return (
      <main className="dashboard-page">
        <section className="dashboard-card dashboard-stack">
          <div>
            <p className="eyebrow">ClaimFlow</p>
            <h1>Add Adjuster</h1>
            <p className="dashboard-copy">
              Invite adjusters by email. Each invited user will be provisioned with the adjuster role.
            </p>
          </div>

          <InviteAdjusterForm
            action={inviteAdjusterAction}
            error={getParamValue(params.error)}
            message={getParamValue(params.message)}
          />

          <form action={logoutAction}>
            <button type="submit" className="secondary-button">
              Sign out
            </button>
          </form>
        </section>
      </main>
    );
  }

  redirect(getDashboardHomeHref(profile?.role));
}
