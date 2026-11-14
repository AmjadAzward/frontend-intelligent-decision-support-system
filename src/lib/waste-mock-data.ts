export interface WasteNode {
  id: string;
  type: string;
  name: string;
  lat: number;
  lon: number;
  weight_kg: number;
}

export interface WasteEdge {
  source: string;
  target: string;
  distance_km: number;
}

export interface WasteMapResponse {
  nodes: WasteNode[];
  edges: WasteEdge[];
  adjacency_list: Record<string, Array<{ target: string; distance_km: number }>>;
}

export interface CoordinatePoint {
  node_id: string;
  name: string;
  node_type: string;
  lat: number;
  lon: number;
}

export interface TruckRoute {
  truck_id: string;
  collected_weight_kg: number;
  capacity_utilization_pct: number;
  route_distance_km: number;
  stop_sequence: string[];
  full_path_coordinates: CoordinatePoint[];
}

export interface OptimizationSummary {
  total_distance_km: number;
  total_waste_collected_kg: number;
  total_waste_available_kg?: number;
  collection_coverage_pct?: number;
  trucks_used: number;
  total_trucks_available?: number;
  is_fallback?: boolean;
  execution_time_ms: number;
  peak_memory_kb: number;
}

export interface OptimizationResponse {
  status: string;
  is_fallback?: boolean;
  fallback_message?: string;
  uncollected_waste_kg?: number;
  uncollected_bins?: string[];
  recommended_fleet_size?: number;
  recommended_truck_capacity_kg?: number;
  warnings?: string[];
  summary: OptimizationSummary;
  truck_routes: TruckRoute[];
}

export type CityMapResponse = WasteMapResponse;

