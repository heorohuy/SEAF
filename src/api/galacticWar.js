// const DEFAULT_API_BASE = import.meta.env.VITE_HELDIVERS_API || (import.meta.env.DEV ? '/helldivers-api' : 'https://api.helldivers2.dev');

const DEFAULT_API_BASE =
  import.meta.env.DEV
    ? '/helldivers-api'
    : '/api';

const HEADER_CLIENT = import.meta.env.VITE_HELDIVERS_CLIENT || 'helldivers2-seaf-map';
const HEADER_CONTACT = import.meta.env.VITE_HELDIVERS_CONTACT || 'admin@helldivers2.dev';

const DEFAULT_HEADERS = {
  'X-Super-Client': HEADER_CLIENT,
  'X-Super-Contact': HEADER_CONTACT,
  Accept: 'application/json',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveFaction(owner) {
  const normalized = String(owner).toLowerCase();
  if (normalized.includes('super earth') || normalized.includes('super-earth') || normalized.includes('human')) {
    return 'super-earth';
  }
  if (normalized.includes('terminid')) {
    return 'terminids';
  }
  if (normalized.includes('automaton')) {
    return 'automatons';
  }
  if (normalized.includes('illuminate')) {
    return 'illuminate';
  }
  return 'neutral';
}

function getNumericPositionValue(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function hasValidMapPosition(id, x, y) {
  if (id === 0) {
    return true;
  }

  if (
    typeof x !== 'number' ||
    !Number.isFinite(x) ||
    typeof y !== 'number' ||
    !Number.isFinite(y)
  ) {
    return false;
  }

  if (x === 0 && y === 0) {
    return false;
  }

  return true;
}

function getBiomeValue(raw) {
  const candidates = [
    raw?.biome,
    raw?.biomeType,
    raw?.environment,
    raw?.environmentType,
  ];

  for (const value of candidates) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      if (typeof value === 'object') {
        return (
          value.name ??
          value.type ??
          value.id ??
          JSON.stringify(value)
        );
      }

      return value;
    }
  }

  return null;
}

function normalizePlanet(raw, info) {

  const normalizedRawX = getNumericPositionValue(
    raw?.positionX,
    raw?.position?.x,
    info?.position?.x,
  );

  const normalizedRawY = getNumericPositionValue(
    raw?.positionY,
    raw?.position?.y,
    info?.position?.y,
  );

  const hasPosition = hasValidMapPosition(
    raw.index,
    normalizedRawX,
    normalizedRawY,
  );

  if (
    !hasPosition
  ) {
    console.warn(
      'Planet has no usable map position:',
      {
        index: raw.index,
        name: raw.name,
        positionX: raw.positionX,
        positionY: raw.positionY,
        rawPosition: raw.position,
        warInfoPosition: info?.position,
      },
    );
  }

  const x = hasPosition
    ? clamp(
      (normalizedRawX + 1) * 380 + 100,
      40,
      920,
    )
    : null;

  const y = hasPosition
    ? clamp(
      (normalizedRawY + 1) * 380 + 100,
      40,
      920,
    )
    : null;

  const liberation = raw.maxHealth
    ? Math.round(
      (raw.health / raw.maxHealth) * 100,
    )
    : 0;

  const owner =
    raw.currentOwner ||
    raw.initialOwner ||
    raw.owner ||
    'Neutral';

  const faction = resolveFaction(owner);

  const status =
    raw.event?.name ||
    owner ||
    'Unknown';

  return {
    id: String(
      raw.index ??
      raw.name,
    ),

    index: raw.index,

    name:
      raw.name ||
      `Planet ${raw.index}`,

    sector:
      raw.sector ||
      'Unknown',

    owner,

    faction,

    liberation,

    status,

    event:
      raw.event?.name ??
      null,

    x,

    y,

    biome: getBiomeValue(raw),

    raw,
  };
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(endpoint, retries = 2) {
  const url = `${DEFAULT_API_BASE.replace(/\/$/, '')}${endpoint}`;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
      credentials: 'omit',
    });

    if (response.ok) {
      return response.json();
    }

    if (response.status === 429) {
      const retryAfter =
        Number(response.headers.get('Retry-After'));

      const delay = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : 10_000;

      if (attempt < retries - 1) {
        await wait(delay);
        continue;
      }
    }

    if (response.status >= 500 && attempt < retries - 1) {
      await wait(3000 * (attempt + 1));
      continue;
    }

    const body = await response.text();

    throw new Error(
      `Helldivers API error ${response.status}: ${body}`,
    );
  }

  throw new Error('Helldivers API request failed');
}


function buildConnections(planetsByIndex, infos) {
  const edges = new Set();

  for (const info of infos) {
    const source = planetsByIndex.get(String(info.index));
    if (!source || !Array.isArray(info.waypoints)) continue;

    for (const targetIndex of info.waypoints) {
      const target = planetsByIndex.get(String(targetIndex));
      if (!target) continue;
      const edgeKey = [source.id, target.id].sort().join('|');
      edges.add(edgeKey);
    }
  }

  return Array.from(edges).map((edge) => edge.split('|'));
}

