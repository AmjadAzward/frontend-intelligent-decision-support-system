import { useEffect, useState } from "react";
import { Check, Lightbulb, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader, Panel, Section } from "@/components/page-shell";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { locationName } from "@/lib/city-data";

/**
 * Base URL of the Task 4 "Intelligent Decision" backend service.
 * In a deployed app this would come from an environment variable; for local
 * development it points at the FastAPI service running on port 8004.
 */
const API_BASE_URL = import.meta.env.VITE_TASK4_API_URL ?? "http://127.0.0.1:8004";

/**
 * The backend groups facilities by these type keys. The UI shows friendlier
 * labels, so we translate label -> backend facility_type here.
 */
const FACILITY_TYPE_MAP: Record<string, string> = {
  Hospital: "hospital",
  "Police Station": "police",
  "Fire Station": "fire",
  "Public Service Center": "recreation",
};

/** The three ranking techniques the backend implements (for comparison). */
const ALGORITHMS = ["linear_search", "weighted_ranking", "heuristic_scoring"] as const;
type AlgorithmKey = (typeof ALGORITHMS)[number];

const ALGORITHM_LABEL: Record<AlgorithmKey, string> = {
  linear_search: "Linear Search",
  weighted_ranking: "Weighted Ranking",
  heuristic_scoring: "Heuristic Scoring",
};

/** Shape of a single scored facility returned by the backend. */
type ScoredFacility = {
  location_key: string;
  name: string;
  facility_type: string;
  distance_km: number;
  capacity: number | null;
  current_load: number;
  availability: number;
  score: number;
  rank: number;
};

type RecommendationResponse = {
  algorithm: AlgorithmKey;
  location_key: string;
  facility_type: string;
  recommended: ScoredFacility | null;
  ranked: ScoredFacility[];
};

type ManagedFacility = {
  location_key: string;
  facility_type: string;
  capacity: number | null;
  current_load: number;
  priority_score: number;
};
type LocationOption = { location_key: string; name: string };

/** Turn a raw availability headroom into a friendly label for the cards. */
function availabilityLabel(availability: number, capacity: number | null): string {
  if (!capacity || capacity <= 0) return "Unknown";
  const ratio = availability / capacity;
  if (ratio >= 0.4) return "High";
  if (ratio >= 0.15) return "Medium";
  return "Low";
}

/** Call the backend for one algorithm and return its response. */
async function fetchRecommendation(
  locationKey: string,
  facilityType: string,
  weights: { distance: number; capacity: number; availability: number },
  algorithm: AlgorithmKey,
): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/decision/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location_key: locationKey,
      facility_type: facilityType,
      weights,
      algorithm,
    }),
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as RecommendationResponse;
}

