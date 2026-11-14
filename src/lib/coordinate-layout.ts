import { CityMapResponse, WasteNode as NodeItem, WasteEdge as EdgeItem, TruckRoute, CoordinatePoint } from './waste-mock-data';

export type SpacingMode = 'balanced' | 'wide' | 'gps';

export interface SpacedNode extends NodeItem {
  originalLat: number;
  originalLon: number;
  anchorIntersectionId?: string | undefined;
}

export interface BinLeaderLine {
  binId: string;
  binPosition: [number, number];
  intersectionId: string;
  intersectionPosition: [number, number];
}

export interface SpacedLayoutResult {
  nodes: SpacedNode[];
  nodeMap: Map<string, SpacedNode>;
  edges: EdgeItem[];
  leaderLines: BinLeaderLine[];
  transformCoordinates: (lat: number, lon: number, nodeId?: string) => [number, number];
  transformTruckRoutes: (routes: TruckRoute[]) => TruckRoute[];
  bounds: [[number, number], [number, number]];
  center: [number, number];
}

// Spacing scaling factors for New York City
const SPACING_FACTORS: Record<SpacingMode, number> = {
  gps: 1.0,
  balanced: 1.6,
  wide: 2.4,
};

// New York City Central Anchor (Times Square / Midtown Manhattan)
export const NYC_DEFAULT_CENTER = {
  lat: 40.7380,
  lon: -73.9900,
};

/**
 * Computes a spaced layout for New York City map nodes to ensure intersections
 * and smart bins have distinct, readable visual separation directly on the NYC map.
 */