function getCentroid(points) {
  const total = points.reduce(
    (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
    { x: 0, y: 0 }
  );
  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function createHexagon(x, y, radius = 40) {
  return [
    [x - radius, y - radius * 0.6],
    [x + radius, y - radius * 0.6],
    [x + radius * 1.2, y],
    [x + radius, y + radius * 0.6],
    [x - radius, y + radius * 0.6],
    [x - radius * 1.2, y],
  ];
}



function clipPolygonToHalfPlane(polygon, normalX, normalY, constant) {
  const result = [];

  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentValue = normalX * current[0] + normalY * current[1] - constant;
    const nextValue = normalX * next[0] + normalY * next[1] - constant;
    const currentInside = currentValue <= 0;
    const nextInside = nextValue <= 0;

    if (currentInside) {
      result.push(current);
    }

    if (currentInside !== nextInside) {
      const t = currentValue / (currentValue - nextValue);
      if (Number.isFinite(t)) {
        result.push([
          current[0] + (next[0] - current[0]) * t,
          current[1] + (next[1] - current[1]) * t,
        ]);
      }
    }
  }

  return result;
}

function buildVoronoiCell(site, sites, bounds) {
  let polygon = bounds;

  for (const other of sites) {
    if (other.id === site.id) continue;

    const dx = other.x - site.x;
    const dy = other.y - site.y;
    const constant = (other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y) / 2;

    polygon = clipPolygonToHalfPlane(polygon, dx, dy, constant);
    if (polygon.length === 0) break;
  }

  return polygon;
}

function getSectorFaction(planets) {
  if (planets.some((planet) => planet.faction === 'illuminate')) {
    return 'illuminate';
  }
  if (planets.some((planet) => planet.faction === 'terminids')) {
    return 'terminids';
  }
  if (planets.some((planet) => planet.faction === 'automatons')) {
    return 'automatons';
  }
  return 'super-earth';
}

function buildSectors(planets) {
  const groups = new Map();

  for (const planet of planets) {
    const key = planet.sector || 'Unknown';

    const group =
      groups.get(key) || {
        name: key.toUpperCase(),
        planets: [],
      };

    group.planets.push(planet);

    groups.set(key, group);
  }

  const sectorSites = Array.from(
    groups.entries(),
  )
    .map(([key, group]) => {
      const positionedPlanets =
        group.planets.filter(
          (planet) =>
            typeof planet.x === 'number' &&
            typeof planet.y === 'number',
        );

      if (positionedPlanets.length === 0) {
        return null;
      }

      const points = positionedPlanets.map(
        (planet) => [
          planet.x,
          planet.y,
        ],
      );

      const centroid =
        getCentroid(points);

      return {
        id: key
          .toLowerCase()
          .replace(/\s+/g, '-'),

        name: group.name,

        faction:
          getSectorFaction(
            positionedPlanets,
          ),

        x: centroid.x,

        y: centroid.y,
      };
    })
    .filter(Boolean);

  const positionedPlanets =
    planets.filter(
      (planet) =>
        typeof planet.x === 'number' &&
        typeof planet.y === 'number',
    );

  if (positionedPlanets.length === 0) {
    return [];
  }

  const allXs = positionedPlanets.map(
    (planet) => planet.x,
  );

  const allYs = positionedPlanets.map(
    (planet) => planet.y,
  );

  const minX =
    Math.min(...allXs) - 80;

  const maxX =
    Math.max(...allXs) + 80;

  const minY =
    Math.min(...allYs) - 80;

  const maxY =
    Math.max(...allYs) + 80;

  const bounds = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];

  return sectorSites.map((site) => {
    const rawCell =
      buildVoronoiCell(
        site,
        sectorSites,
        bounds,
      );

    const cell = rawCell.length
      ? rawCell
      : createHexagon(
        site.x,
        site.y,
        60,
      );

    const centroid =
      getCentroid(cell);

    return {
      id: site.id,

      name: site.name,

      points: cell,

      centerX: centroid.x,

      centerY: centroid.y,

      faction: site.faction,
    };
  });
}

export async function fetchGalacticMap() {
  const response = await fetch(
    '/api/galactic-map',
    {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    let message;

    try {
      const body = await response.json();

      message =
        body?.error ||
        `Galactic map API error ${response.status}`;
    } catch {
      message =
        `Galactic map API error ${response.status}`;
    }

    throw new Error(message);
  }

  const data = await response.json();

  /*
   * --------------------------------------------------------------------------
   * Convert the cached raw API response into the format expected by the map.
   * --------------------------------------------------------------------------
   */

  const rawPlanets =
    Array.isArray(data?.planets)
      ? data.planets
      : [];

  const warInfo =
    data?.warInfo ?? null;

  const planetInfos =
    Array.isArray(warInfo?.planetInfos)
      ? warInfo.planetInfos
      : [];

  const planetInfoByIndex =
    new Map(
      planetInfos.map((info) => [
        String(info.index),
        info,
      ]),
    );

  const planets =
    Array.from(
      new Map(
        rawPlanets.map((raw) => {
          const planet =
            normalizePlanet(
              raw,
              planetInfoByIndex.get(
                String(raw.index),
              ),
            );

          return [
            planet.name,
            planet,
          ];
        }),
      ).values(),
    );

  const planetsByIndex =
    new Map(
      planets.map((planet) => [
        String(planet.index),
        planet,
      ]),
    );

  const connections =
    buildConnections(
      planetsByIndex,
      planetInfos,
    );

  const sectors =
    buildSectors(planets);

  return {
    ...data,

    planets,
    connections,
    sectors,

    /*
     * Preserve the server/database status.
     */
    databaseStatus:
      data?.databaseStatus ?? {
        state: 'online',
        label: 'ONLINE',
        cached: false,
      },
  };
}

export default fetchGalacticMap;
