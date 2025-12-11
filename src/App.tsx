import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { AssetsPage } from "./AssetsPage";
import { ManufacturersPage } from "./ManufacturersPage";
import { ProjectsPage } from "./ProjectsPage";

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