export const MOCK_CITY_MAP: CityMapResponse = {
  "nodes": [
    {
      "id": "D0",
      "type": "start",
      "name": "Central Municipal Depot",
      "lat": 40.758,
      "lon": -73.9995,
      "weight_kg": 0
    },
    {
      "id": "T1",
      "type": "destination",
      "name": "Waste Processing & Disposal Facility",
      "lat": 40.718,
      "lon": -73.975,
      "weight_kg": 0
    },
    {
      "id": "I1",
      "type": "intersection",
      "name": "Intersection 1 - Times Square (Broadway & 42nd St)",
      "lat": 40.756,
      "lon": -73.9865,
      "weight_kg": 0
    },
    {
      "id": "I2",
      "type": "intersection",
      "name": "Intersection 2 - Columbus Circle (Broadway & 59th St)",
      "lat": 40.7681,
      "lon": -73.9819,
      "weight_kg": 0
    },
    {
      "id": "I3",
      "type": "intersection",
      "name": "Intersection 3 - Rockefeller Plaza (5th Ave & 50th St)",
      "lat": 40.7587,
      "lon": -73.9787,
      "weight_kg": 0
    },
    {
      "id": "I4",
      "type": "intersection",
      "name": "Intersection 4 - Grand Central Terminal (42nd St & Park Ave)",
      "lat": 40.7527,
      "lon": -73.9772,
      "weight_kg": 0
    },
    {
      "id": "I5",
      "type": "intersection",
      "name": "Intersection 5 - Bryant Park North (6th Ave & 42nd St)",
      "lat": 40.7538,
      "lon": -73.9839,
      "weight_kg": 0
    },
    {
      "id": "I6",
      "type": "intersection",
      "name": "Intersection 6 - Herald Square (Broadway & 34th St)",
      "lat": 40.7505,
      "lon": -73.9876,
      "weight_kg": 0
    },
    {
      "id": "I7",
      "type": "intersection",
      "name": "Intersection 7 - Penn Station West (7th Ave & 31st St)",
      "lat": 40.7495,
      "lon": -73.992,
      "weight_kg": 0
    },
    {
      "id": "I8",
      "type": "intersection",
      "name": "Intersection 8 - Hudson Yards Boulevard (11th Ave & 34th St)",
      "lat": 40.755,
      "lon": -74.0015,
      "weight_kg": 0
    },
    {
      "id": "I9",
      "type": "intersection",
      "name": "Intersection 9 - Empire State North (5th Ave & 34th St)",
      "lat": 40.7484,
      "lon": -73.9857,
      "weight_kg": 0
    },
    {
      "id": "I10",
      "type": "intersection",
      "name": "Intersection 10 - Madison Square North (Broadway & 26th St)",
      "lat": 40.7435,
      "lon": -73.989,
      "weight_kg": 0
    },
    {
      "id": "I11",
      "type": "intersection",
      "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
      "lat": 40.741,
      "lon": -73.9896,
      "weight_kg": 0
    },
    {
      "id": "I12",
      "type": "intersection",
      "name": "Intersection 12 - Chelsea West (8th Ave & 23rd St)",
      "lat": 40.745,
      "lon": -73.998,
      "weight_kg": 0
    },
    {
      "id": "I13",
      "type": "intersection",
      "name": "Intersection 13 - Gramercy Park Link (Park Ave S & 20th St)",
      "lat": 40.738,
      "lon": -73.986,
      "weight_kg": 0
    },
    {
      "id": "I14",
      "type": "intersection",
      "name": "Intersection 14 - Union Square North (Broadway & 17th St)",
      "lat": 40.7365,
      "lon": -73.9905,
      "weight_kg": 0
    },
    {
      "id": "I15",
      "type": "intersection",
      "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
      "lat": 40.734,
      "lon": -73.99,
      "weight_kg": 0
    },
    {
      "id": "I16",
      "type": "intersection",
      "name": "Intersection 16 - Meatpacking Crossing (9th Ave & 14th St)",
      "lat": 40.741,
      "lon": -74.004,
      "weight_kg": 0
    },
    {
      "id": "I17",
      "type": "intersection",
      "name": "Intersection 17 - West Village (7th Ave S & Bleecker St)",
      "lat": 40.732,
      "lon": -74.003,
      "weight_kg": 0
    },
    {
      "id": "I18",
      "type": "intersection",
      "name": "Intersection 18 - Washington Square North (5th Ave & Waverly)",
      "lat": 40.7315,
      "lon": -73.9965,
      "weight_kg": 0
    },
    {
      "id": "I19",
      "type": "intersection",
      "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
      "lat": 40.729,
      "lon": -73.9865,
      "weight_kg": 0
    },
    {
      "id": "I20",
      "type": "intersection",
      "name": "Intersection 20 - Astor Place Plaza (Lafayette & 8th St)",
      "lat": 40.7295,
      "lon": -73.9915,
      "weight_kg": 0
    },
    {
      "id": "I21",
      "type": "intersection",
      "name": "Intersection 21 - SoHo North (Broadway & Houston St)",
      "lat": 40.725,
      "lon": -73.996,
      "weight_kg": 0
    },
    {
      "id": "I22",
      "type": "intersection",
      "name": "Intersection 22 - SoHo Central (Spring St & West Broadway)",
      "lat": 40.722,
      "lon": -74.001,
      "weight_kg": 0
    },
    {
      "id": "I23",
      "type": "intersection",
      "name": "Intersection 23 - Lower East Side Link (Delancey & Essex)",
      "lat": 40.7185,
      "lon": -73.988,
      "weight_kg": 0
    },
    {
      "id": "I24",
      "type": "intersection",
      "name": "Intersection 24 - Chinatown Core (Canal St & Mott St)",
      "lat": 40.717,
      "lon": -73.9975,
      "weight_kg": 0
    },
    {
      "id": "I25",
      "type": "intersection",
      "name": "Intersection 25 - Tribeca North (Hudson St & Canal St)",
      "lat": 40.721,
      "lon": -74.008,
      "weight_kg": 0
    },
    {
      "id": "I26",
      "type": "intersection",
      "name": "Intersection 26 - Tribeca Central (Franklin St & Church St)",
      "lat": 40.7175,
      "lon": -74.005,
      "weight_kg": 0
    },
    {
      "id": "I27",
      "type": "intersection",
      "name": "Intersection 27 - Civic Center (Chambers St & Centre St)",
      "lat": 40.713,
      "lon": -74.0035,
      "weight_kg": 0
    },
    {
      "id": "I28",
      "type": "intersection",
      "name": "Intersection 28 - World Trade Center (Fulton & Greenwich)",
      "lat": 40.7115,
      "lon": -74.011,
      "weight_kg": 0
    },
    {
      "id": "I29",
      "type": "intersection",
      "name": "Intersection 29 - Wall Street Crossing (Broadway & Wall St)",
      "lat": 40.7075,
      "lon": -74.0115,
      "weight_kg": 0
    },
    {
      "id": "I30",
      "type": "intersection",
      "name": "Intersection 30 - South Ferry / Battery Gateway (State St)",
      "lat": 40.703,
      "lon": -74.0145,
      "weight_kg": 0
    },
    {
      "id": "B1",
      "type": "bin",
      "name": "Smart Bin 1 - Times Square Theater District",
      "lat": 40.758,
      "lon": -73.9855,
      "weight_kg": 340
    },
    {
      "id": "B2",
      "type": "bin",
      "name": "Smart Bin 2 - Central Park South Promenade",
      "lat": 40.7655,
      "lon": -73.978,
      "weight_kg": 420
    },
    {
      "id": "B3",
      "type": "bin",
      "name": "Smart Bin 3 - Rockefeller Center Concourse",
      "lat": 40.7595,
      "lon": -73.9775,
      "weight_kg": 290
    },
    {
      "id": "B4",
      "type": "bin",
      "name": "Smart Bin 4 - Midtown East Corporate Center",
      "lat": 40.7545,
      "lon": -73.9735,
      "weight_kg": 480
    },
    {
      "id": "B5",
      "type": "bin",
      "name": "Smart Bin 5 - Grand Central Station Entrance",
      "lat": 40.752,
      "lon": -73.9785,
      "weight_kg": 490
    },
    {
      "id": "B6",
      "type": "bin",
      "name": "Smart Bin 6 - Bryant Park Library Terrace",
      "lat": 40.7532,
      "lon": -73.9825,
      "weight_kg": 310
    },
    {
      "id": "B7",
      "type": "bin",
      "name": "Smart Bin 7 - Herald Square Shopping Concourse",
      "lat": 40.7495,
      "lon": -73.9885,
      "weight_kg": 460
    },
    {
      "id": "B8",
      "type": "bin",
      "name": "Smart Bin 8 - Penn Station Plaza",
      "lat": 40.7508,
      "lon": -73.993,
      "weight_kg": 390
    },
    {
      "id": "B9",
      "type": "bin",
      "name": "Smart Bin 9 - Hudson Yards High Line Concourse",
      "lat": 40.753,
      "lon": -74.002,
      "weight_kg": 370
    },
    {
      "id": "B10",
      "type": "bin",
      "name": "Smart Bin 10 - Empire State Observation Concourse",
      "lat": 40.7478,
      "lon": -73.9845,
      "weight_kg": 440
    },
    {
      "id": "B11",
      "type": "bin",
      "name": "Smart Bin 11 - Chelsea Market Promenade",
      "lat": 40.742,
      "lon": -74.006,
      "weight_kg": 490
    },
    {
      "id": "B12",
      "type": "bin",
      "name": "Smart Bin 12 - Madison Square Park Lawn",
      "lat": 40.7425,
      "lon": -73.9875,
      "weight_kg": 260
    },
    {
      "id": "B13",
      "type": "bin",
      "name": "Smart Bin 13 - Flatiron Landmark Plaza",
      "lat": 40.7405,
      "lon": -73.9905,
      "weight_kg": 350
    },
    {
      "id": "B14",
      "type": "bin",
      "name": "Smart Bin 14 - Gramercy Park East",
      "lat": 40.737,
      "lon": -73.9835,
      "weight_kg": 210
    },
    {
      "id": "B15",
      "type": "bin",
      "name": "Smart Bin 15 - Union Square Greenmarket",
      "lat": 40.7355,
      "lon": -73.991,
      "weight_kg": 470
    },
    {
      "id": "B16",
      "type": "bin",
      "name": "Smart Bin 16 - Meatpacking District Plaza",
      "lat": 40.74,
      "lon": -74.007,
      "weight_kg": 380
    },
    {
      "id": "B17",
      "type": "bin",
      "name": "Smart Bin 17 - Washington Square Arch",
      "lat": 40.7308,
      "lon": -73.9973,
      "weight_kg": 490
    },
    {
      "id": "B18",
      "type": "bin",
      "name": "Smart Bin 18 - East Village Tompkins Square",
      "lat": 40.7265,
      "lon": -73.9815,
      "weight_kg": 320
    },
    {
      "id": "B19",
      "type": "bin",
      "name": "Smart Bin 19 - NYU Stern Campus Courtyard",
      "lat": 40.729,
      "lon": -73.994,
      "weight_kg": 280
    },
    {
      "id": "B20",
      "type": "bin",
      "name": "Smart Bin 20 - SoHo Broadway Fashion District",
      "lat": 40.7235,
      "lon": -73.998,
      "weight_kg": 430
    },
    {
      "id": "B21",
      "type": "bin",
      "name": "Smart Bin 21 - Lower East Side Cultural Center",
      "lat": 40.717,
      "lon": -73.985,
      "weight_kg": 360
    },
    {
      "id": "B22",
      "type": "bin",
      "name": "Smart Bin 22 - Chinatown Columbus Park",
      "lat": 40.7145,
      "lon": -73.9995,
      "weight_kg": 410
    },
    {
      "id": "B23",
      "type": "bin",
      "name": "Smart Bin 23 - Tribeca Historic Promenade",
      "lat": 40.719,
      "lon": -74.007,
      "weight_kg": 240
    },
    {
      "id": "B24",
      "type": "bin",
      "name": "Smart Bin 24 - One World Trade Center Plaza",
      "lat": 40.713,
      "lon": -74.013,
      "weight_kg": 500
    },
    {
      "id": "B25",
      "type": "bin",
      "name": "Smart Bin 25 - Wall Street New York Stock Exchange",
      "lat": 40.7068,
      "lon": -74.009,
      "weight_kg": 450
    }
  ],
  "edges": [
    {
      "source": "D0",
      "target": "I8",
      "distance_km": 0.47
    },
    {
      "source": "D0",
      "target": "I1",
      "distance_km": 1.4
    },
    {
      "source": "D0",
      "target": "I7",
      "distance_km": 1.42
    },
    {
      "source": "B9",
      "target": "D0",
      "distance_km": 0.74
    },
    {
      "source": "I19",
      "target": "T1",
      "distance_km": 1.95
    },
    {
      "source": "I23",
      "target": "T1",
      "distance_km": 1.37
    },
    {
      "source": "I24",
      "target": "T1",
      "distance_km": 2.37
    },
    {
      "source": "I27",
      "target": "T1",
      "distance_km": 3.08
    },
    {
      "source": "I1",
      "target": "I2",
      "distance_km": 1.75
    },
    {
      "source": "I1",
      "target": "I5",
      "distance_km": 0.41
    },
    {
      "source": "I1",
      "target": "I6",
      "distance_km": 0.77
    },
    {
      "source": "I1",
      "target": "I8",
      "distance_km": 1.59
    },
    {
      "source": "B1",
      "target": "I1",
      "distance_km": 0.3
    },
    {
      "source": "I2",
      "target": "I3",
      "distance_km": 1.35
    },
    {
      "source": "B2",
      "target": "I2",
      "distance_km": 0.55
    },
    {
      "source": "I3",
      "target": "I4",
      "distance_km": 0.85
    },
    {
      "source": "I3",
      "target": "I5",
      "distance_km": 0.87
    },
    {
      "source": "B3",
      "target": "I3",
      "distance_km": 0.25
    },
    {
      "source": "I4",
      "target": "I5",
      "distance_km": 0.72
    },
    {
      "source": "I4",
      "target": "I9",
      "distance_km": 1.08
    },
    {
      "source": "B4",
      "target": "I4",
      "distance_km": 0.46
    },
    {
      "source": "B5",
      "target": "I4",
      "distance_km": 0.25
    },
    {
      "source": "I5",
      "target": "I6",
      "distance_km": 0.6
    },
    {
      "source": "I5",
      "target": "I9",
      "distance_km": 0.77
    },
    {
      "source": "B6",
      "target": "I5",
      "distance_km": 0.25
    },
    {
      "source": "I6",
      "target": "I7",
      "distance_km": 0.48
    },
    {
      "source": "I6",
      "target": "I9",
      "distance_km": 0.35
    },
    {
      "source": "I10",
      "target": "I6",
      "distance_km": 0.98
    },
    {
      "source": "B7",
      "target": "I6",
      "distance_km": 0.25
    },
    {
      "source": "I7",
      "target": "I8",
      "distance_km": 1.26
    },
    {
      "source": "I12",
      "target": "I7",
      "distance_km": 0.89
    },
    {
      "source": "B8",
      "target": "I7",
      "distance_km": 0.25
    },
    {
      "source": "I12",
      "target": "I8",
      "distance_km": 1.44
    },
    {
      "source": "B9",
      "target": "I8",
      "distance_km": 0.28
    },
    {
      "source": "I10",
      "target": "I9",
      "distance_km": 0.76
    },
    {
      "source": "I13",
      "target": "I9",
      "distance_km": 1.45
    },
    {
      "source": "B10",
      "target": "I9",
      "distance_km": 0.25
    },
    {
      "source": "I10",
      "target": "I11",
      "distance_km": 0.35
    },
    {
      "source": "I10",
      "target": "I12",
      "distance_km": 0.97
    },
    {
      "source": "B12",
      "target": "I10",
      "distance_km": 0.25
    },
    {
      "source": "I11",
      "target": "I13",
      "distance_km": 0.56
    },
    {
      "source": "I11",
      "target": "I14",
      "distance_km": 0.63
    },
    {
      "source": "I11",
      "target": "I12",
      "distance_km": 1.04
    },
    {
      "source": "B13",
      "target": "I11",
      "distance_km": 0.25
    },
    {
      "source": "I12",
      "target": "I16",
      "distance_km": 0.84
    },
    {
      "source": "B11",
      "target": "I12",
      "distance_km": 0.94
    },
    {
      "source": "I13",
      "target": "I14",
      "distance_km": 0.52
    },
    {
      "source": "I13",
      "target": "I15",
      "distance_km": 0.7
    },
    {
      "source": "B14",
      "target": "I13",
      "distance_km": 0.3
    },
    {
      "source": "I14",
      "target": "I15",
      "distance_km": 0.35
    },
    {
      "source": "I14",
      "target": "I18",
      "distance_km": 0.94
    },
    {
      "source": "B15",
      "target": "I14",
      "distance_km": 0.25
    },
    {
      "source": "I15",
      "target": "I19",
      "distance_km": 0.79
    },
    {
      "source": "I15",
      "target": "I20",
      "distance_km": 0.65
    },
    {
      "source": "B15",
      "target": "I15",
      "distance_km": 0.25
    },
    {
      "source": "I16",
      "target": "I17",
      "distance_km": 1.26
    },
    {
      "source": "B11",
      "target": "I16",
      "distance_km": 0.25
    },
    {
      "source": "B16",
      "target": "I16",
      "distance_km": 0.35
    },
    {
      "source": "I17",
      "target": "I18",
      "distance_km": 0.69
    },
    {
      "source": "I17",
      "target": "I22",
      "distance_km": 1.41
    },
    {
      "source": "I17",
      "target": "I25",
      "distance_km": 1.62
    },
    {
      "source": "B16",
      "target": "I17",
      "distance_km": 1.19
    },
    {
      "source": "I18",
      "target": "I20",
      "distance_km": 0.6
    },
    {
      "source": "I18",
      "target": "I21",
      "distance_km": 0.9
    },
    {
      "source": "B17",
      "target": "I18",
      "distance_km": 0.25
    },
    {
      "source": "B19",
      "target": "I18",
      "distance_km": 0.44
    },
    {
      "source": "I19",
      "target": "I20",
      "distance_km": 0.53
    },
    {
      "source": "I19",
      "target": "I23",
      "distance_km": 1.47
    },
    {
      "source": "B18",
      "target": "I19",
      "distance_km": 0.63
    },
    {
      "source": "I20",
      "target": "I21",
      "distance_km": 0.78
    },
    {
      "source": "B19",
      "target": "I20",
      "distance_km": 0.27
    },
    {
      "source": "I21",
      "target": "I22",
      "distance_km": 0.67
    },
    {
      "source": "I21",
      "target": "I23",
      "distance_km": 1.24
    },
    {
      "source": "I21",
      "target": "I24",
      "distance_km": 1.12
    },
    {
      "source": "B20",
      "target": "I21",
      "distance_km": 0.3
    },
    {
      "source": "I22",
      "target": "I25",
      "distance_km": 0.75
    },
    {
      "source": "I22",
      "target": "I26",
      "distance_km": 0.75
    },
    {
      "source": "B20",
      "target": "I22",
      "distance_km": 0.38
    },
    {
      "source": "I23",
      "target": "I24",
      "distance_km": 1.02
    },
    {
      "source": "B21",
      "target": "I23",
      "distance_km": 0.38
    },
    {
      "source": "I24",
      "target": "I26",
      "distance_km": 0.79
    },
    {
      "source": "I24",
      "target": "I27",
      "distance_km": 0.84
    },
    {
      "source": "B22",
      "target": "I24",
      "distance_km": 0.41
    },
    {
      "source": "I25",
      "target": "I26",
      "distance_km": 0.58
    },
    {
      "source": "B23",
      "target": "I25",
      "distance_km": 0.3
    },
    {
      "source": "I26",
      "target": "I27",
      "distance_km": 0.65
    },
    {
      "source": "I26",
      "target": "I28",
      "distance_km": 1.05
    },
    {
      "source": "B23",
      "target": "I26",
      "distance_km": 0.3
    },
    {
      "source": "I27",
      "target": "I28",
      "distance_km": 0.82
    },
    {
      "source": "I27",
      "target": "I29",
      "distance_km": 1.14
    },
    {
      "source": "B22",
      "target": "I27",
      "distance_km": 0.47
    },
    {
      "source": "I28",
      "target": "I29",
      "distance_km": 0.56
    },
    {
      "source": "B24",
      "target": "I28",
      "distance_km": 0.3
    },
    {
      "source": "I29",
      "target": "I30",
      "distance_km": 0.7
    },
    {
      "source": "B25",
      "target": "I29",
      "distance_km": 0.28
    },
    {
      "source": "B25",
      "target": "I30",
      "distance_km": 0.78
    }
  ],
  "adjacency_list": {
    "D0": [
      {
        "target": "I8",
        "distance_km": 0.47
      },
      {
        "target": "I1",
        "distance_km": 1.4
      },
      {
        "target": "I7",
        "distance_km": 1.42
      },
      {
        "target": "B9",
        "distance_km": 0.74
      }
    ],
    "T1": [
      {
        "target": "I19",
        "distance_km": 1.95
      },
      {
        "target": "I23",
        "distance_km": 1.37
      },
      {
        "target": "I24",
        "distance_km": 2.37
      },
      {
        "target": "I27",
        "distance_km": 3.08
      }
    ],
    "I1": [
      {
        "target": "D0",
        "distance_km": 1.4
      },
      {
        "target": "I2",
        "distance_km": 1.75
      },
      {
        "target": "I5",
        "distance_km": 0.41
      },
      {
        "target": "I6",
        "distance_km": 0.77
      },
      {
        "target": "I8",
        "distance_km": 1.59
      },
      {
        "target": "B1",
        "distance_km": 0.3
      }
    ],
    "I2": [
      {
        "target": "I3",
        "distance_km": 1.35
      },
      {
        "target": "I1",
        "distance_km": 1.75
      },
      {
        "target": "B2",
        "distance_km": 0.55
      }
    ],
    "I3": [
      {
        "target": "I2",
        "distance_km": 1.35
      },
      {
        "target": "I4",
        "distance_km": 0.85
      },
      {
        "target": "I5",
        "distance_km": 0.87
      },
      {
        "target": "B3",
        "distance_km": 0.25
      }
    ],
    "I4": [
      {
        "target": "I3",
        "distance_km": 0.85
      },
      {
        "target": "I5",
        "distance_km": 0.72
      },
      {
        "target": "I9",
        "distance_km": 1.08
      },
      {
        "target": "B4",
        "distance_km": 0.46
      },
      {
        "target": "B5",
        "distance_km": 0.25
      }
    ],
    "I5": [
      {
        "target": "I3",
        "distance_km": 0.87
      },
      {
        "target": "I4",
        "distance_km": 0.72
      },
      {
        "target": "I1",
        "distance_km": 0.41
      },
      {
        "target": "I6",
        "distance_km": 0.6
      },
      {
        "target": "I9",
        "distance_km": 0.77
      },
      {
        "target": "B6",
        "distance_km": 0.25
      }
    ],
    "I6": [
      {
        "target": "I1",
        "distance_km": 0.77
      },
      {
        "target": "I5",
        "distance_km": 0.6
      },
      {
        "target": "I7",
        "distance_km": 0.48
      },
      {
        "target": "I9",
        "distance_km": 0.35
      },
      {
        "target": "I10",
        "distance_km": 0.98
      },
      {
        "target": "B7",
        "distance_km": 0.25
      }
    ],
    "I7": [
      {
        "target": "D0",
        "distance_km": 1.42
      },
      {
        "target": "I6",
        "distance_km": 0.48
      },
      {
        "target": "I8",
        "distance_km": 1.26
      },
      {
        "target": "I12",
        "distance_km": 0.89
      },
      {
        "target": "B8",
        "distance_km": 0.25
      }
    ],
    "I8": [
      {
        "target": "D0",
        "distance_km": 0.47
      },
      {
        "target": "I1",
        "distance_km": 1.59
      },
      {
        "target": "I7",
        "distance_km": 1.26
      },
      {
        "target": "I12",
        "distance_km": 1.44
      },
      {
        "target": "B9",
        "distance_km": 0.28
      }
    ],
    "I9": [
      {
        "target": "I4",
        "distance_km": 1.08
      },
      {
        "target": "I5",
        "distance_km": 0.77
      },
      {
        "target": "I6",
        "distance_km": 0.35
      },
      {
        "target": "I10",
        "distance_km": 0.76
      },
      {
        "target": "I13",
        "distance_km": 1.45
      },
      {
        "target": "B10",
        "distance_km": 0.25
      }
    ],
    "I10": [
      {
        "target": "I6",
        "distance_km": 0.98
      },
      {
        "target": "I9",
        "distance_km": 0.76
      },
      {
        "target": "I11",
        "distance_km": 0.35
      },
      {
        "target": "I12",
        "distance_km": 0.97
      },
      {
        "target": "B12",
        "distance_km": 0.25
      }
    ],
    "I11": [
      {
        "target": "I10",
        "distance_km": 0.35
      },
      {
        "target": "I13",
        "distance_km": 0.56
      },
      {
        "target": "I14",
        "distance_km": 0.63
      },
      {
        "target": "I12",
        "distance_km": 1.04
      },
      {
        "target": "B13",
        "distance_km": 0.25
      }
    ],
    "I12": [
      {
        "target": "I7",
        "distance_km": 0.89
      },
      {
        "target": "I8",
        "distance_km": 1.44
      },
      {
        "target": "I10",
        "distance_km": 0.97
      },
      {
        "target": "I11",
        "distance_km": 1.04
      },
      {
        "target": "I16",
        "distance_km": 0.84
      },
      {
        "target": "B11",
        "distance_km": 0.94
      }
    ],
    "I13": [
      {
        "target": "I9",
        "distance_km": 1.45
      },
      {
        "target": "I11",
        "distance_km": 0.56
      },
      {
        "target": "I14",
        "distance_km": 0.52
      },
      {
        "target": "I15",
        "distance_km": 0.7
      },
      {
        "target": "B14",
        "distance_km": 0.3
      }
    ],
    "I14": [
      {
        "target": "I11",
        "distance_km": 0.63
      },
      {
        "target": "I13",
        "distance_km": 0.52
      },
      {
        "target": "I15",
        "distance_km": 0.35
      },
      {
        "target": "I18",
        "distance_km": 0.94
      },
      {
        "target": "B15",
        "distance_km": 0.25
      }
    ],
    "I15": [
      {
        "target": "I13",
        "distance_km": 0.7
      },
      {
        "target": "I14",
        "distance_km": 0.35
      },
      {
        "target": "I19",
        "distance_km": 0.79
      },
      {
        "target": "I20",
        "distance_km": 0.65
      },
      {
        "target": "B15",
        "distance_km": 0.25
      }
    ],
    "I16": [
      {
        "target": "I12",
        "distance_km": 0.84
      },
      {
        "target": "I17",
        "distance_km": 1.26
      },
      {
        "target": "B11",
        "distance_km": 0.25
      },
      {
        "target": "B16",
        "distance_km": 0.35
      }
    ],
    "I17": [
      {
        "target": "I16",
        "distance_km": 1.26
      },
      {
        "target": "I18",
        "distance_km": 0.69
      },
      {
        "target": "I22",
        "distance_km": 1.41
      },
      {
        "target": "I25",
        "distance_km": 1.62
      },
      {
        "target": "B16",
        "distance_km": 1.19
      }
    ],
    "I18": [
      {
        "target": "I14",
        "distance_km": 0.94
      },
      {
        "target": "I17",
        "distance_km": 0.69
      },
      {
        "target": "I20",
        "distance_km": 0.6
      },
      {
        "target": "I21",
        "distance_km": 0.9
      },
      {
        "target": "B17",
        "distance_km": 0.25
      },
      {
        "target": "B19",
        "distance_km": 0.44
      }
    ],
    "I19": [
      {
        "target": "I15",
        "distance_km": 0.79
      },
      {
        "target": "I20",
        "distance_km": 0.53
      },
      {
        "target": "I23",
        "distance_km": 1.47
      },
      {
        "target": "B18",
        "distance_km": 0.63
      },
      {
        "target": "T1",
        "distance_km": 1.95
      }
    ],
    "I20": [
      {
        "target": "I15",
        "distance_km": 0.65
      },
      {
        "target": "I18",
        "distance_km": 0.6
      },
      {
        "target": "I19",
        "distance_km": 0.53
      },
      {
        "target": "I21",
        "distance_km": 0.78
      },
      {
        "target": "B19",
        "distance_km": 0.27
      }
    ],
    "I21": [
      {
        "target": "I18",
        "distance_km": 0.9
      },
      {
        "target": "I20",
        "distance_km": 0.78
      },
      {
        "target": "I22",
        "distance_km": 0.67
      },
      {
        "target": "I23",
        "distance_km": 1.24
      },
      {
        "target": "I24",
        "distance_km": 1.12
      },
      {
        "target": "B20",
        "distance_km": 0.3
      }
    ],
    "I22": [
      {
        "target": "I17",
        "distance_km": 1.41
      },
      {
        "target": "I21",
        "distance_km": 0.67
      },
      {
        "target": "I25",
        "distance_km": 0.75
      },
      {
        "target": "I26",
        "distance_km": 0.75
      },
      {
        "target": "B20",
        "distance_km": 0.38
      }
    ],
    "I23": [
      {
        "target": "I19",
        "distance_km": 1.47
      },
      {
        "target": "I21",
        "distance_km": 1.24
      },
      {
        "target": "T1",
        "distance_km": 1.37
      },
      {
        "target": "I24",
        "distance_km": 1.02
      },
      {
        "target": "B21",
        "distance_km": 0.38
      }
    ],
    "I24": [
      {
        "target": "I21",
        "distance_km": 1.12
      },
      {
        "target": "I23",
        "distance_km": 1.02
      },
      {
        "target": "I26",
        "distance_km": 0.79
      },
      {
        "target": "I27",
        "distance_km": 0.84
      },
      {
        "target": "T1",
        "distance_km": 2.37
      },
      {
        "target": "B22",
        "distance_km": 0.41
      }
    ],
    "I25": [
      {
        "target": "I17",
        "distance_km": 1.62
      },
      {
        "target": "I22",
        "distance_km": 0.75
      },
      {
        "target": "I26",
        "distance_km": 0.58
      },
      {
        "target": "B23",
        "distance_km": 0.3
      }
    ],
    "I26": [
      {
        "target": "I22",
        "distance_km": 0.75
      },
      {
        "target": "I24",
        "distance_km": 0.79
      },
      {
        "target": "I25",
        "distance_km": 0.58
      },
      {
        "target": "I27",
        "distance_km": 0.65
      },
      {
        "target": "I28",
        "distance_km": 1.05
      },
      {
        "target": "B23",
        "distance_km": 0.3
      }
    ],
    "I27": [
      {
        "target": "I24",
        "distance_km": 0.84
      },
      {
        "target": "I26",
        "distance_km": 0.65
      },
      {
        "target": "I28",
        "distance_km": 0.82
      },
      {
        "target": "I29",
        "distance_km": 1.14
      },
      {
        "target": "T1",
        "distance_km": 3.08
      },
      {
        "target": "B22",
        "distance_km": 0.47
      }
    ],
    "I28": [
      {
        "target": "I26",
        "distance_km": 1.05
      },
      {
        "target": "I27",
        "distance_km": 0.82
      },
      {
        "target": "I29",
        "distance_km": 0.56
      },
      {
        "target": "B24",
        "distance_km": 0.3
      }
    ],
    "I29": [
      {
        "target": "I27",
        "distance_km": 1.14
      },
      {
        "target": "I28",
        "distance_km": 0.56
      },
      {
        "target": "I30",
        "distance_km": 0.7
      },
      {
        "target": "B25",
        "distance_km": 0.28
      }
    ],
    "I30": [
      {
        "target": "I29",
        "distance_km": 0.7
      },
      {
        "target": "B25",
        "distance_km": 0.78
      }
    ],
    "B1": [
      {
        "target": "I1",
        "distance_km": 0.3
      }
    ],
    "B2": [
      {
        "target": "I2",
        "distance_km": 0.55
      }
    ],
    "B3": [
      {
        "target": "I3",
        "distance_km": 0.25
      }
    ],
    "B4": [
      {
        "target": "I4",
        "distance_km": 0.46
      }
    ],
    "B5": [
      {
        "target": "I4",
        "distance_km": 0.25
      }
    ],
    "B6": [
      {
        "target": "I5",
        "distance_km": 0.25
      }
    ],
    "B7": [
      {
        "target": "I6",
        "distance_km": 0.25
      }
    ],
    "B8": [
      {
        "target": "I7",
        "distance_km": 0.25
      }
    ],
    "B9": [
      {
        "target": "D0",
        "distance_km": 0.74
      },
      {
        "target": "I8",
        "distance_km": 0.28
      }
    ],
    "B10": [
      {
        "target": "I9",
        "distance_km": 0.25
      }
    ],
    "B11": [
      {
        "target": "I12",
        "distance_km": 0.94
      },
      {
        "target": "I16",
        "distance_km": 0.25
      }
    ],
    "B12": [
      {
        "target": "I10",
        "distance_km": 0.25
      }
    ],
    "B13": [
      {
        "target": "I11",
        "distance_km": 0.25
      }
    ],
    "B14": [
      {
        "target": "I13",
        "distance_km": 0.3
      }
    ],
    "B15": [
      {
        "target": "I14",
        "distance_km": 0.25
      },
      {
        "target": "I15",
        "distance_km": 0.25
      }
    ],
    "B16": [
      {
        "target": "I16",
        "distance_km": 0.35
      },
      {
        "target": "I17",
        "distance_km": 1.19
      }
    ],
    "B17": [
      {
        "target": "I18",
        "distance_km": 0.25
      }
    ],
    "B18": [
      {
        "target": "I19",
        "distance_km": 0.63
      }
    ],
    "B19": [
      {
        "target": "I18",
        "distance_km": 0.44
      },
      {
        "target": "I20",
        "distance_km": 0.27
      }
    ],
    "B20": [
      {
        "target": "I21",
        "distance_km": 0.3
      },
      {
        "target": "I22",
        "distance_km": 0.38
      }
    ],
    "B21": [
      {
        "target": "I23",
        "distance_km": 0.38
      }
    ],
    "B22": [
      {
        "target": "I24",
        "distance_km": 0.41
      },
      {
        "target": "I27",
        "distance_km": 0.47
      }
    ],
    "B23": [
      {
        "target": "I25",
        "distance_km": 0.3
      },
      {
        "target": "I26",
        "distance_km": 0.3
      }
    ],
    "B24": [
      {
        "target": "I28",
        "distance_km": 0.3
      }
    ],
    "B25": [
      {
        "target": "I29",
        "distance_km": 0.28
      },
      {
        "target": "I30",
        "distance_km": 0.78
      }
    ]
  }
};

