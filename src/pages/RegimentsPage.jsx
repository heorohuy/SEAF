import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronUp,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";

import NavigationMenu from "../components/NavigationMenu";
import {
  getSheetData,
} from "../api/sicarisLoadouts.js";

import {
  getStratagemCatalog,
  getStratagemDescription,
  findStratagem,
  clearStratagemCache,
} from "../api/stratagems.js";

import "./RegimentsPage.css";
import SiteFooter from "../components/SiteFooter";


/*
 * ---------------------------------------------------------------------------
 * SHEET PARSING
 * ---------------------------------------------------------------------------
 */

const SLOT_PATTERN =
  /^SLOT\s+(\d+)/i;

function cleanCell(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function cleanStratagemName(value) {
  return cleanCell(value)
    .replace(
      /\s*\([^)]*\)\s*$/,
      ""
    )
    .trim();
}

function parseLoadouts(rows) {
  if (
    !Array.isArray(rows) ||
    rows.length < 2
  ) {
    return [];
  }

  const columnCount =
    Math.max(
      0,
      ...rows.map((row) =>
        Array.isArray(row)
          ? row.length
          : 0
      )
    );

  const loadouts = [];

  for (
    let columnIndex = 0;
    columnIndex < columnCount;
    columnIndex += 1
  ) {
    const regimentName =
      cleanCell(
        rows[1]?.[columnIndex]
      );

    if (!regimentName) {
      continue;
    }

    const slots = [];

    let currentSlot = null;
    let expectingCategory = false;

    for (
      let rowIndex = 2;
      rowIndex < rows.length;
      rowIndex += 1
    ) {
      const value =
        cleanCell(
          rows[rowIndex]?.[
          columnIndex
          ]
        );

      if (!value) {
        continue;
      }

      const slotMatch =
        value.match(
          SLOT_PATTERN
        );

      if (slotMatch) {
        const categoryFromSlot =
          value
            .replace(
              SLOT_PATTERN,
              ""
            )
            .trim();

        currentSlot = {
          number: Number(
            slotMatch[1]
          ),
          label:
            `SLOT ${slotMatch[1]}`,
          category:
            categoryFromSlot,
          items: [],
        };

        slots.push(
          currentSlot
        );

        expectingCategory =
          !categoryFromSlot;

        continue;
      }

      if (!currentSlot) {
        continue;
      }

      if (expectingCategory) {
        currentSlot.category =
          value;

        expectingCategory =
          false;

        continue;
      }

      const itemName =
        cleanStratagemName(
          value
        );

      if (!itemName) {
        continue;
      }

      currentSlot.items.push({
        name: itemName,
        category:
          currentSlot.category,
      });
    }

    const validSlots =
      slots.filter(
        (slot) =>
          Boolean(
            slot.category
          )
      );

    if (
      validSlots.length > 0
    ) {
      loadouts.push({
        title:
          regimentName,
        slots:
          validSlots,
      });
    }
  }

  return loadouts;
}

/*
 * ---------------------------------------------------------------------------
 * STRATAGEM ICONS
 * ---------------------------------------------------------------------------
 */

const ICON_ROOT =
  [
    "https:",
    "",
    "raw.githubusercontent.com",
  ].join("//") +
  "/nvigneux/Helldivers-2-Stratagems-icons-svg/master";

const ICON_FOLDERS = [
  "Engineering Bay",
  "Patriotic Administration Center",
  "Bridge",
  "Hangar",
  "Robotics Workshop",
  "General Stratagems",
  "Siege Breakers",
  "Borderline Justice",
  "Chemical Agents",
  "Control Group",
  "Dust Devils",
  "Entrenched Division",
  "Exo Experts",
  "Force of Law",
  "Masters of Ceremony",
  "Python Commandos",
  "Redacted Regiment",
  "Servants of Freedom",
  "Urban Legends",
  "Orbital Cannons",
];

