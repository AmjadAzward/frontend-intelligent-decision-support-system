import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Cpu,
  Download,
  Eye,
  EyeOff,
  Fuel,
  Gauge,
  HelpCircle,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Route,
  Scale,
  Share2,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import L, { type LatLngBoundsExpression, type LatLngTuple } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  ScaleControl,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import "leaflet/dist/leaflet.css";

import { PageHeader, Panel, Section, StatCard } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  computeSpacedLayout,
  type SpacedLayoutResult,
  type SpacingMode,
} from "@/lib/coordinate-layout";
import {
  MOCK_CITY_MAP,
  MOCK_OPTIMIZATION_RESULT,
  type WasteNode,
  type WasteEdge,
  type WasteMapResponse,
  type CoordinatePoint,
  type TruckRoute,
  type OptimizationSummary,
  type OptimizationResponse,
} from "@/lib/waste-mock-data";
import { exportOptimizationToCsv, exportToJson } from "@/lib/waste-export";

const TASK5_API_BASE_URL = import.meta.env.VITE_TASK5_API_URL ?? "http://127.0.0.1:8005";
const MAP_API_URL = `${TASK5_API_BASE_URL}/api/v1/map`;
const OPTIMIZE_API_URL = `${TASK5_API_BASE_URL}/api/v1/optimize`;
const HEALTH_API_URL = `${TASK5_API_BASE_URL}/api/v1/health`;

export type {
  WasteNode,
  WasteEdge,
  WasteMapResponse,
  TruckRoute,
  OptimizationSummary,
  OptimizationResponse,
};
export type RouteCoordinate = CoordinatePoint;

export interface ActiveTruckPosition {
  truckId: string;
  lat: number;
  lon: number;
  headingDeg: number;
  currentNodeName: string;
  currentNodeType: string;
  progressPct: number;
}

const ROUTE_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
  "#4f46e5", // indigo
  "#c026d3", // fuchsia
  "#ca8a04", // yellow-amber
  "#0d9488", // teal
];

function getTruckColor(truckId: string, index = 0): string {
  const num = parseInt(truckId.replace(/\D/g, ""), 10);
  const colorIndex = isNaN(num) ? index : num - 1;
  return ROUTE_COLORS[Math.abs(colorIndex) % ROUTE_COLORS.length] || "#2563eb";
}

/** Animated number counter hook (ease-out cubic) */
function useAnimatedCounter(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startValue + (target - startValue) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

interface PrecomputedRoute {
  truckId: string;
  totalDistance: number;
  segments: {
    p1: RouteCoordinate;
    p2: RouteCoordinate;
    segDist: number;
    startDist: number;
    headingDeg: number;
  }[];
}

function precomputeRoute(route: TruckRoute): PrecomputedRoute {
  const coords = route.full_path_coordinates;
  const segments: PrecomputedRoute["segments"] = [];
  let totalDistance = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    if (p1 && p2) {
      const midLatRad = ((p1.lat + p2.lat) / 2) * (Math.PI / 180);
      const cosLat = Math.cos(midLatRad);
      const dLatKm = (p2.lat - p1.lat) * 111.32;
      const dLonKm = (p2.lon - p1.lon) * 111.32 * cosLat;
      const segDist = Math.sqrt(dLatKm * dLatKm + dLonKm * dLonKm);

      const dLon = (p2.lon - p1.lon) * cosLat;
      const dLat = p2.lat - p1.lat;
      let headingDeg = (Math.atan2(dLon, dLat) * 180) / Math.PI;
      if (headingDeg < 0) headingDeg += 360;

      segments.push({
        p1,
        p2,
        segDist,
        startDist: totalDistance,
        headingDeg,
      });

      totalDistance += segDist;
    }
  }

  return {
    truckId: route.truck_id,
    totalDistance,
    segments,
  };
}

/** Route simulation hook for continuous movement playback across route waypoints */
function useRouteSimulation(truckRoutes: TruckRoute[] = []) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const precomputedRoutes = useMemo(() => {
    return truckRoutes.map(precomputeRoute);
  }, [truckRoutes]);

  const resetSimulation = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && progress >= 100) {
        setProgress(0);
      }
      return !prev;
    });
  }, [progress]);

  const getTruckPositions = useCallback((): ActiveTruckPosition[] => {
    if (!precomputedRoutes || precomputedRoutes.length === 0) return [];

    return precomputedRoutes.map((pr) => {
      const route = truckRoutes.find((r) => r.truck_id === pr.truckId);
      const coords = route?.full_path_coordinates || [];

      if (coords.length === 0) {
        return {
          truckId: pr.truckId,
          lat: 40.758,
          lon: -73.9995,
          headingDeg: 0,
          currentNodeName: "Depot",
          currentNodeType: "start",
          progressPct: progress,
        };
      }

      if (pr.segments.length === 0 || pr.totalDistance === 0) {
        const first = coords[0] || {
          lat: 40.758,
          lon: -73.9995,
          name: "Depot",
          node_type: "start",
          node_id: "D0",
        };
        return {
          truckId: pr.truckId,
          lat: first.lat,
          lon: first.lon,
          headingDeg: 0,
          currentNodeName: first.name || first.node_id,
          currentNodeType: first.node_type,
          progressPct: progress,
        };
      }

      const currentDist = (progress / 100) * pr.totalDistance;
      let targetSeg = pr.segments[0];

      for (let i = 0; i < pr.segments.length; i++) {
        const seg = pr.segments[i];
        if (seg && (currentDist <= seg.startDist + seg.segDist || i === pr.segments.length - 1)) {
          targetSeg = seg;
          break;
        }
      }

      if (!targetSeg) {
        const first = coords[0] || {
          lat: 40.758,
          lon: -73.9995,
          name: "Depot",
          node_type: "start",
          node_id: "D0",
        };
        return {
          truckId: pr.truckId,
          lat: first.lat,
          lon: first.lon,
          headingDeg: 0,
          currentNodeName: first.name || first.node_id,
          currentNodeType: first.node_type,
          progressPct: progress,
        };
      }

      const remaining = currentDist - targetSeg.startDist;
      const segFraction =
        targetSeg.segDist > 0 ? Math.min(1, Math.max(0, remaining / targetSeg.segDist)) : 0;

      const lat = targetSeg.p1.lat + (targetSeg.p2.lat - targetSeg.p1.lat) * segFraction;
      const lon = targetSeg.p1.lon + (targetSeg.p2.lon - targetSeg.p1.lon) * segFraction;

      const activeNode = segFraction > 0.5 ? targetSeg.p2 : targetSeg.p1;

      return {
        truckId: pr.truckId,
        lat,
        lon,
        headingDeg: targetSeg.headingDeg,
        currentNodeName: activeNode.name || activeNode.node_id,
        currentNodeType: activeNode.node_type,
        progressPct: progress,
      };
    });
  }, [precomputedRoutes, truckRoutes, progress]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimeRef.current = null;
      return;
    }

    const step = (time: number) => {
      if (lastTimeRef.current != null) {
        const deltaMs = time - lastTimeRef.current;
        const baseDurationMs = 16000;
        const increment = (deltaMs / (baseDurationMs / speedMultiplier)) * 100;

        setProgress((prev) => {
          const next = prev + increment;
          if (next >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speedMultiplier]);

  return {
    isPlaying,
    speedMultiplier,
    progress,
    setSpeedMultiplier,
    setProgress,
    togglePlay,
    resetSimulation,
    getTruckPositions,
  };
}

/** Check if the response matches WasteMapResponse structure */
function isWasteMapResponse(data: unknown): data is WasteMapResponse {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as Partial<WasteMapResponse>;
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    return false;
  }
  return candidate.nodes.every(
    (node) =>
      typeof node === "object" &&
      node !== null &&
      typeof node.id === "string" &&
      typeof node.lat === "number" &&
      typeof node.lon === "number" &&
      typeof node.weight_kg === "number",
  );
}

/** Dynamic map bounds fitter component */
function MapBoundsFitter({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [35, 35] });
    }
  }, [bounds, map]);
  return null;
}

