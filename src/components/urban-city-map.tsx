import { useState } from "react";
import {
  Building2,
  Bus,
  CheckCircle2,
  Flame,
  GraduationCap,
  HeartPulse,
  Home,
  Navigation,
  Recycle,
  Shield,
  ShoppingBag,
  Trees,
  Warehouse,
} from "lucide-react";

import { CITY_LOCATIONS, CITY_ROADS, type CityLocation, type CityRoad } from "@/lib/city-data";
import { cn } from "@/lib/utils";

type UrbanCityMapProps = {
  highlightPath?: string[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onSetStart?: (id: string) => void;
  onSetEnd?: (id: string) => void;
  startId?: string;
  endId?: string;
  className?: string;
};

// Map kind to icons and theme colors
const KIND_CONFIG: Record<
  string,
  {
    icon: typeof Building2;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  civic: {
    icon: Building2,
    color: "#4f46e5",
    bg: "#e0e7ff",
    border: "#818cf8",
    label: "Civic & Government",
  },
  medical: {
    icon: HeartPulse,
    color: "#e11d48",
    bg: "#ffe4e6",
    border: "#fb7185",
    label: "Healthcare & Hospital",
  },
  safety: {
    icon: Shield,
    color: "#ea580c",
    bg: "#ffedd5",
    border: "#fb923c",
    label: "Emergency & Safety",
  },
  education: {
    icon: GraduationCap,
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#a78bfa",
    label: "University / Education",
  },
  transport: {
    icon: Bus,
    color: "#0284c7",
    bg: "#e0f2fe",
    border: "#38bdf8",
    label: "Transit Terminal",
  },
  commercial: {
    icon: ShoppingBag,
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
    label: "Commercial & Retail",
  },
  utility: {
    icon: Recycle,
    color: "#059669",
    bg: "#d1fae5",
    border: "#34d399",
    label: "Utility & Industrial",
  },
  residential: {
    icon: Home,
    color: "#0d9488",
    bg: "#ccfbf1",
    border: "#2dd4bf",
    label: "Residential District",
  },
  leisure: {
    icon: Trees,
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#4ade80",
    label: "Public Park & Greenery",
  },
};

function isEdgeOnPath(path: string[], a: string, b: string): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    if (
      (path[i] === a && path[i + 1] === b) ||
      (path[i] === b && path[i + 1] === a)
    ) {
      return true;
    }
  }
  return false;
}

