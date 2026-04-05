import { HashRouter, Routes, Route } from "react-router-dom";
import { FeatureListPage } from "./pages/FeatureListPage";
import { FeatureReviewPage } from "./pages/FeatureReviewPage";
import { AgentManagementPage } from "./pages/AgentManagementPage";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<FeatureListPage />} />
        <Route path="/feature/:id" element={<FeatureReviewPage />} />
        <Route path="/agents" element={<AgentManagementPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