const ICON_OVERRIDES = {
  "B-1 Supply Pack": [
    "Engineering Bay",
    "Supply Pack",
  ],

  "Ballistic Shield": [
    "Engineering Bay",
    "Ballistic Shield Backpack",
  ],

  "Ballistic Shield Backpack": [
    "Engineering Bay",
    "Ballistic Shield Backpack",
  ],

  "Guard Dog": [
    "Robotics Workshop",
    "Guard Dog",
  ],

  "Guard Dog Rover": [
    "Engineering Bay",
    "Guard Dog Rover",
  ],

  "Machine Gun": [
    "Patriotic Administration Center",
    "Machine Gun",
  ],

  "Anti Materiel Rifle": [
    "Patriotic Administration Center",
    "Anti-Materiel Rifle",
  ],

  "Anti-Materiel Rifle": [
    "Patriotic Administration Center",
    "Anti-Materiel Rifle",
  ],

  "Grenade Launcher": [
    "Engineering Bay",
    "Grenade Launcher",
  ],

  "Railgun": [
    "Patriotic Administration Center",
    "Railgun",
  ],

  "Flamethrower": [
    "Patriotic Administration Center",
    "Flamethrower",
  ],

  "Arc Thrower": [
    "Engineering Bay",
    "Arc Thrower",
  ],

  "Commando": [
    "Patriotic Administration Center",
    "Commando",
  ],

  "Heavy Machine Gun": [
    "Patriotic Administration Center",
    "Heavy Machine Gun",
  ],

  "Laser Cannon": [
    "Engineering Bay",
    "Laser Cannon",
  ],

  "Quasar Cannon": [
    "Engineering Bay",
    "Quasar Cannon",
  ],

  "HMG Emplacement": [
    "Bridge",
    "HMG Emplacement",
  ],

  "Grenadier Battlement": [
    "Bridge",
    "Grenadier Battlement",
  ],

  "Supply FRV": [
    "Hangar",
    "Supply FRV",
  ],

  "M-103 Supply FRV": [
    "Hangar",
    "Supply FRV",
  ],

  "M-102 Fast Recon Vehicle": [
    "Hangar",
    "Fast Recon Vehicle",
  ],

  "Fast Recon Vehicle": [
    "Hangar",
    "Fast Recon Vehicle",
  ],

  "Incendiary FRV": [
    "Hangar",
    "Incinerator FRV",
  ],

  "M-104 Incinerator FRV": [
    "Hangar",
    "Incinerator FRV",
  ],

  "FAF-14 Spear": [
    "Patriotic Administration Center",
    "Spear",
  ],

  "Spear": [
    "Patriotic Administration Center",
    "Spear",
  ],

  "AC-8 Autocannon": [
    "Patriotic Administration Center",
    "Autocannon",
  ],

  "Autocannon": [
    "Patriotic Administration Center",
    "Autocannon",
  ],

  "GR-8 Recoilless Rifle": [
    "Patriotic Administration Center",
    "Recoilless Rifle",
  ],

  "Recoilless Rifle": [
    "Patriotic Administration Center",
    "Recoilless Rifle",
  ],

  "Shield Generator Pack": [
    "Engineering Bay",
    "Shield Generator Pack",
  ],

  "Orbital 120 HE Barrage": [
    "Orbital Cannons",
    "Orbital 120MM HE Barrage",
  ],

  "Orbital 120MM HE Barrage": [
    "Orbital Cannons",
    "Orbital 120MM HE Barrage",
  ],

  "Orbital EMS Strike": [
    "Bridge",
    "Orbital EMS Strike",
  ],

  "Orbital Smoke Strike": [
    "Bridge",
    "Orbital Smoke Strike",
  ],

  "Orbital Walking Barrage": [
    "Orbital Cannons",
    "Orbital Walking Barrage",
  ],

  "Orbital Precision Strike": [
    "Bridge",
    "Orbital Precision Strike",
  ],

  "Orbital Gas Strike": [
    "Bridge",
    "Orbital Gas Strike",
  ],

  "Emancipator Exosuit": [
    "Robotics Workshop",
    "Emancipator Exosuit",
  ],

  "Patriot Exosuit": [
    "Robotics Workshop",
    "Patriot Exosuit",
  ],

  "Machine Gun Sentry": [
    "Robotics Workshop",
    "Machine Gun Sentry",
  ],

  "Mortar Sentry": [
    "Robotics Workshop",
    "Mortar Sentry",
  ],

  "EMS Mortar Sentry": [
    "Robotics Workshop",
    "EMS Mortar Sentry",
  ],

  "Autocannon Sentry": [
    "Robotics Workshop",
    "Autocannon Sentry",
  ],

  "Rocket Sentry": [
    "Robotics Workshop",
    "Rocket Sentry",
  ],

  "Gatling Sentry": [
    "Robotics Workshop",
    "Gatling Sentry",
  ],

  "Tesla Tower": [
    "Bridge",
    "Tesla Tower",
  ],

  "Incendiary Mines": [
    "Engineering Bay",
    "Incendiary Mines",
  ],

  "Anti-Personnel Minefield": [
    "Engineering Bay",
    "Anti-Personnel Minefield",
  ],

  "Eagle 500KG": [
    "Hangar",
    "Eagle 500KG Bomb",
  ],

  "Eagle 500KG Bomb": [
    "Hangar",
    "Eagle 500KG Bomb",
  ],

  "Eagle Cluster Bomb": [
    "Hangar",
    "Eagle Cluster Bomb",
  ],

  "Eagle Strafing Run": [
    "Hangar",
    "Eagle Strafing Run",
  ],

  "Eagle Airstrike": [
    "Hangar",
    "Eagle Airstrike",
  ],

  "Eagle Napalm Airstrike": [
    "Hangar",
    "Eagle Napalm Airstrike",
  ],

  "Eagle Smoke Strike": [
    "Hangar",
    "Eagle Smoke Strike",
  ],

  "Jump Pack": [
    "Hangar",
    "Jump Pack",
  ],

  "TD-220 Bastion": [
    "Siege Breakers",
    "Bastion MK XVI",
  ],

  "TD-220 Bastion MK XVI": [
    "Siege Breakers",
    "Bastion MK XVI",
  ],
};

