import { cn } from "@/lib/utils";
import { BLOCKED_AREAS, COLLECTION_BINS, REFERENCE_EDGES, REFERENCE_LANDMARKS, REFERENCE_NODES, referenceNode } from "@/lib/reference-city-data";

type ReferenceCityMapProps = { highlightNodes?: string[]; selectedBins?: string[]; onBinSelect?: (code: string) => void; className?: string };

function pointString(points: [number, number][]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function edgeActive(path: string[], from: string, to: string) {
  return path.some((node, index) => index < path.length - 1 && ((node === from && path[index + 1] === to) || (node === to && path[index + 1] === from)));
}

export function ReferenceCityMap({ highlightNodes = [], selectedBins = [], onBinSelect, className }: ReferenceCityMapProps) {
  return (
    <div className={cn("w-full overflow-hidden rounded-xl border border-[#cfd4d7] bg-[#e9e6df]", className)}>
      <svg viewBox="0 0 4608 3072" className="block h-auto w-full" role="img" aria-label="Enlarged reference city map with traversable roads and collection points">
        <rect width="4608" height="3072" fill="#e8e5de" />
        {BLOCKED_AREAS.map((area) => <polygon key={area.code} points={pointString(area.points)} fill={area.fill} opacity={area.type === "water" ? 1 : 0.92} stroke={area.type === "water" ? "#3b95c7" : "#6b9b42"} strokeWidth="10" />)}
        <g opacity="0.35" stroke="#9a9a96" strokeWidth="9" fill="none">{Array.from({ length: 12 }, (_, index) => <path key={`street-h-${index}`} d={`M ${650 + index * 320} 0 V 3072`} />)}{Array.from({ length: 9 }, (_, index) => <path key={`street-v-${index}`} d={`M 0 ${220 + index * 320} H 4608`} />)}</g>
        {BLOCKED_AREAS.filter((area) => area.type === "building").map((area) => <polygon key={area.code} points={pointString(area.points)} fill={area.fill} stroke="#8f9599" strokeWidth="14" />)}
        <g fill="none" stroke="#f8f4e9" strokeWidth="76" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">{REFERENCE_EDGES.map((edge) => { const from = referenceNode(edge.from); const to = referenceNode(edge.to); return <line key={`road-base-${edge.code}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />; })}</g>
        <g fill="none" stroke="#dc351d" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round">{REFERENCE_EDGES.map((edge) => { const from = referenceNode(edge.from); const to = referenceNode(edge.to); const active = edgeActive(highlightNodes, edge.from, edge.to); return <line key={edge.code} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={active ? "#ff7b16" : "#dc351d"} strokeWidth={active ? 48 : 30} />; })}</g>
        {REFERENCE_NODES.filter((node) => node.type === "junction" || node.type === "depot").map((node) => <circle key={node.code} cx={node.x} cy={node.y} r={node.type === "depot" ? 42 : 18} fill={node.type === "depot" ? "#15558c" : "#b82c1a"} stroke="#fff" strokeWidth="12" />)}
        {COLLECTION_BINS.map((bin) => { const selected = selectedBins.includes(bin.code); return <g key={bin.code} onClick={() => onBinSelect?.(bin.code)} className={onBinSelect ? "cursor-pointer" : undefined}><circle cx={bin.x} cy={bin.y} r={selected ? 38 : 30} fill="#f47a20" stroke="#fff" strokeWidth="12" /><path d={`M ${bin.x - 12} ${bin.y - 13} h 24 v 28 h -24 z M ${bin.x - 17} ${bin.y - 16} h 34 M ${bin.x - 5} ${bin.y - 9} v 19 M ${bin.x + 5} ${bin.y - 9} v 19`} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" /><title>{bin.label} - demand {bin.demand}</title></g>; })}
        {REFERENCE_LANDMARKS.map((landmark) => <g key={landmark.code}><circle cx={landmark.x} cy={landmark.y} r="86" fill={landmark.color} stroke="#fff" strokeWidth="16" /><text x={landmark.x} y={landmark.y + 25} textAnchor="middle" fill="#fff" fontSize="92" fontWeight="700">{landmark.code === "SCEM-HQ" ? "✦" : "▰"}</text></g>)}
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#cfd4d7] bg-white/80 px-4 py-3 text-xs text-slate-700"><span><i className="mr-2 inline-block size-3 rounded-full bg-[#dc351d]" />Traversable road</span><span><i className="mr-2 inline-block size-3 rounded-full bg-[#f47a20]" />Collection point</span><span><i className="mr-2 inline-block size-3 rounded-full bg-[#80ca46]" />Blocked green area</span><span><i className="mr-2 inline-block size-3 rounded-full bg-[#aeb3ba]" />Blocked building</span></div>
    </div>
  );
}
