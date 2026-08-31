import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

import fetchGalacticMap from '../api/galacticWar';
import NavigationMenu from '../components/NavigationMenu';

import '../AppNavigation.css';
import './PlanetsPage.css';

import SiteFooter from "../components/SiteFooter";
import SiteHeader from '../components/SiteHeader';
import AuthButton from './components/AuthButton.jsx';



function formatValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function getBiomeLabel(planet) {
  const biome =
    planet.biome ??
    planet.biomeType ??
    planet.environment ??
    planet.environmentType;

  if (biome === undefined || biome === null || biome === '') {
    return '—';
  }

  if (typeof biome === 'object') {
    return (
      biome.name ??
      biome.type ??
      biome.id ??
      JSON.stringify(biome)
    );
  }

  return String(biome);
}

function getCoordinate(planet, axis) {
  const value = planet?.[axis];

  if (typeof value !== 'number') {
    return '—';
  }

  return value.toFixed(2);
}

function RawData({ planet }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawData = useMemo(() => {
    const data = planet?.raw ?? planet;

    return JSON.stringify(data, null, 2);
  }, [planet]);

  const copyRawData = async () => {
    try {
      await navigator.clipboard.writeText(rawData);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Clipboard may be unavailable in some browsers.
    }
  };

  return (
    <div className="planet-raw">
      <div className="planet-raw-actions">
        <button
          type="button"
          className="planet-raw-toggle"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}

          {open ? 'HIDE RAW DATA' : 'VIEW RAW DATA'}
        </button>

        {open && (
          <button
            type="button"
            className="planet-copy-button"
            onClick={copyRawData}
          >
            {copied ? (
              <Check size={14} />
            ) : (
              <Copy size={14} />
            )}

            {copied ? 'COPIED' : 'COPY'}
          </button>
        )}
      </div>

      {open && (
        <pre className="planet-raw-content">
          {rawData}
        </pre>
      )}
    </div>
  );
}

