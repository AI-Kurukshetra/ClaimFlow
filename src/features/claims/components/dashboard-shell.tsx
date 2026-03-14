"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "portal-nav-item active" : "portal-nav-item"}
              >
                <div className="portal-nav-topline">
                  <span>{item.label}</span>
                  {typeof item.count === "number" ? <span className="nav-badge">{item.count}</span> : null}
                </div>
                <span className="portal-nav-copy">{item.description}</span>
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
