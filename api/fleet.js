import * as cheerio from "cheerio";

const HD2CLANS_BASE = "https://hd2clans.com";
const DEFAULT_CLAN_ID = "1108";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const clanId = String(req.query.clan || DEFAULT_CLAN_ID);

  if (!/^\d+$/.test(clanId)) {
    return res.status(400).json({
      error: "Invalid clan ID",
    });
  }

  try {
    const ships = await getClanFleet(clanId);

    // Cache for 5 minutes.
    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      clanId: Number(clanId),
      ships,
    });
  } catch (error) {
    console.error("Fleet API error:", error);

    // Return the actual error while we're getting this working.
    return res.status(500).json({
      error: "Failed to retrieve fleet data",
      message: error?.message || String(error),
    });
  }
}


/**
 * Get commissioned ships from the clan hangar.
 *
 * Super Destroyers are excluded by section:
 *
 * Clan Fleet Registry
 *       ↓
 *   commissioned ships
 *       ↓
 * Super Destroyers
 */
async function getClanFleet(clanId) {
  const hangarUrl = `${HD2CLANS_BASE}/clan/${clanId}/hangar`;

  const html = await fetchHtml(hangarUrl);
  const $ = cheerio.load(html);

  // Get every element in document order.
  const elements = $("body *").toArray();

  const registryHeading = elements.find((element) => {
    return (
      /^h[1-6]$/i.test(element.name) &&
      cleanText($(element).text()).toLowerCase() ===
        "clan fleet registry"
    );
  });

  if (!registryHeading) {
    throw new Error(
      "Could not find 'Clan Fleet Registry' heading"
    );
  }

  const superDestroyerHeading = elements.find((element) => {
    return (
      /^h[1-6]$/i.test(element.name) &&
      cleanText($(element).text()).toLowerCase() ===
        "super destroyers"
    );
  });

  if (!superDestroyerHeading) {
    throw new Error(
      "Could not find 'Super Destroyers' heading"
    );
  }

  const registryIndex = elements.indexOf(registryHeading);
  const superDestroyerIndex =
    elements.indexOf(superDestroyerHeading);

  if (registryIndex === -1 || superDestroyerIndex === -1) {
    throw new Error(
      "Could not determine fleet section boundaries"
    );
  }

  if (registryIndex >= superDestroyerIndex) {
    throw new Error(
      "Fleet section boundaries are in an invalid order"
    );
  }

  /*
   * Only look at links between the two headings.
   *
   * This is the important part:
   *
   * Super Destroyer links occur AFTER superDestroyerIndex,
   * so they are never included.
   */
  const shipUrls = [];

  elements.forEach((element, index) => {
    if (
      index <= registryIndex ||
      index >= superDestroyerIndex
    ) {
      return;
    }

    if (
      element.name !== "a" ||
      !element.attribs?.href
    ) {
      return;
    }

    const href = element.attribs.href;

    if (!href.includes("/hangar/ship/")) {
      return;
    }

    const url = new URL(
      href,
      HD2CLANS_BASE
    ).href;

    if (!shipUrls.includes(url)) {
      shipUrls.push(url);
    }
  });

  if (shipUrls.length === 0) {
    throw new Error(
      "No commissioned ships found in Clan Fleet Registry"
    );
  }

  console.log(
    `Found ${shipUrls.length} commissioned ships for clan ${clanId}`
  );

  /*
   * Fetch each individual ship page.
   */
  const ships = await Promise.all(
    shipUrls.map((url) => getShip(url))
  );

  return ships;
}


/**
 * Parse an individual ship page.
 */
async function getShip(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  /*
   * Name
   *
   * Current HD2Clans structure:
   *
   * # FNS Apex Directive
   */
  const name = cleanText($("h1").first().text());

  if (!name) {
    throw new Error(
      `Could not find ship name: ${url}`
    );
  }


  /*
   * Class
   *
   * Current structure:
   *
   * <a>Freedom-Class Light Cruiser</a>
   */
  let shipClass = null;

  $("a").each((_, element) => {
    if (shipClass) {
      return;
    }

    const text = cleanText($(element).text());

    /*
     * All ship classes on HD2Clans use "-Class".
     */
    if (/-Class\s+/i.test(text)) {
      shipClass = text;
    }
  });

  if (!shipClass) {
    throw new Error(
      `Could not find ship class for "${name}"`
    );
  }


  /*
   * Location
   *
   * Current structure:
   *
   * Location: Senge 23
   *
   * Returns in
   */
  const bodyText = cleanText($("body").text());

  const locationMatch = bodyText.match(
    /Location:\s*(.+?)\s+Returns in/i
  );

  if (!locationMatch) {
    throw new Error(
      `Could not find location for "${name}"`
    );
  }

  const location = locationMatch[1].trim();

  return {
    name,
    class: shipClass,
    location,
  };
}


/**
 * Fetch a page from HD2Clans.
 */
async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SEAF-Fleet-Integration/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `HD2Clans returned HTTP ${response.status} for ${url}`
    );
  }

  return response.text();
}


/**
 * Normalize whitespace.
 */
function cleanText(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .trim();
}
