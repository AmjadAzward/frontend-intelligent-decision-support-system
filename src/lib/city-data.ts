export type CityLocation = {
  id: string;
  name: string;
  short: string;
  kind: "civic" | "medical" | "safety" | "education" | "transport" | "commercial" | "utility" | "residential" | "leisure";
  x: number;
  y: number;
};

export type CityRoad = {
  from: string;
  to: string;
  km: number;
};

export const CITY_LOCATIONS: CityLocation[] = [
  { id: "city-hall", name: "City Hall", short: "Hall", kind: "civic", x: 440, y: 250 },
  { id: "central-hospital", name: "Central Hospital", short: "C. Hosp", kind: "medical", x: 620, y: 160 },
  { id: "community-hospital", name: "Community Hospital", short: "Com. Hosp", kind: "medical", x: 780, y: 250 },
  { id: "police-station", name: "Police Station", short: "Police", kind: "safety", x: 300, y: 140 },
  { id: "fire-station", name: "Fire Station", short: "Fire", kind: "safety", x: 300, y: 370 },
  { id: "university", name: "University", short: "Univ", kind: "education", x: 620, y: 380 },
  { id: "bus-station", name: "Central Bus Station", short: "Bus", kind: "transport", x: 470, y: 110 },
  { id: "shopping-center", name: "Shopping Center", short: "Shops", kind: "commercial", x: 700, y: 470 },
  { id: "waste-center", name: "Waste Management Center", short: "Waste", kind: "utility", x: 140, y: 250 },
  { id: "residential", name: "Residential District", short: "Resid.", kind: "residential", x: 460, y: 490 },
  { id: "public-park", name: "Public Park", short: "Park", kind: "leisure", x: 250, y: 500 },
  { id: "medical-center", name: "City Medical Center", short: "Med Ctr", kind: "medical", x: 830, y: 380 },
  { id: "service-center", name: "Public Service Center", short: "Service", kind: "civic", x: 190, y: 60 },
  { id: "industrial-zone", name: "Industrial Zone", short: "Industry", kind: "utility", x: 100, y: 420 },
  { id: "riverside", name: "Riverside Suburb", short: "Riverside", kind: "residential", x: 860, y: 90 },
];

export const CITY_ROADS: CityRoad[] = [
  { from: "city-hall", to: "bus-station", km: 1.6 },
  { from: "city-hall", to: "police-station", km: 2.4 },
  { from: "city-hall", to: "fire-station", km: 2.2 },
  { from: "city-hall", to: "central-hospital", km: 3.1 },
  { from: "city-hall", to: "university", km: 3.4 },
  { from: "city-hall", to: "residential", km: 3.0 },
  { from: "city-hall", to: "shopping-center", km: 4.6 },
  { from: "city-hall", to: "service-center", km: 4.1 },
  { from: "bus-station", to: "central-hospital", km: 5.8 },
  { from: "bus-station", to: "police-station", km: 2.0 },
  { from: "bus-station", to: "riverside", km: 6.2 },
  { from: "bus-station", to: "service-center", km: 3.6 },
  { from: "bus-station", to: "university", km: 5.1 },
  { from: "central-hospital", to: "community-hospital", km: 2.7 },
  { from: "central-hospital", to: "riverside", km: 3.4 },
  { from: "central-hospital", to: "university", km: 2.9 },
  { from: "community-hospital", to: "medical-center", km: 2.3 },
  { from: "university", to: "shopping-center", km: 1.9 },
  { from: "university", to: "medical-center", km: 3.2 },
  { from: "shopping-center", to: "residential", km: 2.6 },
  { from: "residential", to: "public-park", km: 2.1 },
  { from: "public-park", to: "fire-station", km: 1.8 },
  { from: "fire-station", to: "waste-center", km: 2.0 },
  { from: "waste-center", to: "industrial-zone", km: 1.9 },
  { from: "industrial-zone", to: "public-park", km: 2.4 },
];

export const ROUTE_PLANNER_LOCATIONS = [
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
];

export function locationById(id: string): CityLocation {
  return CITY_LOCATIONS.find((l) => l.id === id) ?? CITY_LOCATIONS[0];
}

