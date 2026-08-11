 
import factoryIcon from '../assets/1986-JJ-SEAFICONS-OUTPOST.png';

export default function Planet({ planet, selected, hasAssociatedMatch, associatedRegimentIcon, onSelect }) {
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

      {hasAssociatedMatch && (
        <image
          className="factory-icon"
          href={factoryIcon}
          x={planet.x + 2.8}
          y={planet.y - 6}
          width="6"
          height="5"
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {associatedRegimentIcon && (
        <image
          className="regiment-icon"
          href={associatedRegimentIcon}
          x={planet.x + 2.8}
          y={planet.y + 2}
          width="6"
          height="5"
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </g>
  );
}
