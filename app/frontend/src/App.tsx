import { HashRouter, Routes, Route } from "react-router-dom";
import logo from "./assets/lucidforge-logo.png";

function FeatureListPage() {
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <img
        src={logo}
        alt=""
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          opacity: 0.06,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <div style={{ position: "relative", padding: "var(--space-xl)" }}>
        <p style={{ color: "var(--text-secondary)" }}>No features yet.</p>
      </div>
    </div>
  );
}

function FeatureReviewPage() {
  return <div style={{ padding: "var(--space-xl)" }}>Feature Review</div>;
}

function AgentManagementPage() {
  return <div style={{ padding: "var(--space-xl)" }}>Agent Management</div>;
}

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
