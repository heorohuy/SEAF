import factoryIcon from '../assets/1986-JJ-SEAFICONS-OUTPOST.png';

export default function Planet({
  planet,
  selected,
  hasAssociatedMatch,
  associatedRegimentIcon,
  hasSOS,
  onSelect
}) {
  /*
   * Planet label starts to the right of the planet.
   *
   * When an FOB exists, the FOB occupies the space immediately
   * before the planet name.
   */
  const labelX = planet.x + 4;
  const labelY = planet.y + 1.2;

  const factoryX = planet.x + 2.8;
  const factoryY = planet.y - 9;

  data-source-planet={
  planet.isSourcePlanet
    ? 'true'
    : undefined
}

  return (
    <g
      key={planet.id}
      className={`planet-svg ${planet.faction} ${
        selected ? 'selected' : ''
      }`}
      onClick={() => onSelect(planet)}
      onMouseDown={(e) => e.stopPropagation()}
      role="button"
      tabIndex={0}
      aria-label={`${planet.name}, sector ${planet.sector}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(planet);
        }
      }}
    >
      {hasSOS && (
        <>
          <circle
            className="sos-pulse"
            cx={planet.x}
            cy={planet.y}
            r="2.5"
          >
            <animate
              attributeName="r"
              from="2.5"
              to="12"
              dur="1.8s"
              repeatCount="indefinite"
            />

            <animate
              attributeName="opacity"
              values="0.9;0.45;0"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>

          <circle
            className="sos-pulse"
            cx={planet.x}
            cy={planet.y}
            r="2.5"
          >
            <animate
              attributeName="r"
              from="2.5"
              to="12"
              dur="1.8s"
              begin="0.9s"
              repeatCount="indefinite"
            />

            <animate
              attributeName="opacity"
              values="0.9;0.45;0"
              dur="1.8s"
              begin="0.9s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}

      {/* Planet glow */}
      <circle
        className="planet-glow"
        cx={planet.x}
        cy={planet.y}
        r="3.2"
      />

      {/* Planet itself */}
      <circle
        className="planet-circle"
        cx={planet.x}
        cy={planet.y}
        r="1.4"
      />

      {/* =========================================================
          FOB
          Sits immediately to the left of the planet name.
      ========================================================== */}
      {hasAssociatedMatch && (
        <image
          className="factory-icon"
          href={factoryIcon}
          x={factoryX}
          y={factoryY}
          width="5"
          height="5"
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* =========================================================
          PLANET NAME
      ========================================================== */}
      <text
        className="planet-label"
        x={labelX}
        y={labelY}
      >
        {planet.name}
      </text>

      {/* =========================================================
          REGIMENT ICON
          Remains below the planet/name.
      ========================================================== */}
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