export function locationName(id: string): string {
  return locationById(id).name;
}

type AdjacencyMap = Map<string, { to: string; km: number }[]>;

export function buildAdjacency(roads: CityRoad[] = CITY_ROADS): AdjacencyMap {
  const map: AdjacencyMap = new Map();
  for (const l of CITY_LOCATIONS) map.set(l.id, []);
  for (const r of roads) {
    map.get(r.from)?.push({ to: r.to, km: r.km });
    map.get(r.to)?.push({ to: r.from, km: r.km });
  }
  return map;
}

export function degreeOf(id: string): number {
  return CITY_ROADS.filter((r) => r.from === id || r.to === id).length;
}

export function roadBetween(a: string, b: string): number | undefined {
  return CITY_ROADS.find(
    (r) => (r.from === a && r.to === b) || (r.from === b && r.to === a),
  )?.km;
}

export type PathResult = {
  path: string[];
  distanceKm: number;
  visited: number;
  timeMs: number;
};

function pathDistance(path: string[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += roadBetween(path[i], path[i + 1]) ?? 0;
  return Math.round(total * 10) / 10;
}

export function bfsPath(start: string, goal: string): PathResult {
  const t0 = performance.now();
  const adj = buildAdjacency();
  const prev = new Map<string, string | null>([[start, null]]);
  const queue = [start];
  let visited = 0;
  while (queue.length) {
    const node = queue.shift()!;
    visited++;
    if (node === goal) break;
    for (const edge of adj.get(node) ?? []) {
      if (!prev.has(edge.to)) {
        prev.set(edge.to, node);
        queue.push(edge.to);
      }
    }
  }
  const path = reconstruct(prev, goal);
  return { path, distanceKm: pathDistance(path), visited, timeMs: elapsed(t0) };
}

export function dijkstraPath(start: string, goal: string): PathResult {
  const t0 = performance.now();
  const adj = buildAdjacency();
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>([[start, null]]);
  const settled = new Set<string>();
  dist.set(start, 0);
  let visited = 0;
  while (true) {
    let node: string | null = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (!settled.has(id) && d < best) {
        best = d;
        node = id;
      }
    }
    if (!node) break;
    settled.add(node);
    visited++;
    if (node === goal) break;
    for (const edge of adj.get(node) ?? []) {
      const nd = best + edge.km;
      if (nd < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nd);
        prev.set(edge.to, node);
      }
    }
  }
  const path = reconstruct(prev, goal);
  return { path, distanceKm: pathDistance(path), visited, timeMs: elapsed(t0) };
}

export function aStarPath(start: string, goal: string): PathResult {
  const t0 = performance.now();
  const adj = buildAdjacency();
  const h = (id: string) => {
    const a = locationById(id);
    const b = locationById(goal);
    return Math.hypot(a.x - b.x, a.y - b.y) / 90;
  };
  const g = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, string | null>([[start, null]]);
  const open = new Set<string>([start]);
  const closed = new Set<string>();
  let visited = 0;
  while (open.size) {
    let node: string | null = null;
    let best = Infinity;
    for (const id of open) {
      const score = (g.get(id) ?? Infinity) + h(id);
      if (score < best) {
        best = score;
        node = id;
      }
    }
    if (!node) break;
    open.delete(node);
    closed.add(node);
    visited++;
    if (node === goal) break;
    for (const edge of adj.get(node) ?? []) {
      if (closed.has(edge.to)) continue;
      const nd = (g.get(node) ?? 0) + edge.km;
      if (nd < (g.get(edge.to) ?? Infinity)) {
        g.set(edge.to, nd);
        prev.set(edge.to, node);
        open.add(edge.to);
      }
    }
  }
  const path = reconstruct(prev, goal);
  return { path, distanceKm: pathDistance(path), visited, timeMs: elapsed(t0) };
}

function reconstruct(prev: Map<string, string | null>, goal: string): string[] {
  if (!prev.has(goal)) return [];
  const path: string[] = [];
  let cur: string | null | undefined = goal;
  while (cur) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return path;
}

function elapsed(t0: number): number {
  return Math.round((performance.now() - t0) * 100) / 100;
}

