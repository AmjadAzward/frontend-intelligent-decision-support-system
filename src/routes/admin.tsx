import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, Panel, Section } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_BASE_URL = import.meta.env.VITE_RESOURCE_API_BASE_URL ?? "";
const LOCATIONS = [
  ["central-hospital", "Central Hospital"],
  ["north-district", "North District"],
  ["west-junction", "West Junction"],
  ["south-market", "South Market"],
  ["east-park", "East Park"],
  ["shopping-center", "Shopping Center"],
] as const;
type HistoryItem = {
  id: string;
  strategy: string;
  served: number;
  total_requests: number;
  coverage: number;
  unassigned: number;
  processing_time_ms: number;
  created_at: string;
};
type BenchmarkPoint = {
  incident_count: number;
  strategy: string;
  runtime_ms: number;
  peak_memory_kb: number;
  served: number;
  coverage: number;
  unassigned: number;
};
type RequestItem = {
  request_code: string;
  requester_name: string;
  priority: string;
  incident_location_key: string;
  status: string;
  metadata: { required_vehicle_type?: string; deadline_minutes?: number };
};
type VehicleItem = {
  vehicle_code: string;
  vehicle_type: string;
  status: string;
  current_location_key: string;
  metadata: { response_minutes?: number };
};

export default function AdminPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<"request" | "vehicle" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState({
    request_code: "",
    requester_name: "",
    priority: "Medium",
    incident_location_key: "",
    required_vehicle_type: "Ambulance",
    deadline_minutes: 20,
    status: "open",
  });
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_code: "",
    vehicle_type: "Ambulance",
    current_location_key: "",
    response_minutes: 10,
    status: "available",
  });
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<RequestItem | VehicleItem | null>(null);
  const [viewType, setViewType] = useState<"request" | "vehicle">("request");

  const showSuccess = (message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 3500);
  };

  const scrollToForms = () => {
    window.setTimeout(() => {
      document
        .getElementById("task2-data-forms")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const cancelEditing = () => {
    setEditingRequest(null);
    setEditingVehicle(null);
    setRequestForm({
      request_code: "",
      requester_name: "",
      priority: "Medium",
      incident_location_key: "",
      required_vehicle_type: "Ambulance",
      deadline_minutes: 20,
      status: "open",
    });
    setVehicleForm({
      vehicle_code: "",
      vehicle_type: "Ambulance",
      current_location_key: "",
      response_minutes: 10,
      status: "available",
    });
  };

  const loadHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/api/resource/history`);
    if (!response.ok) throw new Error("History request failed");
    setHistory((await response.json()) as HistoryItem[]);
  };

  const loadData = async () => {
    const [requestResponse, vehicleResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/resource/requests`),
      fetch(`${API_BASE_URL}/api/resource/vehicles`),
    ]);
    if (!requestResponse.ok || !vehicleResponse.ok) throw new Error("Data request failed");
    setRequests((await requestResponse.json()) as RequestItem[]);
    setVehicles((await vehicleResponse.json()) as VehicleItem[]);
  };

  useEffect(() => {
    Promise.all([loadHistory(), loadData()]).catch(() => setError("Could not load Task 2 data."));
  }, []);

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/resource/benchmark`, { method: "POST" });
      if (!response.ok) throw new Error("Benchmark request failed");
      setBenchmark((await response.json()) as BenchmarkPoint[]);
    } catch {
      setError("Could not run the scalability benchmark. Check the Task 2 backend.");
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (path: string, body: object) => {
    if (saving) return;
    setError(null);
    setSuccess(null);
    const record = body as Record<string, string | number>;
    if (
      path.endsWith("/requests") &&
      (!String(record.request_code ?? "").trim() ||
        !String(record.requester_name ?? "").trim() ||
        !String(record.incident_location_key ?? "").trim())
    ) {
      throw new Error("Enter a request code, incident name, and location.");
    }
    if (
      path.endsWith("/vehicles") &&
      (!String(record.vehicle_code ?? "").trim() ||
        !String(record.vehicle_type ?? "").trim() ||
        !String(record.current_location_key ?? "").trim())
    ) {
      throw new Error("Enter a vehicle code, vehicle type, and location.");
    }
    const isRequestEdit = path.endsWith("/requests") && editingRequest;
    const isVehicleEdit = path.endsWith("/vehicles") && editingVehicle;
    const target = isRequestEdit
      ? `/api/resource/requests/${editingRequest}`
      : isVehicleEdit
        ? `/api/resource/vehicles/${editingVehicle}`
        : path;
    const kind = path.endsWith("/requests") ? "request" : "vehicle";
    setSaving(kind);
    try {
      const response = await fetch(`${API_BASE_URL}${target}`, {
        method: isRequestEdit || isVehicleEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const responseText = await response.text();
        let detail = responseText;
        try {
          detail = (JSON.parse(responseText) as { detail?: string }).detail ?? responseText;
        } catch {
          /* keep the server text */
        }
        throw new Error(detail || `Save failed (${response.status})`);
      }
      await Promise.all([loadHistory(), loadData()]);
      setEditingRequest(null);
      setEditingVehicle(null);
      showSuccess(
        `${kind === "request" ? "Emergency request" : "Emergency vehicle"} ${isRequestEdit || isVehicleEdit ? "updated" : "added"} successfully.`,
      );
    } finally {
      setSaving(null);
    }
  };

  const updateRecord = async (path: string, body: object) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await response.text());
    await loadData();
  };

  const deleteRecord = async (path: string) => {
    const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await response.text());
    await loadData();
    showSuccess(
      `${path.includes("/requests/") ? "Emergency request" : "Emergency vehicle"} deleted successfully.`,
    );
  };

  const runtimeData = benchmark.reduce<Record<number, Record<string, number>>>((acc, item) => {
    acc[item.incident_count] ??= { incident_count: item.incident_count };
    acc[item.incident_count][item.strategy] = item.runtime_ms;
    return acc;
  }, {});
  const memoryData = benchmark.reduce<Record<number, Record<string, number>>>((acc, item) => {
    acc[item.incident_count] ??= { incident_count: item.incident_count };
    acc[item.incident_count][item.strategy] = item.peak_memory_kb;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        eyebrow="System Administration"
        title="Task 2 Evaluation"
        subtitle="Review persisted allocation history and measure scalability across increasing incident loads."
      />
      {error && (
        <p className="mx-auto max-w-7xl px-4 pt-6 text-sm text-destructive lg:px-8">{error}</p>
      )}
      {success && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-emerald-500/30 bg-background px-4 py-3 text-sm text-emerald-700 shadow-xl animate-in fade-in slide-in-from-bottom-3"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
            ✓
          </span>
          <span>{success}</span>
        </div>
      )}
      {saving && (
        <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary shadow-sm animate-pulse">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            {saving === "request" ? "Saving emergency request..." : "Saving emergency vehicle..."}
          </div>
        </div>
      )}
      <Section
        title="Manage Task 2 Data"
        description="Add new incidents and emergency vehicles to Supabase."
      >
        <div id="task2-data-forms" className="scroll-mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Add Emergency Request">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="request-code">Request code</Label>
                <Input
                  id="request-code"
                  placeholder="e.g. E106"
                  value={requestForm.request_code}
                  onChange={(e) => setRequestForm({ ...requestForm, request_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incident-name">Incident name</Label>
                <Input
                  id="incident-name"
                  placeholder="e.g. Road accident"
                  value={requestForm.requester_name}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, requester_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-location">Incident location</Label>
                <select
                  id="request-location"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={requestForm.incident_location_key}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, incident_location_key: e.target.value })
                  }
                >
                  <option value="">Choose location</option>
                  {LOCATIONS.map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-priority">Priority</Label>
                <select
                  id="request-priority"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={requestForm.priority}
                  onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                >
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-status">Request status</Label>
                <select
                  id="request-status"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={requestForm.status}
                  onChange={(e) => setRequestForm({ ...requestForm, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-needed">Vehicle needed</Label>
                <Input
                  id="vehicle-needed"
                  placeholder="e.g. Ambulance"
                  value={requestForm.required_vehicle_type}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, required_vehicle_type: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline-minutes">Response deadline (minutes)</Label>
                <Input
                  id="deadline-minutes"
                  type="number"
                  min="1"
                  value={requestForm.deadline_minutes}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, deadline_minutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                onClick={() =>
                  createRecord("/api/resource/requests", requestForm)
                    .then(() =>
                      setRequestForm({
                        ...requestForm,
                        request_code: "",
                        requester_name: "",
                        incident_location_key: "",
                      }),
                    )
                    .catch((error) =>
                      setError(error instanceof Error ? error.message : "Could not add request."),
                    )
                }
              >
                {editingRequest ? "Update Request" : "Add Request"}
              </Button>
              {editingRequest && (
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </Panel>
          <Panel title="Add Emergency Vehicle">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicle-code">Vehicle code</Label>
                <Input
                  id="vehicle-code"
                  placeholder="e.g. A03"
                  value={vehicleForm.vehicle_code}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-type">Vehicle type</Label>
                <Input
                  id="vehicle-type"
                  placeholder="e.g. Ambulance"
                  value={vehicleForm.vehicle_type}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-location">Base location</Label>
                <select
                  id="vehicle-location"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={vehicleForm.current_location_key}
                  onChange={(e) =>
                    setVehicleForm({ ...vehicleForm, current_location_key: e.target.value })
                  }
                >
                  <option value="">Choose location</option>
                  {LOCATIONS.map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-status">Availability</Label>
                <select
                  id="vehicle-status"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={vehicleForm.status}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="maintenance">Under maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response-minutes">Typical response time (minutes)</Label>
                <Input
                  id="response-minutes"
                  type="number"
                  min="1"
                  value={vehicleForm.response_minutes}
                  onChange={(e) =>
                    setVehicleForm({ ...vehicleForm, response_minutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                onClick={() =>
                  createRecord("/api/resource/vehicles", vehicleForm)
                    .then(() =>
                      setVehicleForm({
                        ...vehicleForm,
                        vehicle_code: "",
                        current_location_key: "",
                      }),
                    )
                    .catch((error) =>
                      setError(error instanceof Error ? error.message : "Could not add vehicle."),
                    )
                }
              >
                {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
              </Button>
              {editingVehicle && (
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </Section>
      <Section title="Emergency Requests" description="View, edit, or remove incident records.">
        <Panel>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Incident</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((item) => (
                    <TableRow key={item.request_code}>
                      <TableCell className="font-medium">{item.request_code}</TableCell>
                      <TableCell>{item.requester_name}</TableCell>
                      <TableCell>{item.priority}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setViewRecord(item);
                              setViewType("request");
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRequest(item.request_code);
                              setRequestForm({
                                request_code: item.request_code,
                                requester_name: item.requester_name,
                                priority: item.priority,
                                incident_location_key: item.incident_location_key,
                                required_vehicle_type:
                                  item.metadata?.required_vehicle_type ?? "Ambulance",
                                deadline_minutes: item.metadata?.deadline_minutes ?? 20,
                              });
                              scrollToForms();
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              deleteRecord(`/api/resource/requests/${item.request_code}`).catch(
                                (error) => setError(error.message),
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </Section>
      <Section title="Emergency Vehicles" description="View, edit, or remove vehicle records.">
        <Panel>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((item) => (
                    <TableRow key={item.vehicle_code}>
                      <TableCell className="font-medium">{item.vehicle_code}</TableCell>
                      <TableCell>{item.vehicle_type}</TableCell>
                      <TableCell>{item.current_location_key}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setViewRecord(item);
                              setViewType("vehicle");
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingVehicle(item.vehicle_code);
                              setVehicleForm({
                                vehicle_code: item.vehicle_code,
                                vehicle_type: item.vehicle_type,
                                current_location_key: item.current_location_key,
                                response_minutes: item.metadata?.response_minutes ?? 10,
                              });
                              scrollToForms();
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              deleteRecord(`/api/resource/vehicles/${item.vehicle_code}`).catch(
                                (error) => setError(error.message),
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </Section>
      <Section
        title="Allocation History"
        description="Every completed optimization run is stored in Supabase."
      >
        <Panel>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Served</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Unassigned</TableHead>
                  <TableHead>Runtime</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No saved runs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{item.strategy}</TableCell>
                      <TableCell>
                        {item.served} / {item.total_requests}
                      </TableCell>
                      <TableCell>{item.coverage}%</TableCell>
                      <TableCell>{item.unassigned}</TableCell>
                      <TableCell>{item.processing_time_ms} ms</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      </Section>
      <Section
        title="Scalability Experiments"
        description="Synthetic scenarios measure runtime and peak memory as the incident count grows."
      >
        <div className="mb-5 flex justify-end">
          <Button onClick={runBenchmark} disabled={loading}>
            {loading ? "Running benchmark..." : "Run Scalability Benchmark"}
          </Button>
        </div>
        {benchmark.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Runtime (ms)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Object.values(runtimeData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="incident_count" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="greedy" stroke="var(--primary)" strokeWidth={2} />
                    <Line dataKey="genetic" stroke="var(--accent)" strokeWidth={2} />
                    <Line dataKey="backtracking" stroke="var(--success)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Peak Memory (KB)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.values(memoryData)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="incident_count" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="greedy" fill="var(--primary)" />
                    <Bar dataKey="genetic" fill="var(--accent)" />
                    <Bar dataKey="backtracking" fill="var(--success)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        )}
      </Section>
      <Dialog open={viewRecord !== null} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewType === "request" ? "Emergency Request Details" : "Emergency Vehicle Details"}
            </DialogTitle>
            <DialogDescription>Complete record information from the database.</DialogDescription>
          </DialogHeader>
          {viewRecord && viewType === "request" && "request_code" in viewRecord && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Request code" value={viewRecord.request_code} />
              <Detail label="Incident name" value={viewRecord.requester_name || "Not provided"} />
              <Detail label="Priority" value={viewRecord.priority} />
              <Detail label="Status" value={viewRecord.status} />
              <Detail
                label="Incident location"
                value={viewRecord.incident_location_key || "Not provided"}
              />
              <Detail
                label="Vehicle needed"
                value={viewRecord.metadata?.required_vehicle_type || "Not provided"}
              />
              <Detail
                label="Response deadline"
                value={`${viewRecord.metadata?.deadline_minutes ?? "Not provided"} minutes`}
              />
            </div>
          )}
          {viewRecord && viewType === "vehicle" && "vehicle_code" in viewRecord && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Vehicle code" value={viewRecord.vehicle_code} />
              <Detail label="Vehicle type" value={viewRecord.vehicle_type} />
              <Detail label="Availability" value={viewRecord.status} />
              <Detail
                label="Base location"
                value={viewRecord.current_location_key || "Not provided"}
              />
              <Detail
                label="Typical response time"
                value={`${viewRecord.metadata?.response_minutes ?? "Not provided"} minutes`}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