export function computeSpacedLayout(
  cityMap: CityMapResponse | null,
  mode: SpacingMode = 'balanced'
): SpacedLayoutResult {
  const emptyResult: SpacedLayoutResult = {
    nodes: [],
    nodeMap: new Map(),
    edges: [],
    leaderLines: [],
    transformCoordinates: (lat, lon) => [lat, lon],
    transformTruckRoutes: (routes) => routes,
    bounds: [[0, 0], [0, 0]],
    center: [NYC_DEFAULT_CENTER.lat, NYC_DEFAULT_CENTER.lon],
  };

  if (!cityMap || !cityMap.nodes || cityMap.nodes.length === 0) {
    return emptyResult;
  }

  const factor = SPACING_FACTORS[mode] || 1.6;

  // 1. Calculate original bounding box and centroid in New York
  let sumLat = 0, sumLon = 0;
  cityMap.nodes.forEach((n) => {
    sumLat += n.lat;
    sumLon += n.lon;
  });

  const nycCenterLat = sumLat / cityMap.nodes.length;
  const nycCenterLon = sumLon / cityMap.nodes.length;

  // 2. Identify connections for bins
  const binConnectedIntersections = new Map<string, string[]>();
  const intersectionConnectedBins = new Map<string, string[]>();

  cityMap.edges.forEach((edge) => {
    const isSourceBin = edge.source.startsWith('B');
    const isTargetBin = edge.target.startsWith('B');

    if (isSourceBin && !isTargetBin) {
      const binId = edge.source;
      const intId = edge.target;
      const list = binConnectedIntersections.get(binId) || [];
      if (!list.includes(intId)) list.push(intId);
      binConnectedIntersections.set(binId, list);

      const bList = intersectionConnectedBins.get(intId) || [];
      if (!bList.includes(binId)) bList.push(binId);
      intersectionConnectedBins.set(intId, bList);
    } else if (isTargetBin && !isSourceBin) {
      const binId = edge.target;
      const intId = edge.source;
      const list = binConnectedIntersections.get(binId) || [];
      if (!list.includes(intId)) list.push(intId);
      binConnectedIntersections.set(binId, list);

      const bList = intersectionConnectedBins.get(intId) || [];
      if (!bList.includes(binId)) bList.push(binId);
      intersectionConnectedBins.set(intId, bList);
    }
  });

  const nodeMap = new Map<string, SpacedNode>();
  const nonBinNodes: SpacedNode[] = [];
  const binNodes: NodeItem[] = [];

  // 3. Process non-bin nodes (Intersections, Depot D0, Facility T1) in New York
  cityMap.nodes.forEach((node) => {
    if (node.type === 'bin' || node.id.startsWith('B')) {
      binNodes.push(node);
    } else {
      // In GPS mode, keep exact NYC coordinates
      let newLat = node.lat;
      let newLon = node.lon;

      if (factor > 1.0) {
        const dLat = node.lat - nycCenterLat;
        const dLon = node.lon - nycCenterLon;
        newLat = nycCenterLat + dLat * factor;
        newLon = nycCenterLon + dLon * factor;
      }

      const spacedNode: SpacedNode = {
        ...node,
        originalLat: node.lat,
        originalLon: node.lon,
        lat: newLat,
        lon: newLon,
      };

      nonBinNodes.push(spacedNode);
      nodeMap.set(node.id, spacedNode);
    }
  });

  // 4. Process Bin Nodes with clear radial displacement in New York
  const spacedBins: SpacedNode[] = [];
  const leaderLines: BinLeaderLine[] = [];

  // Radial clearance offset (degree delta for noticeable visual separation in NYC)
  const baseBinOffset = mode === 'gps' ? 0.0012 : mode === 'balanced' ? 0.0032 : 0.0050;
  const lonAspect = 1.32; // Mercator longitude aspect ratio for New York (40.7Â° N)

  binNodes.forEach((bin) => {
    const connectedIntIds = binConnectedIntersections.get(bin.id) || [];
    const primaryIntId = connectedIntIds[0];
    const primaryIntNode = primaryIntId ? nodeMap.get(primaryIntId) : null;

    if (!primaryIntNode) {
      let bLat = bin.lat;
      let bLon = bin.lon;
      if (factor > 1.0) {
        bLat = nycCenterLat + (bin.lat - nycCenterLat) * factor;
        bLon = nycCenterLon + (bin.lon - nycCenterLon) * factor;
      }

      const spacedBin: SpacedNode = {
        ...bin,
        originalLat: bin.lat,
        originalLon: bin.lon,
        lat: bLat,
        lon: bLon,
      };
      spacedBins.push(spacedBin);
      nodeMap.set(bin.id, spacedBin);
      return;
    }

    // Determine radial separation angle
    const siblingBins = (primaryIntId ? intersectionConnectedBins.get(primaryIntId) : null) || [bin.id];
    const siblingIndex = siblingBins.indexOf(bin.id);
    const totalSiblings = Math.max(1, siblingBins.length);

    // Calculate natural direction vector from primary intersection to original bin position
    const origDLat = bin.lat - primaryIntNode.originalLat;
    const origDLon = (bin.lon - primaryIntNode.originalLon) / lonAspect;
    let baseAngle = Math.atan2(origDLat, origDLon);

    if (Math.abs(origDLat) < 0.0001 && Math.abs(origDLon) < 0.0001) {
      const binNum = parseInt(bin.id.replace(/\D/g, ''), 10) || 1;
      baseAngle = (binNum * (Math.PI / 4)) % (2 * Math.PI);
    }

    // Distribute sibling bins cleanly around the intersection so they never collide
    const angleSpread = totalSiblings > 1 ? (siblingIndex - (totalSiblings - 1) / 2) * (Math.PI / 2.5) : 0;
    const finalAngle = baseAngle + angleSpread;

    const offsetDist = baseBinOffset * (1 + siblingIndex * 0.2);
    const newBinLat = primaryIntNode.lat + Math.sin(finalAngle) * offsetDist;
    const newBinLon = primaryIntNode.lon + Math.cos(finalAngle) * offsetDist * lonAspect;

    const spacedBin: SpacedNode = {
      ...bin,
      originalLat: bin.lat,
      originalLon: bin.lon,
      lat: newBinLat,
      lon: newBinLon,
      anchorIntersectionId: primaryIntId,
    };

    spacedBins.push(spacedBin);
    nodeMap.set(bin.id, spacedBin);

    // Add leader connection line
    leaderLines.push({
      binId: bin.id,
      binPosition: [newBinLat, newBinLon],
      intersectionId: primaryIntId || "",
      intersectionPosition: [primaryIntNode.lat, primaryIntNode.lon],
    });
  });

  const allSpacedNodes = [...nonBinNodes, ...spacedBins];

  // Compute calculated bounds for New York City
  let outMinLat = Infinity, outMaxLat = -Infinity;
  let outMinLon = Infinity, outMaxLon = -Infinity;
  allSpacedNodes.forEach((n) => {
    outMinLat = Math.min(outMinLat, n.lat);
    outMaxLat = Math.max(outMaxLat, n.lat);
    outMinLon = Math.min(outMinLon, n.lon);
    outMaxLon = Math.max(outMaxLon, n.lon);
  });

  const bounds: [[number, number], [number, number]] = [
    [outMinLat, outMinLon],
    [outMaxLat, outMaxLon],
  ];

  // Coordinate projection helper
  const transformCoordinates = (lat: number, lon: number, nodeId?: string): [number, number] => {
    if (nodeId && nodeMap.has(nodeId)) {
      const n = nodeMap.get(nodeId)!;
      return [n.lat, n.lon];
    }
    if (factor === 1.0) return [lat, lon];
    const dLat = lat - nycCenterLat;
    const dLon = lon - nycCenterLon;
    return [
      nycCenterLat + dLat * factor,
      nycCenterLon + dLon * factor,
    ];
  };

  // Truck route transformer
  const transformTruckRoutes = (routes: TruckRoute[]): TruckRoute[] => {
    if (!routes || routes.length === 0) return [];

    return routes.map((route) => {
      const transformedWaypoints: CoordinatePoint[] = route.full_path_coordinates.map(
        (wp) => {
          let mappedNode: SpacedNode | undefined;
          if (nodeMap.has(wp.node_id)) {
            mappedNode = nodeMap.get(wp.node_id);
          } else {
            for (const n of allSpacedNodes) {
              if (
                n.name === wp.name ||
                (Math.abs(n.originalLat - wp.lat) < 0.0001 &&
                  Math.abs(n.originalLon - wp.lon) < 0.0001)
              ) {
                mappedNode = n;
                break;
              }
            }
          }

          if (mappedNode) {
            return {
              ...wp,
              lat: mappedNode.lat,
              lon: mappedNode.lon,
            };
          }

          const [tLat, tLon] = transformCoordinates(wp.lat, wp.lon);
          return {
            ...wp,
            lat: tLat,
            lon: tLon,
          };
        }
      );

      return {
        ...route,
        full_path_coordinates: transformedWaypoints,
      };
    });
  };

  return {
    nodes: allSpacedNodes,
    nodeMap,
    edges: cityMap.edges,
    leaderLines,
    transformCoordinates,
    transformTruckRoutes,
    bounds,
    center: [nycCenterLat, nycCenterLon],
  };
}
