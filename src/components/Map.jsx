// src/components/Map.jsx

import { useRef, useEffect, useMemo } from 'react';

import Planet from './Planet';
import Sector from './Sector';
import ShipMarker from './ShipMarker';
import TransitShip from './TransitShip';

import {
  buildPlanetLookup,
  normalizeKey,
  resolvePlanetLocation,
} from '../api/shipTracking';

const SVG_SIZE = 960;
const SVG_CENTER = SVG_SIZE / 2;


export default function GalaxyMap({
  containerRef,
  planets,
  connections,
  sectors,
  mapDimension = 'galaxy',
  selectedPlanet,
  selectedShip,
  ships,
  shipRoutes,
  associatedFobKeys,
  associatedPlanetIcons,
  sosLocations,
  onSelect,
  onSelectShip,
  transformStyle,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
} = {}) {
  const localRef = useRef(null);
  const ref = containerRef || localRef;

  /*
   * ------------------------------------------------------------
   * Mouse wheel handling
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const node = ref.current;

    if (!node || !onWheel) {
      return undefined;
    }

    const handler = (event) => {
      event.preventDefault();
      onWheel(event);
    };

    node.addEventListener('wheel', handler, {
      passive: false,
    });

    return () => {
      node.removeEventListener('wheel', handler);
    };
  }, [onWheel, ref]);

  /*
   * ------------------------------------------------------------
   * Coordinate helpers
   * ------------------------------------------------------------
   */

  const flipY = (y) => SVG_SIZE - y;

  /*
   * ------------------------------------------------------------
   * Prepare sectors
   *
   * The source galaxy data uses a normal Cartesian-style Y
   * coordinate while SVG renders Y downward.
   * ------------------------------------------------------------
   */

  const displayedSectors = useMemo(
  () =>
    (Array.isArray(sectors) ? sectors : []).map(
      (sector) => ({
        ...sector,

        points: Array.isArray(sector.points)
          ? sector.points.map(([x, y]) => [
              x,
              mapDimension === 'galaxy'
                ? flipY(y)
                : y,
            ])
          : undefined,

        centerY:
          sector.centerY != null
            ? mapDimension === 'galaxy'
              ? flipY(sector.centerY)
              : sector.centerY
            : sector.centerY,
      }),
    ),
  [sectors, mapDimension],
);

  /*
   * ------------------------------------------------------------
   * Only planets with valid map coordinates participate in
   * graphical rendering and ship location resolution.
   * ------------------------------------------------------------
   */

  const positionedPlanets = useMemo(() => {
    const allPlanets = Array.isArray(planets)
      ? planets
      : [];

    const invalid = allPlanets.filter(
      (planet) =>
        !Number.isFinite(planet?.x) ||
        !Number.isFinite(planet?.y),
    );

    if (invalid.length > 0) {
      console.warn(
        `Map discarded ${invalid.length} planets without valid coordinates`,
        invalid,
      );
    }

    return allPlanets.filter(
      (planet) =>
        Number.isFinite(planet?.x) &&
        Number.isFinite(planet?.y),
    );
  }, [planets]);

  /*
   * ------------------------------------------------------------
   * SVG-facing planet coordinates
   * ------------------------------------------------------------
   */

  const displayedPlanets = useMemo(
  () =>
    positionedPlanets.map((planet) => ({
      ...planet,
      y:
        mapDimension === 'galaxy'
          ? flipY(planet.y)
          : planet.y,
    })),
  [positionedPlanets, mapDimension],
);

  /*
   * ------------------------------------------------------------
   * Planet lookup
   *
   * IMPORTANT:
   *
   * Use the un-flipped planet coordinates here because
   * shipTracking resolves API locations against the actual
   * galaxy data.
   * ------------------------------------------------------------
   */

  const planetLookup = useMemo(
    () => buildPlanetLookup(positionedPlanets),
    [positionedPlanets],
  );

  /*
   * ------------------------------------------------------------
   * Galaxy boundary
   * ------------------------------------------------------------
   */

  const galaxyRadius = useMemo(() => {
    if (displayedPlanets.length === 0) {
      return 100;
    }

    const maximumDistance = Math.max(
      ...displayedPlanets.map((planet) =>
        Math.hypot(
          planet.x - SVG_CENTER,
          planet.y - SVG_CENTER,
        ),
      ),
    );

    return Math.min(
      470,
      maximumDistance + 20,
    );
  }, [displayedPlanets]);

  /*
   * ------------------------------------------------------------
   * Orbiting ships
   *
   * A ship in preparing_deploy is considered to be in transit
   * and therefore is NOT rendered in an orbital ring.
   *
   * All other ships are resolved to their current planet.
   * ------------------------------------------------------------
   */

  const orbitingShips = useMemo(() => {
    if (!Array.isArray(ships)) {
      return [];
    }

    return ships
      .filter(
        (ship) =>
          ship?.condition?.key !== 'preparing_deploy',
      )
      .map((ship) => {
        const planet = resolvePlanetLocation(
          ship?.condition?.location,
          planetLookup,
        );

        if (!planet) {
          return null;
        }

        /*
         * Do not mutate the API object.
         * __planet exists only for map rendering.
         */
        return {
          ...ship,
          __planet: planet,
        };
      })
      .filter(Boolean);
  }, [ships, planetLookup]);

  /*
   * ------------------------------------------------------------
   * Group orbiting ships by planet.
   *
   * This lets ShipMarker calculate separate orbital positions
   * around each planet.
   * ------------------------------------------------------------
   */

  const shipsByPlanet = useMemo(() => {
    const groups = new Map();

    for (const ship of orbitingShips) {
      const planetId = String(ship.__planet.id);

      if (!groups.has(planetId)) {
        groups.set(planetId, []);
      }

      groups.get(planetId).push(ship);
    }

    return groups;
  }, [orbitingShips]);

  /*
   * ------------------------------------------------------------
   * Transit routes
   * ------------------------------------------------------------
   */

  const routes = Array.isArray(shipRoutes)
    ? shipRoutes
    : [];

  /*
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */

  return (
    <div
      ref={ref}
      className="map"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg
        className="galaxy-svg"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        style={transformStyle}
      >
        <defs>
          <clipPath id="galaxy-mask">
            <circle
              cx={SVG_CENTER}
              cy={SVG_CENTER}
              r={galaxyRadius}
            />
          </clipPath>

          <filter
            id="ship-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="1.5"
              result="blur"
            />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* =====================================================
            MAP GEOMETRY
        ====================================================== */}

        <g clipPath="url(#galaxy-mask)">
          <circle
            cx={SVG_CENTER}
            cy={SVG_CENTER}
            r={galaxyRadius}
            fill="rgba(8, 12, 18, 0.95)"
          />

          {displayedSectors.map((sector) => (
            <Sector
              key={sector.id}
              sector={sector}
              planets={displayedPlanets}
              showBox={true}
              showLabel={false}
            />
          ))}

          {(Array.isArray(connections)
            ? connections
            : []
          ).map(([fromId, toId]) => {
            const from = displayedPlanets.find(
              (planet) =>
                String(planet.id) === String(fromId),
            );

            const to = displayedPlanets.find(
              (planet) =>
                String(planet.id) === String(toId),
            );

            if (!from || !to) {
              return null;
            }

            return (
              <line
                key={`${fromId}-${toId}`}
                className="connection"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
        </g>

        {/* =====================================================
            SECTOR LABELS
        ====================================================== */}

        <g>
          {displayedSectors.map((sector) => (
            <Sector
              key={`label-${sector.id}`}
              sector={sector}
              planets={displayedPlanets}
              galaxyRadius={galaxyRadius}
              showBox={false}
              showLabel={true}
            />
          ))}
        </g>

        {/* =====================================================
            TRANSIT SHIPS

            Transit ships render above the connection lines but
            below planets.

            The route object supplies:
              - origin
              - destination
              - start time
              - duration
              - shipId
        ====================================================== */}

        <g
          className="ship-transit-layer"
          filter="url(#ship-glow)"
        >
          {routes.map((route) => {
            const ship = Array.isArray(ships)
              ? ships.find(
                (candidate) =>
                  String(candidate.id) ===
                  String(route.shipId),
              )
              : null;

            if (!ship) {
              return null;
            }

            return (
              <TransitShip
                key={`transit-${ship.id}`}
                route={route}
                ship={ship}
                onSelect={onSelectShip}
              />
            );
          })}
        </g>

        {/* =====================================================
            PLANETS
        ====================================================== */}

        <g>
          {displayedPlanets.map((planet) => {
            const planetNameKey = normalizeKey(
              planet.name,
            );

            const planetIdKey = normalizeKey(
              planet.id,
            );

            const associatedRegimentIcon =
              associatedPlanetIcons?.[
              planetNameKey
              ] ||
              associatedPlanetIcons?.[
              planetIdKey
              ];

            const hasSOS =
              sosLocations?.has(
                planetNameKey,
              ) ||
              sosLocations?.has(
                planetIdKey,
              );

            const hasAssociatedMatch =
              associatedFobKeys?.has(
                planetNameKey,
              ) ||
              associatedFobKeys?.has(
                planetIdKey,
              );

            return (
              <Planet
                key={planet.id}
                planet={planet}
                selected={
                  selectedPlanet?.id ===
                  planet.id
                }
                hasAssociatedMatch={
                  hasAssociatedMatch
                }
                associatedRegimentIcon={
                  associatedRegimentIcon
                }
                hasSOS={hasSOS}
                onSelect={onSelect}
              />
            );
          })}
        </g>

        {/* =====================================================
            ORBITING SHIPS

            Render AFTER planets so the ship markers are above
            the planet and can receive pointer events.

            Ships are grouped by their resolved planet.
        ====================================================== */}

        <g
          className="ship-orbit-layer"
          filter="url(#ship-glow)"
        >
          {Array.from(shipsByPlanet.entries()).flatMap(
            ([planetId, planetShips]) =>
              planetShips.map((ship, shipIndex) => (
                <ShipMarker
                  key={`ship-${ship.id}`}
                  ship={ship}
                  shipIndex={shipIndex}
                  shipCount={planetShips.length}
                  selected={
                    String(selectedShip?.id) ===
                    String(ship.id)
                  }
                  onSelect={onSelectShip}
                />
              )),
          )}
        </g>
      </svg>
    </div>
  );
}