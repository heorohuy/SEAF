import React from 'react';

export default function Planet({ planet, selected, onSelect }) {
  return (
    <g
      key={planet.id}
      className={`planet-svg ${planet.faction} ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(planet)}
      onMouseDown={(e) => e.stopPropagation()}
      role="button"
      tabIndex={0}
      aria-label={`${planet.name}, sector ${planet.sector}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(planet);
      }}
    >
      <circle className="planet-glow" cx={planet.x} cy={planet.y} r="3.2" />

      <circle className="planet-circle" cx={planet.x} cy={planet.y} r="1.4" />

      <text className="planet-label" x={planet.x + 2.8} y={planet.y + 1.2}>
        {planet.name}
      </text>
    </g>
  );
}
