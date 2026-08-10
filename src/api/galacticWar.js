const DEFAULT_API_BASE = import.meta.env.VITE_HELDIVERS_API || (import.meta.env.DEV ? '/helldivers-api' : 'https://api.helldivers2.dev');
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

function normalizePlanet(raw, info) {
  const x = typeof info?.position?.x === 'number' ? clamp((info.position.x + 1) * 380 + 100, 40, 920) : 480;
  const y = typeof info?.position?.y === 'number' ? clamp((info.position.y + 1) * 380 + 100, 40, 920) : 480;

  const liberation = raw.maxHealth ? Math.round((raw.health / raw.maxHealth) * 100) : 0;
  const owner = raw.currentOwner || raw.initialOwner || raw.owner || 'Neutral';

  const faction = resolveFaction(owner);

  const status = raw.event?.name || owner || 'Unknown';

  return {
    id: String(raw.index ?? raw.name),
    index: raw.index,
    name: raw.name || `Planet ${raw.index}`,
    sector: raw.sector || 'Unknown',
    owner,
    faction,
    liberation,
    status,
    event: raw.event?.name ?? null,
    x,
    y,
  };
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(endpoint, retries = 3, backoff = 500) {
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

    if (response.status === 429 && attempt < retries - 1) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '', 10);
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : backoff * (attempt + 1);
      await wait(delay);
      continue;
    }

    const body = await response.text();
    throw new Error(`Helldivers API error ${response.status}: ${body}`);
  }

  throw new Error('Helldivers API rate limited after retry attempts');
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

function buildSegmentPolygon(a, b, padding = 20) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = -dy / distance;
  const ny = dx / distance;

  return [
    [a.x + nx * padding, a.y + ny * padding],
    [b.x + nx * padding, b.y + ny * padding],
    [b.x - nx * padding, b.y - ny * padding],
    [a.x - nx * padding, a.y - ny * padding],
  ];
}

function convexHull(points) {
  const sorted = points
    .slice()
    .sort(([ax, ay], [bx, by]) => (ax === bx ? ay - by : ax - bx));

  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function inflatePolygon(points, padding = 18) {
  const centroid = getCentroid(points);
  return points.map(([x, y]) => {
    const dx = x - centroid.x;
    const dy = y - centroid.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      return [x + padding, y];
    }
    return [x + (dx / length) * padding, y + (dy / length) * padding];
  });
}

function buildSectorPolygon(planets) {
  const coords = planets.map((planet) => [planet.x, planet.y]);

  if (coords.length === 1) {
    return createHexagon(coords[0][0], coords[0][1], 40);
  }

  if (coords.length === 2) {
    return buildSegmentPolygon(
      { x: coords[0][0], y: coords[0][1] },
      { x: coords[1][0], y: coords[1][1] },
      26
    );
  }

  const hull = convexHull(coords);
  if (hull.length <= 2) {
    return createHexagon(coords[0][0], coords[0][1], 40);
  }

  return inflatePolygon(hull, 18);
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
    const group = groups.get(key) || {
      name: key.toUpperCase(),
      planets: [],
    };

    group.planets.push(planet);
    groups.set(key, group);
  }

  const sectorSites = Array.from(groups.entries()).map(([key, group]) => {
    const points = group.planets.map((planet) => [planet.x, planet.y]);
    const centroid = getCentroid(points);
    return {
      id: key.toLowerCase().replace(/\s+/g, '-'),
      name: group.name,
      faction: getSectorFaction(group.planets),
      x: centroid.x,
      y: centroid.y,
    };
  });

  const allXs = planets.map((planet) => planet.x);
  const allYs = planets.map((planet) => planet.y);
  const minX = Math.min(...allXs) - 80;
  const maxX = Math.max(...allXs) + 80;
  const minY = Math.min(...allYs) - 80;
  const maxY = Math.max(...allYs) + 80;
  const bounds = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];

  return sectorSites.map((site) => {
    const rawCell = buildVoronoiCell(site, sectorSites, bounds);
    const cell = rawCell.length ? rawCell : createHexagon(site.x, site.y, 60);
    const centroid = getCentroid(cell);

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
  const [rawPlanets, warIdResponse] = await Promise.all([
    fetchJson('/api/v1/planets'),
    fetchJson('/raw/api/WarSeason/current/WarID'),
  ]);

  const warId = warIdResponse?.id;
  const warInfo = warId ? await fetchJson(`/raw/api/WarSeason/${warId}/WarInfo`) : null;
  const planetInfos = Array.isArray(warInfo?.planetInfos) ? warInfo.planetInfos : [];
  const planetInfoByIndex = new Map(planetInfos.map((info) => [String(info.index), info]));

  const planets = Array.isArray(rawPlanets)
    ? rawPlanets.map((raw) => normalizePlanet(raw, planetInfoByIndex.get(String(raw.index))))
    : [];

  const planetsByIndex = new Map(planets.map((planet) => [String(planet.index), planet]));
  const connections = buildConnections(planetsByIndex, planetInfos);
  const sectors = buildSectors(planets);

  const warInfoPayload = warInfo
    ? {
        warId: warInfo.warId,
        startDate: warInfo.startDate,
        endDate: warInfo.endDate,
        layoutVersion: warInfo.layoutVersion,
      }
    : null;

  return {
    planets,
    connections,
    sectors,
    warInfo: warInfoPayload,
  };
}

export default fetchGalacticMap;
