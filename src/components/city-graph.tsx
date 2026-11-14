import { CITY_LOCATIONS, CITY_ROADS, type CityRoad } from "@/lib/city-data";
import { cn } from "@/lib/utils";

type CityGraphProps = {
  highlightPath?: string[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showDistances?: boolean;
  showConnectionCounts?: boolean;
  visibleIds?: string[];
  roads?: CityRoad[];
  className?: string;
};

function edgeOnPath(path: string[], a: string, b: string) {
  for (let i = 0; i < path.length - 1; i++) {
    if (
      (path[i] === a && path[i + 1] === b) ||
      (path[i] === b && path[i + 1] === a)
    )
      return true;
  }
  return false;
}

export function CityGraph({
  highlightPath = [],
  selectedId = null,
  onSelect,
  showDistances = false,
  showConnectionCounts = false,
  visibleIds,
  roads = CITY_ROADS,
  className,
}: CityGraphProps) {
  const nodes = CITY_LOCATIONS.filter((l) => !visibleIds || visibleIds.includes(l.id));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = roads.filter((r) => ids.has(r.from) && ids.has(r.to));
  const pos = (id: string) => CITY_LOCATIONS.find((l) => l.id === id)!;
  const start = highlightPath[0];
  const end = highlightPath[highlightPath.length - 1];

  return (
    <div className={cn("w-full overflow-hidden rounded-xl bg-secondary/50 p-2", className)}>
      <svg viewBox="40 20 880 520" className="h-auto w-full" role="img" aria-label="Fictional city network graph">
        {edges.map((r) => {
          const a = pos(r.from);
          const b = pos(r.to);
          const active = edgeOnPath(highlightPath, r.from, r.to);
          return (
            <g key={`${r.from}-${r.to}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={active ? "var(--primary)" : "var(--border)"}
                strokeWidth={active ? 5 : 2}
                strokeLinecap="round"
              />
              {showDistances && (
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 5}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="11"
                >
                  {r.km}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((n) => {
          const onPath = highlightPath.includes(n.id);
          const isStart = n.id === start;
          const isEnd = n.id === end;
          const isSelected = n.id === selectedId;
          const connections = CITY_ROADS.filter((r) => r.from === n.id || r.to === n.id).length;
          const fill = isStart
            ? "var(--success)"
            : isEnd
              ? "var(--accent)"
              : onPath || isSelected
                ? "var(--primary)"
                : "var(--card)";
          const textFill = isStart || isEnd || onPath || isSelected ? "var(--primary-foreground)" : "var(--foreground)";
          return (
            <g
              key={n.id}
              onClick={() => onSelect?.(n.id)}
              className={onSelect ? "cursor-pointer" : undefined}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={isSelected ? 20 : 16}
                fill={fill}
                stroke={isSelected ? "var(--primary)" : "var(--border)"}
                strokeWidth={isSelected ? 4 : 2}
              />
              {showConnectionCounts && (
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={textFill}>
                  {connections}
                </text>
              )}
              <text
                x={n.x}
                y={n.y + 34}
                textAnchor="middle"
                fontSize="12"
                fontWeight={onPath || isSelected ? 700 : 500}
                className="fill-foreground"
              >
                {n.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function GraphLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-success" /> Starting point
      </span>
      <span className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-accent" /> Destination
      </span>
      <span className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-primary" /> Selected route
      </span>
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-5 rounded bg-border" /> City road
      </span>
    </div>
  );
}