export function UrbanCityMap({
  highlightPath = [],
  selectedId = null,
  onSelect,
  onSetStart,
  onSetEnd,
  startId,
  endId,
  className,
}: UrbanCityMapProps) {
  const [hoveredNode, setHoveredNode] = useState<CityLocation | null>(null);
  const [hoveredRoad, setHoveredRoad] = useState<{ road: CityRoad; x: number; y: number } | null>(null);

  const startNode = startId || highlightPath[0];
  const endNode = endId || highlightPath[highlightPath.length - 1];

  const pos = (id: string): CityLocation =>
    CITY_LOCATIONS.find((l) => l.id === id) || CITY_LOCATIONS[0];

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl border border-border bg-slate-50 dark:bg-slate-950 shadow-inner", className)}>
      <svg
        viewBox="30 20 900 520"
        className="h-auto w-full select-none"
        role="img"
        aria-label="Stylized Urban GIS City Transportation Map"
      >
        <defs>
          {/* Subtle urban background grid pattern */}
          <pattern id="urban-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-slate-200 dark:text-slate-800" opacity="0.6" />
          </pattern>

          {/* Ocean Water Gradient */}
          <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.02" />
          </linearGradient>

          {/* Park Greenery Gradient */}
          <radialGradient id="park-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#16a34a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
          </radialGradient>

          {/* Glowing Filter for Route */}
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base Ground with Urban Grid */}
        <rect x="0" y="0" width="960" height="560" fill="url(#urban-grid)" />

        {/* 2. Coastal Ocean Water Body (West Shoreline - Colombo Harbor / Sea) */}
        <path
          d="M 30 20 
             C 70 120, 60 200, 85 280 
             C 105 350, 75 420, 95 540 
             L 30 540 Z"
          fill="url(#ocean-gradient)"
        />
        <path
          d="M 30 20 
             C 70 120, 60 200, 85 280 
             C 105 350, 75 420, 95 540"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          opacity="0.7"
        />
        <text x="45" y="180" className="fill-sky-700/60 dark:fill-sky-300/40 text-[11px] font-semibold tracking-widest uppercase" transform="rotate(-90 45 180)">
          Indian Ocean / Coastal Front
        </text>

        {/* 3. District Zoning Parcels */}
        {/* Civic District Zone */}
        <rect x="370" y="190" width="160" height="130" rx="24" className="fill-indigo-500/[0.06] stroke-indigo-500/20" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x="385" y="210" className="fill-indigo-500/60 text-[9px] font-bold tracking-wider uppercase">
          Civic Central District
        </text>

        {/* Healthcare & Medical Precinct */}
        <rect x="580" y="120" width="280" height="170" rx="28" className="fill-rose-500/[0.06] stroke-rose-500/20" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x="600" y="142" className="fill-rose-500/60 text-[9px] font-bold tracking-wider uppercase">
          Metro Healthcare Precinct
        </text>

        {/* Public Park Botanical Zone */}
        <circle cx="250" cy="500" r="85" fill="url(#park-gradient)" />
        <text x="210" y="475" className="fill-emerald-600/70 dark:fill-emerald-400/50 text-[10px] font-bold tracking-wider uppercase">
          Botanical Park
        </text>

        {/* Industrial Corridor Zone */}
        <rect x="80" y="220" width="130" height="230" rx="20" className="fill-emerald-500/[0.04] stroke-emerald-500/20" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x="95" y="240" className="fill-emerald-600/60 text-[9px] font-bold tracking-wider uppercase">
          Eco-Utility Sector
        </text>

        {/* 4. Road Network Layers */}
        {/* Underlay: Thick asphalt roads */}
        {CITY_ROADS.map((r) => {
          const a = pos(r.from);
          const b = pos(r.to);
          return (
            <line
              key={`base-${r.from}-${r.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              className="text-slate-300 dark:text-slate-800"
            />
          );
        })}

        {/* Road Surface and Center Strips */}
        {CITY_ROADS.map((r) => {
          const a = pos(r.from);
          const b = pos(r.to);
          return (
            <line
              key={`inner-${r.from}-${r.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-slate-100 dark:text-slate-900"
            />
          );
        })}

        {/* Active Highlighted Shortest-Path Route */}
        {CITY_ROADS.map((r) => {
          const a = pos(r.from);
          const b = pos(r.to);
          const active = isEdgeOnPath(highlightPath, r.from, r.to);
          if (!active) return null;

          return (
            <g key={`active-${r.from}-${r.to}`}>
              {/* Outer Glow */}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#3b82f6"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.5"
                filter="url(#route-glow)"
              />
              {/* Main Corridor Line */}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#2563eb"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Animated Directional Striping */}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#60a5fa"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="24"
                  to="0"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          );
        })}

        {/* Interactive Road Distance Badges & Hitboxes */}
        {CITY_ROADS.map((r) => {
          const a = pos(r.from);
          const b = pos(r.to);
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const active = isEdgeOnPath(highlightPath, r.from, r.to);

          return (
            <g
              key={`badge-${r.from}-${r.to}`}
              onMouseEnter={() => setHoveredRoad({ road: r, x: midX, y: midY })}
              onMouseLeave={() => setHoveredRoad(null)}
              className="cursor-pointer"
            >
              {/* Invisible wide hitbox for easy hovering */}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="transparent"
                strokeWidth="20"
              />
              {/* Distance Pill Badge */}
              <rect
                x={midX - 16}
                y={midY - 9}
                width="32"
                height="18"
                rx="9"
                className={cn(
                  "transition-colors",
                  active
                    ? "fill-blue-600 stroke-white text-white font-bold"
                    : "fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700 hover:fill-blue-50"
                )}
                strokeWidth={active ? "2" : "1"}
              />
              <text
                x={midX}
                y={midY + 3.5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                className={active ? "fill-white" : "fill-slate-700 dark:fill-slate-200"}
              >
                {r.km}
              </text>
            </g>
          );
        })}

        {/* 5. City Landmark Nodes / Vertices */}
        {CITY_LOCATIONS.map((node) => {
          const onPath = highlightPath.includes(node.id);
          const pathIndex = highlightPath.indexOf(node.id);
          const isStart = node.id === startNode;
          const isEnd = node.id === endNode;
          const isSelected = node.id === selectedId;

          const config = KIND_CONFIG[node.kind] || KIND_CONFIG.civic;

          return (
            <g
              key={node.id}
              onClick={() => {
                onSelect?.(node.id);
                if (isStart && onSetEnd) onSetEnd(node.id);
                else if (!isStart && onSetStart) onSetStart(node.id);
              }}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              {/* Start Node Pulse Ring */}
              {isStart && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="26"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="22;30;22"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0.1;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* End Node Pulse Ring */}
              {isEnd && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="26"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="22;30;22"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0.1;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Outer Pin Body */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isStart || isEnd ? 20 : isSelected || onPath ? 18 : 15}
                fill={
                  isStart
                    ? "#10b981"
                    : isEnd
                    ? "#f59e0b"
                    : onPath
                    ? "#2563eb"
                    : config.bg
                }
                stroke={
                  isStart
                    ? "#059669"
                    : isEnd
                    ? "#d97706"
                    : onPath
                    ? "#1d4ed8"
                    : config.border
                }
                strokeWidth={isStart || isEnd || isSelected ? 3.5 : 2}
                className="transition-all shadow-md"
              />

              {/* Center Dot or Step Number */}
              {onPath ? (
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize={isStart || isEnd ? "12" : "11"}
                  fontWeight="800"
                  fill="#ffffff"
                >
                  {isStart ? "S" : isEnd ? "D" : pathIndex + 1}
                </text>
              ) : (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill={config.color}
                />
              )}

              {/* Landmark Name Label */}
              <text
                x={node.x}
                y={node.y + 28}
                textAnchor="middle"
                fontSize="11"
                fontWeight={onPath || isSelected ? 700 : 600}
                className={cn(
                  "pointer-events-none drop-shadow-sm",
                  isStart
                    ? "fill-emerald-600 dark:fill-emerald-400 font-bold text-xs"
                    : isEnd
                    ? "fill-amber-600 dark:fill-amber-400 font-bold text-xs"
                    : onPath
                    ? "fill-blue-600 dark:fill-blue-400 font-bold"
                    : "fill-slate-800 dark:fill-slate-200"
                )}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Road Tooltip on Hover */}
      {hoveredRoad && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur"
          style={{ left: `${(hoveredRoad.x / 960) * 100}%`, top: `${(hoveredRoad.y / 560) * 100}%` }}
        >
          <p className="font-semibold text-foreground">
            {pos(hoveredRoad.road.from).name} &harr; {pos(hoveredRoad.road.to).name}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Distance: <strong className="text-primary">{hoveredRoad.road.km} km</strong></span>
            <span>Est. Drive: <strong>~{Math.round(hoveredRoad.road.km * 2.2)} mins</strong></span>
          </div>
        </div>
      )}

      {/* Floating Node Tooltip on Hover */}
      {hoveredNode && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-xl backdrop-blur"
          style={{ left: `${(hoveredNode.x / 960) * 100}%`, top: `${(hoveredNode.y / 560) * 100 - 4}%` }}
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: KIND_CONFIG[hoveredNode.kind]?.color || "#64748b" }}
            />
            <strong className="text-sm font-bold text-foreground">{hoveredNode.name}</strong>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Category: <span className="font-medium text-foreground">{KIND_CONFIG[hoveredNode.kind]?.label}</span>
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Click to set as journey origin / destination
          </p>
        </div>
      )}

      {/* Map Legend Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card/80 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-3.5 rounded-full bg-emerald-500 border border-emerald-700" /> Start Origin
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-3.5 rounded-full bg-amber-500 border border-amber-700" /> Destination
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-6 rounded-full bg-blue-600" /> Optimal Route Corridor
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-5 rounded-full bg-slate-400" /> Urban Roadway (km)
          </span>
        </div>
        <span className="text-[11px] italic">
          💡 Click any landmark node to set Origin or Destination
        </span>
      </div>
    </div>
  );
}
