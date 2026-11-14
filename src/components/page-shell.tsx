import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
}) {
  return (
    <div className="border-b border-border bg-hero-gradient">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-8 lg:px-8", className)}>
      {title && (
        <div className="mb-5">
          <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  value,
  label,
  hint,
}: {
  value: string | number;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="font-display text-3xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6", className)}>
      {title && (
        <div className="mb-4">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function FlowStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/60 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function Connector() {
  return <div className="mx-auto h-6 w-px bg-border" aria-hidden />;
}