export default function PlanetsPage() {
  const [planets, setPlanets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('ALL');
  const [faction, setFaction] = useState('ALL');

  const loadPlanets = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const data = await fetchGalacticMap({
        forceRefresh: true,
      });

      setPlanets(
        Array.isArray(data?.planets)
          ? data.planets
          : [],
      );

      setDatabaseStatus(
        data.databaseStatus ?? {
          state: 'online',
          label: 'ONLINE',
        },
      );
    } catch (err) {
      setDatabaseStatus({
        state: 'error',
        label: 'OFFLINE',
      });

      setError(
        err?.message ||
        'Unable to retrieve planetary data.',
      );
    } finally {
      setRefreshing(false);
    }
  };


  useEffect(() => {
    let cancelled = false;

    const loadInitialPlanets = async () => {
      try {
        const data = await fetchGalacticMap();

        if (cancelled) {
          return;
        }

        setPlanets(
          Array.isArray(data?.planets)
            ? data.planets
            : [],
        );

        setDatabaseStatus(
          data.databaseStatus ?? {
            state: 'online',
            label: 'ONLINE',
          },
        );

        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setDatabaseStatus({
          state: 'error',
          label: 'OFFLINE',
        });

        setError(
          err?.message ||
          'Unable to retrieve planetary data.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };


    void loadInitialPlanets();

    return () => {
      cancelled = true;
    };
  }, []);

  const sectors = useMemo(() => {
    return [
      ...new Set(
        planets
          .map((planet) => planet.sector)
          .filter(Boolean),
      ),
    ].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  }, [planets]);

  const factions = useMemo(() => {
    return [
      ...new Set(
        planets
          .map((planet) => planet.faction)
          .filter(Boolean),
      ),
    ].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  }, [planets]);

  const filteredPlanets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...planets]
      .filter((planet) => {
        if (
          sector !== 'ALL' &&
          String(planet.sector) !== sector
        ) {
          return false;
        }

        if (
          faction !== 'ALL' &&
          String(planet.faction) !== faction
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const values = [
          planet.id,
          planet.index,
          planet.name,
          planet.sector,
          planet.faction,
          getBiomeLabel(planet),
        ];

        return values.some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(query),
        );
      })
      .sort((a, b) => {
        const aId = Number(a.index ?? a.id);
        const bId = Number(b.index ?? b.id);

        if (
          Number.isFinite(aId) &&
          Number.isFinite(bId)
        ) {
          return aId - bId;
        }

        return String(a.name).localeCompare(
          String(b.name),
        );
      });
  }, [
    planets,
    search,
    sector,
    faction,
  ]);

  return (
    <div className="planets-page">

      <SiteHeader
        databaseStatus={{
          state: loading
            ? 'loading'
            : error
              ? 'error'
              : 'online',
          label: loading
            ? 'SYNCING'
            : error
              ? 'OFFLINE'
              : 'ONLINE',
        }}
      >
        <AuthButton />
      </SiteHeader>

      <main className="planets-content">
        <section className="planets-heading">
          <div>
            <div className="planets-kicker">
              <Database size={14} />
              GALACTIC ARCHIVE // LIVE DATA
            </div>

            <h1>PLANET DATABASE</h1>

            <p>
              Planet identifiers, coordinates,
              sectors, factions and environmental
              data.
            </p>
          </div>

          <div className="planets-count">
            <strong>
              {filteredPlanets.length}
            </strong>

            <span>
              OF {planets.length} PLANETS
            </span>
          </div>
        </section>

        <section className="planets-controls">
          <div className="planet-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="SEARCH NAME, ID, SECTOR OR BIOME..."
              aria-label="Search planets"
            />
          </div>

          <select
            value={sector}
            onChange={(event) =>
              setSector(event.target.value)
            }
            aria-label="Filter by sector"
          >
            <option value="ALL">
              ALL SECTORS
            </option>

            {sectors.map((value) => (
              <option
                key={value}
                value={value}
              >
                {String(value).toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={faction}
            onChange={(event) =>
              setFaction(event.target.value)
            }
            aria-label="Filter by faction"
          >
            <option value="ALL">
              ALL FACTIONS
            </option>

            {factions.map((value) => (
              <option
                key={value}
                value={value}
              >
                {String(value).toUpperCase()}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="planet-refresh"
            onClick={() => loadPlanets()}
            disabled={refreshing}
            title="Refresh planet data"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'planet-refresh-spinning'
                  : ''
              }
            />

            <span>REFRESH</span>
          </button>
        </section>

        {loading && (
          <div className="planets-message">
            <RefreshCw
              size={17}
              className="planet-refresh-spinning"
            />

            <span>
              SYNCHRONIZING PLANETARY DATA...
            </span>
          </div>
        )}

        {error && (
          <div className="planets-message planets-message--error">
            <strong>API ERROR</strong>

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                loadPlanets()
              }
            >
              RETRY
            </button>
          </div>
        )}

        {!loading && !error && (
          <section className="planet-table-shell">
            <div className="planet-table-scroll">
              <table className="planet-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>PLANET</th>
                    <th>SECTOR</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>BIOME</th>
                    <th>FACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlanets.map(
                    (planet) => (
                      <tr
                        key={`${planet.index}-${planet.id}`}
                      >
                        <td className="planet-index">
                          {formatValue(
                            planet.index ??
                            planet.id,
                          )}
                        </td>

                        <td className="planet-name">
                          {formatValue(
                            planet.name,
                          )}
                        </td>

                        <td>
                          {formatValue(
                            planet.sector,
                          )}
                        </td>

                        <td className="planet-coordinate">
                          {getCoordinate(
                            planet,
                            'x',
                          )}
                        </td>

                        <td className="planet-coordinate">
                          {getCoordinate(
                            planet,
                            'y',
                          )}
                        </td>

                        <td className="planet-biome">
                          {getBiomeLabel(
                            planet,
                          )}
                        </td>

                        <td>
                          <span
                            className={`planet-faction planet-faction--${planet.faction ||
                              'neutral'
                              }`}
                          >
                            {formatValue(
                              planet.faction,
                            )}
                          </span>
                        </td>

                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {filteredPlanets.length === 0 && (
              <div className="planet-empty">
                NO PLANETS MATCH THE CURRENT FILTERS.
              </div>
            )}
          </section>
        )}

        {!loading &&
          !error &&
          filteredPlanets.map((planet) => (
            <div
              key={`raw-${planet.index}-${planet.id}`}
              className="planet-debug-row"
            >
              <div className="planet-debug-heading">
                <span>
                  {planet.index ?? planet.id}
                </span>

                <strong>
                  {planet.name}
                </strong>
              </div>

              <RawData planet={planet} />
            </div>
          ))}
      </main>
      <SiteFooter />
    </div>
  );
}