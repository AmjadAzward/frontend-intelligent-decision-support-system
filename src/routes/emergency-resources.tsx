import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Connector, FlowStep, PageHeader, Panel, Section, StatCard } from "@/components/page-shell";
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

const API_BASE_URL = import.meta.env.VITE_RESOURCE_API_BASE_URL ?? "";
const STRATEGIES = ["greedy", "backtracking", "genetic"] as const;
type StrategyKey = (typeof STRATEGIES)[number];

const STRATEGY_LABELS: Record<StrategyKey, string> = {
  greedy: "Fast First Response",
  backtracking: "Careful Best Fit",
  genetic: "Balanced Coverage Plan",
};

type Incident = {
  id: string;
  location: string;
  priority: "Critical" | "High" | "Medium";
  vehicle: string;
  deadline_minutes: number;
};
type Assignment = {
  request_id: string;
  vehicle: string | null;
  response_minutes: number | null;
  deadline_met: boolean;
  status: "Assigned" | "Unassigned";
};
type AllocationResult = {
  strategy: StrategyKey;
  assignments: Assignment[];
  served: number;
  total_requests: number;
  coverage: number;
  unassigned: number;
  processing_time_ms: number;
  incidents: Incident[];
  matching_edges: number;
  scheduling_order: string[];
  cache_hits: number;
  cache_misses: number;
};

