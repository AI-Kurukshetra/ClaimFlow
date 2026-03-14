"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  preloadAdjusterClaimsPayload,
  useAdjusterClaimsPayload,
} from "@/features/claims/components/adjuster-claims-data";
import {
  preloadClaimantClaimsPayload,
  useClaimantClaimsPayload,
} from "@/features/claims/components/claimant-claims-data";
import { getDetailNavigationHref } from "@/features/claims/services/claim-status-routing";

type NavigationItem = {
  count?: number;
  description: string;
  href: string;
  label: string;
};

type DashboardShellProps = {
  email: string | null | undefined;
  fullName: string;
  navigationItems: NavigationItem[];
  onSignOut: (formData: FormData) => Promise<void>;
  portalDescription: string;
  portalTitle: string;
  children: ReactNode;
};

export function DashboardShell({
  email,
  fullName,
  navigationItems,
  onSignOut,
  portalDescription,
  portalTitle,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const detailNavigationHref = getDetailNavigationHref(pathname);
  const isClaimantPortal = pathname.startsWith("/dashboard/claimant");
  const isAdjusterPortal = pathname.startsWith("/dashboard/adjuster");

  const { payload: claimantPayload } = useClaimantClaimsPayload(isClaimantPortal);
  const { payload: adjusterPayload } = useAdjusterClaimsPayload(isAdjusterPortal);

  const claimantCountsByHref: Record<string, number> | null = claimantPayload
    ? {
        "/dashboard/claimant/dashboard": claimantPayload.totals.all,
        "/dashboard/claimant/action-required": claimantPayload.totals.actionRequired,
        "/dashboard/claimant/in-progress": claimantPayload.totals.inProgress,
        "/dashboard/claimant/previous-claims": claimantPayload.totals.closed,
      }
    : null;

  const adjusterCountsByHref: Record<string, number> | null = adjusterPayload
    ? {
        "/dashboard/adjuster/reviewing": adjusterPayload.totals.reviewing,
        "/dashboard/adjuster/details-requested": adjusterPayload.totals.detailsRequested,
        "/dashboard/adjuster/estimated": adjusterPayload.totals.estimated,
        "/dashboard/adjuster/approved": adjusterPayload.totals.approved,
        "/dashboard/adjuster/closed": adjusterPayload.totals.closed,
      }
    : null;

  useEffect(() => {
    if (isClaimantPortal) {
      navigationItems
        .filter((item) => item.href.startsWith("/dashboard/claimant"))
        .forEach((item) => {
          router.prefetch(item.href);
        });

      preloadClaimantClaimsPayload();
      return;
    }

    if (isAdjusterPortal) {
      navigationItems
        .filter((item) => item.href.startsWith("/dashboard/adjuster"))
        .forEach((item) => {
          router.prefetch(item.href);
        });

      preloadAdjusterClaimsPayload();
    }
  }, [isAdjusterPortal, isClaimantPortal, navigationItems, router]);

  return (
    <section className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <p className="eyebrow">ClaimFlow</p>
          <h1>{portalTitle}</h1>
          <p>{portalDescription}</p>
        </div>

        <nav className="portal-nav" aria-label={`${portalTitle} navigation`}>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || detailNavigationHref === item.href;
            const claimantOverrideCount = claimantCountsByHref?.[item.href];
            const adjusterOverrideCount = adjusterCountsByHref?.[item.href];
            const count =
              typeof claimantOverrideCount === "number"
                ? claimantOverrideCount
                : typeof adjusterOverrideCount === "number"
                  ? adjusterOverrideCount
                  : item.count;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "portal-nav-item active" : "portal-nav-item"}
              >
                <div className="portal-nav-topline">
                  <span>{item.label}</span>
                  {typeof count === "number" ? <span className="nav-badge">{count}</span> : null}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="portal-content">
        <header className="portal-header">
          <div>
            <p className="eyebrow">Welcome Back</p>
            <h2>{fullName}</h2>
            <p>{email}</p>
          </div>

          <form action={onSignOut}>
            <button type="submit" className="secondary-button">
              Sign out
            </button>
          </form>
        </header>

        <main className="portal-main">{children}</main>
      </div>
    </section>
  );
}
