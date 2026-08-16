const API_URL =
  "https://helldivers.wiki.gg/api.php";

const CACHE_KEY =
  "seaf-stratagem-catalog-v2";

const CACHE_TTL =
  1000 * 60 * 60 * 6;

let catalogPromise = null;

const descriptionCache = new Map();

/*
 * ---------------------------------------------------------------------------
 * NAME NORMALIZATION
 * ---------------------------------------------------------------------------
 */

const NAME_ALIASES = {
  "B-1 Supply Pack": "B-1 Supply Pack",

  "AC-8 Autocannon": "AC-8 Autocannon",
  Autocannon: "AC-8 Autocannon",

  "GR-8 Recoilless Rifle":
    "GR-8 Recoilless Rifle",
  "Recoilless Rifle":
    "GR-8 Recoilless Rifle",

  "FAF-14 Spear": "FAF-14 Spear",
  Spear: "FAF-14 Spear",

  "Orbital 120 HE Barrage":
    "Orbital 120MM HE Barrage",

  "Eagle 500KG":
    "Eagle 500kg Bomb",

  "Eagle 500KG Bomb":
    "Eagle 500kg Bomb",

  "M-102 Fast Recon Vehicle":
    "M-102 Fast Recon Vehicle",

  "Fast Recon Vehicle":
    "M-102 Fast Recon Vehicle",

  "M-103 Supply FRV":
    "M-103 Supply FRV",

  "Supply FRV":
    "M-103 Supply FRV",

  "M-104 Incinerator FRV":
    "M-104 Incinerator FRV",

  "Incendiary FRV":
    "M-104 Incinerator FRV",

  "TD-220 Bastion":
    "TD-220 Bastion",

  "TD-220 Bastion MK XVI":
    "TD-220 Bastion",
};

