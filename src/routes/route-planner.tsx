import {
  AlertTriangle,
  ArrowDown,
  ArrowRightLeft,
  CheckCircle2,
  Cpu,
  Gauge,
  Info,
  Layers,
  Loader2,
  MapPin,
  Network,
  Route as RouteIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CityGraph, GraphLegend } from "@/components/city-graph";
import { UrbanCityMap } from "@/components/urban-city-map";
import { PageHeader, Panel, Section, StatCard } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  aStarPath,
  bfsPath,
  CITY_LOCATIONS,
  dijkstraPath,
  locationName,
  type PathResult,
} from "@/lib/city-data";

/** Base URL of Task 1 FastAPI backend microservice */
const API_BASE_URL = "http://localhost:8001";

type CityItem = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  connections?: number;
};

type RouteResponse = {
  algorithm: string;
  start: string;
  destination: string;
  route: string[];
  route_names: string[];
  distance: number;
  nodes_explored: number;
  execution_time_ms: number;
  is_optimal_distance: boolean;
  hops: number;
  notes: string;
};

type ComparisonResponse = {
  start: string;
  destination: string;
  results: RouteResponse[];
  analysis: string;
};

type BenchmarkTier = {
  tier_name: string;
  node_count: number;
  edge_count: number;
  bfs_time_ms: number;
  bfs_nodes: number;
  dijkstra_time_ms: number;
  dijkstra_nodes: number;
  astar_time_ms: number;
  astar_nodes: number;
};

type BenchmarkResponse = {
  runs_averaged: number;
  tiers: BenchmarkTier[];
  conclusion: string;
};

const METHODS = [
  {
    id: "astar",
    label: "A* Algorithm (Heuristic Directed)",
    desc: "Uses geographic Haversine distance heuristic for fast, optimal routing.",
  },
  {
    id: "dijkstra",
    label: "Dijkstra's Algorithm (Guaranteed Optimal)",
    desc: "Exhaustive priority-queue search guaranteeing shortest physical distance.",
  },
  {
    id: "bfs",
    label: "Breadth-First Search (BFS — Fewest Hops)",
    desc: "Unweighted baseline finding the minimum number of road segments.",
  },
  {
    id: "compare",
    label: "Compare All Three Algorithms",
    desc: "Executes BFS, Dijkstra, and A* concurrently on the same journey.",
  },
] as const;

