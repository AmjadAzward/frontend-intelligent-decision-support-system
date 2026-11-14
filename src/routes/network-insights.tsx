import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { CityGraph } from "@/components/city-graph";
import { PageHeader, Panel, Section, StatCard } from "@/components/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getNetworkAnalysis,
  getNetworkNodes,
  type NetworkAnalysisResponse,
  type NetworkNode,
  type TraversalResult,
} from "@/lib/network-api";

const METHODS = {
  bfs: { label: "Breadth-First Search", purpose: "Network traversal by level" },
  dfs: { label: "Depth-First Search", purpose: "Network traversal by branch" },
  centrality: { label: "Degree Centrality", purpose: "Identify important locations" },
} as const;

type MethodKey = keyof typeof METHODS;

function formatTime(value: number): string {
  return `${value.toFixed(3)} ms`;
}

function ErrorAlert({ title, message }: { title: string; message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function TraversalPanel({
  title,
  result,
  nodeNames,
}: {
  title: string;
  result: TraversalResult;
  nodeNames: Map<string, string>;
}) {
  return (
    <Panel title={title} description="Traversal order returned by the Task 3 backend.">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
        {result.traversal_order.map((node, index) => (
          <span key={`${node}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span className="text-muted-foreground">→</span>}
            <span className="rounded-lg bg-secondary px-3 py-2">
              {nodeNames.get(node) ?? node}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatCard value={result.visited_count} label="Visited Nodes" />
        <StatCard value={formatTime(result.execution_time_ms)} label="Execution Time" />
      </div>
    </Panel>
  );
}

export default function NetworkInsightsPage() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [method, setMethod] = useState<MethodKey>("centrality");
  const [analysis, setAnalysis] = useState<NetworkAnalysisResponse | null>(null);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [nodesError, setNodesError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadNodes() {
      setLoadingNodes(true);
      setNodesError(null);
      try {
        const loadedNodes = await getNetworkNodes();
        if (!active) return;
        setNodes(loadedNodes);
        setSelectedId((current) =>
          loadedNodes.some((node) => node.location_key === current)
            ? current
            : (loadedNodes[0]?.location_key ?? ""),
        );
      } catch (error) {
        if (!active) return;
        setNodesError(error instanceof Error ? error.message : "Could not load network nodes.");
      } finally {
        if (active) setLoadingNodes(false);
      }
    }

    void loadNodes();
    return () => {
      active = false;
    };
  }, []);

  const nodeNames = useMemo(
    () => new Map(nodes.map((node) => [node.location_key, node.name])),
    [nodes],
  );
  const selected = nodes.find((node) => node.location_key === selectedId) ?? null;
  const selectedMetrics = analysis?.centrality.find(
    (item) => item.location_key === selectedId,
  );
  const visibleGraphIds = nodes.map((node) => node.location_key);

  function selectNode(nodeId: string) {
    if (!nodes.some((node) => node.location_key === nodeId)) return;
    setSelectedId(nodeId);
    setAnalysis(null);
    setAnalysisError(null);
  }

  async function analyzeNetwork() {
    if (!selectedId) return;
    setRunningAnalysis(true);
    setAnalysisError(null);
    try {
      setAnalysis(await getNetworkAnalysis(selectedId));
    } catch (error) {
      setAnalysis(null);
      setAnalysisError(error instanceof Error ? error.message : "Network analysis failed.");
    } finally {
      setRunningAnalysis(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Smart City Service"
        title="City Network Insights"
        subtitle="Understand the structure and importance of locations across the city."
      />

      <Section>
        {loadingNodes ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : nodesError ? (
          <ErrorAlert title="Unable to load city network" message={nodesError} />
        ) : nodes.length === 0 ? (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>Empty network</AlertTitle>
            <AlertDescription>No locations are currently available for analysis.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard value={analysis?.total_nodes ?? nodes.length} label="Locations" />
            <StatCard value={analysis?.total_edges ?? "—"} label="Road Records" />
            <StatCard value={analysis ? analysis.network_density.toFixed(3) : "—"} label="Network Density" />
            <StatCard value={analysis?.most_connected_location?.name ?? "Analyze to calculate"} label="Most Connected Location" />
          </div>
        )}
      </Section>

      {nodes.length > 0 && (
        <>
          <Section
            title="Interactive City Network"
            description="The diagram preserves the existing illustrative layout; analysis values come from the backend."
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <Panel>
                <CityGraph selectedId={selectedId} onSelect={selectNode} visibleIds={visibleGraphIds} />
                <p className="mt-3 text-xs text-muted-foreground">
                  Display positions and roads are illustrative because the Task 3 API does not expose
                  graph coordinates or road records. Connection counts shown below are backend results.
                </p>
              </Panel>
              <Panel title="Selected Location">
                <div className="space-y-2">
                  <Label>Starting node</Label>
                  <Select value={selectedId} onValueChange={selectNode}>
                    <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                    <SelectContent>
                      {nodes.map((node) => (
                        <SelectItem key={node.location_key} value={node.location_key}>{node.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Location</p>
                <p className="mt-1 font-display text-xl font-semibold">{selected?.name ?? selectedId}</p>
                <div className="mt-5 grid gap-3">
                  <StatCard value={selectedMetrics?.degree ?? "—"} label="Connections" />
                  <StatCard value={selectedMetrics?.centrality.toFixed(3) ?? "—"} label="Degree Centrality" />
                </div>
              </Panel>
            </div>
          </Section>

          <Section title="Network Analysis">
            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
              <Panel title="Analysis Method" description="Choose which backend result to emphasize.">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Result view</Label>
                    <Select value={method} onValueChange={(value) => setMethod(value as MethodKey)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(METHODS).map(([key, item]) => (
                          <SelectItem key={key} value={key}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => void analyzeNetwork()} disabled={!selectedId || runningAnalysis}>
                    {runningAnalysis ? <><Loader2 className="size-4 animate-spin" /> Analyzing…</> : "Analyze Network"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    One backend request calculates BFS, DFS, centrality, ranking, and density.
                  </p>
                </div>
              </Panel>

              <Panel title={METHODS[method].label} description={METHODS[method].purpose}>
                {!analysis && !runningAnalysis && (
                  <p className="text-sm text-muted-foreground">Select a starting node and run the analysis to view this result.</p>
                )}
                {runningAnalysis && <Skeleton className="h-32 w-full" />}
                {analysis && method !== "centrality" && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium">
                      {(method === "bfs" ? analysis.bfs : analysis.dfs).traversal_order
                        .map((node) => nodeNames.get(node) ?? node)
                        .join(" → ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Visited {(method === "bfs" ? analysis.bfs : analysis.dfs).visited_count} nodes in{" "}
                      {formatTime((method === "bfs" ? analysis.bfs : analysis.dfs).execution_time_ms)}.
                    </p>
                  </div>
                )}
                {analysis && method === "centrality" && (
                  <div className="space-y-3">
                    {analysis.centrality.slice(0, 5).map((item) => (
                      <div key={item.location_key} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                        <span><span className="mr-3 text-sm font-bold text-primary">{item.rank}.</span>{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.degree} connections</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </Section>
        </>
      )}

      {analysisError && <Section><ErrorAlert title="Analysis failed" message={analysisError} /></Section>}

      {analysis && (
        <>
          <Section title="Traversal Results" description={`Starting from ${analysis.start_location_name}.`}>
            <div className="grid gap-6 lg:grid-cols-2">
              <TraversalPanel title="Breadth-First Search" result={analysis.bfs} nodeNames={nodeNames} />
              <TraversalPanel title="Depth-First Search" result={analysis.dfs} nodeNames={nodeNames} />
            </div>
          </Section>

          <Section title="Degree Centrality Ranking" description="All locations ranked by directly connected neighbours.">
            <Panel>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Location</TableHead><TableHead>Connections</TableHead><TableHead>Degree Centrality</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {analysis.centrality.map((item) => (
                      <TableRow key={item.location_key}>
                        <TableCell className="font-medium">{item.rank}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.degree}</TableCell>
                        <TableCell>{item.centrality.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>
          </Section>

          <Section title="Network Metrics">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard value={analysis.network_density.toFixed(3)} label="Network Density" />
              <StatCard value={analysis.most_connected_location?.name ?? "None"} label="Most Connected" />
              <StatCard value={analysis.most_connected_location?.degree ?? 0} label="Most Connections" />
              <StatCard value={analysis.most_connected_location?.centrality.toFixed(3) ?? "0.000"} label="Highest Centrality" />
              <StatCard value={formatTime(analysis.metrics_execution_time_ms)} label="Metrics Time" />
              <StatCard value={formatTime(analysis.total_execution_time_ms)} label="Total Analysis Time" />
              <StatCard value={analysis.total_nodes} label="Total Nodes" />
              <StatCard value={analysis.total_edges} label="Total Road Records" />
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
