<div align="center">

# SmartCity IDSS

### Smart City Intelligent Decision Support System

A modern decision-support dashboard for a fictional smart city, built on classic algorithms and data structures.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-22B5BF?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Services-009688?style=for-the-badge&logo=fastapi&logoColor=white)

</div>

---

## Overview

SmartCity IDSS presents one complete city management system made of five integrated services, each backed by its own algorithmic engine.

| Service | Purpose | Port |
| --- | --- | --- |
| ![Route](https://img.shields.io/badge/City_Route_Planner-2563EB?style=flat-square) | Find optimal routes across the city | 8001 |
| ![Emergency](https://img.shields.io/badge/Emergency_Resource_Center-DC2626?style=flat-square) | Dispatch and allocate emergency resources | 8002 |
| ![Network](https://img.shields.io/badge/City_Network_Insights-7C3AED?style=flat-square) | Analyse the city's infrastructure network | 8003 |
| ![Facility](https://img.shields.io/badge/Smart_Facility_Advisor-0D9488?style=flat-square) | Recommend facility locations and decisions | 8004 |
| ![Waste](https://img.shields.io/badge/Waste_Collection_Planner-16A34A?style=flat-square) | Optimise waste collection runs | 8005 |

## Highlights

- ![blue](https://img.shields.io/badge/-Clean_UI-2563EB?style=flat-square) Light dashboard theme with white cards, rounded corners and subtle shadows
- ![teal](https://img.shields.io/badge/-Responsive-0D9488?style=flat-square) Works across desktop, tablet and mobile screens
- ![purple](https://img.shields.io/badge/-Charts-7C3AED?style=flat-square) Interactive data visualisation with Recharts
- ![green](https://img.shields.io/badge/-Offline_Demo-16A34A?style=flat-square) Waste planner falls back to a demo dataset when its live service is offline

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

For the full system with all five backend services, follow the setup guide below.

---


## Setup From Scratch

Use a short Windows path. This avoids long-path problems with the Task 5 Python dependencies.

```powershell
cd C:\
mkdir PDSA
cd PDSA
git clone <FRONTEND_REPOSITORY_URL> frontend-intelligent-decision-support-system
git clone <BACKEND_REPOSITORY_URL> Backend-Intelligent-Decision-Support-System
```

Update both repositories from the `main` branch:

```powershell
cd C:\PDSA\frontend-intelligent-decision-support-system
git checkout main
git pull origin main

cd C:\PDSA\Backend-Intelligent-Decision-Support-System
git checkout main
git pull origin main
```

## Supabase Configuration

Create this file:

```text
C:\PDSA\Backend-Intelligent-Decision-Support-System\.env
```

Add the project values. Never commit this file or expose a service-role key in the frontend.

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

Run the database schema, seed data, and any RLS policies supplied in the project's `sql` folder using the Supabase SQL Editor.

## Backend Installation

Create a virtual environment and install dependencies in each service:

```powershell
cd C:\PDSA\Backend-Intelligent-Decision-Support-System

foreach ($service in @("task1-route-service", "task2-resource-service", "task3-network-service", "task4-decision-service", "task5-optimization-service")) {
    cd $service
    py -3.13 -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
    cd ..
}
```

## Frontend Installation

```powershell
cd C:\PDSA\frontend-intelligent-decision-support-system
npm install
```

## Run The Full System

From the frontend repository, run the included launcher:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-pdsa.ps1
```

The launcher starts all services together:

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Route service | http://127.0.0.1:8001 |
| Resource service | http://127.0.0.1:8002 |
| Network service | http://127.0.0.1:8003 |
| Facility service | http://127.0.0.1:8004 |
| Waste service | http://127.0.0.1:8005 |

Open `http://localhost:5173` after the launcher starts.

## Run Services Manually

If the launcher is not used, start each backend in a separate PowerShell window:

```powershell
cd C:\PDSA\Backend-Intelligent-Decision-Support-System\task1-route-service
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001

cd C:\PDSA\Backend-Intelligent-Decision-Support-System\task2-resource-service
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8002

cd C:\PDSA\Backend-Intelligent-Decision-Support-System\task3-network-service
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8003

cd C:\PDSA\Backend-Intelligent-Decision-Support-System\task4-decision-service
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8004

cd C:\PDSA\Backend-Intelligent-Decision-Support-System\task5-optimization-service
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8005
```

In another window:

```powershell
cd C:\PDSA\frontend-intelligent-decision-support-system
npm run dev
```

## Troubleshooting

- `ERR_CONNECTION_REFUSED`: start the corresponding backend and verify its port.
- Task 5 `networkx` installation errors: clone under `C:\PDSA` and recreate that service's `.venv`.
- Facility save errors: verify the selected location exists in `locations` and run the required Supabase RLS policies.
- The Waste Collection Planner can load its demo dataset when the live Task 5 service is offline.