export const MOCK_OPTIMIZATION_RESULT: OptimizationResponse = {
  "status": "success",
  "summary": {
    "total_distance_km": 80.11,
    "total_waste_collected_kg": 9630,
    "trucks_used": 4,
    "execution_time_ms": 12.8,
    "peak_memory_kb": 240.5
  },
  "truck_routes": [
    {
      "truck_id": "TRUCK-1",
      "collected_weight_kg": 2330,
      "capacity_utilization_pct": 93.2,
      "route_distance_km": 17.5,
      "stop_sequence": [
        "D0",
        "B9",
        "B11",
        "B16",
        "B17",
        "B19",
        "B18",
        "T1",
        "D0"
      ],
      "full_path_coordinates": [
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        },
        {
          "node_id": "B9",
          "name": "Smart Bin 9 - Hudson Yards High Line Concourse",
          "node_type": "bin",
          "lat": 40.753,
          "lon": -74.002
        },
        {
          "node_id": "I8",
          "name": "Intersection 8 - Hudson Yards Boulevard (11th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.755,
          "lon": -74.0015
        },
        {
          "node_id": "I12",
          "name": "Intersection 12 - Chelsea West (8th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.745,
          "lon": -73.998
        },
        {
          "node_id": "B11",
          "name": "Smart Bin 11 - Chelsea Market Promenade",
          "node_type": "bin",
          "lat": 40.742,
          "lon": -74.006
        },
        {
          "node_id": "I16",
          "name": "Intersection 16 - Meatpacking Crossing (9th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -74.004
        },
        {
          "node_id": "B16",
          "name": "Smart Bin 16 - Meatpacking District Plaza",
          "node_type": "bin",
          "lat": 40.74,
          "lon": -74.007
        },
        {
          "node_id": "I17",
          "name": "Intersection 17 - West Village (7th Ave S & Bleecker St)",
          "node_type": "intersection",
          "lat": 40.732,
          "lon": -74.003
        },
        {
          "node_id": "I18",
          "name": "Intersection 18 - Washington Square North (5th Ave & Waverly)",
          "node_type": "intersection",
          "lat": 40.7315,
          "lon": -73.9965
        },
        {
          "node_id": "B17",
          "name": "Smart Bin 17 - Washington Square Arch",
          "node_type": "bin",
          "lat": 40.7308,
          "lon": -73.9973
        },
        {
          "node_id": "I18",
          "name": "Intersection 18 - Washington Square North (5th Ave & Waverly)",
          "node_type": "intersection",
          "lat": 40.7315,
          "lon": -73.9965
        },
        {
          "node_id": "B19",
          "name": "Smart Bin 19 - NYU Stern Campus Courtyard",
          "node_type": "bin",
          "lat": 40.729,
          "lon": -73.994
        },
        {
          "node_id": "I20",
          "name": "Intersection 20 - Astor Place Plaza (Lafayette & 8th St)",
          "node_type": "intersection",
          "lat": 40.7295,
          "lon": -73.9915
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "B18",
          "name": "Smart Bin 18 - East Village Tompkins Square",
          "node_type": "bin",
          "lat": 40.7265,
          "lon": -73.9815
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "T1",
          "name": "Waste Processing & Disposal Facility",
          "node_type": "destination",
          "lat": 40.718,
          "lon": -73.975
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "I15",
          "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.734,
          "lon": -73.99
        },
        {
          "node_id": "I14",
          "name": "Intersection 14 - Union Square North (Broadway & 17th St)",
          "node_type": "intersection",
          "lat": 40.7365,
          "lon": -73.9905
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "I12",
          "name": "Intersection 12 - Chelsea West (8th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.745,
          "lon": -73.998
        },
        {
          "node_id": "I8",
          "name": "Intersection 8 - Hudson Yards Boulevard (11th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.755,
          "lon": -74.0015
        },
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        }
      ]
    },
    {
      "truck_id": "TRUCK-2",
      "collected_weight_kg": 2470,
      "capacity_utilization_pct": 98.8,
      "route_distance_km": 18.78,
      "stop_sequence": [
        "D0",
        "B8",
        "B7",
        "B10",
        "B12",
        "B13",
        "B14",
        "B21",
        "T1",
        "D0"
      ],
      "full_path_coordinates": [
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        },
        {
          "node_id": "I7",
          "name": "Intersection 7 - Penn Station West (7th Ave & 31st St)",
          "node_type": "intersection",
          "lat": 40.7495,
          "lon": -73.992
        },
        {
          "node_id": "B8",
          "name": "Smart Bin 8 - Penn Station Plaza",
          "node_type": "bin",
          "lat": 40.7508,
          "lon": -73.993
        },
        {
          "node_id": "I7",
          "name": "Intersection 7 - Penn Station West (7th Ave & 31st St)",
          "node_type": "intersection",
          "lat": 40.7495,
          "lon": -73.992
        },
        {
          "node_id": "I6",
          "name": "Intersection 6 - Herald Square (Broadway & 34th St)",
          "node_type": "intersection",
          "lat": 40.7505,
          "lon": -73.9876
        },
        {
          "node_id": "B7",
          "name": "Smart Bin 7 - Herald Square Shopping Concourse",
          "node_type": "bin",
          "lat": 40.7495,
          "lon": -73.9885
        },
        {
          "node_id": "I6",
          "name": "Intersection 6 - Herald Square (Broadway & 34th St)",
          "node_type": "intersection",
          "lat": 40.7505,
          "lon": -73.9876
        },
        {
          "node_id": "I9",
          "name": "Intersection 9 - Empire State North (5th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.7484,
          "lon": -73.9857
        },
        {
          "node_id": "B10",
          "name": "Smart Bin 10 - Empire State Observation Concourse",
          "node_type": "bin",
          "lat": 40.7478,
          "lon": -73.9845
        },
        {
          "node_id": "I9",
          "name": "Intersection 9 - Empire State North (5th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.7484,
          "lon": -73.9857
        },
        {
          "node_id": "I10",
          "name": "Intersection 10 - Madison Square North (Broadway & 26th St)",
          "node_type": "intersection",
          "lat": 40.7435,
          "lon": -73.989
        },
        {
          "node_id": "B12",
          "name": "Smart Bin 12 - Madison Square Park Lawn",
          "node_type": "bin",
          "lat": 40.7425,
          "lon": -73.9875
        },
        {
          "node_id": "I10",
          "name": "Intersection 10 - Madison Square North (Broadway & 26th St)",
          "node_type": "intersection",
          "lat": 40.7435,
          "lon": -73.989
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "B13",
          "name": "Smart Bin 13 - Flatiron Landmark Plaza",
          "node_type": "bin",
          "lat": 40.7405,
          "lon": -73.9905
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "I13",
          "name": "Intersection 13 - Gramercy Park Link (Park Ave S & 20th St)",
          "node_type": "intersection",
          "lat": 40.738,
          "lon": -73.986
        },
        {
          "node_id": "B14",
          "name": "Smart Bin 14 - Gramercy Park East",
          "node_type": "bin",
          "lat": 40.737,
          "lon": -73.9835
        },
        {
          "node_id": "I13",
          "name": "Intersection 13 - Gramercy Park Link (Park Ave S & 20th St)",
          "node_type": "intersection",
          "lat": 40.738,
          "lon": -73.986
        },
        {
          "node_id": "I15",
          "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.734,
          "lon": -73.99
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "I23",
          "name": "Intersection 23 - Lower East Side Link (Delancey & Essex)",
          "node_type": "intersection",
          "lat": 40.7185,
          "lon": -73.988
        },
        {
          "node_id": "B21",
          "name": "Smart Bin 21 - Lower East Side Cultural Center",
          "node_type": "bin",
          "lat": 40.717,
          "lon": -73.985
        },
        {
          "node_id": "I23",
          "name": "Intersection 23 - Lower East Side Link (Delancey & Essex)",
          "node_type": "intersection",
          "lat": 40.7185,
          "lon": -73.988
        },
        {
          "node_id": "T1",
          "name": "Waste Processing & Disposal Facility",
          "node_type": "destination",
          "lat": 40.718,
          "lon": -73.975
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "I15",
          "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.734,
          "lon": -73.99
        },
        {
          "node_id": "I14",
          "name": "Intersection 14 - Union Square North (Broadway & 17th St)",
          "node_type": "intersection",
          "lat": 40.7365,
          "lon": -73.9905
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "I12",
          "name": "Intersection 12 - Chelsea West (8th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.745,
          "lon": -73.998
        },
        {
          "node_id": "I8",
          "name": "Intersection 8 - Hudson Yards Boulevard (11th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.755,
          "lon": -74.0015
        },
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        }
      ]
    },
    {
      "truck_id": "TRUCK-3",
      "collected_weight_kg": 2330,
      "capacity_utilization_pct": 93.2,
      "route_distance_km": 22.46,
      "stop_sequence": [
        "D0",
        "B1",
        "B2",
        "B3",
        "B5",
        "B4",
        "B6",
        "T1",
        "D0"
      ],
      "full_path_coordinates": [
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        },
        {
          "node_id": "I1",
          "name": "Intersection 1 - Times Square (Broadway & 42nd St)",
          "node_type": "intersection",
          "lat": 40.756,
          "lon": -73.9865
        },
        {
          "node_id": "B1",
          "name": "Smart Bin 1 - Times Square Theater District",
          "node_type": "bin",
          "lat": 40.758,
          "lon": -73.9855
        },
        {
          "node_id": "I1",
          "name": "Intersection 1 - Times Square (Broadway & 42nd St)",
          "node_type": "intersection",
          "lat": 40.756,
          "lon": -73.9865
        },
        {
          "node_id": "I2",
          "name": "Intersection 2 - Columbus Circle (Broadway & 59th St)",
          "node_type": "intersection",
          "lat": 40.7681,
          "lon": -73.9819
        },
        {
          "node_id": "B2",
          "name": "Smart Bin 2 - Central Park South Promenade",
          "node_type": "bin",
          "lat": 40.7655,
          "lon": -73.978
        },
        {
          "node_id": "I2",
          "name": "Intersection 2 - Columbus Circle (Broadway & 59th St)",
          "node_type": "intersection",
          "lat": 40.7681,
          "lon": -73.9819
        },
        {
          "node_id": "I3",
          "name": "Intersection 3 - Rockefeller Plaza (5th Ave & 50th St)",
          "node_type": "intersection",
          "lat": 40.7587,
          "lon": -73.9787
        },
        {
          "node_id": "B3",
          "name": "Smart Bin 3 - Rockefeller Center Concourse",
          "node_type": "bin",
          "lat": 40.7595,
          "lon": -73.9775
        },
        {
          "node_id": "I3",
          "name": "Intersection 3 - Rockefeller Plaza (5th Ave & 50th St)",
          "node_type": "intersection",
          "lat": 40.7587,
          "lon": -73.9787
        },
        {
          "node_id": "I4",
          "name": "Intersection 4 - Grand Central Terminal (42nd St & Park Ave)",
          "node_type": "intersection",
          "lat": 40.7527,
          "lon": -73.9772
        },
        {
          "node_id": "B5",
          "name": "Smart Bin 5 - Grand Central Station Entrance",
          "node_type": "bin",
          "lat": 40.752,
          "lon": -73.9785
        },
        {
          "node_id": "I4",
          "name": "Intersection 4 - Grand Central Terminal (42nd St & Park Ave)",
          "node_type": "intersection",
          "lat": 40.7527,
          "lon": -73.9772
        },
        {
          "node_id": "B4",
          "name": "Smart Bin 4 - Midtown East Corporate Center",
          "node_type": "bin",
          "lat": 40.7545,
          "lon": -73.9735
        },
        {
          "node_id": "I4",
          "name": "Intersection 4 - Grand Central Terminal (42nd St & Park Ave)",
          "node_type": "intersection",
          "lat": 40.7527,
          "lon": -73.9772
        },
        {
          "node_id": "I5",
          "name": "Intersection 5 - Bryant Park North (6th Ave & 42nd St)",
          "node_type": "intersection",
          "lat": 40.7538,
          "lon": -73.9839
        },
        {
          "node_id": "B6",
          "name": "Smart Bin 6 - Bryant Park Library Terrace",
          "node_type": "bin",
          "lat": 40.7532,
          "lon": -73.9825
        },
        {
          "node_id": "I5",
          "name": "Intersection 5 - Bryant Park North (6th Ave & 42nd St)",
          "node_type": "intersection",
          "lat": 40.7538,
          "lon": -73.9839
        },
        {
          "node_id": "I9",
          "name": "Intersection 9 - Empire State North (5th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.7484,
          "lon": -73.9857
        },
        {
          "node_id": "I10",
          "name": "Intersection 10 - Madison Square North (Broadway & 26th St)",
          "node_type": "intersection",
          "lat": 40.7435,
          "lon": -73.989
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "I14",
          "name": "Intersection 14 - Union Square North (Broadway & 17th St)",
          "node_type": "intersection",
          "lat": 40.7365,
          "lon": -73.9905
        },
        {
          "node_id": "I15",
          "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.734,
          "lon": -73.99
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "T1",
          "name": "Waste Processing & Disposal Facility",
          "node_type": "destination",
          "lat": 40.718,
          "lon": -73.975
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "I15",
          "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.734,
          "lon": -73.99
        },
        {
          "node_id": "I14",
          "name": "Intersection 14 - Union Square North (Broadway & 17th St)",
          "node_type": "intersection",
          "lat": 40.7365,
          "lon": -73.9905
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "I12",
          "name": "Intersection 12 - Chelsea West (8th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.745,
          "lon": -73.998
        },
        {
          "node_id": "I8",
          "name": "Intersection 8 - Hudson Yards Boulevard (11th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.755,
          "lon": -74.0015
        },
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        }
      ]
    },
    {
      "truck_id": "TRUCK-4",
      "collected_weight_kg": 2500,
      "capacity_utilization_pct": 100.0,
      "route_distance_km": 21.37,
      "stop_sequence": [
        "D0",
        "B15",
        "B20",
        "B23",
        "B24",
        "B25",
        "B22",
        "T1",
        "D0"
      ],
      "full_path_coordinates": [
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        },
        {
          "node_id": "I8",
          "name": "Intersection 8 - Hudson Yards Boulevard (11th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.755,
          "lon": -74.0015
        },
        {
          "node_id": "I12",
          "name": "Intersection 12 - Chelsea West (8th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.745,
          "lon": -73.998
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "I14",
          "name": "Intersection 14 - Union Square North (Broadway & 17th St)",
          "node_type": "intersection",
          "lat": 40.7365,
          "lon": -73.9905
        },
        {
          "node_id": "B15",
          "name": "Smart Bin 15 - Union Square Greenmarket",
          "node_type": "bin",
          "lat": 40.7355,
          "lon": -73.991
        },
        {
          "node_id": "I15",
          "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.734,
          "lon": -73.99
        },
        {
          "node_id": "I20",
          "name": "Intersection 20 - Astor Place Plaza (Lafayette & 8th St)",
          "node_type": "intersection",
          "lat": 40.7295,
          "lon": -73.9915
        },
        {
          "node_id": "I21",
          "name": "Intersection 21 - SoHo North (Broadway & Houston St)",
          "node_type": "intersection",
          "lat": 40.725,
          "lon": -73.996
        },
        {
          "node_id": "B20",
          "name": "Smart Bin 20 - SoHo Broadway Fashion District",
          "node_type": "bin",
          "lat": 40.7235,
          "lon": -73.998
        },
        {
          "node_id": "I22",
          "name": "Intersection 22 - SoHo Central (Spring St & West Broadway)",
          "node_type": "intersection",
          "lat": 40.722,
          "lon": -74.001
        },
        {
          "node_id": "I25",
          "name": "Intersection 25 - Tribeca North (Hudson St & Canal St)",
          "node_type": "intersection",
          "lat": 40.721,
          "lon": -74.008
        },
        {
          "node_id": "B23",
          "name": "Smart Bin 23 - Tribeca Historic Promenade",
          "node_type": "bin",
          "lat": 40.719,
          "lon": -74.007
        },
        {
          "node_id": "I26",
          "name": "Intersection 26 - Tribeca Central (Franklin St & Church St)",
          "node_type": "intersection",
          "lat": 40.7175,
          "lon": -74.005
        },
        {
          "node_id": "I28",
          "name": "Intersection 28 - World Trade Center (Fulton & Greenwich)",
          "node_type": "intersection",
          "lat": 40.7115,
          "lon": -74.011
        },
        {
          "node_id": "B24",
          "name": "Smart Bin 24 - One World Trade Center Plaza",
          "node_type": "bin",
          "lat": 40.713,
          "lon": -74.013
        },
        {
          "node_id": "I28",
          "name": "Intersection 28 - World Trade Center (Fulton & Greenwich)",
          "node_type": "intersection",
          "lat": 40.7115,
          "lon": -74.011
        },
        {
          "node_id": "I29",
          "name": "Intersection 29 - Wall Street Crossing (Broadway & Wall St)",
          "node_type": "intersection",
          "lat": 40.7075,
          "lon": -74.0115
        },
        {
          "node_id": "B25",
          "name": "Smart Bin 25 - Wall Street New York Stock Exchange",
          "node_type": "bin",
          "lat": 40.7068,
          "lon": -74.009
        },
        {
          "node_id": "I29",
          "name": "Intersection 29 - Wall Street Crossing (Broadway & Wall St)",
          "node_type": "intersection",
          "lat": 40.7075,
          "lon": -74.0115
        },
        {
          "node_id": "I27",
          "name": "Intersection 27 - Civic Center (Chambers St & Centre St)",
          "node_type": "intersection",
          "lat": 40.713,
          "lon": -74.0035
        },
        {
          "node_id": "B22",
          "name": "Smart Bin 22 - Chinatown Columbus Park",
          "node_type": "bin",
          "lat": 40.7145,
          "lon": -73.9995
        },
        {
          "node_id": "I24",
          "name": "Intersection 24 - Chinatown Core (Canal St & Mott St)",
          "node_type": "intersection",
          "lat": 40.717,
          "lon": -73.9975
        },
        {
          "node_id": "T1",
          "name": "Waste Processing & Disposal Facility",
          "node_type": "destination",
          "lat": 40.718,
          "lon": -73.975
        },
        {
          "node_id": "I19",
          "name": "Intersection 19 - East Village Central (2nd Ave & 10th St)",
          "node_type": "intersection",
          "lat": 40.729,
          "lon": -73.9865
        },
        {
          "node_id": "I15",
          "name": "Intersection 15 - Union Square South (4th Ave & 14th St)",
          "node_type": "intersection",
          "lat": 40.734,
          "lon": -73.99
        },
        {
          "node_id": "I14",
          "name": "Intersection 14 - Union Square North (Broadway & 17th St)",
          "node_type": "intersection",
          "lat": 40.7365,
          "lon": -73.9905
        },
        {
          "node_id": "I11",
          "name": "Intersection 11 - Flatiron Plaza (5th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.741,
          "lon": -73.9896
        },
        {
          "node_id": "I12",
          "name": "Intersection 12 - Chelsea West (8th Ave & 23rd St)",
          "node_type": "intersection",
          "lat": 40.745,
          "lon": -73.998
        },
        {
          "node_id": "I8",
          "name": "Intersection 8 - Hudson Yards Boulevard (11th Ave & 34th St)",
          "node_type": "intersection",
          "lat": 40.755,
          "lon": -74.0015
        },
        {
          "node_id": "D0",
          "name": "Central Municipal Depot",
          "node_type": "start",
          "lat": 40.758,
          "lon": -73.9995
        }
      ]
    }
  ]
};
