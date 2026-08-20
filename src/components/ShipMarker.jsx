// src/components/ShipMarker.jsx

import { getOrbitPosition } from '../api/shipTracking';
import sprdDestroyerIcon from '../assets/1986-JJ-SEAFICONS-SPRDSTROYER.png';

function getShipImage(ship) {
  return sprdDestroyerIcon;
}

function getShipLabel(ship) {
  return ship?.name || `Ship ${ship?.id ?? ''}`;
}

export default function ShipMarker({
  ship,
  shipIndex,
  shipCount,
  selected = false,
  mapDimension = 'galaxy',
  onSelect,
}) {
  if (!ship) {
    return null;
  }

  const position = getOrbitPosition(
    ship.__planet,
    shipIndex,
    shipCount,
  );

  const displayPosition =
  mapDimension === 'void'
    ? {
        ...position,
        y: 960 - position.y,
      }
    : position;

  if (!position) {
    return null;
  }

  const imageUrl = getShipImage(ship);
  const label = getShipLabel(ship);

  const handleSelect = (event) => {
    event.stopPropagation();
    onSelect?.(ship);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      event.stopPropagation();
      onSelect?.(ship);
    }
  };

  return (
    <g
      className={`ship-marker ${
        selected ? 'selected' : ''
      }`}
      transform={`translate(${displayPosition.x} ${displayPosition.y})`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Select ${label}`}
    >
      {/* Large invisible hit target. */}
      {/* <circle
        className="ship-hit-area"
        cx="0"
        cy="0"
        r="0.5"
      /> */}

      <circle
        className="ship-orbit-pulse"
        cx="0"
        cy="0"
        r="2.5"
      />

      {imageUrl ? (
        <image
          className="ship-image"
          href={imageUrl}
          x="-2.8"
          y="-2.8"
          width="5.6"
          height="5.6"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <path
          className="ship-fallback"
          d="
            M 0 -3.5
            L 1.4 1.5
            L 0 3
            L -1.4 1.5
            Z
          "
        />
      )}

      <circle
        className="ship-core"
        cx="0"
        cy="0"
        r="1.1"
      />

      <title>{label}</title>
    </g>
  );
}