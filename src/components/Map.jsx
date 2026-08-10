import React, { useRef, useEffect } from 'react';
import Planet from './Planet';
import Sector from './Sector';

export default function Map({ planets, connections, sectors, selectedPlanet, onSelect, transformStyle, onMouseDown, onMouseMove, onMouseUp, onWheel }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !onWheel) return;

    const handler = (e) => {
      e.preventDefault();
      onWheel(e);
    };

    node.addEventListener('wheel', handler, { passive: false });
    return () => node.removeEventListener('wheel', handler);
  }, [onWheel]);

  const flipY = (y) => 960 - y;
  const flippedSectors = sectors.map((sector) => ({
    ...sector,
    points: Array.isArray(sector.points)
      ? sector.points.map(([x, y]) => [x, flipY(y)])
      : undefined,
    centerY: sector.centerY != null ? flipY(sector.centerY) : sector.centerY,
  }));
  const flippedPlanets = planets.map((planet) => ({
    ...planet,
    y: flipY(planet.y),
  }));

  const galaxyRadius = Math.min(
    470,
    Math.max(...flippedPlanets.map((planet) => Math.hypot(planet.x - 480, planet.y - 480))) + 20
  );

  return (
    <div ref={containerRef} className="map" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <svg className="galaxy-svg" viewBox="0 0 960 960" preserveAspectRatio="xMidYMid meet" style={transformStyle}>
        <defs>
          <clipPath id="galaxy-mask">
            <circle cx="480" cy="480" r={galaxyRadius} />
          </clipPath>
        </defs>

        <g clipPath="url(#galaxy-mask)">
          <circle cx="480" cy="480" r={galaxyRadius} fill="rgba(8, 12, 18, 0.95)" />

          {flippedSectors.map((s) => (
            <Sector key={s.id} sector={s} />
          ))}

          {connections.map(([fromId, toId]) => {
            const from = flippedPlanets.find((p) => p.id === fromId);
            const to = flippedPlanets.find((p) => p.id === toId);
            if (!from || !to) return null;
            return <line key={`${fromId}-${toId}`} className="connection" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
          })}

          {flippedPlanets.map((planet) => (
            <Planet key={planet.id} planet={planet} selected={selectedPlanet?.id === planet.id} onSelect={onSelect} />
          ))}
        </g>

        <circle cx="480" cy="480" r="440" className="galaxy-boundary" fill="none" />
      </svg>
    </div>
  );
}
