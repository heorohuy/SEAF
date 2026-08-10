import React, { useRef, useState, useEffect } from 'react';
import { Crosshair, Shield, Globe, Menu, ZoomIn, ZoomOut } from 'lucide-react';
import Map from './components/Map';

import fetchGalacticMap from './api/galacticWar';
import { planets as fallbackPlanets, connections as fallbackConnections, sectors as fallbackSectors } from './data/galaxy';
import './App.css';

export default function App() {
  const [planets, setPlanets] = useState(fallbackPlanets);
  const [connections, setConnections] = useState(fallbackConnections);
  const [sectors, setSectors] = useState(fallbackSectors);

  const [selectedPlanet, setSelectedPlanet] = useState(fallbackPlanets[0]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [warInfo, setWarInfo] = useState(null);

  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchGalacticMap()
      .then((data) => {
        if (!mounted) return;
        if (data.planets && data.planets.length) setPlanets(data.planets);
        if (data.connections) setConnections(data.connections);
        if (data.sectors) setSectors(data.sectors);
        if (data.warInfo) setWarInfo(data.warInfo);
        if (data.planets && data.planets.length) setSelectedPlanet(data.planets[0]);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || String(err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleMouseDown = (e) => {
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setOffset((c) => ({ x: c.x + dx, y: c.y + dy }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const stopDragging = () => (dragging.current = false);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 0) zoomOut();
    else zoomIn();
  };

  const formatDate = (seconds) =>
    seconds
      ? new Date(seconds * 1000).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : '—';

  return (
    <div className="app">
      <header className="top-bar">
        <div className="logo">
          <Shield size={24} />
          <span>GALACTIC WAR</span>
        </div>

        <div className="war-status">
          <span>WAR STATUS</span>
          <strong>ACTIVE</strong>
        </div>

        <button className="menu-button">
          <Menu size={24} />
        </button>
      </header>

      <main className="galaxy">
        <div className="stars" />

        <Map
          planets={planets}
          connections={connections}
          sectors={sectors}
          selectedPlanet={selectedPlanet}
          onSelect={setSelectedPlanet}
          transformStyle={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onWheel={handleWheel}
        />

        <div className="map-title">
          <Crosshair size={18} />
          <span>GALACTIC MAP</span>
          {loading && <span style={{ marginLeft: 8, color: '#8f9aa5', fontSize: 10 }}>LOADING…</span>}
          {error && <span style={{ marginLeft: 8, color: '#ff6b6b', fontSize: 10 }}>API ERROR</span>}
        </div>

        <div className="zoom-controls">
          <button onClick={zoomIn} aria-label="Zoom in">
            <ZoomIn size={18} />
          </button>

          <span>{Math.round(zoom * 100)}%</span>

          <button onClick={zoomOut} aria-label="Zoom out">
            <ZoomOut size={18} />
          </button>
        </div>

        <div className="legend-panel">
          <span>LEGEND</span>
          <div className="legend-row">
            <span className="legend-dot super-earth" /> Super Earth
          </div>
          <div className="legend-row">
            <span className="legend-dot automatons" /> Automatons
          </div>
          <div className="legend-row">
            <span className="legend-dot terminids" /> Terminids
          </div>
          <div className="legend-row">
            <span className="legend-dot illuminate" /> Illuminate
          </div>
        </div>

        <section className="planet-panel">
          <div className="panel-header">
            <Globe size={20} />
            <span>SELECTED PLANET</span>
          </div>

          <h1>{selectedPlanet?.name ?? '—'}</h1>

          <div className="war-summary">
            <div className="status-label">WAR SEASON</div>
            <div className="status-value">#{warInfo?.warId ?? '—'}</div>
            <div className="planet-meta">
              {formatDate(warInfo?.startDate)} — {formatDate(warInfo?.endDate)}
            </div>
          </div>

          <div className="faction">
            <span className={`faction-dot ${selectedPlanet?.faction ?? ''}`} />

            <div>
              <div className="faction-name">
                {selectedPlanet?.faction === 'super-earth'
                  ? 'SUPER EARTH'
                  : selectedPlanet?.faction === 'automatons'
                  ? 'AUTOMATON'
                  : selectedPlanet?.faction === 'terminids'
                  ? 'TERMINID'
                  : selectedPlanet?.faction === 'illuminate'
                  ? 'ILLUMINATE'
                  : 'NEUTRAL'}
              </div>
              <div className="planet-meta">Sector: {selectedPlanet?.sector ?? '—'}</div>
            </div>
          </div>

          {selectedPlanet?.event && (
            <div className="event-block">
              <div className="status-label">LIVE EVENT</div>
              <div className="status-value">{selectedPlanet.event}</div>
            </div>
          )}

          <div className="liberation">
            <div className="liberation-label">
              <span>LIBERATION</span>
              <strong>{Math.round(selectedPlanet?.liberation || 0)}%</strong>
            </div>

            <div className="progress">
              <div style={{ width: `${selectedPlanet?.liberation || 0}%` }} />
            </div>
          </div>

          <div className="status-block">
            <div className="status-label">STATUS</div>
            <div className="status-value">{selectedPlanet?.status ?? 'Unknown'}</div>
          </div>

          <div className="campaign-block">
            <div className="status-label">CAMPAIGN</div>
            <div className="campaign-value">Operation: Ironfall</div>
          </div>
        </section>
      </main>
    </div>
  );
}
