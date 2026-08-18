// src/api/shipTracking.js

export const SHIP_STATE_STORAGE_KEY =
  'seaf:hd2clans:1108:ship-state';

export function loadPersistedShipStates() {
  try {
    const raw = localStorage.getItem(
      SHIP_STATE_STORAGE_KEY,
    );

    if (!raw) {
      return new Map();
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Map();
    }

    return new Map(
      parsed.map(([id, ship]) => [
        String(id),
        ship,
      ]),
    );
  } catch {
    return new Map();
  }
}

export function savePersistedShipStates(
  ships,
) {
  try {
    const entries = (ships || []).map(
      (ship) => [
        String(ship.id),
        {
          id: ship.id,
          name: ship.name,
          condition:
            ship.condition
              ? {
                  key:
                    ship.condition.key,
                  label:
                    ship.condition.label,
                  location:
                    ship.condition.location,
                }
              : null,
        },
      ],
    );

    localStorage.setItem(
      SHIP_STATE_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // localStorage can be unavailable in
    // privacy-restricted environments.
  }
}

export const MAP_SIZE = 960;

export const PREPARING_DEPLOY = 'preparing_deploy';

export function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[-_–—]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function compactKey(value) {
  return normalizeKey(value)
    .replace(/['’]/g, '')
    .replace(/\s+/g, '');
}

export function getPlanetKey(planet) {
  return normalizeKey(planet?.id || planet?.name);
}

/**
 * Build a lookup containing both planet ID and planet name.
 */
export function buildPlanetLookup(planets) {
  const lookup = new Map();

  if (!Array.isArray(planets)) {
    return lookup;
  }

  for (const planet of planets) {
    if (
      !planet ||
      typeof planet.x !== 'number' ||
      !Number.isFinite(planet.x) ||
      typeof planet.y !== 'number' ||
      !Number.isFinite(planet.y)
    ) {
      continue;
    }

    const nameKey = normalizeKey(planet.name);
    const idKey = normalizeKey(planet.id);

    if (nameKey) {
      lookup.set(nameKey, planet);
    }

    if (idKey) {
      lookup.set(idKey, planet);
    }

    // A second compact lookup makes matching a little more tolerant
    // when one API inserts punctuation.
    const compactName = compactKey(planet.name);
    const compactId = compactKey(planet.id);

    if (compactName) {
      lookup.set(`compact:${compactName}`, planet);
    }

    if (compactId) {
      lookup.set(`compact:${compactId}`, planet);
    }
  }

  return lookup;
}

/**
 * Resolve an HD2Clans location to a SEAF planet.
 *
 * HD2Clans locations can be human-readable strings. We first try
 * exact normalized matching, then compact matching, then conservative
 * prefix/suffix matching.
 */
export function resolvePlanetLocation(location, planetsOrLookup) {
  if (!location) {
    return null;
  }

  const key = normalizeKey(location);

  if (!key) {
    return null;
  }

  const lookup =
    planetsOrLookup instanceof Map
      ? planetsOrLookup
      : buildPlanetLookup(planetsOrLookup);

  const exact = lookup.get(key);

  if (exact) {
    return exact;
  }

  const compact = lookup.get(`compact:${compactKey(location)}`);

  if (compact) {
    return compact;
  }

  // Conservative fuzzy matching.
  const candidates = [];

  for (const [lookupKey, planet] of lookup.entries()) {
    if (
      lookupKey.startsWith('compact:') ||
      !planet
    ) {
      continue;
    }

    if (
      lookupKey === key ||
      lookupKey.startsWith(key) ||
      key.startsWith(lookupKey)
    ) {
      candidates.push(planet);
    }
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  // Last-resort matching against compact names.
  const compactLocation = compactKey(location);

  for (const [lookupKey, planet] of lookup.entries()) {
    if (!lookupKey.startsWith('compact:')) {
      continue;
    }

    const compactPlanet = lookupKey.slice('compact:'.length);

    if (
      compactPlanet === compactLocation ||
      compactPlanet.startsWith(compactLocation) ||
      compactLocation.startsWith(compactPlanet)
    ) {
      return planet;
    }
  }

  return null;
}

export function isDeploying(ship) {
  return (
    ship?.condition?.key === PREPARING_DEPLOY
  );
}

export function isPlanetaryShipState(ship) {
  const key = ship?.condition?.key;

  return (
    key === 'anchored' ||
    key === 'deployed' ||
    key === 'escorting_dss' ||
    key === 'reserve'
  );
}

function eventTimestamp(event) {
  const value = Date.parse(event?.at || '');

  return Number.isFinite(value)
    ? value
    : 0;
}

function getShipActivity(shipId, activity) {
  if (!Array.isArray(activity)) {
    return [];
  }

  return activity
    .filter(
      (event) =>
        Number(event?.ship_id) === Number(shipId),
    )
    .sort(
      (a, b) =>
        eventTimestamp(a) - eventTimestamp(b),
    );
}

export function inferOriginFromPreviousState(
  currentShip,
  previousShip,
  planetsOrLookup,
) {
  if (
    !currentShip ||
    !previousShip ||
    !currentShip.condition?.location ||
    !previousShip.condition?.location
  ) {
    return null;
  }

  if (
    previousShip.condition.key ===
    PREPARING_DEPLOY
  ) {
    return null;
  }

  const lookup =
    planetsOrLookup instanceof Map
      ? planetsOrLookup
      : buildPlanetLookup(planetsOrLookup);

  const origin =
    resolvePlanetLocation(
      previousShip.condition.location,
      lookup,
    );

  const destination =
    resolvePlanetLocation(
      currentShip.condition.location,
      lookup,
    );

  if (!origin || !destination) {
    return null;
  }

  if (origin.id === destination.id) {
    return null;
  }

  return {
    shipId: currentShip.id,
    origin,
    destination,
    source: 'persisted-state',
    startedAt: Date.now(),
  };
}

/**
 * Find the activity event representing the current deployment
 * preparation.
 */
function findPreparingEvent(ship, events) {
  const destinationKey = normalizeKey(
    ship?.condition?.location,
  );

  const preparingEvents = events.filter((event) => {
    const conditionKey = String(
      event?.condition_key || '',
    ).toLowerCase();

    const eventType = String(
      event?.event_type || '',
    ).toLowerCase();

    const eventLocation = normalizeKey(
      event?.location,
    );

    return (
      conditionKey === PREPARING_DEPLOY ||
      eventType === PREPARING_DEPLOY ||
      (
        eventLocation &&
        destinationKey &&
        eventLocation === destinationKey &&
        /deploy|deployment/i.test(
          String(event?.event || ''),
        )
      )
    );
  });

  if (preparingEvents.length === 0) {
    return null;
  }

  return preparingEvents[preparingEvents.length - 1];
}

/**
 * Infer the origin of a deployment from the last known ship state
 * or the API's recent activity feed.
 */
export function inferTransitRoute(
  ship,
  previousShip,
  activity,
  planetsOrLookup,
) {
  if (!ship || !isDeploying(ship)) {
    return null;
  }

  const lookup =
    planetsOrLookup instanceof Map
      ? planetsOrLookup
      : buildPlanetLookup(planetsOrLookup);

  const destination = resolvePlanetLocation(
    ship?.condition?.location,
    lookup,
  );

  if (!destination) {
    return null;
  }

  // First choice: the immediately preceding observed ship state.
  if (
    previousShip &&
    previousShip.id === ship.id &&
    previousShip.condition?.location
  ) {
    const previousPlanet = resolvePlanetLocation(
      previousShip.condition.location,
      lookup,
    );

    if (
      previousPlanet &&
      previousPlanet.id !== destination.id
    ) {
      return {
        shipId: ship.id,
        origin: previousPlanet,
        destination,
        source: 'previous-poll',
        startedAt: Date.now(),
      };
    }
  }

  const events = getShipActivity(
    ship.id,
    activity,
  );

  if (events.length === 0) {
    return null;
  }

  const preparingEvent =
    findPreparingEvent(ship, events);

  if (!preparingEvent) {
    // If the API did not label the preparation event in the
    // way expected, use the most recent event whose location
    // differs from the current destination.
    const reverseCandidate = [...events]
      .reverse()
      .find((event) => {
        const planet = resolvePlanetLocation(
          event?.location,
          lookup,
        );

        return (
          planet &&
          planet.id !== destination.id
        );
      });

    if (!reverseCandidate) {
      return null;
    }

    const origin = resolvePlanetLocation(
      reverseCandidate.location,
      lookup,
    );

    if (!origin) {
      return null;
    }

    return {
      shipId: ship.id,
      origin,
      destination,
      source: 'activity',
      startedAt:
        eventTimestamp(reverseCandidate) ||
        Date.now(),
    };
  }

  const preparingTime =
    eventTimestamp(preparingEvent);

  // Find the latest planetary location before
  // deployment preparation began.
  const previousLocationEvent = [...events]
    .reverse()
    .find((event) => {
      const timestamp = eventTimestamp(event);

      if (
        preparingTime &&
        timestamp >= preparingTime
      ) {
        return false;
      }

      const eventPlanet =
        resolvePlanetLocation(
          event?.location,
          lookup,
        );

      return (
        eventPlanet &&
        eventPlanet.id !== destination.id
      );
    });

  if (!previousLocationEvent) {
    return null;
  }

  const origin = resolvePlanetLocation(
    previousLocationEvent.location,
    lookup,
  );

  if (!origin) {
    return null;
  }

  return {
    shipId: ship.id,
    origin,
    destination,
    source: 'activity',
    startedAt:
      preparingTime ||
      eventTimestamp(previousLocationEvent) ||
      Date.now(),
  };
}

/**
 * SEAF's Map.jsx flips Y from the game's coordinate space.
 */
export function toMapCoordinates(planet) {
  if (!planet) {
    return null;
  }

  return {
    x: planet.x,
    y: MAP_SIZE - planet.y,
  };
}

/**
 * Calculate deterministic orbit locations.
 *
 * The ship ID is used as part of the index so ships do not jump
 * around every time the API returns the array in a different order.
 */
export function getOrbitPosition(
  planet,
  shipIndex,
  shipCount,
) {
  if (!planet) {
    return null;
  }

  const position = toMapCoordinates(planet);

  const count = Math.max(
    Number(shipCount) || 1,
    1,
  );

  const index = Math.max(
    Number(shipIndex) || 0,
    0,
  );

  // Six ships per orbital ring.
  const ringIndex = Math.floor(index / 6);
  const ringPosition = index % 6;

  const ringSize = Math.min(
    6,
    Math.max(1, count - ringIndex * 6),
  );

  const angle =
    -Math.PI / 2 +
    (ringPosition / ringSize) *
      Math.PI *
      2;

  const radius =
    8 + ringIndex * 3.75;

  return {
    x:
      position.x +
      Math.cos(angle) * radius,
    y:
      position.y +
      Math.sin(angle) * radius,
  };
}

export function makeRouteKey(route) {
  if (
    !route?.shipId ||
    !route?.origin?.id ||
    !route?.destination?.id
  ) {
    return null;
  }

  return [
    route.shipId,
    route.origin.id,
    route.destination.id,
  ].join(':');
}

/**
 * Remove invalid routes and rebuild routes which can be inferred.
 */
export function reconcileShipRoutes({
  ships,
  previousShips,
  activity,
  planets,
  existingRoutes,
}) {
  const lookup = buildPlanetLookup(planets);
  const previousMap = new Map();

  for (const ship of previousShips || []) {
    previousMap.set(String(ship.id), ship);
  }

  const nextRoutes = new Map();

  for (const ship of ships || []) {
    const id = String(ship.id);

    if (!isDeploying(ship)) {
      continue;
    }

    const existing = existingRoutes?.get(id);

    if (existing) {
      const destination =
        resolvePlanetLocation(
          ship?.condition?.location,
          lookup,
        );

      if (
        destination &&
        existing.destination?.id ===
          destination.id
      ) {
        nextRoutes.set(id, existing);
        continue;
      }
    }

    const route = inferTransitRoute(
      ship,
      previousMap.get(id),
      activity,
      lookup,
    );

    if (route) {
      nextRoutes.set(id, route);
    }
  }

  return nextRoutes;
}