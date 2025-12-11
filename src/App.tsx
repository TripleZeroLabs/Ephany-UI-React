import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { AssetsPage } from "./AssetsPage";

function ManufacturersPage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Manufacturers</h1>
      <p>Coming soon. This will list manufacturers from the Ephany API.</p>
    </div>
  );
}

function ProjectsPage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Projects</h1>
      <p>Coming soon. This will show project-level rollouts and asset usage.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/assets" replace />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/manufacturers" element={<ManufacturersPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
