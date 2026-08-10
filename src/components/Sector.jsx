import React from 'react';

export default function Sector({ sector }) {
  const hasPolygon = Array.isArray(sector.points) && sector.points.length > 0;
  const polygonPoints = hasPolygon
    ? sector.points.map(([x, y]) => `${x},${y}`).join(' ')
    : '';
  const centerX = sector.centerX ?? sector.x;
  const centerY = sector.centerY ?? sector.y;

  return (
    <g>
      {hasPolygon ? (
        <polygon className={`sector-box ${sector.faction}`} points={polygonPoints} />
      ) : (
        <rect
          className={`sector-box ${sector.faction}`}
          x={sector.x - sector.width / 2}
          y={sector.y - sector.height / 2}
          width={sector.width}
          height={sector.height}
        />
      )}

      <text className="sector-label" x={centerX} y={centerY - 2} textAnchor="middle">
        {sector.name}
      </text>
    </g>
  );
}
