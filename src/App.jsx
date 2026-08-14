import { Routes, Route } from 'react-router-dom';

import MapApp from './MapApp.jsx';
import PlanetsPage from './pages/PlanetsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapApp />} />

      <Route path="/planets" element={<PlanetsPage />} />

      <Route path="*" element={<MapApp />} />
    </Routes>
  );
}