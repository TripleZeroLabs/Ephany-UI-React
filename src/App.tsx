import "./App.css";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {AssetsPage} from "./pages/AssetsPage.tsx";
import {ManufacturersPage} from "./pages/ManufacturersPage.tsx";
import {ProjectsPage} from "./pages/ProjectsPage.tsx";
import {SnapshotDetailView} from "./pages/SnapshotDetailPage.tsx";
import {useBuildVersion} from "./hooks/useBuildVersion";
import {UpdateBanner} from "./components/UpdateBanner";
import {AuthProvider} from "./context/AuthContext";
import {ProtectedLayout} from "./components/ProtectedRoute";
import {LoginPage} from "./pages/LoginPage";

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

// List pages
import {VendorsPage} from "./pages/VendorsPage";
import {AssetFilesPage} from "./pages/AssetFilesPage";
import {AttributesPage} from "./pages/AttributesPage";
import {CategoriesPage} from "./pages/CategoriesPage";

function App() {
    const {current, updateAvailable} = useBuildVersion(60_000);

    return (
        <BrowserRouter>
            <AuthProvider>
                <UpdateBanner visible={updateAvailable} version={current?.version}/>

                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage/>}/>

                    {/* Protected layout — renders Header + Footer via Outlet */}
                    <Route element={<ProtectedLayout version={current?.version}/>}>
                        <Route path="/" element={<Navigate to="/assets" replace/>}/>

                        {/* Library */}
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

                        {/* Projects */}
                        <Route path="/projects" element={<ProjectsPage/>}/>
                        <Route path="/projects/new" element={<ProjectFormPage/>}/>
                        <Route path="/projects/:id/edit" element={<ProjectFormPage/>}/>

                        <Route path="/snapshots/new" element={<SnapshotFormPage/>}/>
                        <Route path="/snapshots/:id/edit" element={<SnapshotFormPage/>}/>
                        <Route path="/snapshots/:id" element={<SnapshotDetailView/>}/>
                        <Route path="/snapshots/:id/:tab" element={<SnapshotDetailView/>}/>

                        <Route path="/instances/:id/edit" element={<AssetInstanceFormPage/>}/>

                        {/* 404 */}
                        <Route path="*" element={<Navigate to="/assets" replace/>}/>
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
