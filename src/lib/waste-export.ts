import { OptimizationResponse, WasteMapResponse } from "./waste-mock-data";

export const exportToJson = (
  data: OptimizationResponse | WasteMapResponse,
  filename: string
) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportOptimizationToCsv = (
  data: OptimizationResponse,
  filename = "waste_optimization_report"
) => {
  const coveragePct =
    data.summary.collection_coverage_pct ??
    (data.summary.total_waste_available_kg
      ? (data.summary.total_waste_collected_kg / data.summary.total_waste_available_kg) * 100
      : 100);

  // Build CSV content in 3 distinct sections
  const rows: string[][] = [
    ["=== OPTIMIZATION SUMMARY ==="],
    [
      "Solver Status",
      data.is_fallback || data.status === "partial_collection"
        ? "PARTIAL SUCCESS - FALLBACK APPLIED"
        : "OPTIMAL SUCCESS",
    ],
    ["Total Road Distance (km)", String(data.summary.total_distance_km)],
    ["Total Waste Collected (kg)", String(data.summary.total_waste_collected_kg)],
    [
      "Total Waste in City (kg)",
      String(data.summary.total_waste_available_kg || data.summary.total_waste_collected_kg),
    ],
    ["Collection Coverage (%)", `${coveragePct.toFixed(1)}%`],
    ["Bins Deferred / Uncollected", String(data.uncollected_bins?.length || 0)],
    ["Uncollected Waste (kg)", String(data.uncollected_waste_kg || 0)],
    ["Trucks Used / Dispatched", String(data.summary.trucks_used)],
    ["Algorithm Execution Time (ms)", String(data.summary.execution_time_ms)],
    ["Peak Dynamic Memory (KB)", String(data.summary.peak_memory_kb)],
    [
      "Recommended Fleet Size",
      String(data.recommended_fleet_size || data.summary.trucks_used),
    ],
    [
      "Recommended Truck Capacity (kg)",
      String(data.recommended_truck_capacity_kg || "N/A"),
    ],
    [
      "Fallback Message",
      `"${data.fallback_message || (data.warnings && data.warnings[0]) || "N/A"}"`,
    ],
    [],
    ["=== FLEET ROUTE BREAKDOWN ==="],
    [
      "Truck ID",
      "Collected Weight (kg)",
      "Capacity Utilization (%)",
      "Route Distance (km)",
      "Number of Stops",
      "Stop Sequence",
    ],
  ];

  data.truck_routes.forEach((route) => {
    rows.push([
      route.truck_id,
      String(route.collected_weight_kg),
      String(route.capacity_utilization_pct),
      String(route.route_distance_km),
      String(route.stop_sequence.length),
      `"${route.stop_sequence.join(" -> ")}"`,
    ]);
  });

  rows.push([]);
  rows.push(["=== TURN-BY-TURN WAYPOINTS ==="]);
  rows.push([
    "Truck ID",
    "Step",
    "Node ID",
    "Node Name",
    "Node Type",
    "Latitude",
    "Longitude",
  ]);

  data.truck_routes.forEach((route) => {
    route.full_path_coordinates.forEach((coord, idx) => {
      rows.push([
        route.truck_id,
        String(idx + 1),
        coord.node_id,
        `"${coord.name}"`,
        coord.node_type,
        String(coord.lat),
        String(coord.lon),
      ]);
    });
  });

  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