function clean(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(name) {
  const value = clean(name);

  return (
    NAME_ALIASES[value] ||
    value
  );
}

/*
 * This is used for matching only.
 *
 * Examples:
 *
 * "B-1 Supply Pack"
 * "b 1 supply pack"
 * "B-1  Supply Pack"
 *
 * all become the same lookup key.
 */
function lookupKey(name) {
  return normalizeName(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/*
 * ---------------------------------------------------------------------------
 * STRATAGEM CODE
 * ---------------------------------------------------------------------------
 */

function parseCode(value) {
  if (!value) {
    return [];
  }

  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&uarr;/gi, " up ")
    .replace(/&darr;/gi, " down ")
    .replace(/&larr;/gi, " left ")
    .replace(/&rarr;/gi, " right ")
    .replace(/↑/g, " up ")
    .replace(/↓/g, " down ")
    .replace(/←/g, " left ")
    .replace(/→/g, " right ");

  const matches =
    text.match(
      /\b(up|down|left|right)\b/gi
    );

  return matches
    ? matches.map((item) =>
        item.toLowerCase()
      )
    : [];
}

/*
 * ---------------------------------------------------------------------------
 * TRAITS
 * ---------------------------------------------------------------------------
 */

function parseTraits(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .split(/[,;•]/)
    .map((item) => clean(item))
    .filter(Boolean);
}

/*
 * ---------------------------------------------------------------------------
 * COOLDOWN
 * ---------------------------------------------------------------------------
 */

function formatCooldown(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const raw = clean(value);

  if (!raw) {
    return null;
  }

  const number = Number(
    raw.replace(/[^\d.]/g, "")
  );

  if (!Number.isFinite(number)) {
    return raw;
  }

  if (number >= 60) {
    const minutes = number / 60;

    if (Number.isInteger(minutes)) {
      return `${minutes}m`;
    }

    return `${minutes.toFixed(1)}m`;
  }

  return `${number}s`;
}

/*
 * ---------------------------------------------------------------------------
 * CARGO ROW NORMALIZATION
 * ---------------------------------------------------------------------------
 *
 * Cargo API returns:
 *
 * {
 *   title: {
 *     title: "...",
 *     permit_type: "...",
 *     ...
 *   }
 * }
 */

function normalizeEntry(row) {
  const data =
    row?.title || row || {};

  const name = clean(
    data.title ||
    data.name ||
    data._pageName ||
    data.page ||
    data.page_name
  );

  if (!name) {
    return null;
  }

  const canonicalName =
    normalizeName(name);

  return {
    name,

    canonicalName,

    lookupName:
      canonicalName,

    lookupKey:
      lookupKey(canonicalName),

    permitType:
      clean(data.permit_type) ||
      null,

    type:
      clean(
        data.stratagem_type ||
        data.type
      ) ||
      null,

    source:
      clean(
        data.source ||
        data.ship_module
      ) ||
      null,

    unlockLevel:
      clean(data.unlock_level) ||
      null,

    unlockCost:
      clean(data.unlock_cost) ||
      null,

    cooldown:
      formatCooldown(
        data.base_cooldown ||
        data.cooldown
      ),

    traits:
      parseTraits(data.traits),

    code:
      parseCode(
        data.stratagem_code
      ),

    wikiUrl:
      `https://helldivers.wiki.gg/wiki/${encodeURIComponent(
        name.replace(/ /g, "_")
      )}`,
  };
}

/*
 * ---------------------------------------------------------------------------
 * CATALOG FETCH
 * ---------------------------------------------------------------------------
 */

async function fetchCatalog() {
  const fields = [
    "title",
    "permit_type",
    "unlock_level",
    "unlock_cost",
    "source",
    "traits",
    "stratagem_code",
    "stratagem_type",
    "base_cooldown",
  ].join(",");

  const params =
    new URLSearchParams({
      action: "cargoquery",
      tables: "Stratagems",
      fields,
      limit: "500",
      format: "json",
      origin: "*",
    });

  const url =
    `${API_URL}?${params.toString()}`;

  console.log(
    "[SEAF] Loading stratagem catalog..."
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Stratagem API returned ${response.status}`
    );
  }

  const json =
    await response.json();

  if (json?.error) {
    throw new Error(
      json.error.info ||
      "Cargo API returned an error"
    );
  }

  if (
    !Array.isArray(
      json?.cargoquery
    )
  ) {
    throw new Error(
      "Invalid stratagem catalog response"
    );
  }

  const catalog =
    json.cargoquery
      .map(normalizeEntry)
      .filter(Boolean);

  /*
   * IMPORTANT:
   *
   * Never consider an empty catalog
   * a successful catalog request.
   */
  if (catalog.length === 0) {
    throw new Error(
      "Stratagem catalog returned zero usable entries"
    );
  }

  console.log(
    `[SEAF] Loaded ${catalog.length} stratagem records`
  );

  return catalog;
}

/*
 * ---------------------------------------------------------------------------
 * CACHE
 * ---------------------------------------------------------------------------
 */

function readCache() {
  try {
    const value =
      localStorage.getItem(
        CACHE_KEY
      );

    if (!value) {
      return null;
    }

    const cached =
      JSON.parse(value);

    if (
      !cached?.timestamp ||
      !Array.isArray(cached.data)
    ) {
      return null;
    }

    /*
     * Empty caches are invalid.
     */
    if (cached.data.length === 0) {
      localStorage.removeItem(
        CACHE_KEY
      );

      return null;
    }

    if (
      Date.now() -
        cached.timestamp >
      CACHE_TTL
    ) {
      return null;
    }

    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  /*
   * Never cache an empty catalog.
   */
  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return;
  }

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Cache failure must never break the page.
  }
}

/*
 * ---------------------------------------------------------------------------
 * PUBLIC CATALOG API
 * ---------------------------------------------------------------------------
 */

export async function getStratagemCatalog() {
  if (catalogPromise) {
    return catalogPromise;
  }

  const cached =
    readCache();

  if (cached?.length) {
    console.log(
      `[SEAF] Using cached stratagem catalog (${cached.length})`
    );

    return cached;
  }

  catalogPromise =
    fetchCatalog()
      .then((catalog) => {
        writeCache(catalog);

        return catalog;
      })
      .catch((error) => {
        catalogPromise = null;

        console.warn(
          "[SEAF] Unable to load stratagem catalog:",
          error
        );

        /*
         * Metadata failure must NOT prevent
         * RegimentsPage from rendering.
         */
        return [];
      });

  return catalogPromise;
}

/*
 * ---------------------------------------------------------------------------
 * STRATAGEM LOOKUP
 * ---------------------------------------------------------------------------
 *
 * This is exported so RegimentsPage does not need
 * to perform fragile .find() logic itself.
 */

export function findStratagem(
  catalog,
  name
) {
  if (
    !Array.isArray(catalog) ||
    !catalog.length ||
    !name
  ) {
    return null;
  }

  const key =
    lookupKey(name);

  return (
    catalog.find(
      (item) =>
        item.lookupKey === key
    ) ||
    catalog.find(
      (item) =>
        lookupKey(item.name) === key
    ) ||
    null
  );
}

/*
 * ---------------------------------------------------------------------------
 * DESCRIPTION
 * ---------------------------------------------------------------------------
 */

export async function getStratagemDescription(
  name
) {
  const pageName =
    normalizeName(name);

  const key =
    lookupKey(pageName);

  if (
    descriptionCache.has(key)
  ) {
    return descriptionCache.get(key);
  }

  const params =
    new URLSearchParams({
      action: "query",
      prop: "extracts",
      exintro: "1",
      explaintext: "1",
      redirects: "1",
      titles: pageName,
      format: "json",
      origin: "*",
    });

  try {
    const response =
      await fetch(
        `${API_URL}?${params.toString()}`
      );

    if (!response.ok) {
      return null;
    }

    const json =
      await response.json();

    const pages =
      json?.query?.pages || {};

    const page =
      Object.values(pages)[0];

    const description =
      clean(page?.extract) ||
      null;

    descriptionCache.set(
      key,
      description
    );

    return description;
  } catch (error) {
    console.warn(
      "[SEAF] Unable to load stratagem description:",
      error
    );

    return null;
  }
}