function encodePathPart(value) {
  return encodeURIComponent(
    value
  );
}

function buildIconCandidates(name) {
  const cleanedName =
    cleanStratagemName(
      name
    );

  const candidates = [];

  const exactOverride =
    ICON_OVERRIDES[
    cleanedName
    ];

  if (exactOverride) {
    candidates.push(
      `${ICON_ROOT}/${encodePathPart(
        exactOverride[0]
      )}/${encodePathPart(
        exactOverride[1]
      )}.svg`
    );
  }

  for (
    const folder of ICON_FOLDERS
  ) {
    const candidate =
      `${ICON_ROOT}/${encodePathPart(
        folder
      )}/${encodePathPart(
        cleanedName
      )}.svg`;

    if (
      !candidates.includes(
        candidate
      )
    ) {
      candidates.push(
        candidate
      );
    }
  }

  return candidates;
}

function StratagemIcon({
  name,
}) {
  const candidates =
    useMemo(
      () =>
        buildIconCandidates(
          name
        ),
      [name]
    );

  const [
    candidateIndex,
    setCandidateIndex,
  ] = useState(0);

  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(false);
  }, [name]);

  if (
    failed ||
    candidates.length === 0
  ) {
    return (
      <div
        className="regiment-icon-fallback"
        aria-hidden="true"
      >
        <Shield size={27} />
      </div>
    );
  }

  return (
    <img
      src={
        candidates[
        candidateIndex
        ]
      }
      alt=""
      className="regiment-stratagem-icon"
      onError={() => {
        if (
          candidateIndex + 1 <
          candidates.length
        ) {
          setCandidateIndex(
            (index) =>
              index + 1
          );
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

/*
 * ---------------------------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------------------------
 */

function getDirectionSymbol(
  direction
) {
  const symbols = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
  };

  return (
    symbols[direction] ||
    "?"
  );
}

function getStratagemInfoFallback(
  name,
  category
) {
  return {
    name,

    type:
      category ||
      "STRATAGEM",

    permitType: null,

    stratagemType:
      category ||
      null,

    source: null,

    unlockLevel: null,

    unlockCost: null,

    cooldown: null,

    callInTime: null,

    uses: null,

    traits: [],

    code: [],

    codeDisplay: "",

    wikiUrl:
      name
        ? `https://helldivers.wiki.gg/wiki/${encodeURIComponent(
          name.replace(/ /g, "_")
        )}`
        : null,
  };
}



/*
 * ---------------------------------------------------------------------------
 * STRATAGEM BUTTON
 * ---------------------------------------------------------------------------
 */

function StratagemButton({
  name,
  category,
  expanded,
  onClick,
  catalog,
}) {
  const catalogInfo =
    findStratagem(
      catalog,
      name
    );

  const [
    description,
    setDescription,
  ] = useState(null);

  const [
    descriptionLoading,
    setDescriptionLoading,
  ] = useState(false);

  useEffect(() => {
    if (
      !expanded ||
      description
    ) {
      return;
    }

    let cancelled = false;

    setDescriptionLoading(
      true
    );

    getStratagemDescription(
      name
    )
      .then((value) => {
        if (!cancelled) {
          setDescription(
            value
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDescriptionLoading(
            false
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    expanded,
    name,
    description,
  ]);

  const info =
    catalogInfo ||
    getStratagemInfoFallback(
      name,
      category
    );

  return (
    <div
      className={
        `regiment-stratagem ${expanded
          ? "regiment-stratagem-expanded"
          : ""
        }`
      }
    >
      <button
        type="button"
        className="regiment-stratagem-button"
        onClick={onClick}
        aria-expanded={expanded}
        aria-label={`View ${name}`}
      >
        <span className="regiment-stratagem-icon-wrap">
          <StratagemIcon
            name={name}
          />
        </span>

        <span className="regiment-stratagem-hover-name">
          {name}
        </span>
      </button>

      {expanded && (
        <div className="regiment-stratagem-details">
          <div className="regiment-stratagem-details-top">
            <div>
              <div className="regiment-stratagem-details-kicker">
                STRATAGEM DESIGNATION
              </div>

              <h3>
                {name}
              </h3>
            </div>

            <button
              type="button"
              className="regiment-stratagem-collapse"
              onClick={onClick}
              aria-label={`Collapse ${name}`}
            >
              <ChevronUp
                size={16}
              />
            </button>
          </div>

          <div className="regiment-stratagem-details-meta">
            {category && (
              <span className="regiment-stratagem-meta-sheet">
                LOADOUT: {category}
              </span>
            )}

            {info.permitType && (
              <span>
                PERMIT: {info.permitType}
              </span>
            )}

            {info.stratagemType && (
              <span>
                TYPE: {info.stratagemType}
              </span>
            )}
          </div>

          <div className="regiment-stratagem-stats">
            {info.uses && (
              <div className="regiment-stratagem-stat">
                <span>USES</span>

                <strong>
                  {info.uses}
                </strong>
              </div>
            )}

            {info.callInTime && (
              <div className="regiment-stratagem-stat">
                <span>CALL-IN</span>

                <strong>
                  {info.callInTime}
                </strong>
              </div>
            )}

            {info.cooldown && (
              <div className="regiment-stratagem-stat">
                <span>COOLDOWN</span>

                <strong>
                  {info.cooldown}
                </strong>
              </div>
            )}

            {info.unlockLevel && (
              <div className="regiment-stratagem-stat">
                <span>UNLOCK</span>

                <strong>
                  LEVEL {info.unlockLevel}
                </strong>
              </div>
            )}

            {info.unlockCost && (
              <div className="regiment-stratagem-stat">
                <span>COST</span>

                <strong>
                  {info.unlockCost}
                </strong>
              </div>
            )}
          </div>

          {info.traits?.length > 0 && (
            <div className="regiment-stratagem-traits">
              <div className="regiment-stratagem-section-label">
                STRATAGEM TRAITS
              </div>

              <div className="regiment-stratagem-traits-list">
                {info.traits.map(
                  (trait, index) => (
                    <span
                      key={`${trait}-${index}`}
                    >
                      {trait}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {info.code?.length > 0 && (
            <div className="regiment-stratagem-code">
              <div className="regiment-stratagem-code-label">
                STRATAGEM CODE
              </div>

              <div className="regiment-stratagem-code-sequence">
                {info.code.map(
                  (direction, index) => (
                    <span
                      key={`${direction}-${index}`}
                      className="regiment-stratagem-code-key"
                      title={direction}
                    >
                      {getDirectionSymbol(
                        direction
                      )}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {(info.source ||
            info.shipModule) && (
              <div className="regiment-stratagem-source">
                <span>
                  SHIP MODULE
                </span>

                <strong>
                  {info.source ||
                    info.shipModule}
                </strong>
              </div>
            )}


          <div className="regiment-stratagem-description">
            {descriptionLoading ? (
              <span className="regiment-stratagem-description-loading">
                RETRIEVING STRATAGEM RECORD...
              </span>
            ) : (
              <p>
                {description ||
                  "No tactical description is currently available for this stratagem."}
              </p>
            )}
          </div>

          {info.wikiUrl && (
            <a
              className="regiment-stratagem-wiki-link"
              href={
                info.wikiUrl
              }
              target="_blank"
              rel="noreferrer"
            >
              OPEN FULL STRATAGEM RECORD
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * SLOT
 * ---------------------------------------------------------------------------
 */

function SlotSection({
  loadoutIndex,
  slot,
  expandedItem,
  onToggle,
  catalog,
}) {
  return (
    <section className="regiment-slot">
      <header className="regiment-slot-header">
        <div className="regiment-slot-number">
          {String(
            slot.number
          ).padStart(2, "0")}
        </div>

        <div>
          <div className="regiment-slot-label">
            {slot.label}
          </div>

          <h2>
            {slot.category}
          </h2>
        </div>
      </header>

      {slot.items.length >
        0 ? (
        <div className="regiment-stratagem-grid">
          {slot.items.map(
            (
              item,
              itemIndex
            ) => {
              const itemKey =
                `${loadoutIndex}-${slot.number}-${itemIndex}-${item.name}`;

              return (
                <StratagemButton
                  key={itemKey}
                  name={item.name}
                  category={
                    item.category
                  }
                  catalog={
                    catalog
                  }
                  expanded={
                    expandedItem ===
                    itemKey
                  }
                  onClick={() =>
                    onToggle(
                      expandedItem ===
                        itemKey
                        ? null
                        : itemKey
                    )
                  }
                />
              );
            }
          )}
        </div>
      ) : (
        <div className="regiment-slot-empty">
          NO AUTHORIZED STRATAGEMS
        </div>
      )}
    </section>
  );
}

/*
 * ---------------------------------------------------------------------------
 * PAGE
 * ---------------------------------------------------------------------------
 */

export default function RegimentsPage() {
  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /*
   * IMPORTANT:
   * This state was missing from the previous version.
   */
  const [
    error,
    setError,
  ] = useState(null);

  const [
    stratagemCatalog,
    setStratagemCatalog,
  ] = useState([]);

  const [stratagemCatalogError, setStratagemCatalogError] =
    useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    expandedItem,
    setExpandedItem,
  ] = useState(null);

  /*
   * -------------------------------------------------------------------------
   * LOAD STRATAGEM CATALOG
   * -------------------------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    getStratagemCatalog()
      .then((catalog) => {
        if (!cancelled) {
          setStratagemCatalog(
            Array.isArray(
              catalog
            )
              ? catalog
              : []
          );
        }
      })
      .catch((err) => {
        /*
         * Catalog data is supplemental.
         *
         * Never prevent the regiment
         * page from rendering.
         */
        console.warn(
          "Failed to load stratagem catalog:",
          err
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * -------------------------------------------------------------------------
   * LOAD SHEET
   * -------------------------------------------------------------------------
   */

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getSheetData();

      setRows(
        Array.isArray(data)
          ? data
          : []
      );

      setExpandedItem(
        null
      );
    } catch (err) {
      console.error(
        "Failed to load regiment loadout data:",
        err
      );

      setRows([]);

      setError(
        "FAILED TO LOAD REGIMENT LOADOUT DATA"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCache() {
    try {
      /*
       * Clear the stratagem catalog and description caches.
       */
      clearStratagemCache();

      /*
       * Clear the currently displayed metadata so the UI
       * does not temporarily show stale information.
       */
      setStratagemCatalog([]);
      setStratagemCatalogError(null);

      /*
       * Re-fetch the catalog immediately.
       */
      const catalog =
        await getStratagemCatalog();

      setStratagemCatalog(catalog);
    } catch (err) {
      console.warn(
        "Failed to reload stratagem catalog after cache clear:",
        err
      );

      setStratagemCatalogError(err);
    }
  }


  useEffect(() => {
    loadData();
  }, []);

  /*
   * -------------------------------------------------------------------------
   * PARSE LOADOUTS
   * -------------------------------------------------------------------------
   */

  const loadouts =
    useMemo(
      () =>
        parseLoadouts(rows),
      [rows]
    );

  /*
   * -------------------------------------------------------------------------
   * SEARCH
   * -------------------------------------------------------------------------
   */

  const visibleLoadouts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return loadouts;
      }

      return loadouts
        .map((loadout) => {
          const loadoutMatches =
            loadout.title
              .toLowerCase()
              .includes(query);

          if (
            loadoutMatches
          ) {
            return loadout;
          }

          const slots =
            loadout.slots
              .map((slot) => {
                const categoryMatches =
                  slot.category
                    .toLowerCase()
                    .includes(
                      query
                    );

                if (
                  categoryMatches
                ) {
                  return slot;
                }

                const items =
                  slot.items.filter(
                    (item) =>
                      item.name
                        .toLowerCase()
                        .includes(
                          query
                        )
                  );

                if (
                  !items.length
                ) {
                  return null;
                }

                return {
                  ...slot,
                  items,
                };
              })
              .filter(Boolean);

          if (!slots.length) {
            return null;
          }

          return {
            ...loadout,
            slots,
          };
        })
        .filter(Boolean);
    }, [
      loadouts,
      search,
    ]);

  /*
   * -------------------------------------------------------------------------
   * RENDER
   * -------------------------------------------------------------------------
   */

  return (
    <div className="regiments-page">
      <header className="regiments-header">
        <div className="regiments-header-title">
          <Shield size={22} />

          <div>
            <span>
              S.E.A.F. // L.E.M.O.N
            </span>

            <small>
              REGIMENT LOADOUT DATABASE
            </small>
          </div>
        </div>

        <div className="regiments-header-status">
          <span>
            DATABASE
          </span>

          <strong>
            {loading
              ? "SYNCING"
              : stratagemCatalog.length > 0
                ? "ONLINE"
                : "PARTIAL"}
          </strong>

        </div>

        <NavigationMenu />
      </header>

      <main className="regiments-content">
        <section className="regiments-title">
          <div>
            <div className="regiments-kicker">
              FORCE DATABASE //
              PERSONNEL EQUIPMENT
            </div>

            <h1>
              REGIMENT LOADOUTS
            </h1>

            <p>
              Authorized regiment
              equipment, specialist
              weapons, specialties
              and universal
              stratagems.
            </p>
          </div>

          <div className="regiments-source">
            <span>
              SOURCE
            </span>

            <strong>
              SICARIS // GOOGLE
              SHEETS
            </strong>
          </div>
        </section>

        <section className="regiments-toolbar">
          <div className="regiments-search">
            <Search size={16} />

            <input
              type="search"
              placeholder="SEARCH LOADOUTS..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <button
            type="button"
            className="regiments-refresh"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={
                loading
                  ? "regiments-refresh-spinning"
                  : ""
              }
            />

            REFRESH
          </button>

          <button
            type="button"
            className="regiments-cache-clear"
            onClick={handleClearCache}
          >
            CLEAR DATA CACHE
          </button>
        </section>


        {!loading && (
          <div className="regiments-catalog-status">
            <span>
              STRATAGEM LIBRARY
            </span>

            <strong>
              {stratagemCatalog.length > 0
                ? `${stratagemCatalog.length} RECORDS`
                : "UNAVAILABLE"}
            </strong>

            {stratagemCatalogError && (
              <span className="regiments-catalog-status-error">
                METADATA OFFLINE
              </span>
            )}
          </div>
        )}


        {loading && (
          <div className="regiments-state">
            <span>
              SYNCING REGIMENT DATABASE...
            </span>
          </div>
        )}

        {error &&
          !loading && (
            <div className="regiments-state regiments-state-error">
              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={
                  loadData
                }
              >
                RETRY
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          visibleLoadouts.length >
          0 && (
            <section className="regiments-loadouts">
              {visibleLoadouts.map(
                (
                  loadout,
                  loadoutIndex
                ) => (
                  <article
                    className="regiment-loadout"
                    key={`${loadout.title}-${loadoutIndex}`}
                  >
                    <header className="regiment-loadout-header">
                      <h2>
                        {
                          loadout.title
                        }
                      </h2>
                    </header>

                    <div className="regiment-loadout-body">
                      {loadout.slots.map(
                        (slot) => (
                          <SlotSection
                            key={`${loadout.title}-${slot.number}`}
                            loadoutIndex={
                              loadoutIndex
                            }
                            slot={
                              slot
                            }
                            expandedItem={
                              expandedItem
                            }
                            onToggle={
                              setExpandedItem
                            }
                            catalog={
                              stratagemCatalog
                            }
                          />
                        )
                      )}
                    </div>
                  </article>
                )
              )}
            </section>
          )}

        {!loading &&
          !error &&
          loadouts.length >
          0 &&
          visibleLoadouts.length ===
          0 && (
            <div className="regiments-state">
              NO LOADOUTS MATCH
              SEARCH.
            </div>
          )}

        {!loading &&
          !error &&
          rows.length ===
          0 && (
            <div className="regiments-state">
              NO REGIMENT DATA FOUND.
            </div>
          )}
      </main>
      <SiteFooter />
    </div>
  );
}
