import { Navigate, Route, Routes } from "react-router-dom";

import { SiteFooter, SiteNav } from "./components/site-nav";
import HomePage from "./routes/index";
import EmergencyResourcesPage from "./routes/emergency-resources";
import FacilityAdvisorPage from "./routes/facility-advisor";
import RoutePlannerPage from "./routes/route-planner";
import NetworkInsightsPage from "./routes/network-insights";
import WastePlannerPage from "./routes/waste-planner";
import AdminPage from "./routes/admin";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/route-planner" element={<RoutePlannerPage />} />
          <Route path="/emergency-resources" element={<EmergencyResourcesPage />} />
          <Route path="/network-insights" element={<NetworkInsightsPage />} />
          <Route path="/facility-advisor" element={<FacilityAdvisorPage />} />
          <Route path="/waste-planner" element={<WastePlannerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;
