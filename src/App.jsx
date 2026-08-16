import { Routes, Route } from 'react-router-dom';

import MapApp from './MapApp.jsx';
import PlanetsPage from './pages/PlanetsPage.jsx';
import RegimentsPage from './pages/RegimentsPage.jsx';
import ShipsPage from './pages/ShipsPage.jsx';
import GuidePage from "./pages/GuidePage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";


export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<MapApp />}
      />

      <Route
        path="/planets"
        element={<PlanetsPage />}
      />

      <Route
        path="/regiments"
        element={<RegimentsPage />}
      />

      <Route
        path="/ships"
        element={<ShipsPage />}
      />

      <Route
        path="*"
        element={<MapApp />}
      />

      <Route
        path="/guide"
        element={<GuidePage />}
      />

      <Route
        path="/privacy"
        element={<PrivacyPage />}
      />

      <Route
        path="/about"
        element={<AboutPage />}
      />

      <Route
        path="/terms"
        element={<TermsPage />}
      />


    </Routes>
  );
}
