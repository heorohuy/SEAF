import { useRef, useState, useEffect, useCallback, } from 'react';
import { Crosshair, Shield, Globe, ZoomIn, ZoomOut } from 'lucide-react';
import GalaxyMap from './components/Map';

import NavigationMenu from './components/NavigationMenu';

import fetchGalacticMap from './api/galacticWar';
import { planets as fallbackPlanets, connections as fallbackConnections, sectors as fallbackSectors } from './data/galaxy';
import './App.css';

//googlesheets section
import { getSheetData as getFobSheetData } from './api/sicarisFOB';
import { getSheetData as getRegimentSheetData } from './api/sicarisRegiments';
import { getSheetData as getSOSSheetData } from './api/sicarisSOS';
//googlesheets section ends

import airIcon from './assets/1986-JJ-SEAFICONS-AIR.png';
import armoredIcon from './assets/1986-JJ-SEAFICONS-ARMORED.png';
import infantryIcon from './assets/1986-JJ-SEAFICONS-INFANTRY.png';
import cavalryIcon from './assets/1986-JJ-SEAFICONS-MECHANIZED.png';
import sapperIcon from './assets/1986-JJ-SEAFICONS-SAPPER.png';

// import AdBanner from './components/AdBanner';
import SiteFooter from "./components/SiteFooter";


const parseCellValue = (cell) => {
  if (cell == null) return undefined;
  if (typeof cell === 'number') return cell;
  if (typeof cell === 'string') {
    const trimmed = cell.trim();
    if (trimmed === '') return undefined;
    const number = Number(trimmed);
    return Number.isFinite(number) ? number : trimmed;
  }
  return cell;
};

