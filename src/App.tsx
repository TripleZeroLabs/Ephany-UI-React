import "./App.css";
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {Header} from "./components/Header";
import {Footer} from "./components/Footer";
import {AssetsPage} from "./AssetsPage";
import {ManufacturersPage} from "./ManufacturersPage";
import {ProjectsPage} from "./ProjectsPage";
import {useBuildVersion} from "./hooks/useBuildVersion";
import {UpdateBanner} from "./components/UpdateBanner";

function App() {
    // Poll every 60s for a new deploy
    const {current, updateAvailable} = useBuildVersion(60_000);

    return (
        <BrowserRouter>
            <UpdateBanner visible={updateAvailable} version={current?.version}/>

            <Header/>

            <main>
                <Routes>
                    <Route path="/" element={<Navigate to="/assets" replace/>}/>
                    <Route path="/assets" element={<AssetsPage/>}/>
                    <Route path="/manufacturers" element={<ManufacturersPage/>}/>
                    <Route path="/projects" element={<ProjectsPage/>}/>
                </Routes>
            </main>

            <Footer version={current?.version}/>
        </BrowserRouter>
    );
}

export default App;
