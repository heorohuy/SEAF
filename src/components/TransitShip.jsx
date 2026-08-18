// src/components/TransitShip.jsx

import { useId } from 'react';

function safeId(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9_-]/g, '-');
}

export default function TransitShip({
  route,
  ship,
  onSelect,
}) {
  // Hooks must always run before conditional returns.
  const uniqueId = useId();

  if (
    !route?.origin ||
    !route?.destination ||
    !ship
  ) {
    return null;
  }

  const routeId =
    `ship-route-${safeId(ship.id)}-${safeId(
      uniqueId,
    )}`;

  const origin = {
    x: route.origin.x,
    y: 960 - route.origin.y,
  };

  const destination = {
    x: route.destination.x,
    y: 960 - route.destination.y,
  };

  const imageUrl = ship.image_url || null;

  const handleSelect = (event) => {
    event.stopPropagation();
    onSelect?.(ship);
  };

  return (
    <g
      className="ship-transit"
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      aria-label={`Select ${ship.name}`}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          event.stopPropagation();
          onSelect?.(ship);
        }
      }}
    >
      {/* Visible route. */}
      <line
        id={routeId}
        className="ship-transit-route"
        x1={origin.x}
        y1={origin.y}
        x2={destination.x}
        y2={destination.y}
      />

      {/* Animated route glow. */}
      <line
        className="ship-transit-route-glow"
        x1={origin.x}
        y1={origin.y}
        x2={destination.x}
        y2={destination.y}
      />

      {/* Origin marker. */}
      <circle
        className="ship-transit-origin"
        cx={origin.x}
        cy={origin.y}
        r="2.2"
      />

      {/* Destination marker. */}
      <circle
        className="ship-transit-destination"
        cx={destination.x}
        cy={destination.y}
        r="2.2"
      />

      {/* The animated ship follows the route line. */}
      <g className="ship-transit-vessel">
        <animateMotion
          dur={`${Math.max(
            3,
            Math.min(
              10,
              Math.hypot(
                destination.x - origin.x,
                destination.y - origin.y,
              ) / 70,
            ),
          )}s`}
          repeatCount="indefinite"
          rotate="auto"
        >
          <mpath href={`#${routeId}`} />
        </animateMotion>

        <circle
          className="ship-transit-hit-area"
          cx="0"
          cy="0"
          r="5"
        />

        {/* Engine trail. */}
        <path
          className="ship-engine-trail"
          d="M -5 0 L -1 0"
        />

        {imageUrl ? (
          <image
            className="ship-transit-image"
            href={imageUrl}
            x="-3"
            y="-3"
            width="6"
            height="6"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <path
            className="ship-transit-fallback"
            d="
              M 3 0
              L -2 -1.6
              L -1 0
              L -2 1.6
              Z
            "
          />
        )}

        <circle
          className="ship-transit-core"
          cx="0"
          cy="0"
          r="1"
        />
      </g>

      <title>
        {ship.name} — en route to{' '}
        {route.destination.name}
      </title>
    </g>
  );
}