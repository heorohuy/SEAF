const API_URL =
  "https://helldivers.wiki.gg/api.php";

const CACHE_KEY =
  "seaf-stratagem-catalog-v2";

const CACHE_TTL =
  1000 * 60 * 60 * 6;

let catalogPromise = null;

const descriptionCache = new Map();

const NAME_ALIASES = {
  "B-1 Supply Pack": "B-1 Supply Pack",

  "AC-8 Autocannon": "AC-8 Autocannon",

  "GR-8 Recoilless Rifle":
    "GR-8 Recoilless Rifle",

  "FAF-14 Spear":
    "FAF-14 Spear",

  "Orbital 120 HE Barrage":
    "Orbital 120MM HE Barrage",

  "Eagle 500KG":
    "Eagle 500KG Bomb",

  "M-102 Fast Recon Vehicle":
    "M-102 Fast Recon Vehicle",

  "M-103 Supply FRV":
    "M-103 Supply FRV",

  "M-104 Incinerator FRV":
    "M-104 Incinerator FRV",

  "TD-220 Bastion":
    "TD-220 Bastion MK XVI",

  "Ballistic Shield":
    "Ballistic Shield Backpack",
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

  const matches = text.match(
    /\b(up|down|left|right)\b/gi
  );

  return matches
    ? matches.map((item) =>
        item.toLowerCase()
      )
    : [];
}

function parseTraits(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(clean)
      .filter(Boolean);
  }

  return String(value)
    .replace(/<[^>]*>/g, "")
    .split(/[,;•|]/)
    .map(clean)
    .filter(Boolean);
}

function formatCooldown(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(
    String(value).replace(/[^\d.]/g, "")
  );

  if (!Number.isFinite(number)) {
    return clean(value);
  }

  if (number >= 60) {
    const minutes = number / 60;

    if (Number.isInteger(minutes)) {
      return `${minutes}m`;
    }
  }

  return `${number}s`;
}

function formatUses(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const normalized = clean(value);

  if (
    normalized === "4294967295" ||
    normalized === "-1" ||
    normalized.toLowerCase() ===
      "unlimited"
  ) {
    return "Unlimited";
  }

  return normalized;
}

function formatCallInTime(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(
    String(value).replace(/[^\d.]/g, "")
  );

  if (!Number.isFinite(number)) {
    return clean(value);
  }

  return `${number}s`;
}

function getWikiUrl(name) {
  if (!name) {
    return null;
  }

  return (
    "https://helldivers.wiki.gg/wiki/" +
    encodeURIComponent(
      name.replace(/ /g, "_")
    )
  );
}

function normalizeEntry(row) {
  const data =
    row?.title || row || {};

  const name = clean(
    data.title ||
      data.name ||
      data._pageName
  );

  const permitType =
    clean(
      data.permit_type ||
        data.permit ||
        data.category
    ) || null;

  const stratagemType =
    clean(
      data.stratagem_type ||
        data.type
    ) || null;

  const source =
    clean(data.source) || null;

  const cooldown =
    formatCooldown(
      data.base_cooldown ??
        data.cooldown
    );

  const callInTime =
    formatCallInTime(
      data.call_in_time ??
        data.callin_time ??
        data.call_in
    );

  const uses =
    formatUses(data.uses);

  const traits =
    parseTraits(data.traits);

  const code =
    parseCode(
      data.stratagem_code ??
        data.code
    );

  return {
    name,

    lookupName:
      normalizeName(name),

    permitType,

    stratagemType,

    /*
     * Keep "type" for backwards compatibility
     * with the existing UI.
     */
    type:
      stratagemType ||
      permitType ||
      null,

    source,

    unlockLevel:
      clean(
        data.unlock_level
      ) || null,

    unlockCost:
      clean(
        data.unlock_cost
      ) || null,

    cooldown,

    callInTime,

    uses,

    traits,

    code,

    codeDisplay:
      code.join(" "),

    wikiUrl:
      getWikiUrl(name),
  };
}

async function fetchCatalog() {
  /*
   * These are the useful fields exposed by the
   * Helldivers Wiki Stratagems Cargo table.
   *
   * The extra aliases are harmless if the wiki
   * does not populate them.
   */
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
    "call_in_time",
    "uses",
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

  const response =
    await fetch(
      `${API_URL}?${params.toString()}`
    );

  if (!response.ok) {
    throw new Error(
      `Stratagem API returned ${response.status}`
    );
  }

  const json =
    await response.json();

  if (
    !Array.isArray(
      json?.cargoquery
    )
  ) {
    throw new Error(
      "Invalid stratagem catalog response"
    );
  }

  return json.cargoquery
    .map(normalizeEntry)
    .filter(
      (item) => item.name
    );
}

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
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Cache failures must never break the page.
  }
}

export async function getStratagemCatalog() {
  if (catalogPromise) {
    return catalogPromise;
  }

  const cached =
    readCache();

  if (cached) {
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
          "Unable to load stratagem catalog:",
          error
        );

        return [];
      });

  return catalogPromise;
}

export function findStratagem(
  catalog,
  name
) {
  if (
    !Array.isArray(catalog) ||
    !name
  ) {
    return null;
  }

  const requested =
    clean(name);

  const normalized =
    normalizeName(requested);

  return (
    catalog.find(
      (item) =>
        clean(item.name)
          .toLowerCase() ===
        requested.toLowerCase()
    ) ||
    catalog.find(
      (item) =>
        clean(item.lookupName)
          .toLowerCase() ===
        requested.toLowerCase()
    ) ||
    catalog.find(
      (item) =>
        clean(item.name)
          .toLowerCase() ===
        normalized.toLowerCase()
    ) ||
    null
  );
}

export async function getStratagemDescription(
  name
) {
  const pageName =
    normalizeName(name);

  if (
    descriptionCache.has(
      pageName
    )
  ) {
    return descriptionCache.get(
      pageName
    );
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
      page?.extract?.trim() ||
      null;

    descriptionCache.set(
      pageName,
      description
    );

    return description;
  } catch (error) {
    console.warn(
      "Unable to load stratagem description:",
      error
    );

    return null;
  }
}

export function clearStratagemCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Cache clearing should never break the page.
  }

  /*
   * Clear the in-memory request cache as well.
   *
   * This is important because removing localStorage alone
   * would still allow an existing catalogPromise to be reused.
   */
  catalogPromise = null;

  /*
   * Descriptions are cached separately in memory.
   */
  descriptionCache.clear(); 
}
