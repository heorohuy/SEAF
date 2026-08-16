import { useRef, useEffect } from 'react';
import Planet from './Planet';
import Sector from './Sector';

export default function Map({
  containerRef,
  planets,
  connections,
  sectors,
  selectedPlanet,
  associatedFobKeys,
  associatedPlanetIcons,
  sosLocations,
  onSelect,
  transformStyle,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel
}) {
  const localRef = useRef(null);
  const ref = containerRef || localRef;

  useEffect(() => {
    const node = ref.current;
    if (!node || !onWheel) return;

    const handler = (e) => {
      e.preventDefault();
      onWheel(e);
    };

    node.addEventListener('wheel', handler, { passive: false });

    return () => {
      node.removeEventListener('wheel', handler);
    };
  }, [onWheel, ref]);

  const flipY = (y) => 960 - y;

  const flippedSectors = sectors.map((sector) => ({
    ...sector,
    points: Array.isArray(sector.points)
      ? sector.points.map(([x, y]) => [x, flipY(y)])
      : undefined,
    centerY:
      sector.centerY != null
        ? flipY(sector.centerY)
        : sector.centerY,
  }));

  const positionedPlanets = planets.filter(
    (planet) =>
      typeof planet.x === 'number' &&
      Number.isFinite(planet.x) &&
      typeof planet.y === 'number' &&
      Number.isFinite(planet.y)
  );

  const flippedPlanets = positionedPlanets.map((planet) => ({
    ...planet,
    y: flipY(planet.y),
  }));

  const galaxyRadius =
    flippedPlanets.length > 0
      ? Math.min(
          470,
          Math.max(
            ...flippedPlanets.map((planet) =>
              Math.hypot(
                planet.x - 480,
                planet.y - 480
              )
            )
          ) + 20
        )
      : 100;

  const normalizeKey = (value) =>
    String(value ?? '')
      .toLowerCase()
      .trim()
      .replace(/[-_–—]+/g, ' ')
      .replace(/\s+/g, ' ');

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
        viewBox="0 0 960 960"
        preserveAspectRatio="xMidYMid meet"
        style={transformStyle}
      >
        <defs>
          <clipPath id="galaxy-mask">
            <circle
              cx="480"
              cy="480"
              r={galaxyRadius}
            />
          </clipPath>
        </defs>

        {/* =========================================================
            MAP GEOMETRY
            Sector boxes and connection lines stay inside the
            circular galaxy boundary.
        ========================================================== */}
        <g clipPath="url(#galaxy-mask)">
          <circle
            cx="480"
            cy="480"
            r={galaxyRadius}
            fill="rgba(8, 12, 18, 0.95)"
          />

          {flippedSectors.map((sector) => (
            <Sector
              key={sector.id}
              sector={sector}
              planets={flippedPlanets}
              showBox={true}
              showLabel={false}
            />
          ))}

          {connections.map(([fromId, toId]) => {
            const from = flippedPlanets.find(
              (p) => p.id === fromId
            );

            const to = flippedPlanets.find(
              (p) => p.id === toId
            );

            if (!from || !to) return null;

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

        {/* =========================================================
            SECTOR LABELS
            These are not clipped. Sector.jsx keeps the label
            inside the sector and inside the galaxy circle.
        ========================================================== */}
        <g>
          {flippedSectors.map((sector) => (
            <Sector
              key={`label-${sector.id}`}
              sector={sector}
              planets={flippedPlanets}
              galaxyRadius={galaxyRadius}
              showBox={false}
              showLabel={true}
            />
          ))}
        </g>

        {/* =========================================================
            PLANETS
            Planets and their labels are outside the circular clip
            so labels at the map edge are not cut off.
        ========================================================== */}
        <g>
          {flippedPlanets.map((planet) => {
            const planetNameKey = normalizeKey(
              planet.name
            );

            const planetIdKey = normalizeKey(
              planet.id
            );

            const associatedRegimentIcon =
              associatedPlanetIcons?.[planetNameKey] ||
              associatedPlanetIcons?.[planetIdKey];

            const hasSOS =
              sosLocations?.has(planetNameKey) ||
              sosLocations?.has(planetIdKey);

            const hasAssociatedMatch =
              associatedFobKeys.has(
                planetNameKey
              ) ||
              associatedFobKeys.has(
                planetIdKey
              );

            return (
              <Planet
                key={planet.id}
                planet={planet}
                selected={
                  selectedPlanet?.id === planet.id
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
      </svg>
    </div>
  );
}