async function optimize(
  strategy: StrategyKey,
  requestCount: number,
  vehicleCount: number,
  selectedVehicles: string[],
  selectedRequests: string[],
): Promise<AllocationResult> {
  const response = await fetch(`${API_BASE_URL}/api/resource/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strategy,
      request_count: requestCount,
      vehicle_count: vehicleCount,
      selected_vehicles: selectedVehicles,
      selected_requests: selectedRequests,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return (await response.json()) as AllocationResult;
}

export default function EmergencyResourcesPage() {
  const [strategy, setStrategy] = useState<StrategyKey>("greedy");
  const [requestCount, setRequestCount] = useState(4);
  const [vehicleCount, setVehicleCount] = useState(3);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);
  const [requestOptions, setRequestOptions] = useState<Incident[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [comparison, setComparison] = useState<AllocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const incidents = result?.incidents ?? [];

  const scrollToResults = () => {
    window.setTimeout(() => {
      document
        .getElementById("dispatch-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const runOptimization = async (
    requestIds = selectedRequests,
    vehicleIds = selectedVehicles,
    moveToResults = true,
    requestLimit = requestCount,
    vehicleLimit = vehicleCount,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(
        STRATEGIES.map((key) => optimize(key, requestLimit, vehicleLimit, vehicleIds, requestIds)),
      );
      setComparison(responses);
      setResult(responses.find((response) => response.strategy === strategy) ?? responses[0]);
      if (moveToResults) scrollToResults();
    } catch (optimizationError) {
      setError(
        optimizationError instanceof Error
          ? optimizationError.message
          : "Could not prepare the dispatch plan.",
      );
      setResult(null);
      setComparison([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDispatchData = async () => {
      try {
        const [requestsResponse, vehiclesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/resource/requests`),
          fetch(`${API_BASE_URL}/api/resource/vehicles`),
        ]);
        if (!requestsResponse.ok || !vehiclesResponse.ok) throw new Error("Data loading failed");
        const requestRows = (await requestsResponse.json()) as Array<{
          request_code: string;
          requester_name?: string;
          priority: "Critical" | "High" | "Medium";
          incident_location_key?: string;
          metadata?: { required_vehicle_type?: string; deadline_minutes?: number };
        }>;
        const vehicleRows = (await vehiclesResponse.json()) as Array<{
          vehicle_code: string;
          status: string;
        }>;
        const loadedRequests = requestRows.map((row) => ({
          id: row.request_code,
          location: row.incident_location_key || "Unknown location",
          priority: row.priority,
          vehicle: row.metadata?.required_vehicle_type || "Any suitable vehicle",
          deadline_minutes: row.metadata?.deadline_minutes || 20,
        }));
        const loadedVehicles = vehicleRows
          .filter((row) => row.status === "available" && row.vehicle_code)
          .map((row) => row.vehicle_code);
        setRequestOptions(loadedRequests);
        setVehicleOptions(loadedVehicles);
        setRequestCount(Math.max(1, loadedRequests.length));
        setVehicleCount(Math.max(1, loadedVehicles.length));
        setSelectedRequests(loadedRequests.map((row) => row.id));
        setSelectedVehicles(loadedVehicles);
        if (loadedRequests.length > 0)
          await runOptimization(
            loadedRequests.map((row) => row.id),
            loadedVehicles,
            false,
            loadedRequests.length,
            loadedVehicles.length,
          );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load emergency requests and vehicles from the Task 2 backend.",
        );
      }
    };
    void loadDispatchData();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Smart City Service"
        title="Emergency Resource Center"
        subtitle="Coordinate emergency vehicles and respond to city incidents efficiently."
      />

      <div className="mx-auto flex max-w-7xl justify-end px-4 pt-6 lg:px-8">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin">Open Task 2 Admin Dashboard</Link>
        </Button>
      </div>

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value={result?.total_requests ?? "-"} label="Active Requests" />
          <StatCard value={result?.served ?? "-"} label="Requests Assigned" />
          <StatCard value={result ? `${result.coverage}%` : "-"} label="Response Coverage" />
          <StatCard value={result?.unassigned ?? "-"} label="Unassigned Requests" />
        </div>
      </Section>

      <Section title="Incoming Emergency Requests">
        <Panel>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Required Vehicle</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Run the optimizer to load live incidents.
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents.map((incident) => {
                    const assignment = result?.assignments.find(
                      (item) => item.request_id === incident.id,
                    );
                    return (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">{incident.id}</TableCell>
                        <TableCell>{incident.location}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              incident.priority === "Critical"
                                ? "destructive"
                                : incident.priority === "High"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {incident.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{incident.vehicle}</TableCell>
                        <TableCell>{incident.deadline_minutes} min</TableCell>
                        <TableCell
                          className={
                            assignment?.status === "Assigned"
                              ? "font-medium text-success"
                              : "font-medium text-warning"
                          }
                        >
                          {assignment?.status ?? "Pending"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </Section>

      <Section title="Dispatch Planning">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Panel
            title="Choose Requests and Vehicles"
            description="These choices are loaded from the Task 2 database."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request-count">Emergency requests to consider</Label>
                <select
                  id="request-count"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={requestCount}
                  onChange={(event) => setRequestCount(Number(event.target.value))}
                >
                  {Array.from(
                    { length: Math.max(1, requestOptions.length) },
                    (_, index) => index + 1,
                  ).map((count) => (
                    <option key={count} value={count}>
                      {count} request{count === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-count">Vehicles available now</Label>
                <select
                  id="vehicle-count"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={vehicleCount}
                  onChange={(event) => setVehicleCount(Number(event.target.value))}
                >
                  {Array.from(
                    { length: Math.max(1, vehicleOptions.length) },
                    (_, index) => index + 1,
                  ).map((count) => (
                    <option key={count} value={count}>
                      {count} vehicle{count === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Response Planning Style</Label>
                <Select
                  value={strategy}
                  onValueChange={(value) => setStrategy(value as StrategyKey)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map((key) => (
                      <SelectItem key={key} value={key}>
                        {STRATEGY_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => runOptimization()} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Preparing dispatch plan...
                  </>
                ) : (
                  "Prepare Dispatch Plan"
                )}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </Panel>
          <Panel
            title="Choose a Dispatch Plan"
            description="Choose the situation first, then compare the safest response plan."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Choose the emergency requests</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {requestOptions.map((request) => (
                    <label key={request.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(event) =>
                          setSelectedRequests((current) =>
                            event.target.checked
                              ? [...current, request.id]
                              : current.filter((item) => item !== request.id),
                          )
                        }
                      />
                      {request.id} · {request.location}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Only checked requests will appear in the dispatch plan.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-count">Maximum requests to consider</Label>
                <select
                  id="request-count"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={requestCount}
                  onChange={(event) => setRequestCount(Number(event.target.value))}
                >
                  {Array.from(
                    { length: Math.max(1, requestOptions.length) },
                    (_, index) => index + 1,
                  ).map((count) => (
                    <option key={count} value={count}>
                      {count} request{count === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-count">Maximum vehicles to use</Label>
                <select
                  id="vehicle-count"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={vehicleCount}
                  onChange={(event) => setVehicleCount(Number(event.target.value))}
                >
                  {Array.from(
                    { length: Math.max(1, vehicleOptions.length) },
                    (_, index) => index + 1,
                  ).map((count) => (
                    <option key={count} value={count}>
                      {count} vehicle{count === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Choose the actual vehicles</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {vehicleOptions.map((vehicle) => (
                    <label key={vehicle} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.includes(vehicle)}
                        onChange={(event) =>
                          setSelectedVehicles((current) =>
                            event.target.checked
                              ? [...current, vehicle]
                              : current.filter((item) => item !== vehicle),
                          )
                        }
                      />
                      {vehicle}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  The plan will use up to the selected number from this list.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Response Planning Style</Label>
                <Select
                  value={strategy}
                  onValueChange={(value) => setStrategy(value as StrategyKey)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map((key) => (
                      <SelectItem key={key} value={key}>
                        {STRATEGY_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => runOptimization()} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Preparing dispatch plan...
                  </>
                ) : (
                  "Prepare Dispatch Plan"
                )}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </Panel>
          <Panel
            title="Allocation Workflow"
            description="The service evaluates priority, deadlines and availability."
          >
            <div className="mx-auto max-w-md">
              <FlowStep label="Step 1" value="Emergency Request" />
              <Connector />
              <FlowStep label="Step 2" value="Available Vehicle" />
              <Connector />
              <FlowStep label="Step 3" value="Deadline-Aware Assignment" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Task 2 allocations are calculated by the FastAPI resource service.
            </p>
          </Panel>
        </div>
      </Section>

      {result && (
        <div id="dispatch-results" className="scroll-mt-6">
          <Section
            title="Dispatch Summary"
            description={`The ${STRATEGY_LABELS[result.strategy].toLowerCase()} plan has been prepared for the current emergency situation.`}
          >
            <Panel className="border-primary/20 bg-accent-soft/30">
              <p className="text-sm leading-6 text-foreground/80">
                The dispatch team can respond to{" "}
                <strong>
                  {result.served} of {result.total_requests}
                </strong>{" "}
                active requests right now.{" "}
                <strong>
                  {result.unassigned === 0
                    ? "Every request has a vehicle."
                    : `${result.unassigned} request${result.unassigned === 1 ? " is" : "s are"} waiting because no suitable vehicle is free.`}
                </strong>
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <StatCard
                  value={`${result.served} / ${result.total_requests}`}
                  label="Requests Covered"
                />
                <StatCard value={`${result.coverage}%`} label="Emergency Coverage" />
                <StatCard value={result.unassigned} label="Waiting for Help" />
              </div>
            </Panel>
          </Section>
        </div>
      )}

      {comparison.length > 0 && (
        <Section
          title="Planning Options"
          description="The system compared several ways to respond before showing the selected plan."
        >
          <Panel>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispatch Plan</TableHead>
                    <TableHead>Emergency responses</TableHead>
                    <TableHead>Requests covered</TableHead>
                    <TableHead>Still waiting</TableHead>
                    <TableHead>Time to prepare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((item) => (
                    <TableRow key={item.strategy}>
                      <TableCell className="font-medium">
                        {STRATEGY_LABELS[item.strategy]}
                      </TableCell>
                      <TableCell>
                        {item.served} / {item.total_requests}
                      </TableCell>
                      <TableCell>{item.coverage}%</TableCell>
                      <TableCell>{item.unassigned}</TableCell>
                      <TableCell>{item.processing_time_ms} ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </Section>
      )}

      {result && (
        <Section
          title="Why This Plan Is Safe"
          description="A plain-language explanation of the dispatch decision."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Panel title="No Double Booking">
              <p className="text-sm leading-6 text-muted-foreground">
                Each vehicle is assigned to only one emergency request, so no team is sent to two
                places at the same time.
              </p>
              <p className="mt-3 text-sm font-semibold text-primary">
                {result.matching_edges} possible team-to-incident matches checked
              </p>
            </Panel>
            <Panel title="Ready Teams First">
              <p className="text-sm leading-6 text-muted-foreground">
                The system keeps the quickest available teams at the front of the dispatch list.
              </p>
              <p className="mt-3 text-sm font-semibold text-primary">
                First team ready: {result.scheduling_order[0] ?? "No vehicle available"}
              </p>
            </Panel>
            <Panel title="Travel Estimates Remembered">
              <p className="text-sm leading-6 text-muted-foreground">
                The system calculates travel estimates when needed and remembers them in the
                database, so repeated dispatch decisions can return faster.
              </p>
              <p className="mt-3 text-sm font-semibold text-primary">
                {result.cache_hits > 0
                  ? `${result.cache_hits} previous travel estimate${result.cache_hits === 1 ? "" : "s"} reused`
                  : `${result.cache_misses} new travel estimate${result.cache_misses === 1 ? "" : "s"} calculated`}
              </p>
            </Panel>
          </div>
        </Section>
      )}
    </div>
  );
}