export function dfsOrder(start: string): string[] {
  const adj = buildAdjacency();
  const seen = new Set<string>();
  const order: string[] = [];
  const walk = (node: string) => {
    if (seen.has(node)) return;
    seen.add(node);
    order.push(node);
    for (const e of adj.get(node) ?? []) walk(e.to);
  };
  walk(start);
  return order;
}

export function bfsOrder(start: string): string[] {
  const adj = buildAdjacency();
  const seen = new Set<string>([start]);
  const order: string[] = [];
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const e of adj.get(node) ?? []) {
      if (!seen.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
    }
  }
  return order;
}

export const NETWORK_STATS = {
  locations: CITY_LOCATIONS.length,
  roads: CITY_ROADS.length,
  averageConnections: Math.round(((2 * CITY_ROADS.length) / CITY_LOCATIONS.length) * 10) / 10,
  density:
    Math.round(
      ((2 * CITY_ROADS.length) / (CITY_LOCATIONS.length * (CITY_LOCATIONS.length - 1))) * 100,
    ) / 100,
};

export const RANKED_LOCATIONS = CITY_LOCATIONS.map((l) => ({
  ...l,
  connections: degreeOf(l.id),
}))
  .sort((a, b) => b.connections - a.connections)
  .slice(0, 5);

/* Emergency data */
export type EmergencyRequest = {
  id: string;
  locationId: string;
  priority: "High" | "Medium" | "Low";
  vehicle: string;
  status: "Assigned" | "Waiting";
  assigned: string | null;
};

export const EMERGENCY_REQUESTS: EmergencyRequest[] = [
  { id: "ER-001", locationId: "university", priority: "High", vehicle: "Ambulance", status: "Assigned", assigned: "AMB-02" },
  { id: "ER-002", locationId: "shopping-center", priority: "Medium", vehicle: "Ambulance", status: "Assigned", assigned: "AMB-01" },
  { id: "ER-003", locationId: "residential", priority: "High", vehicle: "Ambulance", status: "Waiting", assigned: null },
  { id: "ER-004", locationId: "public-park", priority: "Low", vehicle: "Ambulance", status: "Assigned", assigned: "AMB-03" },
  { id: "ER-005", locationId: "industrial-zone", priority: "Medium", vehicle: "Ambulance", status: "Assigned", assigned: "AMB-04" },
];

/* Facility data */
export const FACILITIES = [
  {
    id: "central-hospital",
    name: "Central Hospital",
    type: "Hospital",
    distanceKm: 4.2,
    capacity: "80 beds",
    capacityValue: 80,
    availability: "High",
    score: 91,
  },
  {
    id: "community-hospital",
    name: "Community Hospital",
    type: "Hospital",
    distanceKm: 7.1,
    capacity: "150 beds",
    capacityValue: 150,
    availability: "High",
    score: 84,
  },
  {
    id: "medical-center",
    name: "City Medical Center",
    type: "Hospital",
    distanceKm: 5.6,
    capacity: "60 beds",
    capacityValue: 60,
    availability: "Medium",
    score: 76,
  },
  {
    id: "north-police-station",
    name: "North Police Station",
    type: "Police Station",
    distanceKm: 3.4,
    capacity: "36 officers",
    capacityValue: 36,
    availability: "High",
    score: 88,
  },
  {
    id: "river-fire-station",
    name: "River Fire Station",
    type: "Fire Station",
    distanceKm: 2.8,
    capacity: "18 crews",
    capacityValue: 18,
    availability: "High",
    score: 86,
  },
  {
    id: "public-service-center",
    name: "Civic Service Center",
    type: "Public Service Center",
    distanceKm: 2.2,
    capacity: "120 service slots",
    capacityValue: 120,
    availability: "Medium",
    score: 82,
  },
];

/* Waste collection data */
export const COLLECTION_POINTS = [
  { id: "residential", label: "Collection Point A", locationId: "residential" },
  { id: "shopping-center", label: "Collection Point B", locationId: "shopping-center" },
  { id: "university", label: "Collection Point C", locationId: "university" },
  { id: "public-park", label: "Collection Point D", locationId: "public-park" },
  { id: "industrial-zone", label: "Collection Point E", locationId: "industrial-zone" },
];
