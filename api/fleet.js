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

    // Cache the result at Vercel's edge for 5 minutes.
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

    return res.status(502).json({
      error: "Failed to retrieve fleet data",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
}


/**
 * Get the commissioned fleet from a clan's HD2Clans hangar.
 *
 * IMPORTANT:
 * We deliberately only collect links between:
 *
 *     "Clan Fleet Registry"
 *
 * and
 *
 *     "Super Destroyers"
 *
 * This means Super Destroyers are excluded by structure,
 * rather than by checking their name.
 */
async function getClanFleet(clanId) {
  const hangarUrl = `${HD2CLANS_BASE}/clan/${clanId}/hangar`;

  const html = await fetchHtml(hangarUrl);
  const $ = cheerio.load(html);

  const registryHeading = findHeading(
    $,
    "Clan Fleet Registry"
  );

  if (!registryHeading) {
    throw new Error(
      "Could not find Clan Fleet Registry on HD2Clans"
    );
  }

  const shipUrls = [];

  /*
   * Walk through the siblings after the registry heading.
   *
   * We stop BEFORE the Super Destroyers heading.
   */
  let element = registryHeading.next();

  while (element.length) {
    if (
      isHeading(element, "Super Destroyers")
    ) {
      break;
    }

    element
      .find('a[href*="/hangar/ship/"]')
      .each((_, link) => {
        const href = $(link).attr("href");

        if (!href) {
          return;
        }

        const absoluteUrl = new URL(
          href,
          HD2CLANS_BASE
        ).href;

        if (!shipUrls.includes(absoluteUrl)) {
          shipUrls.push(absoluteUrl);
        }
      });

    element = element.next();
  }

  /*
   * Fetch the individual ship pages.
   *
   * Promise.all is fine here because a normal clan fleet is
   * only a handful of ships.
   */
  const ships = await Promise.all(
    shipUrls.map((url) => getShip(url))
  );

  return ships.filter(Boolean);
}


/**
 * Extract the useful information from an individual ship page.
 */
async function getShip(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  /*
   * Ship name
   *
   * The current HD2Clans page has the ship name in the
   * main H1.
   */
  const name = $("h1")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();

  if (!name) {
    throw new Error(`Could not determine ship name: ${url}`);
  }

  /*
   * Ship class
   *
   * On the current page the class is a link immediately
   * below the ship name.
   */
  const shipClass = extractShipClass($);

  /*
   * Location
   *
   * HD2Clans currently renders:
   *
   * Location: <planet/location>
   *
   * We specifically look for the label instead of trying
   * to infer the location from arbitrary text.
   */
  const location = extractLocation($);

  return {
    name,
    class: shipClass,
    location,
  };
}


/**
 * Find the ship class from the class link on the ship page.
 */
function extractShipClass($) {
  let shipClass = null;

  /*
   * The current ship page puts the class as a link
   * immediately after the H1.
   *
   * Look through links for the known class naming convention.
   */
  $("a").each((_, element) => {
    if (shipClass) {
      return;
    }

    const text = $(element)
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (
      text.endsWith("-Class Corvette") ||
      text.endsWith("-Class Escort Frigate") ||
      text.endsWith("-Class Light Cruiser") ||
      text.endsWith("-Class Heavy Cruiser") ||
      text.endsWith("-Class Destroyer") ||
      text.endsWith("-Class Battleship") ||
      text.endsWith("-Class Carrier")
    ) {
      shipClass = text;
    }
  });

  return shipClass;
}


/**
 * Extract "Location:" from the ship page.
 */
function extractLocation($) {
  const bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  const match = bodyText.match(
    /Location:\s*(.+?)(?=\s+Returns in|\s+Drydock Yard|\s+Repair Type|$)/i
  );

  return match ? match[1].trim() : null;
}



/**
 * Fetch HTML from HD2Clans.
 */
async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "SEAF Fleet Integration/1.0 (+https://seaf-lemon.vercel.app)",
      Accept: "text/html",
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
 * Find an H2/H3/etc. heading with the specified text.
 */
function findHeading($, text) {
  let result = null;

  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    if (result) {
      return;
    }

    const heading = $(element)
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (heading.toLowerCase() === text.toLowerCase()) {
      result = $(element);
    }
  });

  return result;
}


/**
 * Determine whether an element is a heading with specific text.
 */
function isHeading(element, text) {
  const tagName = element[0]?.name;

  if (!tagName || !/^h[1-6]$/i.test(tagName)) {
    return false;
  }

  return (
    element
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase() === text.toLowerCase()
  );
}