export default function RoutePlannerPage() {
  const [cities, setCities] = useState<CityItem[]>(
    CITY_LOCATIONS.filter((c) => c.id !== "isolated-outpost").map((c) => ({
      id: c.id,
      name: c.name,
      latitude: 0,
      longitude: 0,
    }))
  );
  const [start, setStart] = useState("city-hall");
  const [end, setEnd] = useState("central-hospital");
  const [method, setMethod] = useState<string>("astar");
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Results state
  const [singleResult, setSingleResult] = useState<RouteResponse | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResponse | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [mapView, setMapView] = useState<"urban" | "topology">("urban");

  // Probe backend on mount
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (res.ok) {
          const citiesRes = await fetch(`${API_BASE_URL}/api/route/cities`);
          if (citiesRes.ok && isMounted) {
            const data = await citiesRes.json();
            setCities(data.filter((city: CityItem) => city.id !== "isolated-outpost"));
            setBackendOnline(true);
            return;
          }
        }
        if (isMounted) setBackendOnline(false);
      } catch {
        if (isMounted) setBackendOnline(false);
      }
    };
    checkBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const swapLocations = () => {
    const prevStart = start;
    setStart(end);
    setEnd(prevStart);
    setErrorMsg(null);
  };

  const handleCalculate = async () => {
    setErrorMsg(null);
    setLoading(true);
    setSingleResult(null);
    setComparisonResult(null);

    if (start === end) {
      setErrorMsg("Starting city and destination must be different.");
      setLoading(false);
      return;
    }

    try {
      if (method === "compare") {
        if (backendOnline) {
          const res = await fetch(`${API_BASE_URL}/api/route/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start, destination: end }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Route comparison failed");
          }
          const data: ComparisonResponse = await res.json();
          setComparisonResult(data);
          // Set chosen result to A* for map visualization
          const astarItem = data.results.find((r) => r.algorithm.includes("A*"));
          if (astarItem) setSingleResult(astarItem);
        } else {
          // Client-side fallback if backend is offline
          const bfsRes = bfsPath(start, end);
          const dijkstraRes = dijkstraPath(start, end);
          const astarRes = aStarPath(start, end);

          const toRouteResp = (algo: string, pr: PathResult, isOpt: boolean, notes: string): RouteResponse => ({
            algorithm: algo,
            start,
            destination: end,
            route: pr.path,
            route_names: pr.path.map(locationName),
            distance: pr.distanceKm,
            nodes_explored: pr.visited,
            execution_time_ms: pr.timeMs,
            is_optimal_distance: isOpt,
            hops: Math.max(0, pr.path.length - 1),
            notes,
          });

          const results = [
            toRouteResp("BFS", bfsRes, false, "BFS minimizes hop count (edges), not physical distance."),
            toRouteResp("Dijkstra", dijkstraRes, true, "Dijkstra guarantees minimum weighted distance."),
            toRouteResp("A*", astarRes, true, "A* achieves optimal distance while reducing explored search space."),
          ];

          setComparisonResult({
            start,
            destination: end,
            results,
            analysis:
              bfsRes.distanceKm > dijkstraRes.distanceKm
                ? `BFS took a path of ${bfsRes.distanceKm} km (${bfsRes.path.length - 1} hops), whereas Dijkstra and A* found the physically shorter route of ${dijkstraRes.distanceKm} km.`
                : "All algorithms identified paths of equal distance on this route.",
          });
          setSingleResult(results[2] ?? null);
        }
      } else {
        // Single algorithm run
        if (backendOnline) {
          const res = await fetch(`${API_BASE_URL}/api/route/plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start, destination: end, algorithm: method }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Route calculation failed");
          }
          const data: RouteResponse = await res.json();
          setSingleResult(data);
        } else {
          // Client fallback
          let pr: PathResult;
          let label = "A*";
          let isOpt = true;
          let notes = "";
          if (method === "bfs") {
            pr = bfsPath(start, end);
            label = "BFS";
            isOpt = false;
            notes = "BFS minimizes road segments (hops), which may not equal minimum distance.";
          } else if (method === "dijkstra") {
            pr = dijkstraPath(start, end);
            label = "Dijkstra";
            notes = "Dijkstra guarantees the globally shortest physical route.";
          } else {
            pr = aStarPath(start, end);
            label = "A*";
            notes = "A* uses Euclidean/Haversine heuristic to prune suboptimal paths.";
          }
          setSingleResult({
            algorithm: label,
            start,
            destination: end,
            route: pr.path,
            route_names: pr.path.map(locationName),
            distance: pr.distanceKm,
            nodes_explored: pr.visited,
            execution_time_ms: pr.timeMs,
            is_optimal_distance: isOpt,
            hops: Math.max(0, pr.path.length - 1),
            notes,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to calculate route.";
      setErrorMsg(msg.includes("No route found") ? `${msg} Please choose another connected city or location.` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBenchmark = async () => {
    if (!backendOnline) {
      setErrorMsg("Backend service must be online on port 8001 to run systematic benchmarks.");
      return;
    }
    setBenchmarkLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/route/benchmark?iterations=30`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Benchmark execution failed.");
      }
      const data: BenchmarkResponse = await res.json();
      setBenchmarkResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Benchmark error.";
      setErrorMsg(msg);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  // Prepare chart data if comparison exists
  const comparisonChartData = comparisonResult?.results.map((r) => ({
    name: r.algorithm,
    timeMs: r.execution_time_ms,
    nodesExplored: r.nodes_explored,
    distanceKm: r.distance,
    hops: r.hops,
  })) ?? [];

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Task 1 — Intelligent Route Optimization"
        title="City Route Optimizer & Path Finder"
        subtitle="Graph-based route optimization using Breadth-First Search, Dijkstra's algorithm, and A* with geographic heuristics."
      />

      {/* Backend Connectivity Status Ribbon */}
      <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {cities.length} vertices loaded &bull; Adjacency-list representation
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunBenchmark}
            disabled={benchmarkLoading}
            className="h-8 gap-1.5 text-xs text-primary"
          >
            {benchmarkLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Gauge className="size-3.5" />}
            Run Scalability Benchmark
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-8">
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Route Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Search Panel & Network Graph */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Panel title="Route Search" description="Configure origin, destination, and pathfinding algorithm.">
            <div className="space-y-4">
              {/* Origin */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Starting City / Location
                </Label>
                <Select value={start} onValueChange={(val) => { setStart(val); setErrorMsg(null); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={swapLocations}
                  className="h-7 gap-1 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowRightLeft className="size-3" /> Swap Origin & Destination
                </Button>
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Destination City / Location
                </Label>
                <Select value={end} onValueChange={(val) => { setEnd(val); setErrorMsg(null); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Algorithm Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pathfinding Algorithm
                </Label>
                <Select value={method} onValueChange={(val) => { setMethod(val); setErrorMsg(null); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {METHODS.find((m) => m.id === method)?.desc}
                </p>
              </div>

              {/* Calculate Button */}
              <Button
                className="w-full gap-2 font-medium"
                onClick={handleCalculate}
                disabled={loading || start === end}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <RouteIcon className="size-4" />}
                {loading ? "Computing Route..." : method === "compare" ? "Compare All Algorithms" : "Find Optimal Route"}
              </Button>

              {start === end && (
                <p className="text-center text-xs text-amber-500">
                  Select two different locations to compute a valid route.
                </p>
              )}
            </div>
          </Panel>

          {/* Network Map / Graph with View Switcher */}
          <Panel>
            {/* Header with View Mode Switcher */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {mapView === "urban" ? "Stylized Urban GIS Network Map" : "City Road Topology & Weights"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {mapView === "urban"
                    ? "Interactive city GIS view with coastal waterfront, district zoning, and animated route corridors."
                    : "Adjacency-list mathematical graph with node connection degrees and road weights (km)."}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/60 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMapView("urban")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                    mapView === "urban"
                      ? "bg-card text-primary font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapPin className="size-3.5" /> Stylized Urban GIS
                </button>
                <button
                  type="button"
                  onClick={() => setMapView("topology")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                    mapView === "topology"
                      ? "bg-card text-primary font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Network className="size-3.5" /> Graph &amp; Weights
                </button>
              </div>
            </div>

            {/* Map Body */}
            {mapView === "urban" ? (
              <UrbanCityMap
                highlightPath={singleResult?.route ?? []}
                startId={start}
                endId={end}
                onSetStart={(id) => {
                  setStart(id);
                  setErrorMsg(null);
                }}
                onSetEnd={(id) => {
                  setEnd(id);
                  setErrorMsg(null);
                }}
              />
            ) : (
              <div>
                <CityGraph highlightPath={singleResult?.route ?? []} showDistances showConnectionCounts />
                <div className="mt-4">
                  <GraphLegend />
                </div>
              </div>
            )}

            {/* Path summary footer */}
            {singleResult && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                <span className="font-medium text-muted-foreground">
                  Active Algorithm: <strong className="text-foreground">{singleResult.algorithm}</strong>
                </span>
                <span className="font-medium">
                  Total Road Distance: <strong className="text-primary">{singleResult.distance.toFixed(1)} km</strong>
                </span>
                <span className="font-medium">
                  Hops: <strong className="text-foreground">{singleResult.hops} road segments</strong>
                </span>
              </div>
            )}
          </Panel>
        </div>
      </Section>

      {/* Single Route Result Display & Visual Route Sequence */}
      {singleResult && (
        <Section title="Calculated Route Result">
          <div className="space-y-6">
            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="size-4" /> Route Successfully Solved
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {singleResult.algorithm}
                  </Badge>
                  {singleResult.is_optimal_distance ? (
                    <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                      Optimal Distance
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-xs">
                      Min-Hop Baseline (Suboptimal Distance)
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Execution Time: <strong>{singleResult.execution_time_ms.toFixed(3)} ms</strong>
                </span>
              </div>

              {/* Visual Vertical Route Step-by-Step Flow */}
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step-by-Step Route Progression
                </p>
                <div className="mt-3 flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center">
                  {singleResult.route_names.map((name, index) => {
                    const isStartNode = index === 0;
                    const isEndNode = index === singleResult.route_names.length - 1;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium ${
                            isStartNode
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 font-semibold"
                              : isEndNode
                              ? "border-amber-500/50 bg-amber-500/10 text-amber-700 font-semibold"
                              : "border-border bg-card text-foreground"
                          }`}
                        >
                          <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                          {name}
                        </div>
                        {index < singleResult.route_names.length - 1 && (
                          <div className="flex items-center px-1 text-primary">
                            <ArrowDown className="size-4 sm:hidden" />
                            <span className="hidden text-base font-bold sm:inline">&rarr;</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metric Cards */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  value={`${singleResult.distance.toFixed(1)} km`}
                  label="Total Route Distance"
                  hint="Sum of road segment weights"
                />
                <StatCard
                  value={singleResult.nodes_explored}
                  label="Nodes Explored"
                  hint="Vertices expanded in priority queue/queue"
                />
                <StatCard
                  value={`${singleResult.execution_time_ms.toFixed(3)} ms`}
                  label="Algorithm Execution Time"
                  hint="Actual measured wall-clock duration"
                />
                <StatCard
                  value={`${singleResult.hops} hops`}
                  label="Road Segments"
                  hint={`${singleResult.route.length} total visited cities`}
                />
              </div>

              {/* Informational Context Note */}
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/80 bg-secondary/40 p-4 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Algorithm Behavior Note</p>
                  <p>{singleResult.notes}</p>
                </div>
              </div>
            </Panel>
          </div>
        </Section>
      )}

      {/* Algorithm Comparison Table & Charts */}
      {comparisonResult && (
        <Section
          title="Algorithm Comparison & Performance Metrics"
          description="Direct head-to-head evaluation of BFS, Dijkstra, and A* on the identical origin-destination pair."
        >
          <div className="space-y-6">
            {/* Analytical Commentary */}
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-accent-soft/40 p-5">
              <Cpu className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">Empirical Analysis</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {comparisonResult.analysis}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              {/* Comparison Table */}
              <Panel title="Algorithm Comparison Table" description="Exact measured results from current execution run.">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Algorithm</TableHead>
                        <TableHead className="text-right">Distance (km)</TableHead>
                        <TableHead className="text-right">Road Hops</TableHead>
                        <TableHead className="text-right">Nodes Explored</TableHead>
                        <TableHead className="text-right">Execution Time</TableHead>
                        <TableHead className="text-center">Optimality</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonResult.results.map((r) => (
                        <TableRow key={r.algorithm}>
                          <TableCell className="font-semibold">{r.algorithm}</TableCell>
                          <TableCell className="text-right font-mono">
                            {r.distance.toFixed(1)} km
                          </TableCell>
                          <TableCell className="text-right font-mono">{r.hops}</TableCell>
                          <TableCell className="text-right font-mono">{r.nodes_explored}</TableCell>
                          <TableCell className="text-right font-mono text-primary">
                            {r.execution_time_ms.toFixed(3)} ms
                          </TableCell>
                          <TableCell className="text-center">
                            {r.is_optimal_distance ? (
                              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 text-[10px]">
                                Optimal
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px]">
                                Suboptimal
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Panel>

              {/* Comparison Recharts */}
              <Panel title="Nodes Explored vs Execution Time" description="Efficiency comparisons across algorithms.">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData} margin={{ left: -15, right: 10, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" />
                      <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="nodesExplored" name="Nodes Explored" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          </div>
        </Section>
      )}

      {/* Systematic Benchmark Panel (if triggered) */}
      {benchmarkResult && (
        <Section
          title="Systematic Scalability Benchmark Experiment"
          description={`Empirical evaluation across Small, Medium, and Large graph networks (averaged over ${benchmarkResult.runs_averaged} runs to eliminate timing noise).`}
        >
          <Panel>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Graph Tier</TableHead>
                    <TableHead className="text-right">Graph Size (|V|, |E|)</TableHead>
                    <TableHead className="text-right">BFS Time</TableHead>
                    <TableHead className="text-right">BFS Nodes</TableHead>
                    <TableHead className="text-right">Dijkstra Time</TableHead>
                    <TableHead className="text-right">Dijkstra Nodes</TableHead>
                    <TableHead className="text-right">A* Time</TableHead>
                    <TableHead className="text-right">A* Nodes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchmarkResult.tiers.map((t) => (
                    <TableRow key={t.tier_name}>
                      <TableCell className="font-semibold">{t.tier_name}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        |V|={t.node_count}, |E|={t.edge_count}
                      </TableCell>
                      <TableCell className="text-right font-mono">{t.bfs_time_ms.toFixed(3)} ms</TableCell>
                      <TableCell className="text-right font-mono">{t.bfs_nodes}</TableCell>
                      <TableCell className="text-right font-mono">{t.dijkstra_time_ms.toFixed(3)} ms</TableCell>
                      <TableCell className="text-right font-mono">{t.dijkstra_nodes}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {t.astar_time_ms.toFixed(3)} ms
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">{t.astar_nodes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 rounded-xl border border-border/80 bg-secondary/30 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Experimental Conclusion</p>
              <p className="mt-1 leading-relaxed">{benchmarkResult.conclusion}</p>
            </div>
          </Panel>
        </Section>
      )}
    </div>
  );
}
