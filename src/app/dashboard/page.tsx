import { redirect } from "next/navigation";

import { inviteAdjusterAction } from "@/features/admin/actions";
import { InviteAdjusterForm } from "@/features/admin/components/invite-adjuster-form";
import { logoutAction } from "@/features/auth/actions";
import { getAuthenticatedUser } from "@/features/auth/services/auth.service";
import { getUserProfile } from "@/features/profiles/services/profile.service";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const profile = await getUserProfile(user.id);
  const isAdmin = profile?.role === "admin";

  if (isAdmin) {
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

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div>
          <p className="eyebrow">ClaimFlow</p>
          <h1>Dashboard</h1>
          <p className="dashboard-copy">
            Auth is wired. Additional product flows can now be layered on top of this base.
          </p>
        </div>

        <dl className="user-summary">
          <div>
            <dt>Signed in as</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{user.id}</dd>
          </div>
        </dl>

        <form action={logoutAction}>
          <button type="submit" className="secondary-button">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
