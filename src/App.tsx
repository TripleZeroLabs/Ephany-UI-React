import "./App.css";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {Header} from "./components/Header";
import {Footer} from "./components/Footer";
import {AssetsPage} from "./pages/AssetsPage.tsx";
import {ManufacturersPage} from "./pages/ManufacturersPage.tsx";
import {ProjectsPage} from "./pages/ProjectsPage.tsx";
import {SnapshotDetailView} from "./pages/SnapshotDetailPage.tsx";
import {useBuildVersion} from "./hooks/useBuildVersion";
import {UpdateBanner} from "./components/UpdateBanner";

// Form pages
import {AssetFormPage} from "./pages/AssetFormPage";
import {ManufacturerFormPage} from "./pages/ManufacturerFormPage";
import {CategoryFormPage} from "./pages/CategoryFormPage";
import {AttributeFormPage} from "./pages/AttributeFormPage";
import {AssetFileFormPage} from "./pages/AssetFileFormPage";
import {VendorFormPage} from "./pages/VendorFormPage";
import {ProjectFormPage} from "./pages/ProjectFormPage";
import {SnapshotFormPage} from "./pages/SnapshotFormPage";
import {AssetInstanceFormPage} from "./pages/AssetInstanceFormPage";

// New list pages
import {VendorsPage} from "./pages/VendorsPage";
import {AssetFilesPage} from "./pages/AssetFilesPage";
import {AttributesPage} from "./pages/AttributesPage";
import {CategoriesPage} from "./pages/CategoriesPage";

function App() {
    // Poll every 60s for a new deploy
    const {current, updateAvailable} = useBuildVersion(60_000);

    return (
        <BrowserRouter>
            <UpdateBanner visible={updateAvailable} version={current?.version}/>

            <Header/>

            <main className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.12))]">
                <Routes>
                    {/* Default redirect to assets */}
                    <Route path="/" element={<Navigate to="/assets" replace/>}/>

                    {/* Library Routes */}
                    <Route path="/assets" element={<AssetsPage/>}/>
                    <Route path="/assets/new" element={<AssetFormPage/>}/>
                    <Route path="/assets/:id/edit" element={<AssetFormPage/>}/>

                    <Route path="/manufacturers" element={<ManufacturersPage/>}/>
                    <Route path="/manufacturers/new" element={<ManufacturerFormPage/>}/>
                    <Route path="/manufacturers/:id/edit" element={<ManufacturerFormPage/>}/>

                    <Route path="/categories" element={<CategoriesPage/>}/>
                    <Route path="/categories/new" element={<CategoryFormPage/>}/>
                    <Route path="/categories/:id/edit" element={<CategoryFormPage/>}/>

                    <Route path="/attributes" element={<AttributesPage/>}/>
                    <Route path="/attributes/new" element={<AttributeFormPage/>}/>
                    <Route path="/attributes/:id/edit" element={<AttributeFormPage/>}/>

                    <Route path="/files" element={<AssetFilesPage/>}/>
                    <Route path="/files/new" element={<AssetFileFormPage/>}/>
                    <Route path="/files/:id/edit" element={<AssetFileFormPage/>}/>

                    <Route path="/vendors" element={<VendorsPage/>}/>
                    <Route path="/vendors/new" element={<VendorFormPage/>}/>
                    <Route path="/vendors/:id/edit" element={<VendorFormPage/>}/>

                    {/* Execution/Project Routes */}
                    <Route path="/projects" element={<ProjectsPage/>}/>
                    <Route path="/projects/new" element={<ProjectFormPage/>}/>
                    <Route path="/projects/:id/edit" element={<ProjectFormPage/>}/>

                    <Route path="/snapshots/new" element={<SnapshotFormPage/>}/>
                    <Route path="/snapshots/:id/edit" element={<SnapshotFormPage/>}/>

                    {/* Snapshot Detail View (The Instance Browser) */}
                    <Route path="/snapshots/:id" element={<SnapshotDetailView/>}/>
                    <Route path="/snapshots/:id/:tab" element={<SnapshotDetailView/>}/>

                    <Route path="/instances/:id/edit" element={<AssetInstanceFormPage/>}/>

                    {/* 404 Catch-all - redirect to assets */}
                    <Route path="*" element={<Navigate to="/assets" replace/>}/>
                </Routes>
            </main>

            <Footer version={current?.version}/>
        </BrowserRouter>
    );
}

export default App;