const parseListCell = (cell) => {
  if (cell == null) return [];
  if (Array.isArray(cell)) return cell.filter(Boolean);
  if (typeof cell === 'string') {
    return cell
      .split(/,|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [cell];
};

const normalizeKey = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[-_–—]+/g, ' ')
    .replace(/\s+/g, ' ');

const getRegimentIcon = (specialty) => {
  const normalized = String(specialty || '').toLowerCase();
  if (normalized.includes('air')) return airIcon;
  if (normalized.includes('armor') || normalized.includes('armored')) return armoredIcon;
  if (normalized.includes('infantry')) return infantryIcon;
  if (normalized.includes('cavalry') || normalized.includes('mechanized')) return cavalryIcon;
  if (normalized.includes('sapper')) return sapperIcon;
  return infantryIcon;
};

function buildFobMap(sheetRows) {
  if (!sheetRows || sheetRows.length === 0) return {};

  const firstRow = sheetRows[0];
  const hasHeaders =
    firstRow.some((cell) => typeof cell === 'string' && /(fob|forward|operating|base|planet|world|system)/i.test(cell)) &&
    firstRow.some((cell) => typeof cell === 'string' && /(planet|world|system)/i.test(cell));

  const dataRows = hasHeaders ? sheetRows.slice(1) : sheetRows;
  const planetIndex = hasHeaders
    ? firstRow.findIndex((cell) => typeof cell === 'string' && /(planet|world|system|location)/i.test(cell))
    : 2;
  const fobIndex = hasHeaders
    ? firstRow.findIndex((cell) => typeof cell === 'string' && /(fob|forward|operating|base|name)/i.test(cell) && !/(planet|world|system)/i.test(cell))
    : 0;

  const headers = hasHeaders ? firstRow.map((h) => (typeof h === 'string' ? h.toLowerCase() : '')) : [];
  const findHeader = (re) => headers.findIndex((h) => re.test(h));
  const warbondsIdx = findHeader(/warb|war bond|warbond|bonds|credits|funds/);
  const healthIdx = findHeader(/health|hp|integrity/);
  const suppliesIdx = findHeader(/surplus|supply|spare|extra/);

  return dataRows.reduce((acc, row) => {
    if (!Array.isArray(row)) return acc;
    const fobValue = row[fobIndex];
    const planetValue = row[planetIndex];

    if (typeof planetValue === 'string' && fobValue != null) {
      const key = normalizeKey(planetValue);
      acc[key] = acc[key] || [];

      const fobObj = { name: String(fobValue).trim(), raw: row };

      if (row[1] != null) {
        fobObj.warbonds = parseListCell(row[1]);
      } else if (warbondsIdx >= 0 && row[warbondsIdx] != null) {
        fobObj.warbonds = parseListCell(row[warbondsIdx]);
      }

      const healthCandidate = parseCellValue(row[3]);
      if (healthCandidate !== undefined) fobObj.health = healthCandidate;
      else if (healthIdx >= 0) {
        const h = parseCellValue(row[healthIdx]);
        if (h !== undefined) fobObj.health = h;
      }

      const suppliesCandidate = parseCellValue(row[4]);
      if (suppliesCandidate !== undefined) fobObj.supplies = suppliesCandidate;
      else if (suppliesIdx >= 0) {
        const s = parseCellValue(row[suppliesIdx]);
        if (s !== undefined) fobObj.supplies = s;
      }

      acc[key].push(fobObj);
      return acc;
    }

    if (row.length >= 3 && typeof row[2] === 'string' && row[0] != null) {
      const key = normalizeKey(row[2]);
      acc[key] = acc[key] || [];
      acc[key].push({ name: String(row[0]).trim(), raw: row });
    }

    return acc;
  }, {});
}

function buildRegimentMap(sheetRows) {
  if (!sheetRows || sheetRows.length === 0) {
    return {
      regimentMap: {},
      firstRegiment: null,
    };
  }

  let firstRegiment = null;

  const firstRow = sheetRows[0];

  const hasHeaders =
    firstRow.some(
      (cell) =>
        typeof cell === 'string' &&
        /(regiment|unit|deployed|deployment|planet|world|location)/i.test(cell)
    ) &&
    firstRow.some(
      (cell) =>
        typeof cell === 'string' &&
        /(regiment|unit|name)/i.test(cell)
    );

  const dataRows = hasHeaders ? sheetRows.slice(1) : sheetRows;

  const headers = hasHeaders
    ? firstRow.map((h) =>
      typeof h === 'string' ? h.toLowerCase() : ''
    )
    : [];

  const findHeader = (re) =>
    headers.findIndex((h) => re.test(h));

  const nameIdx = hasHeaders
    ? findHeader(/regiment|unit|name/)
    : 0;

  const specialtyIdx = hasHeaders
    ? findHeader(/specialty|unit specialty|unit type|role/)
    : 1;

  const fdpIdx = hasHeaders
    ? findHeader(/fdp|fully deployable personal|fully deployable/)
    : 2;

  const warbondsIdx = hasHeaders
    ? findHeader(/warb|war bond|warbond|bonds/)
    : 3;

  const surplusIdx = hasHeaders
    ? findHeader(/surplus|extra|spare/)
    : 4;

  const deployedIdx = hasHeaders
    ? findHeader(/deployed|deployment|planet|world|location|system/)
    : 5;

  const regimentMap = dataRows.reduce((acc, row) => {
    if (!Array.isArray(row)) return acc;

    const planetValue = row[deployedIdx];
    const nameValue = row[nameIdx];

    if (!nameValue || typeof planetValue !== 'string') {
      return acc;
    }

    // First valid regiment in sheet order
    if (!firstRegiment) {
      firstRegiment = {
        name: String(nameValue).trim(),
        deployedPlanet: String(planetValue).trim(),
      };
    }

    const key = normalizeKey(planetValue);

    acc[key] = acc[key] || [];

    const specialtyValue = row[specialtyIdx];
    const fdpValue = parseCellValue(row[3]);//fdpIdx
    const warbondsValue = parseListCell(row[warbondsIdx]);
    const surplusValue = parseCellValue(row[11]);//surplusIdx

    acc[key].push({
      name: String(nameValue).trim(),
      specialty: specialtyValue
        ? String(specialtyValue).trim()
        : 'Infantry Unit',
      fdp: fdpValue,
      warbonds: warbondsValue,
      surplus: surplusValue,
      raw: row,
    });

    return acc;
  }, {});

  return {
    regimentMap,
    firstRegiment,
  };
}

export default function App() {
  const [logoExpanded, setLogoExpanded] = useState(false);

  const [planets, setPlanets] = useState(fallbackPlanets);
  const [connections, setConnections] = useState(fallbackConnections);
  const [sectors, setSectors] = useState(fallbackSectors);

  const [selectedPlanet, setSelectedPlanet] = useState(fallbackPlanets[0] ?? null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState(null);

  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //googlesheets section
  const [fobMap, setFobMap] = useState({});
  const [regimentMap, setRegimentMap] = useState({});
  const [sosLocations, setSosLocations] = useState(new Set());

  const [firstRegiment, setFirstRegiment] = useState(null);
  const initialSnapDone = useRef(false);
  //googlesheets section ends

  const [activeFob, setActiveFob] = useState(null);
  const [activeRegiment, setActiveRegiment] = useState(null);



  useEffect(() => {
    let mounted = true;

    fetchGalacticMap()
      .then((data) => {
        if (!mounted) return;

        if (data.planets && data.planets.length) {
          setPlanets(data.planets);
        }

        if (data.connections) {
          setConnections(data.connections);
        }

        if (data.sectors) {
          setSectors(data.sectors);
        }

        if (data.planets && data.planets.length) {
          setSelectedPlanet(data.planets[0]);
          setActiveFob(null);
        }

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

  useEffect(() => {
    if (initialSnapDone.current) return;
    if (!firstRegiment) return;
    if (!planets.length) return;
    if (!mapContainerRef.current) return;

    const targetKey = normalizeKey(firstRegiment.deployedPlanet);

    const targetPlanet = planets.find(
      (planet) =>
        normalizeKey(planet.name) === targetKey ||
        normalizeKey(planet.id) === targetKey
    );

    if (!targetPlanet) {
      console.warn(
        'Could not find planet for first regiment:',
        firstRegiment.name,
        firstRegiment.deployedPlanet
      );
      return;
    }

    console.log(
      'Initial map location:',
      firstRegiment.name,
      '→',
      targetPlanet.name
    );

    initialSnapDone.current = true;

    const initialZoom = 6;

    setSelectedPlanet(targetPlanet);
    setZoom(initialZoom);

    requestAnimationFrame(() => {
      centerOnPlanet(targetPlanet, initialZoom);
    });
  }, [firstRegiment, planets]);

  const refreshPersonnelData = async () => {
    try {
      const fobRows = await getFobSheetData();

      const normalizedFobRows = fobRows.map((row) =>
        row.map((cell) =>
          typeof cell === 'string' ? cell.trim() : cell
        )
      );

      setFobMap(buildFobMap(normalizedFobRows));

      const regimentRows = await getRegimentSheetData();

      const normalizedRegimentRows = regimentRows.map((row) =>
        row.map((cell) =>
          typeof cell === 'string' ? cell.trim() : cell
        )
      );

      const {
        regimentMap: newRegimentMap,
        firstRegiment: newFirstRegiment,
      } = buildRegimentMap(normalizedRegimentRows);

      setRegimentMap(newRegimentMap);
      setFirstRegiment(newFirstRegiment);

      // SOS CALLOUTS
      //
      // SOS sheet format:
      // Column B = Regiment
      // Column C = Location
      // Column D = Specialty
      //
      // We only need the locations because those determine
      // which planets should pulsate on the map.
      const sosRows = await getSOSSheetData();

      const sosLocationKeys = new Set(
        sosRows
          .filter((row) => Array.isArray(row))
          .map((row) => row[2])
          .filter((location) => {
            if (location == null) return false;

            const normalized = normalizeKey(location);

            // Ignore the sheet header.
            return normalized !== 'location';
          })
          .map((location) => normalizeKey(location))
          .filter(Boolean)
      );

      setSosLocations(sosLocationKeys);

      console.log(
        'SOS locations:',
        Array.from(sosLocationKeys)
      );
    } catch (err) {
      console.error('FOB/Regiment/SOS refresh failed:', err);
      setError(err.message || String(err));
    }
  };


  useEffect(() => {
    // Load immediately when the site opens
    refreshPersonnelData();

    // Then refresh every 15 minutes
    const interval = setInterval(() => {
      refreshPersonnelData();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;

      setSelectedPlanet(null);
      setActiveFob(null);
      setActiveRegiment(null);
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const handleMapKeyboard = (e) => {
      // Don't hijack arrow keys while typing in search/input controls.
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const directions = {
        ArrowUp: { x: 0, y: 1 },
        ArrowDown: { x: 0, y: -1 },
        ArrowLeft: { x: 1, y: 0 },
        ArrowRight: { x: -1, y: 0 },
      };

      const direction = directions[e.key];

      if (!direction) return;

      e.preventDefault();

      const baseSpeed = 40;
      const speed = e.shiftKey ? baseSpeed * 2 : baseSpeed;

      setOffset((current) => ({
        x: current.x + direction.x * speed,
        y: current.y + direction.y * speed,
      }));
    };

    window.addEventListener('keydown', handleMapKeyboard);

    return () => {
      window.removeEventListener('keydown', handleMapKeyboard);
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

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 6));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 0) zoomOut();
    else zoomIn();
  };

  const centerOnPlanet = (planet, targetZoom = zoom) => {
    const container = mapContainerRef.current;

    if (
      !container ||
      !planet ||
      typeof planet.x !== 'number' ||
      typeof planet.y !== 'number' ||
      !Number.isFinite(planet.x) ||
      !Number.isFinite(planet.y)
    ) {
      return;
    }

    const rect = container.getBoundingClientRect();

    // The SVG uses a 960 x 960 viewBox.
    // Map.jsx flips the Y coordinate with: 960 - y
    const svgSize = 960;
    const scale = Math.min(
      rect.width / svgSize,
      rect.height / svgSize
    );

    const flippedY = svgSize - planet.y;

    // Keep the selected planet at the center of the viewport
    const offsetX =
      -(planet.x - svgSize / 2) * scale * targetZoom;

    const offsetY =
      -(flippedY - svgSize / 2) * scale * targetZoom;

    setOffset({
      x: offsetX,
      y: offsetY,
    });
  };

  const handleCenterOnSuperEarth = () => {
    const superEarth = planets.find(
      (planet) =>
        planet.id === 'super-earth' ||
        normalizeKey(planet.name) === 'super earth'
    );

    if (!superEarth) return;

    setSelectedPlanet(superEarth);
    setActiveFob(null);
    setActiveRegiment(null);

    const targetZoom = 6;

    setZoom(targetZoom);

    requestAnimationFrame(() => {
      centerOnPlanet(superEarth, targetZoom);
    });
  };


  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      setSearchError('Enter a planet name');
      return;
    }

    const match = planets.find(
      (planet) =>
        planet.name?.toLowerCase().includes(query) ||
        planet.id?.toLowerCase().includes(query)
    );

    if (!match) {
      setSearchError('No matching planet found');
      return;
    }

    setSearchError(null);
    setSelectedPlanet(match);
    setActiveFob(null);
    setActiveRegiment(null);

    const searchZoom = 6;
    setZoom(searchZoom);

    requestAnimationFrame(() => {
      centerOnPlanet(match, searchZoom);
    });
  };

  const getFobsForPlanet = (planet) => {
    if (!planet) return null;
    const planetNameKey = normalizeKey(planet.name);
    const planetIdKey = normalizeKey(planet.id);
    return fobMap[planetNameKey] || fobMap[planetIdKey] || null;
  };

  const getRegimentsForPlanet = (planet) => {
    if (!planet) return null;
    const planetNameKey = normalizeKey(planet.name);
    const planetIdKey = normalizeKey(planet.id);
    const directMatch = regimentMap[planetNameKey] || regimentMap[planetIdKey];
    if (directMatch) return directMatch;

    // Fallback: try fuzzy matching by normalized prefix/suffix
    const fallbackKey = Object.keys(regimentMap).find((key) =>
      key === planetNameKey ||
      key === planetIdKey ||
      key.startsWith(planetNameKey) ||
      key.endsWith(planetNameKey) ||
      planetNameKey.startsWith(key) ||
      planetIdKey.startsWith(key)
    );
    return fallbackKey ? regimentMap[fallbackKey] : null;
  };

  const selectedPlanetFobs = getFobsForPlanet(selectedPlanet);
  const selectedPlanetRegiments = getRegimentsForPlanet(selectedPlanet);

  const associatedFobKeys = new Set(Object.keys(fobMap));

  const associatedPlanetIcons = Object.entries(regimentMap).reduce((acc, [key, regiments]) => {
    if (Array.isArray(regiments) && regiments.length > 0) {
      acc[key] = getRegimentIcon(regiments[0].specialty);
    }
    return acc;
  }, {});

  const handleSelectPlanet = (planet) => {
    setSelectedPlanet(planet);
    setActiveFob(null);
    setActiveRegiment(null);
  };

  const formatHealth = (v) => {
    if (v === undefined || v === null || v === '') return '—';
    const parse = (x) => {
      if (typeof x === 'number') return x;
      if (typeof x === 'string') {
        const t = x.trim();
        if (t === '') return NaN;
        const n = Number(t);
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    };
    const n = parse(v);
    if (Number.isFinite(n)) {
      const pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
      return `${pct}%`;
    }
    return String(v);
  };

  const formatValue = (v) => (v === undefined || v === null || v === '' ? '—' : String(v));

  const getFdpHealthClass = (fdp) => {
    const value = Number(fdp);

    if (!Number.isFinite(value)) {
      return 'health-unknown';
    }

    if (value < 200) {
      return 'health-critical';
    }

    if (value <= 490) {
      return 'health-warning';
    }

    return 'health-good';
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div
          className={`logo ${logoExpanded ? 'expanded' : ''}`}
          onClick={() => setLogoExpanded((prev) => !prev)}
        >
          <Shield size={24} />
          <span>S.E.A.F. - L.E.M.O.N</span>

          {logoExpanded && (
            <div className="logo-expanded">
              <div>SUPER EARTH ARMED FORCES</div>
              <div>LOGISTICS & EMERGENCY MOVEMENT OPERATIONS NETWORK</div>
            </div>
          )}
        </div>

        <div className="war-status">
          <span>WAR STATUS</span>
          <strong>ACTIVE</strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="galaxy">
        <div className="stars" />

        {/* <div className="ad-strip">
          <AdBanner />
        </div> */}

        <GalaxyMap
          containerRef={mapContainerRef}
          planets={planets}
          connections={connections}
          sectors={sectors}
          selectedPlanet={selectedPlanet}
          associatedFobKeys={associatedFobKeys}
          associatedPlanetIcons={associatedPlanetIcons}
          sosLocations={sosLocations}
          onSelect={handleSelectPlanet}
          transformStyle={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onWheel={handleWheel}
        />

        <div
          className="map-title"
          onClick={handleCenterOnSuperEarth}
          role="button"
          tabIndex={0}
          title="Center map on Super Earth"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCenterOnSuperEarth();
            }
          }}
        >
          <Crosshair size={18} />
          <span>GALACTIC MAP</span>
          {loading && (
            <span style={{ marginLeft: 8, color: '#8f9aa5', fontSize: 10 }}>
              LOADING…
            </span>
          )}
          {error && (
            <span style={{ marginLeft: 8, color: '#ff6b6b', fontSize: 10 }}>
              API ERROR
            </span>
          )}
        </div>


        <div className="search-widget">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search planet or id"
              aria-label="Search planet"
            />
            <button type="submit">Find</button>
          </form>
          {searchError && <div className="search-error">{searchError}</div>}
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
        {selectedPlanet && (
          <section className="planet-panel">
            <div className="panel-header">
              <Globe size={20} />
              <span>SELECTED PLANET</span>
            </div>

            <h1>{selectedPlanet?.name ?? '—'}</h1>

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

            {selectedPlanetFobs?.length > 0 && (
              <div className="associated-block">
                <div className="status-label">FORWARD OPERATING BASES</div>
                <div className="status-value">
                  {selectedPlanetFobs.map((fob, index) => (
                    <button
                      key={`${fob.name || fob}-${index}`}
                      className="fob-button"
                      onClick={() => {
                        if (activeFob === fob) {
                          setActiveFob(null);
                        } else {
                          setActiveFob(fob);
                          setActiveRegiment(null);
                        }
                      }}
                      type="button"
                    >
                      <div className="fob-button-top">{fob.name || fob}</div>
                    </button>
                  ))}
                </div>

                {activeFob && (
                  <div className="fob-details">
                    <div className="fob-details-header">
                      <strong>{activeFob.name}</strong>
                      <button className="close" onClick={() => setActiveFob(null)}>×</button>
                    </div>
                    <div className="fob-row">
                      <div className="status-label">Warbonds</div>
                      <div className="status-value">
                        {activeFob.warbonds && activeFob.warbonds.length > 0 ? (
                          activeFob.warbonds.map((wb, i) => (
                            <span key={`${wb}-${i}`} className="warbond-tag">{wb}</span>
                          ))
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                    <div className="fob-row"><span className="status-label">Health</span><span className="status-value">{formatHealth(activeFob.health)}</span></div>
                    <div className="fob-row"><span className="status-label">Supplies</span><span className="status-value">{(activeFob.supplies === undefined || activeFob.supplies === null || activeFob.supplies === '') ? '—' : String(activeFob.supplies)}</span></div>
                  </div>
                )}
              </div>
            )}

            {selectedPlanetRegiments?.length > 0 && (
              <div className="associated-block">
                <div className="status-label">DEPLOYED REGIMENTS</div>
                

                {activeRegiment && (
                  <div className="fob-details regiment-details">
                    <div className="fob-details-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={getRegimentIcon(activeRegiment.specialty)}
                          alt={activeRegiment.specialty || 'Regiment'}
                          width="18"
                          height="18"
                        />
                        <strong>{activeRegiment.name}</strong>
                      </div>
                      <button className="close" onClick={() => setActiveRegiment(null)}>×</button>
                    </div>

                    <div className="fob-row"><span className="status-label">Specialty</span><span className="status-value">{activeRegiment.specialty || '—'}</span></div>
                    <div className="fob-row"><span className="status-label">FDP</span><span className="status-value">{formatValue(activeRegiment.fdp)}</span></div>
                    <div className="fob-row"><span className="status-label">Surplus</span><span className="status-value">{formatValue(activeRegiment.surplus)}</span></div>
                    <div className="fob-row">
                      <div className="status-label">Warbonds</div>
                      <div className="status-value">
                        {activeRegiment.warbonds && activeRegiment.warbonds.length > 0 ? (
                          activeRegiment.warbonds.map((wb, i) => (
                            <span key={`${wb}-${i}`} className="warbond-tag">{wb}</span>
                          ))
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="regiment-grid">
                  {selectedPlanetRegiments.map((regiment, index) => {
                    const isActive = activeRegiment === regiment;
                    return (
                      <button
                        key={`${regiment.name || 'regiment'}-${index}`}
                        className={`regiment-button ${getFdpHealthClass(regiment.fdp)} ${isActive ? 'active' : ''}`}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setActiveRegiment(null);
                          } else {
                            setActiveRegiment(regiment);
                            setActiveFob(null);
                          }
                        }}
                        title={regiment.name}
                      >
                        <img
                          src={getRegimentIcon(regiment.specialty)}
                          alt={regiment.specialty || 'Regiment'}
                          width="22"
                          height="22"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedPlanet?.event && (
              <div className="event-block">
                <div className="status-label">LIVE EVENT</div>
                <div className="status-value">{selectedPlanet.event}</div>
              </div>
            )}

            {/* <div className="liberation">
              <div className="liberation-label">
                <span>LIBERATION</span>
                <strong>{Math.round(selectedPlanet?.liberation || 0)}%</strong>
              </div>

              <div className="progress">
                <div style={{ width: `${selectedPlanet?.liberation || 0}%` }} />
              </div>
            </div> */}

            {/* <div className="status-block">
            <div className="status-label">STATUS</div>
            <div className="status-value">{selectedPlanet?.status ?? 'Unknown'}</div>
          </div>

          <div className="campaign-block">
            <div className="status-label">CAMPAIGN</div>
            <div className="campaign-value">Operation: Ironfall</div>
          </div> */}
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );

}