export default function FacilityAdvisorPage() {
  const [facilityType, setFacilityType] = useState("Hospital");
  const [distance, setDistance] = useState(60);
  const [capacity, setCapacity] = useState(20);
  const [availability, setAvailability] = useState(20);

  const [ranked, setRanked] = useState<ScoredFacility[]>([]);
  const [recommended, setRecommended] = useState<ScoredFacility | null>(null);
  const [comparison, setComparison] = useState<
    { method: string; facility: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [facilities, setFacilities] = useState<ManagedFacility[]>([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedFacility | null>(null);
  const [form, setForm] = useState<ManagedFacility>({
    location_key: "",
    facility_type: "hospital",
    capacity: 100,
    current_load: 0,
    priority_score: 0,
  });
  const [manageError, setManageError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  const loadFacilities = async () => {
    const response = await fetch(`${API_BASE_URL}/api/facilities`);
    if (!response.ok) throw new Error("Could not load facilities");
    setFacilities((await response.json()) as ManagedFacility[]);
  };

  const loadLocations = async () => {
    const response = await fetch(`${API_BASE_URL}/api/facilities/locations`);
    if (!response.ok) throw new Error("Could not load locations");
    setLocations((await response.json()) as LocationOption[]);
  };

  useEffect(() => {
    Promise.all([loadFacilities(), loadLocations()]).catch(() => undefined);
  }, []);

  const saveFacility = async () => {
    setManageError(null);
    if (!form.location_key) {
      setManageError("Choose a location from the database list before saving.");
      return;
    }
    try {
      const response = await fetch(
        editing
          ? `${API_BASE_URL}/api/facilities/${editing.location_key}`
          : `${API_BASE_URL}/api/facilities`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? `Save failed (${response.status})`);
      }
      await loadFacilities();
      setEditing(null);
      setForm({
        location_key: "",
        facility_type: "hospital",
        capacity: 100,
        current_load: 0,
        priority_score: 0,
      });
    } catch (saveError) {
      setManageError(
        saveError instanceof Error ? saveError.message : "Could not save facility.",
      );
    }
  };

  const removeFacility = async (locationKey: string) => {
    setManageError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/facilities/${locationKey}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? `Delete failed (${response.status})`);
      }
      await loadFacilities();
    } catch (deleteError) {
      setManageError(
        deleteError instanceof Error ? deleteError.message : "Could not delete facility.",
      );
    }
  };

  const handleRecommend = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    const total = distance + capacity + availability || 1;
    // Backend expects each weight in the 0..1 range.
    const weights = {
      distance: distance / total,
      capacity: capacity / total,
      availability: availability / total,
    };
    const backendType = FACILITY_TYPE_MAP[facilityType] ?? "hospital";

    try {
      // Run all three algorithms so the comparison table shows real results.
      const responses = await Promise.all(
        ALGORITHMS.map((algo) => fetchRecommendation("residential", backendType, weights, algo)),
      );

      // Use the weighted-ranking result as the primary display.
      const primary = responses[1];
      setRanked(primary.ranked);
      setRecommended(primary.recommended);

      setComparison(
        responses.map((res, i) => ({
          method: ALGORITHM_LABEL[ALGORITHMS[i]],
          facility: res.recommended?.name ?? "No facility found",
          score: res.recommended?.score ?? 0,
        })),
      );
    } catch (err) {
      setError(
        "Could not reach the recommendation service. Make sure the backend is running on port 8004.",
      );
      setRanked([]);
      setRecommended(null);
      setComparison([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Smart City Service"
        title="Smart Facility Advisor"
        subtitle="Find the most suitable public facility for your needs."
      />

      <Section title="Search Panel">
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setManageError(null);
              setManageOpen(true);
            }}
          >
            <Plus className="size-4" /> Manage Facilities
          </Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Panel
            title="Your Journey"
            description="Set the location and facility type for the recommendation."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Your Location</Label>
                <Select defaultValue="residential">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">{locationName("residential")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Facility Type</Label>
                <Select value={facilityType} onValueChange={setFacilityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hospital">Hospital</SelectItem>
                    <SelectItem value="Police Station">Police Station</SelectItem>
                    <SelectItem value="Fire Station">Fire Station</SelectItem>
                    <SelectItem value="Public Service Center">Public Service Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Panel>

          <Panel
            title="Decision Preferences"
            description="Adjust the factors used to rank available facilities."
          >
            <div className="space-y-4">
              {(
                [
                  ["Distance", distance, setDistance],
                  ["Capacity", capacity, setCapacity],
                  ["Availability", availability, setAvailability],
                ] as [string, number, (value: number) => void][]
              ).map(([label, value, setter]) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{label}</Label>
                    <span className="font-medium text-primary">{value}%</span>
                  </div>
                  <input
                    className="w-full accent-[var(--primary)]"
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(event) => setter(Number(event.target.value))}
                  />
                </div>
              ))}
              <Button className="w-full" onClick={handleRecommend} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Finding best facility…
                  </>
                ) : (
                  "Find Best Facility"
                )}
              </Button>
            </div>
          </Panel>
        </div>
      </Section>

      {error && (
        <Section title="">
          <Panel className="border-destructive/30 bg-destructive/5">
            <p className="text-sm text-destructive">{error}</p>
          </Panel>
        </Section>
      )}

      {hasSearched && !error && (
        <Section
          title="Facility Recommendations"
          description={`Results for ${facilityType.toLowerCase()} facilities near Residential District.`}
        >
          {ranked.length === 0 && !loading ? (
            <Panel>
              <p className="text-sm text-muted-foreground">
                No {facilityType.toLowerCase()} facilities were found for this location.
              </p>
            </Panel>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {ranked.map((facility) => (
                <div
                  key={facility.location_key}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{facility.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {facility.distance_km} km
                      </p>
                    </div>
                    {facility.rank === 1 && <Badge>Recommended</Badge>}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Capacity</p>
                      <p className="mt-1 font-medium">{facility.capacity ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Availability</p>
                      <p className="mt-1 font-medium text-success">
                        {availabilityLabel(facility.availability, facility.capacity)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Recommendation Score
                    </p>
                    <p className="mt-1 font-display text-3xl font-bold text-primary">
                      {Math.round(facility.score * 100)}{" "}
                      <span className="text-sm font-medium text-muted-foreground">/ 100</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {recommended && !error && (
        <Section title="Smart Recommendation">
          <Panel className="border-primary/20 bg-accent-soft/40">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Lightbulb className="size-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Best Match</span>
                </div>
                <h2 className="mt-3 font-display text-3xl font-bold">{recommended.name}</h2>
                <p className="mt-2 text-4xl font-bold text-primary">
                  {Math.round(recommended.score * 100)} / 100
                </p>
              </div>
              <div>
                <p className="font-semibold">Why this facility?</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="size-4 text-success" />
                    {recommended.distance_km <= 5
                      ? "Closest available option"
                      : "Strong distance-performance balance"}
                  </li>
                  <li className="flex gap-2">
                    <Check className="size-4 text-success" />
                    {(recommended.capacity ?? 0) >= 150
                      ? "Good capacity for current demand"
                      : "Reasonable capacity for the current demand"}
                  </li>
                  <li className="flex gap-2">
                    <Check className="size-4 text-success" />
                    {availabilityLabel(recommended.availability, recommended.capacity) === "High"
                      ? "High availability"
                      : "Adequate availability"}
                  </li>
                </ul>
              </div>
            </div>
          </Panel>
        </Section>
      )}

      {comparison.length > 0 && !error && (
        <Section title="Decision Method Comparison">
          <Panel>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Recommended Facility</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((row) => (
                    <TableRow key={row.method}>
                      <TableCell className="font-medium">{row.method}</TableCell>
                      <TableCell>{row.facility}</TableCell>
                      <TableCell>
                        {row.method === ALGORITHM_LABEL.heuristic_scoring
                          ? `${Math.round(row.score)} (raw score)`
                          : `${Math.round(row.score * 100)} / 100`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Heuristic Scoring applies fixed rules (distance, availability and capacity
              bonuses/penalties) and is not affected by the Decision Preferences sliders above.
            </p>
          </Panel>
        </Section>
      )}

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Facilities</DialogTitle>
            <DialogDescription>
              Create, edit, or delete Task 4 facility records stored in Supabase.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-3">
              <Label>Location</Label>
              <Select
                value={form.location_key}
                disabled={Boolean(editing)}
                onValueChange={(value) => setForm({ ...form, location_key: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.location_key} value={location.location_key}>
                      {location.name} ({location.location_key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Locations are loaded from the shared city database.
              </p>
              <Label>Facility Type</Label>
              <Input
                value={form.facility_type}
                onChange={(event) => setForm({ ...form, facility_type: event.target.value })}
                placeholder="hospital"
              />
              <Label>Capacity</Label>
              <Input
                type="number"
                value={form.capacity ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    capacity: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
              />
              <Label>Current Load</Label>
              <Input
                type="number"
                value={form.current_load}
                onChange={(event) => setForm({ ...form, current_load: Number(event.target.value) })}
              />
              <Label>Priority Score</Label>
              <Input
                type="number"
                step="0.1"
                value={form.priority_score}
                onChange={(event) =>
                  setForm({ ...form, priority_score: Number(event.target.value) })
                }
              />
              <Button className="mt-2 w-full" onClick={saveFacility}>
                {editing ? "Update Facility" : "Create Facility"}
              </Button>
              {editing && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setEditing(null);
                    setForm({
                      location_key: "",
                      facility_type: "hospital",
                      capacity: 100,
                      current_load: 0,
                      priority_score: 0,
                    });
                  }}
                >
                  Cancel Edit
                </Button>
              )}
              {manageError && <p className="text-sm text-destructive">{manageError}</p>}
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              {facilities.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No facilities found.</p>
              ) : (
                facilities.map((facility) => (
                  <div
                    key={facility.location_key}
                    className="flex items-center justify-between gap-3 border-b border-border p-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{facility.location_key}</p>
                      <p className="text-xs text-muted-foreground">
                        {facility.facility_type} · {facility.capacity ?? "No capacity"} capacity ·{" "}
                        {facility.current_load} load
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${facility.location_key}`}
                        onClick={() => {
                          setEditing(facility);
                          setForm(facility);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${facility.location_key}`}
                        onClick={() => removeFacility(facility.location_key)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="sr-only" aria-label="Current preference weights">
        Distance {distance}%, capacity {capacity}%, availability {availability}%
      </div>
    </div>
  );
}
