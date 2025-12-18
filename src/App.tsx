import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AssetsPage } from "./pages/AssetsPage.tsx";
import { ManufacturersPage } from "./pages/ManufacturersPage.tsx";
import { ProjectsPage } from "./pages/ProjectsPage.tsx";
import { SnapshotDetailView } from "./pages/SnapshotDetailPage.tsx";
import { useBuildVersion } from "./hooks/useBuildVersion";
import { UpdateBanner } from "./components/UpdateBanner";

function App() {
    // Poll every 60s for a new deploy
    const { current, updateAvailable } = useBuildVersion(60_000);

    return (
        <BrowserRouter>
            <UpdateBanner visible={updateAvailable} version={current?.version} />

            <Header />

            <main className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.12))]">
                <Routes>
                    {/* Default redirect to assets */}
                    <Route path="/" element={<Navigate to="/assets" replace />} />

                    {/* Library Routes */}
                    <Route path="/assets" element={<AssetsPage />} />
                    <Route path="/manufacturers" element={<ManufacturersPage />} />

                    {/* Execution/Project Routes */}
                    <Route path="/projects" element={<ProjectsPage />} />

                    {/* Snapshot Detail View (The Instance Browser) */}
                    <Route path="/snapshots/:id" element={<SnapshotDetailView />} />

                    {/* 404 Catch-all - redirect to assets */}
                    <Route path="*" element={<Navigate to="/assets" replace />} />
                </Routes>
            </main>

            <Footer version={current?.version} />
        </BrowserRouter>
    );
}

export default App;