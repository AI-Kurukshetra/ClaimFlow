"use client";

import { useState } from "react";

type ClaimantDashboardShellProps = {
  email: string | null | undefined;
  fullName: string;
  onSignOut: (formData: FormData) => Promise<void>;
};

const navigationItems = [
  {
    id: "add-claims",
    label: "Add Claims",
    title: "Add Claims",
    description: "This section will host the claim submission experience for new incidents.",
  },
  {
    id: "pending-claims",
    label: "Pending Claims",
    title: "Pending Claims",
    description: "This section will list active claims that are still under review.",
  },
  {
    id: "previous-claims",
    label: "Previous Claims",
    title: "Previous Claims",
    description: "This section will show previously completed and archived claims.",
  },
] as const;

export function ClaimantDashboardShell({
  email,
  fullName,
  onSignOut,
}: ClaimantDashboardShellProps) {
  const [activeItemId, setActiveItemId] = useState<(typeof navigationItems)[number]["id"]>(
    navigationItems[0].id,
  );

  const activeItem = navigationItems.find((item) => item.id === activeItemId) ?? navigationItems[0];

  return (
    <section className="claimant-shell">
      <aside className="claimant-sidebar">
        <div className="claimant-brand">
          <p className="eyebrow">ClaimFlow</p>
          <h1>Claimant Portal</h1>
          <p>Track and manage your claim journey from one place.</p>
        </div>

        <nav className="claimant-nav" aria-label="Claimant navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeItem.id ? "claimant-nav-item active" : "claimant-nav-item"}
              onClick={() => setActiveItemId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="claimant-content">
        <header className="claimant-header">
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

        <main className="claimant-main">
          <div className="claimant-title-block">
            <p className="eyebrow">Workspace</p>
            <h3>{activeItem.title}</h3>
            <p>{activeItem.description}</p>
          </div>
        </main>
      </div>
    </section>
  );
}
