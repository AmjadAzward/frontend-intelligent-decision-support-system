import { Building2, Menu, X } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { useState } from "react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/route-planner", label: "City Route Planner" },
  { to: "/emergency-resources", label: "Emergency Resource Center" },
  { to: "/network-insights", label: "City Network Insights" },
  { to: "/facility-advisor", label: "Smart Facility Advisor" },
  { to: "/waste-planner", label: "Waste Collection Planner" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-bold tracking-tight">
              SmartCity IDSS
            </span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Intelligent City Management
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground",
                  isActive ? "bg-accent-soft text-primary" : "text-muted-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-lg border border-border text-foreground xl:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div className={cn("border-t border-border bg-card xl:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive ? "bg-accent-soft text-primary" : "text-muted-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground lg:px-8">
        <p className="font-display font-semibold text-foreground">SmartCity IDSS</p>
        <p className="mt-1">
          Smart City Intelligent Decision Support System — a prototype platform operating on a
          fictional city dataset.
        </p>
      </div>
    </footer>
  );
}
