// src/api/hd2Clans.js

export const SEAF_CLAN_ID = 1108;

export function getShipDetailUrl(shipId) {
  if (
    shipId === null ||
    shipId === undefined ||
    shipId === ''
  ) {
    return 'https://hd2clans.com/hangar';
  }

  return `https://hd2clans.com/hangar/ship/${encodeURIComponent(
    shipId,
  )}`;
}

/*
 * HD2Clans recommends polling no faster than once per 60 seconds.
 * Five minutes gives us reasonably fresh movement without hammering
 * the public endpoint.
 */
export const SHIP_POLL_INTERVAL_MS = 5 * 60 * 1000;

const API_BASE =
  'https://hd2clans.com/api/public';

/**
 * Returns true when the ship is a Super Destroyer.
 *
 * The API documents personal_ships as Super Destroyers and exposes
 * is_personal on the ship object. We check several representations
 * defensively because the public API may evolve.
 */
export function isSuperDestroyer(ship) {
  if (!ship) {
    return false;
  }

  if (ship.is_personal === true) {
    return true;
  }

  if (
    String(ship.ship_class || '')
      .trim()
      .toLowerCase() === 'super destroyer'
  ) {
    return true;
  }

  if (
    String(ship.class_key || '')
      .trim()
      .toLowerCase() === 'super-destroyer'
  ) {
    return true;
  }

  return false;
}

/**
 * Only alliance/auxiliary ships are displayed on the galactic map.
 */
export function filterMapShips(ships) {
  if (!Array.isArray(ships)) {
    return [];
  }

  return ships.filter(
    (ship) => !isSuperDestroyer(ship),
  );
}

export async function fetchSEAFleet(
  clanId = SEAF_CLAN_ID,
  options = {},
) {
  const { signal } = options;

  const url =
    `${API_BASE}/clan/${encodeURIComponent(clanId)}/hangar`;

  const response = await fetch(url, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `HD2Clans returned HTTP ${response.status}`,
    );
  }

  const data = await response.json();

  if (data?.available === false) {
    throw new Error(
      `Clan ${clanId} is unavailable: ${
        data.reason || 'unknown reason'
      }`,
    );
  }

  const rawShips = Array.isArray(data.ships)
    ? data.ships
    : [];

  const ships = filterMapShips(rawShips);

  return {
    ...data,
    ships,
    activity: Array.isArray(data.activity)
      ? data.activity
      : [],
  };
}