const TASK3_API_URL = (
  import.meta.env["VITE_TASK3_API_URL"] ?? "http://127.0.0.1:8003"
).replace(/\/$/, "");

export type NetworkNode = {
  location_key: string;
  name: string;
  type: string;
};

export type TraversalResult = {
  traversal_order: string[];
  visited_count: number;
  execution_time_ms: number;
};

export type CentralityResult = {
  location_key: string;
  name: string;
  degree: number;
  centrality: number;
  rank: number;
};

export type MostConnectedLocation = {
  location_key: string;
  name: string;
  degree: number;
  centrality: number;
};

export type NetworkAnalysisResponse = {
  start_node: string;
  start_location_name: string;
  total_nodes: number;
  total_edges: number;
  most_connected_location: MostConnectedLocation | null;
  network_density: number;
  bfs: TraversalResult;
  dfs: TraversalResult;
  centrality: CentralityResult[];
  metrics_execution_time_ms: number;
  total_execution_time_ms: number;
};

type NetworkNodesResponse = {
  nodes: NetworkNode[];
};

export class NetworkApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "NetworkApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNetworkNode(value: unknown): value is NetworkNode {
  return (
    isRecord(value) &&
    typeof value["location_key"] === "string" &&
    typeof value["name"] === "string" &&
    typeof value["type"] === "string"
  );
}

function isTraversal(value: unknown): value is TraversalResult {
  return (
    isRecord(value) &&
    Array.isArray(value["traversal_order"]) &&
    value["traversal_order"].every((node) => typeof node === "string") &&
    typeof value["visited_count"] === "number" &&
    typeof value["execution_time_ms"] === "number"
  );
}

function isCentrality(value: unknown): value is CentralityResult {
  return (
    isRecord(value) &&
    typeof value["location_key"] === "string" &&
    typeof value["name"] === "string" &&
    typeof value["degree"] === "number" &&
    typeof value["centrality"] === "number" &&
    typeof value["rank"] === "number"
  );
}

function isMostConnected(value: unknown): value is MostConnectedLocation {
  return (
    isRecord(value) &&
    typeof value["location_key"] === "string" &&
    typeof value["name"] === "string" &&
    typeof value["degree"] === "number" &&
    typeof value["centrality"] === "number"
  );
}

function isAnalysis(value: unknown): value is NetworkAnalysisResponse {
  return (
    isRecord(value) &&
    typeof value["start_node"] === "string" &&
    typeof value["start_location_name"] === "string" &&
    typeof value["total_nodes"] === "number" &&
    typeof value["total_edges"] === "number" &&
    typeof value["network_density"] === "number" &&
    isTraversal(value["bfs"]) &&
    isTraversal(value["dfs"]) &&
    Array.isArray(value["centrality"]) &&
    value["centrality"].every(isCentrality) &&
    typeof value["metrics_execution_time_ms"] === "number" &&
    typeof value["total_execution_time_ms"] === "number" &&
    (value["most_connected_location"] === null ||
      isMostConnected(value["most_connected_location"]))
  );
}

async function requestJson<T>(
  path: string,
  validate: (value: unknown) => value is T,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${TASK3_API_URL}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new NetworkApiError(
      "Could not reach the network analysis service. Confirm that the backend is running on port 8003.",
    );
  }

  if (!response.ok) {
    let detail = `Network request failed (${response.status}).`;
    try {
      const body: unknown = await response.json();
      if (isRecord(body) && typeof body["detail"] === "string") detail = body["detail"];
    } catch {
      // Retain the safe status-based message for non-JSON error responses.
    }
    throw new NetworkApiError(detail, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new NetworkApiError("The network service returned an unreadable response.");
  }

  if (!validate(body)) {
    throw new NetworkApiError("The network service returned an unexpected response format.");
  }
  return body;
}

export async function getNetworkNodes(): Promise<NetworkNode[]> {
  const response = await requestJson<NetworkNodesResponse>(
    "/api/network/nodes",
    (value): value is NetworkNodesResponse =>
      isRecord(value) &&
      Array.isArray(value["nodes"]) &&
      value["nodes"].every(isNetworkNode),
  );
  return response.nodes;
}

export function getNetworkAnalysis(startNode: string): Promise<NetworkAnalysisResponse> {
  return requestJson(
    `/api/network/analysis/${encodeURIComponent(startNode)}`,
    isAnalysis,
  );
}
