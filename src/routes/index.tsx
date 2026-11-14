import { Link } from "react-router-dom";
import {
  Navigation,
  Ambulance,
  Share2,
  Lightbulb,
  Recycle,
  ArrowRight,
} from "lucide-react";

import { CityGraph } from "@/components/city-graph";
import { Panel, Section, StatCard } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { CITY_ROADS, NETWORK_STATS } from "@/lib/city-data";

const SERVICES = [
  {
    to: "/route-planner" as const,
    icon: Navigation,
    title: "City Route Planner",
    description: "Find efficient routes between important city locations.",
    action: "Plan a Route",
  },
  {
    to: "/emergency-resources" as const,
    icon: Ambulance,
    title: "Emergency Resource Center",
    description: "Coordinate limited emergency vehicles with incoming requests.",
    action: "Manage Resources",
  },
  {
    to: "/network-insights" as const,
    icon: Share2,
    title: "City Network Insights",
    description: "Understand the structure and importance of locations across the city.",
    action: "Explore Network",
  },
  {
    to: "/facility-advisor" as const,
    icon: Lightbulb,
    title: "Smart Facility Advisor",
    description: "Find the most suitable public facility based on multiple criteria.",
    action: "Get Recommendation",
  },
  {
    to: "/waste-planner" as const,
    icon: Recycle,
    title: "Waste Collection Planner",
    description: "Plan efficient routes for collecting waste across the city.",
    action: "Plan Collection",
  },
];

const STEPS = [
  { n: "01", title: "Select", text: "Choose a city problem and provide input." },
  { n: "02", title: "Analyze", text: "The system processes the data using an appropriate algorithm." },
  {
    n: "03",
    title: "Compare",
    text: "Alternative approaches can be compared using performance metrics.",
  },
  {
    n: "04",
    title: "Decide",
    text: "The system presents a practical recommendation or optimized result.",
  },
];

const PREVIEW_IDS = [
  "city-hall",
  "central-hospital",
  "community-hospital",
  "police-station",
  "fire-station",
  "university",
  "bus-station",
  "shopping-center",
  "waste-center",
  "residential",
  "public-park",
];

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-border bg-hero-gradient">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Smart City Intelligent Decision Support System
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Smarter Decisions for a Better City
            </h1>
            <p className="mt-4 text-lg font-medium text-foreground/80">
              SmartCity IDSS brings intelligent algorithms to everyday city management.
            </p>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Explore efficient routes, allocate emergency resources, understand city networks, find
              suitable public facilities, and optimize waste collection.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/route-planner">
                  Explore City Services <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/network-insights">View City Network</Link>
              </Button>
            </div>
          </div>
          <Panel className="bg-card/80">
            <CityGraph
              visibleIds={PREVIEW_IDS}
              highlightPath={["city-hall", "bus-station", "central-hospital"]}
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Fictional city network — {NETWORK_STATS.locations} locations, {CITY_ROADS.length} roads
            </p>
          </Panel>
        </div>
      </section>

      <Section title="City at a Glance" description="Key figures from the fictional city dataset.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value={15} label="City Locations" />
          <StatCard value={24} label="Road Connections" />
          <StatCard value={4} label="Emergency Vehicles" />
          <StatCard value={8} label="Collection Points" />
        </div>
      </Section>

      <Section
        title="Smart City Services"
        description="Five connected services working on one shared city dataset."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.to}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lift"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-primary">
                <s.icon className="size-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.description}</p>
              <Button asChild variant="secondary" className="mt-5 w-full">
                <Link to={s.to}>{s.action}</Link>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Explore Our City"
        description="A simple graph of the fictional city: locations as nodes, roads as connections."
      >
        <Panel>
          <CityGraph visibleIds={PREVIEW_IDS} showDistances />
        </Panel>
      </Section>

      <Section title="How SmartCity IDSS Works">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="font-display text-2xl font-bold text-accent">{s.n}</p>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