/** Fly map camera to focused node */
function MapNodeFocuser({
  nodeId,
  nodeLookup,
}: {
  nodeId: string | null;
  nodeLookup: Map<string, WasteNode>;
}) {
  const map = useMap();
  useEffect(() => {
    if (nodeId) {
      const node = nodeLookup.get(nodeId);
      if (node) {
        map.flyTo([node.lat, node.lon], 16, { animate: true, duration: 1.2 });
      }
    }
  }, [nodeId, nodeLookup, map]);
  return null;
}

/** Fetch map payload from backend */
async function fetchWasteMap(signal: AbortSignal): Promise<WasteMapResponse> {
  const response = await fetch(MAP_API_URL, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Map request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isWasteMapResponse(payload)) {
    throw new Error("Invalid map response structure from backend.");
  }

  return payload;
}

/** Custom Leaflet HTML Marker Icons */
const depotMarkerIcon = L.divIcon({
  className: "custom-depot-marker",
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(37, 99, 235, 0.2); filter: blur(4px);"></div>
      <div style="position: relative; width: 28px; height: 28px; border-radius: 8px; background: #2563eb; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(37,99,235,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
        <svg style="width: 13px; height: 13px;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"></path>
        </svg>
        <span style="font-size: 6px; font-weight: 800; line-height: 1;">D0</span>
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const disposalMarkerIcon = L.divIcon({
  className: "custom-disposal-marker",
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(5, 150, 105, 0.2); filter: blur(4px);"></div>
      <div style="position: relative; width: 28px; height: 28px; border-radius: 8px; background: #059669; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(5,150,105,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
        <svg style="width: 13px; height: 13px;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        <span style="font-size: 6px; font-weight: 800; line-height: 1;">T1</span>
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function createMovingTruckIcon(truckId: string, color: string, headingDeg: number) {
  // Lucide truck SVG naturally faces East (90 deg).
  // Bearing from North is headingDeg (0 = North, 90 = East, 180 = South, 270 = West).
  // Therefore, rotating by (headingDeg - 90) aligns the truck cab directly forward along the road segment.
  const rotationDeg = headingDeg - 90;

  return L.divIcon({
    className: `sim-truck-marker-${truckId}`,
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${color}35; filter: blur(3px);"></div>
        <div style="position: relative; width: 28px; height: 28px; border-radius: 8px; background: #ffffff; border: 2px solid ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; transform: rotate(${rotationDeg}deg); transition: transform 0.1s linear;">
          <svg style="width: 15px; height: 15px; color: ${color};" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2a1 1 0 001-1"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/** Animated Truck Marker with reactive Leaflet updates */
function AnimatedTruckMarker({
  tp,
  color,
  isPlayingSimulation,
}: {
  tp: ActiveTruckPosition;
  color: string;
  isPlayingSimulation: boolean;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([tp.lat, tp.lon]);
      markerRef.current.setIcon(createMovingTruckIcon(tp.truckId, color, tp.headingDeg));
    }
  }, [tp.lat, tp.lon, tp.headingDeg, tp.truckId, color]);

  return (
    <Marker
      ref={markerRef}
      position={[tp.lat, tp.lon]}
      icon={createMovingTruckIcon(tp.truckId, color, tp.headingDeg)}
    >
      <Tooltip direction="top" offset={[0, -14]} permanent={isPlayingSimulation}>
        <div className="text-xs font-sans">
          <strong style={{ color }}>{tp.truckId}</strong>
          <div className="text-[10px] text-muted-foreground">Node: {tp.currentNodeName}</div>
        </div>
      </Tooltip>
    </Marker>
  );
}

/** Route Simulator Floating Control Bar */
function RouteSimulatorBar({
  isPlaying,
  progress,
  speedMultiplier,
  hasRoutes,
  truckPositions,
  onTogglePlay,
  onReset,
  onProgressChange,
  onSpeedChange,
}: {
  isPlaying: boolean;
  progress: number;
  speedMultiplier: number;
  hasRoutes: boolean;
  truckPositions: ActiveTruckPosition[];
  onTogglePlay: () => void;
  onReset: () => void;
  onProgressChange: (val: number) => void;
  onSpeedChange: (val: number) => void;
}) {
  if (!hasRoutes) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-card backdrop-blur-md">
      {/* Play / Pause */}
      <button
        type="button"
        onClick={onTogglePlay}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all cursor-pointer"
        title={isPlaying ? "Pause Simulation" : "Play Simulation"}
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
        title="Reset Progress"
      >
        <RotateCcw className="size-4" />
      </button>

      {/* Progress Track with scrubber */}
      <div className="flex flex-1 min-w-[160px] flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
            <Navigation className="size-3.5 text-blue-600" />
            <span>Route Playback</span>
            {isPlaying && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En Route
              </span>
            )}
          </span>
          <span className="font-mono text-xs font-bold text-slate-900">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-none"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={progress}
            onChange={(e) => onProgressChange(parseFloat(e.target.value))}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label="Route Simulation Progress Scrubber"
          />
        </div>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/90 p-1">
        <Gauge className="size-3.5 text-slate-400 mx-1" />
        {[1, 2, 5].map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => onSpeedChange(speed)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer ${
              speedMultiplier === speed
                ? "bg-white text-blue-700 shadow-xs ring-1 ring-blue-500/20"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Active truck node indicator */}
      {truckPositions.length > 0 && isPlaying && (
        <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2 py-1 text-[10px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="truncate max-w-[140px]">
            {truckPositions[0]?.truckId}: {truckPositions[0]?.currentNodeName}
          </span>
        </div>
      )}
    </div>
  );
}

/** Interactive Leaflet Map */
function WastePlannerMap({
  map,
  spacedLayout,
  displayedRoutes,
  visibleTrucks,
  selectedTruckId,
  uncollectedBins,
  focusedNodeId,
  spacingMode,
  onSpacingModeChange,
  showLeaderLines,
  truckPositions,
  isPlayingSimulation,
}: {
  map: WasteMapResponse;
  spacedLayout: SpacedLayoutResult;
  displayedRoutes: TruckRoute[];
  visibleTrucks: Record<string, boolean>;
  selectedTruckId: string | null;
  uncollectedBins: string[];
  focusedNodeId: string | null;
  spacingMode: SpacingMode;
  onSpacingModeChange: (mode: SpacingMode) => void;
  showLeaderLines: boolean;
  truckPositions: ActiveTruckPosition[];
  isPlayingSimulation: boolean;
}) {
  const [showRoads, setShowRoads] = useState(true);
  const [showIntersections, setShowIntersections] = useState(false);
  const [showBins, setShowBins] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const activeNodes = spacedLayout.nodes;
  const nodeLookup = spacedLayout.nodeMap;

  const depotNode = useMemo(
    () => activeNodes.find((n) => n.id === "D0" || n.type === "start"),
    [activeNodes],
  );
  const disposalNode = useMemo(
    () => activeNodes.find((n) => n.id === "T1" || n.type === "destination"),
    [activeNodes],
  );
  const binNodes = useMemo(
    () => activeNodes.filter((n) => n.type === "bin" || n.id.startsWith("B")),
    [activeNodes],
  );
  const intersectionNodes = useMemo(
    () => activeNodes.filter((n) => n.id !== "D0" && n.id !== "T1" && !n.id.startsWith("B")),
    [activeNodes],
  );

  // Roads lookup
  const roads = useMemo(() => {
    return spacedLayout.edges
      .map((edge) => {
        const u = nodeLookup.get(edge.source);
        const v = nodeLookup.get(edge.target);
        if (!u || !v) return null;
        return {
          id: `${edge.source}-${edge.target}`,
          positions: [[u.lat, u.lon] as LatLngTuple, [v.lat, v.lon] as LatLngTuple],
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [spacedLayout.edges, nodeLookup]);

  // Map boundary
  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    return spacedLayout.bounds;
  }, [spacedLayout.bounds]);

  return (
    <div className="relative flex flex-col gap-2">
      {/* Map Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Layer Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground mr-1 flex items-center gap-1 font-medium text-[11px]">
            <Layers className="size-3" /> Layers:
          </span>

          <button
            type="button"
            onClick={() => setShowRoads((v) => !v)}
            className={`rounded-md px-2 py-1 font-medium transition-colors border ${
              showRoads
                ? "bg-secondary text-foreground border-border"
                : "bg-background text-muted-foreground/60 border-border/50 line-through"
            }`}
          >
            Roads
          </button>

          <button
            type="button"
            onClick={() => setShowBins((v) => !v)}
            className={`rounded-md px-2 py-1 font-medium transition-colors border ${
              showBins
                ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30"
                : "bg-background text-muted-foreground/60 border-border/50 line-through"
            }`}
          >
            Smart Bins ({binNodes.length})
          </button>

          <button
            type="button"
            onClick={() => setShowRoutes((v) => !v)}
            className={`rounded-md px-2 py-1 font-medium transition-colors border ${
              showRoutes
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-background text-muted-foreground/60 border-border/50 line-through"
            }`}
          >
            Routes ({displayedRoutes.length})
          </button>

          <button
            type="button"
            onClick={() => setShowIntersections((v) => !v)}
            className={`rounded-md px-2 py-1 font-medium transition-colors border ${
              showIntersections
                ? "bg-secondary text-foreground border-border"
                : "bg-background text-muted-foreground/60 border-border/50"
            }`}
          >
            Intersections
          </button>
        </div>

        {/* Spacing Mode & Expand Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5">
            <span className="px-1.5 text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
              <Sliders className="size-2.5" /> Layout:
            </span>
            {(["gps", "balanced", "wide"] as SpacingMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onSpacingModeChange(mode)}
                className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                  spacingMode === mode
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "gps" ? "GPS (Real Streets)" : mode}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setResetKey((k) => k + 1)}
          >
            <Compass className="size-3.5" /> Reset View
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="size-3.5" /> Compact
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5" /> Expand
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Leaflet Map Frame */}
      <div
        className={`w-full overflow-hidden rounded-xl border border-border/80 bg-slate-50 transition-all duration-300 relative shadow-inner ${
          isExpanded ? "h-[740px]" : "h-[540px]"
        }`}
      >
        <MapContainer
          center={[40.7484, -73.9857]}
          zoom={13}
          scrollWheelZoom={true}
          className="size-full z-0"
          zoomControl={false}
          aria-label="Interactive waste collection city map"
        >
          <MapBoundsFitter bounds={bounds} key={resetKey} />
          <MapNodeFocuser nodeId={focusedNodeId} nodeLookup={nodeLookup} />

          {/* CartoDB Voyager Clean Light Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <ZoomControl position="bottomright" />
          <ScaleControl position="bottomleft" imperial={false} />

          {/* Leader lines connecting displaced bins to their intersection anchors */}
          {showLeaderLines &&
            spacingMode !== "gps" &&
            spacedLayout.leaderLines.map((leader) => (
              <Polyline
                key={`leader-${leader.binId}`}
                positions={[leader.binPosition, leader.intersectionPosition]}
                pathOptions={{
                  color: "#cbd5e1",
                  weight: 1.2,
                  dashArray: "3, 4",
                  opacity: 0.7,
                }}
              />
            ))}

          {/* City Road Network */}
          {showRoads &&
            roads.map((road) => (
              <Polyline
                key={road.id}
                positions={road.positions}
                pathOptions={{
                  color: "#94a3b8",
                  weight: 1.8,
                  opacity: 0.5,
                }}
              />
            ))}

          {/* Optimized Truck Routes */}
          {showRoutes &&
            displayedRoutes.map((route, index) => {
              const isVisible = visibleTrucks[route.truck_id] !== false;
              if (!isVisible) return null;

              const positions: LatLngTuple[] = route.full_path_coordinates.map(
                (pt) => [pt.lat, pt.lon] as LatLngTuple,
              );
              const color = getTruckColor(route.truck_id, index);
              const isSelected = selectedTruckId === route.truck_id;
              const isDimmed = selectedTruckId !== null && !isSelected;

              return (
                <Polyline
                  key={`route-${route.truck_id}`}
                  positions={positions}
                  pathOptions={{
                    color,
                    weight: isSelected ? 7 : 5,
                    opacity: isDimmed ? 0.15 : 0.92,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                >
                  <Tooltip sticky>
                    <div className="font-sans text-xs">
                      <strong className="font-semibold text-foreground">{route.truck_id}</strong>
                      <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                        <div>
                          Distance: <strong>{route.route_distance_km.toFixed(2)} km</strong>
                        </div>
                        <div>
                          Collected:{" "}
                          <strong>{route.collected_weight_kg.toLocaleString()} kg</strong> (
                          {route.capacity_utilization_pct.toFixed(1)}%)
                        </div>
                        <div>
                          Stops: <strong>{route.stop_sequence.length}</strong>
                        </div>
                      </div>
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

          {/* Intersections */}
          {showIntersections &&
            intersectionNodes.map((node) => (
              <CircleMarker
                key={node.id}
                center={[node.lat, node.lon]}
                radius={3.5}
                pathOptions={{
                  color: "#64748b",
                  weight: 1,
                  fillColor: "#f8fafc",
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]}>
                  <div className="text-xs">
                    <span className="font-semibold">{node.id}</span>
                    <div className="text-muted-foreground text-[10px]">
                      {node.name || "Street Intersection"}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}

          {/* Smart Bins */}
          {showBins &&
            binNodes.map((bin) => {
              const isDeferred = uncollectedBins.includes(bin.id);
              const weight = bin.weight_kg;
              // Color scale by load
              const fillColor = isDeferred
                ? "#fbbf24"
                : weight > 400
                  ? "#ea580c"
                  : weight > 250
                    ? "#f97316"
                    : "#fb923c";

              return (
                <CircleMarker
                  key={bin.id}
                  center={[bin.lat, bin.lon]}
                  radius={isDeferred ? 7 : 5.5}
                  pathOptions={{
                    color: isDeferred ? "#d97706" : "#c2410c",
                    weight: isDeferred ? 2.5 : 1.5,
                    fillColor,
                    fillOpacity: isDeferred ? 0.75 : 0.95,
                    dashArray: isDeferred ? "4, 4" : undefined,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    <div className="text-xs">
                      <strong
                        className={`font-semibold ${
                          isDeferred ? "text-amber-700" : "text-foreground"
                        }`}
                      >
                        Smart Bin {bin.id} {isDeferred ? "(Deferred)" : ""}
                      </strong>
                      <div className="text-muted-foreground text-[11px]">
                        Load: <strong>{bin.weight_kg} kg</strong>
                      </div>
                      {isDeferred && (
                        <div className="text-amber-600 font-medium text-[10px] mt-0.5">
                          ⚠ Skipped — capacity constrained
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

          {/* Starting Municipal Depot Marker (D0) */}
          {depotNode && (
            <Marker position={[depotNode.lat, depotNode.lon]} icon={depotMarkerIcon}>
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="text-xs">
                  <strong className="text-blue-700 font-semibold">
                    Central Municipal Depot (D0)
                  </strong>
                  <div className="text-muted-foreground text-[10px]">
                    Fleet Departure & Staging Base
                  </div>
                </div>
              </Tooltip>
            </Marker>
          )}

          {/* Waste Processing Facility Marker (T1) */}
          {disposalNode && (
            <Marker position={[disposalNode.lat, disposalNode.lon]} icon={disposalMarkerIcon}>
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="text-xs">
                  <strong className="text-emerald-700 font-semibold">
                    Disposal & Processing Facility (T1)
                  </strong>
                  <div className="text-muted-foreground text-[10px]">
                    Municipal Waste Unload Terminal
                  </div>
                </div>
              </Tooltip>
            </Marker>
          )}

          {/* Active Simulated Trucks */}
          {truckPositions.map((tp, idx) => {
            const isVisible = visibleTrucks[tp.truckId] !== false;
            if (!isVisible) return null;
            const color = getTruckColor(tp.truckId, idx);
            return (
              <AnimatedTruckMarker
                key={`sim-truck-${tp.truckId}`}
                tp={tp}
                color={color}
                isPlayingSimulation={isPlayingSimulation}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

/** Modern Multi-Mode Fleet Capacity & Route Analytics Visualization */
function FleetUtilizationChart({
  truckRoutes,
  truckCapacityKg,
}: {
  truckRoutes: TruckRoute[];
  truckCapacityKg: number;
}) {
  const [viewMode, setViewMode] = useState<"composed" | "stacked" | "efficiency">("composed");

  if (!truckRoutes || truckRoutes.length === 0) return null;

  // Fleet aggregate statistics for the KPI strip
  const totalCollectedKg = truckRoutes.reduce((acc, r) => acc + r.collected_weight_kg, 0);
  const totalFleetCapacityKg = truckRoutes.length * truckCapacityKg;
  const totalHeadroomKg = Math.max(0, totalFleetCapacityKg - totalCollectedKg);
  const totalFleetDistanceKm = truckRoutes.reduce((acc, r) => acc + r.route_distance_km, 0);
  const avgFleetUtilizationPct =
    totalFleetCapacityKg > 0 ? (totalCollectedKg / totalFleetCapacityKg) * 100 : 0;
  const totalStopsCount = truckRoutes.reduce(
    (acc, r) => acc + (r.bins_collected_count ?? Math.max(1, r.full_path_coordinates.length - 2)),
    0,
  );

  const chartData = truckRoutes.map((route, idx) => {
    const stops = route.bins_collected_count ?? Math.max(1, route.full_path_coordinates.length - 2);
    const distance = parseFloat(route.route_distance_km.toFixed(2));
    const efficiencyKgPerKm = distance > 0 ? Math.round(route.collected_weight_kg / distance) : 0;
    const headroom = Math.max(0, truckCapacityKg - route.collected_weight_kg);

    return {
      name: route.truck_id,
      collectedKg: route.collected_weight_kg,
      headroomKg: headroom,
      capacityLimit: truckCapacityKg,
      utilizationPct: route.capacity_utilization_pct,
      distanceKm: distance,
      stopsCount: stops,
      efficiencyKgPerKm,
      color: getTruckColor(route.truck_id, idx),
      gradientId: `truckGrad-${idx}`,
    };
  });

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      if (!item) return null;
      return (
        <div className="min-w-[230px] rounded-xl border border-slate-200/90 bg-white/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full shadow-xs ring-2 ring-white"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-semibold text-slate-900 font-display">{item.name}</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                item.utilizationPct >= 85
                  ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                  : item.utilizationPct >= 50
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-blue-50 text-blue-700 border border-blue-200/60"
              }`}
            >
              {item.utilizationPct.toFixed(1)}% Full
            </span>
          </div>

          {/* Mini Capacity Progress Bar */}
          <div className="my-2.5 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Payload Load</span>
              <span className="font-mono font-medium text-slate-800">
                {item.collectedKg.toLocaleString()} / {item.capacityLimit.toLocaleString()} kg
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, item.utilizationPct)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>

          {/* Detailed Metric Rows */}
          <div className="space-y-1.5 pt-1 text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-500">
                <Route className="size-3 text-sky-500" /> Transit Distance:
              </span>
              <strong className="font-mono font-semibold text-slate-900">
                {item.distanceKm} km
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-500">
                <Trash2 className="size-3 text-amber-500" /> Bins Collected:
              </span>
              <strong className="font-mono font-semibold text-slate-900">
                {item.stopsCount} stops
              </strong>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span className="flex items-center gap-1 text-slate-500">
                <TrendingUp className="size-3 text-emerald-500" /> Efficiency Rate:
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {item.efficiencyKgPerKm} kg / km
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all sm:p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="size-4" />
            </span>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Fleet Capacity & Distance Distribution
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Multi-metric vehicle payload balance, route distance, and capacity headroom analytics.
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
          <button
            type="button"
            onClick={() => setViewMode("composed")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "composed"
                ? "bg-white text-blue-700 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scale className="size-3.5" />
            <span>Dual-Metric (Load & Dist)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("stacked")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "stacked"
                ? "bg-white text-blue-700 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="size-3.5" />
            <span>Capacity Headroom</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("efficiency")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "efficiency"
                ? "bg-white text-blue-700 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="size-3.5" />
            <span>Transit & Pickups</span>
          </button>
        </div>
      </div>

      {/* Fleet KPI Summary Strip */}
      <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4 border-b border-slate-100">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600 shrink-0">
            <Truck className="size-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Total Fleet Payload
            </p>
            <p className="font-display text-base font-bold text-slate-900">
              {totalCollectedKg.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">kg</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-600 shrink-0">
            <Scale className="size-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Available Headroom
            </p>
            <p className="font-display text-base font-bold text-emerald-700">
              {totalHeadroomKg.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">kg reserve</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100/70 text-sky-600 shrink-0">
            <Route className="size-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Total Route Transit
            </p>
            <p className="font-display text-base font-bold text-slate-900">
              {totalFleetDistanceKm.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-500">km</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-600 shrink-0">
            <Activity className="size-4" />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Fleet Utilization
              </p>
              <span className="text-xs font-bold text-indigo-600">
                {avgFleetUtilizationPct.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                style={{ width: `${Math.min(100, avgFleetUtilizationPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Legend / Context Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-1 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          {viewMode === "composed" && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-gradient-to-t from-blue-600 to-indigo-500" />
                <span>Payload Weight (kg, left axis)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-sky-500 rounded-full" />
                <span className="size-2 rounded-full bg-sky-500 ring-2 ring-white" />
                <span>Transit Distance (km, right axis)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-b-2 border-dashed border-rose-400" />
                <span className="text-rose-600 font-medium">
                  Max Limit ({truckCapacityKg.toLocaleString()} kg)
                </span>
              </span>
            </>
          )}

          {viewMode === "stacked" && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-indigo-500" />
                <span>Collected Waste Payload</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-slate-300 border border-slate-300" />
                <span>Unused Capacity Headroom</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-b-2 border-dashed border-rose-400" />
                <span>Capacity Ceiling ({truckCapacityKg.toLocaleString()} kg)</span>
              </span>
            </>
          )}

          {viewMode === "efficiency" && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-sky-500" />
                <span>Route Distance (km)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Pickup Bins Serviced</span>
              </span>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-400 italic">
          Hover over bars for efficiency & load details
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "composed" ? (
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <defs>
                {chartData.map((d, i) => (
                  <linearGradient
                    key={`grad-${i}`}
                    id={`truckGrad-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.65} />
                  </linearGradient>
                ))}
                <linearGradient id="distLineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                unit="kg"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#0284c7"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#bae6fd" }}
                unit="km"
              />
              <ReferenceLine
                yAxisId="left"
                y={truckCapacityKg}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Limit: ${truckCapacityKg.toLocaleString()}kg`,
                  position: "insideTopRight",
                  fill: "#e11d48",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <RechartsTooltip content={<CustomChartTooltip />} />

              <Bar
                yAxisId="left"
                dataKey="collectedKg"
                radius={[8, 8, 0, 0]}
                name="Waste Collected (kg)"
                maxBarSize={55}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-comp-${index}`} fill={`url(#${entry.gradientId})`} />
                ))}
              </Bar>

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="distanceKm"
                name="Route Distance (km)"
                stroke="url(#distLineGlow)"
                strokeWidth={3}
                dot={{ r: 5, fill: "#0284c7", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 7, stroke: "#0369a1", strokeWidth: 3 }}
              />
            </ComposedChart>
          ) : viewMode === "stacked" ? (
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <defs>
                {chartData.map((d, i) => (
                  <linearGradient
                    key={`grad-stack-${i}`}
                    id={`truckGrad-stack-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
                <linearGradient id="headroomPattern" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                unit="kg"
              />
              <ReferenceLine
                y={truckCapacityKg}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Capacity: ${truckCapacityKg.toLocaleString()}kg`,
                  position: "insideTopRight",
                  fill: "#e11d48",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <RechartsTooltip content={<CustomChartTooltip />} />

              <Bar
                dataKey="collectedKg"
                stackId="capacityStack"
                name="Waste Collected (kg)"
                maxBarSize={55}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-stack-col-${index}`} fill={`url(#truckGrad-stack-${index})`} />
                ))}
              </Bar>

              <Bar
                dataKey="headroomKg"
                stackId="capacityStack"
                radius={[8, 8, 0, 0]}
                name="Available Headroom (kg)"
                fill="url(#headroomPattern)"
                maxBarSize={55}
              />
            </BarChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="distanceBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                yAxisId="distAxis"
                stroke="#0284c7"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#bae6fd" }}
                unit="km"
              />
              <YAxis
                yAxisId="stopsAxis"
                orientation="right"
                stroke="#059669"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#a7f3d0" }}
                unit=" stops"
              />
              <RechartsTooltip content={<CustomChartTooltip />} />

              <Bar
                yAxisId="distAxis"
                dataKey="distanceKm"
                name="Route Distance (km)"
                radius={[8, 8, 0, 0]}
                fill="url(#distanceBarGrad)"
                maxBarSize={50}
              />

              <Line
                yAxisId="stopsAxis"
                type="monotone"
                dataKey="stopsCount"
                name="Stops Serviced"
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 5, fill: "#059669", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 7, stroke: "#047857", strokeWidth: 3 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Data Export Dialog (CSV & JSON) */
function ExportModalDialog({
  optimizationResult,
  map,
}: {
  optimizationResult: OptimizationResponse | null;
  map: WasteMapResponse | null;
}) {
  const [copied, setCopied] = useState(false);

  if (!optimizationResult) return null;

  const jsonReportString = JSON.stringify(optimizationResult, null, 2);

  function handleCopyJson() {
    navigator.clipboard.writeText(jsonReportString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Download className="size-3.5" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-border/80">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Export Optimization Data</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Download or copy complete municipal routing solution reports.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="text-xs">
              Structured CSV
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs">
              Full JSON Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4 pt-3">
            <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-xs space-y-2">
              <p className="font-semibold text-foreground">Consolidated 3-Section CSV File:</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                <li>
                  <strong>Optimization Summary:</strong> Solver status, total distance, total waste
                  collected, execution time, memory.
                </li>
                <li>
                  <strong>Fleet Route Breakdown:</strong> Truck IDs, payload, capacity %, stops, and
                  sequenced node list.
                </li>
                <li>
                  <strong>Turn-by-Turn Waypoints:</strong> Complete ordered GPS steps with node IDs,
                  coordinates, and types.
                </li>
              </ul>
            </div>

            <Button
              className="w-full gap-2 text-xs"
              onClick={() => exportOptimizationToCsv(optimizationResult)}
            >
              <Download className="size-4" />
              Download CSV Report (.csv)
            </Button>
          </TabsContent>

          <TabsContent value="json" className="space-y-3 pt-3">
            <div className="relative max-h-56 overflow-y-auto rounded-lg border border-border/70 bg-slate-950 p-3 text-[11px] font-mono text-slate-200">
              <pre>{jsonReportString.slice(0, 1200)}...</pre>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={handleCopyJson}>
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy JSON
                  </>
                )}
              </Button>
              <Button
                className="flex-1 gap-1.5 text-xs"
                onClick={() => exportToJson(optimizationResult, "waste_optimization_report")}
              >
                <Download className="size-3.5" />
                Download JSON (.json)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/** Main Waste Collection Planner Page Component */
export default function WastePlannerPage() {
  const [map, setMap] = useState<WasteMapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Backend connection status
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");

  const [truckCount, setTruckCount] = useState(5);
  const [truckCapacityKg, setTruckCapacityKg] = useState(10000);

  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  // Map & Route UI controls
  const [visibleTrucks, setVisibleTrucks] = useState<Record<string, boolean>>({});
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  // Layout density setting - Default to "gps" so all nodes & routes align strictly with real city streets!
  const [spacingMode, setSpacingMode] = useState<SpacingMode>("gps");
  const [showLeaderLines, setShowLeaderLines] = useState(false);

  // Load Map on entry / retry
  useEffect(() => {
    const controller = new AbortController();

    async function loadMap() {
      if (isDemoMode) {
        setMap(MOCK_CITY_MAP);
        setLoading(false);
        setBackendStatus("offline");
        return;
      }

      setLoading(true);
      setError(null);
      setBackendStatus("checking");

      try {
        const mapData = await fetchWasteMap(controller.signal);
        setMap(mapData);
        setBackendStatus("online");
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;

        setBackendStatus("offline");
        // Keep the page usable when the optional live service is stopped.
        // The user can retry the live connection from the status controls.
        setIsDemoMode(true);
        setMap(MOCK_CITY_MAP);
        setError(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadMap();
    return () => controller.abort();
  }, [reloadKey, isDemoMode]);

  // Compute spaced layout
  const spacedLayout: SpacedLayoutResult = useMemo(() => {
    return computeSpacedLayout(map, spacingMode);
  }, [map, spacingMode]);

  const routes = optimizationResult?.truck_routes || [];

  // Transformed routes for current spacing mode - identical for both map rendering and simulation!
  const displayedRoutes = useMemo(() => {
    return spacedLayout.transformTruckRoutes(routes);
  }, [routes, spacedLayout]);

  // Simulation runs on the displayed routes so the trucks are 100% on the map paths
  const simulation = useRouteSimulation(displayedRoutes);
  const truckPositions = simulation.getTruckPositions();

  // Trigger Optimization
  async function findOptimizedRoute() {
    try {
      setOptimizing(true);

      // If user selected offline Demo mode or backend is offline, simulate with mock data
      if (isDemoMode || backendStatus === "offline") {
        await new Promise((res) => setTimeout(res, 600));
        setOptimizationResult(MOCK_OPTIMIZATION_RESULT);
        return;
      }

      const response = await fetch(OPTIMIZE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          truck_count: truckCount,
          truck_capacity_kg: truckCapacityKg,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detailMsg =
          errorData?.message || errorData?.detail?.[0]?.msg || `Status ${response.status}`;
        throw new Error(`Optimization failed: ${detailMsg}`);
      }

      const result: OptimizationResponse = await response.json();
      setOptimizationResult(result);
    } catch (err) {
      // Graceful fallback option
      const userWantsMock = confirm(
        `${
          err instanceof Error ? err.message : "Optimization request failed."
        }\n\nWould you like to run the Offline Simulation Dataset instead?`,
      );
      if (userWantsMock) {
        setIsDemoMode(true);
        setMap(MOCK_CITY_MAP);
        setOptimizationResult(MOCK_OPTIMIZATION_RESULT);
      }
    } finally {
      setOptimizing(false);
    }
  }

  // Ctrl + Enter shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!optimizing && !loading) {
          findOptimizedRoute();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Sync truck visibility when optimization completes
  useEffect(() => {
    if (optimizationResult?.truck_routes) {
      const vis: Record<string, boolean> = {};
      for (const r of optimizationResult.truck_routes) {
        vis[r.truck_id] = true;
      }
      setVisibleTrucks(vis);
      setSelectedTruckId(null);
      setExpandedRoutes({});
      setFocusedNodeId(null);
      simulation.resetSimulation();
    }
  }, [optimizationResult]);

  function toggleTruckVisibility(truckId: string) {
    setVisibleTrucks((prev) => ({
      ...prev,
      [truckId]: prev[truckId] === undefined ? false : !prev[truckId],
    }));
  }

  function toggleRouteExpanded(truckId: string) {
    setExpandedRoutes((prev) => ({
      ...prev,
      [truckId]: !prev[truckId],
    }));
  }

  function handleApplyRecommendation(fleetSize?: number, capacityKg?: number) {
    if (fleetSize) setTruckCount(fleetSize);
    if (capacityKg) setTruckCapacityKg(capacityKg);
  }

  function activateDemoMode() {
    setIsDemoMode(true);
    setMap(MOCK_CITY_MAP);
    setOptimizationResult(MOCK_OPTIMIZATION_RESULT);
    setError(null);
  }

  function switchToLiveBackend() {
    setIsDemoMode(false);
    setReloadKey((k) => k + 1);
  }

  const summary = optimizationResult?.summary;
  const uncollectedBins = optimizationResult?.uncollected_bins || [];
  const uncollectedWasteKg = optimizationResult?.uncollected_waste_kg || 0;

  // Animated KPI values
  const animNodes = useAnimatedCounter(map?.nodes.length || 0);
  const animEdges = useAnimatedCounter(map?.edges.length || 0);
  const animDistance = useAnimatedCounter(summary?.total_distance_km || 0);
  const animWaste = useAnimatedCounter(summary?.total_waste_collected_kg || 0);
  const animCoverage = useAnimatedCounter(summary?.collection_coverage_pct || 0);
  const animTime = useAnimatedCounter(summary?.execution_time_ms || 0);
  const animMemory = useAnimatedCounter(summary?.peak_memory_kb || 0);

  return (
    <div className="w-full pb-16 bg-slate-50/50 min-h-screen">
      {/* Modern Ambient Hero Header */}
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-blue-50/80 via-slate-50/50 to-white/80 relative overflow-hidden">
        {/* Soft ambient background glows */}
        <div className="absolute -top-12 right-1/4 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute top-4 left-1/3 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/70 border border-blue-200/60 px-3 py-1 text-xs font-semibold text-blue-700 tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              SMART CITY DECISION SUPPORT
            </span>
            <span className="rounded-full bg-slate-100/80 border border-slate-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              Module 05 · CVRP Engine
            </span>
          </div>

          <h1 className="mt-3.5 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Waste Collection <span className="text-gradient-primary">Planner</span>
          </h1>

          <p className="mt-2.5 max-w-3xl text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
            Live geographic graph optimization, multi-vehicle capacitated vehicle routing (CVRP),
            turn-by-turn coordinate navigation, and interactive route collection simulation.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Status Banner & Offline Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 px-5 shadow-card backdrop-blur-md">
          <div className="flex items-center gap-3 text-xs">
            {isDemoMode || backendStatus === "offline" ? (
              <span className="flex items-center gap-2 font-medium text-amber-800 bg-amber-50 border border-amber-200/60 rounded-full px-3 py-1">
                <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                Offline Simulation Mode (NYC Demo Network)
              </span>
            ) : backendStatus === "online" ? (
              <span className="flex items-center gap-2 font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-full px-3 py-1">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                </span>
                Live Backend Connected (Port 8005)
              </span>
            ) : (
              <span className="flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200/60 rounded-full px-3 py-1">
                <Loader2 className="size-3 animate-spin text-blue-600" />
                Connecting to backend API...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDemoMode ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-slate-200 hover:bg-slate-50"
                onClick={switchToLiveBackend}
              >
                <Wifi className="size-3.5 text-blue-600" /> Connect to Live Backend
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                onClick={activateDemoMode}
              >
                <Sparkles className="size-3.5 text-amber-500" /> Run Offline Demo
              </Button>
            )}

            {summary && (
              <span className="hidden md:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Gauge className="size-3 text-blue-500" />
                  <span>{summary.execution_time_ms.toFixed(1)} ms</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Cpu className="size-3 text-purple-500" />
                  <span className="font-semibold text-purple-700">
                    {summary.peak_memory_kb.toFixed(1)} KB Peak RAM
                  </span>
                </span>
              </span>
            )}

            <ExportModalDialog optimizationResult={optimizationResult} map={map} />
          </div>
        </div>

        {/* Route Optimization Configuration Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Truck className="size-4" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Fleet Dispatch Parameters
                </h2>
                <p className="text-xs text-slate-500">
                  Configure collection vehicles and maximum payload capacity per truck.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
              <span className="size-1.5 rounded-full bg-blue-500" />
              Constraint: CVRP Engine
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label
                  htmlFor="truck-count"
                  className="font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Truck className="size-3.5 text-blue-600" /> Available Trucks
                </Label>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  {truckCount} Vehicles
                </span>
              </div>
              <Input
                id="truck-count"
                type="number"
                min={1}
                max={35}
                value={truckCount}
                onChange={(e) => setTruckCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-slate-50/50 border-slate-200 text-sm focus-visible:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Number of collection trucks ready to be dispatched from the depot.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label
                  htmlFor="truck-capacity"
                  className="font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Scale className="size-3.5 text-indigo-600" /> Truck Payload Limit (kg)
                </Label>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {truckCapacityKg.toLocaleString()} kg / truck
                </span>
              </div>
              <Input
                id="truck-capacity"
                type="number"
                step={500}
                min={1000}
                max={50000}
                value={truckCapacityKg}
                onChange={(e) => setTruckCapacityKg(Math.max(500, parseInt(e.target.value) || 500))}
                className="bg-slate-50/50 border-slate-200 text-sm focus-visible:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Maximum weight load each vehicle can collect before returning to disposal.
              </p>
            </div>
          </div>

          {/* Scenario Presets */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Sliders className="size-3 text-slate-400" /> Quick Scenarios:
            </span>
            {[
              {
                label: "Speed",
                trucks: 3,
                capacity: 3500,
                desc: "3 × 3,500 kg",
              },
              {
                label: "Standard",
                trucks: 5,
                capacity: 10000,
                desc: "5 × 10,000 kg",
              },
              {
                label: "Large Fleet",
                trucks: 10,
                capacity: 1500,
                desc: "10 × 1,500 kg",
              },
              {
                label: "Full Fleet",
                trucks: 25,
                capacity: 1500,
                desc: "25 × 1,500 kg",
              },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setTruckCount(preset.trucks);
                  setTruckCapacityKg(preset.capacity);
                }}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                  truckCount === preset.trucks && truckCapacityKg === preset.capacity
                    ? "border-blue-500/40 bg-blue-50 text-blue-700 font-bold shadow-xs ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {preset.desc}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex size-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <Trash2 className="size-3.5" />
              </span>
              <span>
                City network demand: <strong className="text-slate-800">120 smart bins</strong>{" "}
                (~48,000 kg total waste)
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden sm:flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-mono text-slate-400">
                Ctrl + Enter
              </span>
              <Button
                onClick={findOptimizedRoute}
                disabled={optimizing || loading}
                className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Calculating Routes...
                  </>
                ) : (
                  <>
                    <Route className="size-4" />
                    Optimize Collection Routes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Warnings / Fallback Banner with Solver Recommendations */}
        {optimizationResult?.warnings && optimizationResult.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 space-y-2 text-sm">
                <p className="font-semibold text-amber-950 dark:text-amber-100">
                  Capacity Notice & Recommendations:
                </p>
                {optimizationResult.warnings.map((warn, i) => (
                  <p key={i} className="text-xs opacity-90 leading-relaxed">
                    &bull; {warn}
                  </p>
                ))}

                {/* One-Click Solver Recommendations */}
                {(optimizationResult.recommended_fleet_size ||
                  optimizationResult.recommended_truck_capacity_kg) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20 mt-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-950 dark:text-amber-100">
                      <Sparkles className="size-3.5 text-amber-600" />
                      Apply Solver Recommendations:
                    </span>
                    {optimizationResult.recommended_fleet_size && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 text-xs border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200"
                        onClick={() =>
                          handleApplyRecommendation(optimizationResult.recommended_fleet_size)
                        }
                      >
                        <Truck className="size-3" />
                        Set {optimizationResult.recommended_fleet_size} Trucks
                      </Button>
                    )}
                    {optimizationResult.recommended_truck_capacity_kg && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 text-xs border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200"
                        onClick={() =>
                          handleApplyRecommendation(
                            undefined,
                            optimizationResult.recommended_truck_capacity_kg,
                          )
                        }
                      >
                        <Trash2 className="size-3" />
                        Set {optimizationResult.recommended_truck_capacity_kg?.toLocaleString()} kg
                      </Button>
                    )}
                  </div>
                )}

                {/* Deferred Bins Summary */}
                {uncollectedBins.length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium">
                    <span className="size-2 rounded-full bg-amber-500" />
                    {uncollectedBins.length} bins deferred ({uncollectedWasteKg.toLocaleString()} kg
                    uncollected) — highlighted with amber dashed rings on the map
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Route Simulator Bar (when routes exist) */}
        {routes.length > 0 && (
          <RouteSimulatorBar
            isPlaying={simulation.isPlaying}
            progress={simulation.progress}
            speedMultiplier={simulation.speedMultiplier}
            hasRoutes={routes.length > 0}
            truckPositions={truckPositions}
            onTogglePlay={simulation.togglePlay}
            onReset={simulation.resetSimulation}
            onProgressChange={simulation.setProgress}
            onSpeedChange={simulation.setSpeedMultiplier}
          />
        )}

        {/* Interactive Map Panel */}
        <Panel
          title="Interactive City Collection Map"
          description="Geographic network rendered live from city coordinates with turn-by-turn routing."
          className="shadow-sm border-border/80"
        >
          {loading && (
            <div className="flex min-h-96 items-center justify-center rounded-xl bg-secondary/40 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" /> Loading city map coordinates…
            </div>
          )}

          {error && !loading && !map && (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center">
              <AlertCircle className="size-9 text-destructive" />
              <h2 className="mt-3 font-display text-lg font-semibold">Map loading failed</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  <RefreshCw className="size-4" /> Retry Live Connection
                </Button>
                <Button type="button" className="gap-2" onClick={activateDemoMode}>
                  <Sparkles className="size-4" /> Load Demo Dataset
                </Button>
              </div>
            </div>
          )}

          {map && !loading && (
            <WastePlannerMap
              map={map}
              spacedLayout={spacedLayout}
              displayedRoutes={displayedRoutes}
              visibleTrucks={visibleTrucks}
              selectedTruckId={selectedTruckId}
              uncollectedBins={uncollectedBins}
              focusedNodeId={focusedNodeId}
              spacingMode={spacingMode}
              onSpacingModeChange={setSpacingMode}
              showLeaderLines={showLeaderLines}
              truckPositions={truckPositions}
              isPlayingSimulation={simulation.isPlaying}
            />
          )}
        </Panel>

        {/* Key Metrics / Elevated Stat Cards with Animated Numbers & Icons */}
        {map && !loading && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {/* Card 1: City Graph Nodes */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    City Nodes
                  </p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {animNodes.toFixed(0)}
                  </p>
                </div>
                <span className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                <span className="size-1.5 rounded-full bg-blue-500" />
                <span>Intersections & bins</span>
              </div>
            </div>

            {/* Card 2: Road Connections */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Road Network
                  </p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {animEdges.toFixed(0)}
                  </p>
                </div>
                <span className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs group-hover:scale-105 transition-transform">
                  <Route className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                <span className="size-1.5 rounded-full bg-indigo-500" />
                <span>Street segments</span>
              </div>
            </div>

            {/* Card 3: Collection Coverage */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Coverage
                  </p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                    {summary ? `${animCoverage.toFixed(1)}%` : "100%"}
                  </p>
                </div>
                <span className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5 truncate">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">
                  {summary ? `${animWaste.toFixed(0)} kg collected` : "Awaiting dispatch"}
                </span>
              </div>
            </div>

            {/* Card 4: Total Distance */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Transit
                  </p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {summary ? `${animDistance.toFixed(1)} km` : "--"}
                  </p>
                </div>
                <span className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shadow-xs group-hover:scale-105 transition-transform">
                  <Compass className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5 truncate">
                <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
                <span className="truncate">
                  {summary ? "Turn-by-turn routing" : "Run optimization"}
                </span>
              </div>
            </div>

            {/* Card 5: Execution Time */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Execution Time
                  </p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                    {summary ? `${animTime.toFixed(1)} ms` : "--"}
                  </p>
                </div>
                <span className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs group-hover:scale-105 transition-transform">
                  <Zap className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5 truncate">
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">
                  {summary ? "CVRP heuristic solver" : "Awaiting solver run"}
                </span>
              </div>
            </div>

            {/* Card 6: Peak Memory Usage */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Peak Memory
                  </p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-purple-700 tracking-tight">
                    {summary ? `${animMemory.toFixed(1)} KB` : "--"}
                  </p>
                </div>
                <span className="flex size-10 sm:size-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs group-hover:scale-105 transition-transform">
                  <Cpu className="size-5" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5 truncate">
                <span className="size-1.5 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate">
                  {summary ? "Dynamic heap allocation" : "Awaiting calculation"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fleet Utilization Recharts Bar Chart */}
        {routes.length > 0 && (
          <FleetUtilizationChart truckRoutes={routes} truckCapacityKg={truckCapacityKg} />
        )}

        {/* Optimized Truck Routes Breakdown */}
        {routes.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Route className="size-4" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Vehicle Route Execution Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Turn-by-turn waypoint sequences, individual payloads, and map visibility
                    toggles.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {routes.length} Active Routes
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {routes.map((route, index) => {
                const color = getTruckColor(route.truck_id, index);
                const isVisible = visibleTrucks[route.truck_id] !== false;
                const isSelected = selectedTruckId === route.truck_id;
                const isExpRouteOpen = expandedRoutes[route.truck_id] || false;
                return (
                  <div
                    key={route.truck_id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 shadow-card transition-all duration-200 ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-lift"
                        : isVisible
                          ? "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lift"
                          : "border-slate-200/50 bg-slate-50/60 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div
                          className="flex items-center gap-2.5 cursor-pointer"
                          onClick={() => setSelectedTruckId(isSelected ? null : route.truck_id)}
                          title={isSelected ? "Deselect truck" : "Focus this truck on the map"}
                        >
                          <span
                            className="size-3 rounded-full shadow-xs ring-2 ring-white"
                            style={{
                              backgroundColor: isVisible ? color : "#94a3b8",
                            }}
                          />
                          <span className="font-display font-bold text-slate-900">
                            {route.truck_id}
                          </span>
                          {isSelected && (
                            <span className="rounded-full bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              Focused
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleTruckVisibility(route.truck_id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title={isVisible ? "Hide route on map" : "Show route on map"}
                          >
                            {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                          </button>
                          <span className="rounded-md border border-slate-200/70 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {route.stop_sequence.length} Stops
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1">
                            <Route className="size-3 text-sky-500" /> Route Distance:
                          </span>
                          <strong className="text-slate-900 font-semibold font-mono">
                            {route.route_distance_km.toFixed(2)} km
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1">
                            <Truck className="size-3 text-blue-500" /> Payload Collected:
                          </span>
                          <strong className="text-slate-900 font-semibold font-mono">
                            {route.collected_weight_kg.toLocaleString()} kg
                          </strong>
                        </div>
                        <div className="space-y-1.5 pt-1.5">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Capacity Utilization</span>
                            <span className="font-mono font-bold text-slate-800">
                              {route.capacity_utilization_pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, route.capacity_utilization_pct)}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clickable Stop Sequence & Expandable Waypoints */}
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Navigation className="size-3 text-primary" />
                          Route Sequence
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRouteExpanded(route.truck_id)}
                          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          {isExpRouteOpen
                            ? "Collapse"
                            : `All ${route.full_path_coordinates.length} waypoints`}
                          {isExpRouteOpen ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                        </button>
                      </div>

                      {/* Clickable stop chips */}
                      <div className="flex flex-wrap gap-1">
                        {route.stop_sequence.map((stopId, idx) => (
                          <span
                            key={`${route.truck_id}-stop-${idx}`}
                            className="inline-flex items-center"
                          >
                            <button
                              type="button"
                              onClick={() => setFocusedNodeId(stopId)}
                              className={`rounded px-1.5 py-0.5 text-[11px] font-mono font-medium border transition-colors cursor-pointer ${
                                stopId === "D0"
                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20"
                                  : stopId === "T1"
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                                    : stopId.startsWith("B")
                                      ? "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"
                                      : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                              }`}
                              title={`Fly map camera to ${stopId}`}
                            >
                              {stopId}
                            </button>
                            {idx < route.stop_sequence.length - 1 && (
                              <span className="text-muted-foreground/50 text-[10px] mx-0.5">→</span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Expanded Turn-by-Turn Waypoint Drawer */}
                      {isExpRouteOpen && (
                        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-border/80 bg-secondary/30 p-2 space-y-0.5">
                          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Full Path Sequence ({route.full_path_coordinates.length} waypoints)
                          </div>
                          {route.full_path_coordinates.map((coord, idx) => (
                            <button
                              type="button"
                              key={`${route.truck_id}-wp-${idx}`}
                              onClick={() => setFocusedNodeId(coord.node_id)}
                              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] hover:bg-secondary transition-colors text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground/60 font-mono w-5 text-right">
                                  {idx + 1}.
                                </span>
                                <span
                                  className={`font-mono font-semibold ${
                                    coord.node_id === "D0"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : coord.node_id === "T1"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : coord.node_id.startsWith("B")
                                          ? "text-orange-600 dark:text-orange-400"
                                          : "text-muted-foreground"
                                  }`}
                                >
                                  {coord.node_id}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  {coord.name || coord.node_type}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground/60 font-mono">
                                {coord.lat.toFixed(4)}, {coord.lon.toFixed(4)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
