import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";

import NavigationMenu from "../components/NavigationMenu";
import { getSheetData } from "../api/sicarisLoadouts.js";

import "./RegimentsPage.css";

/*
 * ---------------------------------------------------------------------------
 * SHEET PARSING
 * ---------------------------------------------------------------------------
 *
 * The sheet is structured vertically inside each column:
 *
 *   LOADOUT NAME
 *
 *   SLOT 1
 *   Category
 *   Stratagem
 *   Stratagem
 *
 *   SLOT 2
 *   Category
 *   Stratagem
 *   Stratagem
 *
 *   SLOT 3
 *   Category
 *   Stratagem
 *
 *   SLOT 4
 *   Category
 *   Stratagem
 *
 * Formatting from Google Sheets is not available through the current API,
 * so "SLOT" is used as the reliable boundary between sections.
 */

const SLOT_PATTERN = /^SLOT\s+(\d+)/i;

function cleanCell(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function cleanStratagemName(value) {
  return cleanCell(value)
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

function parseLoadouts(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    return [];
  }

  const columnCount = Math.max(
    ...rows.map((row) =>
      Array.isArray(row) ? row.length : 0
    )
  );

  const loadouts = [];

  /*
   * Sheet structure:
   *
   * ROW 0 = universal regiment/loadout type
   * ROW 1 = regiment name
   * ROW 2+ = slots
   *
   * Example:
   *
   * Infantry Reg.
   * Primary: D.C.S. // Lib Pen
   * SLOT 1
   * Backpack
   * B-1 Supply Pack (0)
   * SLOT 2
   * Specialist Weapon
   * Machine Gun
   * ...
   */

  for (
    let columnIndex = 0;
    columnIndex < columnCount;
    columnIndex += 1
  ) {
    const regimentName = cleanCell(
      rows[1]?.[columnIndex]
    );

    if (!regimentName) {
      continue;
    }

    const slots = [];

    let currentSlot = null;
    let foundCategory = false;

    for (
      let rowIndex = 2;
      rowIndex < rows.length;
      rowIndex += 1
    ) {
      const value = cleanCell(
        rows[rowIndex]?.[columnIndex]
      );

      /*
       * Empty cells are irrelevant.
       *
       * Do NOT use empty cells as slot boundaries.
       */
      if (!value) {
        continue;
      }

      const slotMatch =
        value.match(SLOT_PATTERN);

      /*
       * A SLOT row always starts a new section.
       */
      if (slotMatch) {
        currentSlot = {
          number: Number(slotMatch[1]),
          label: value.toUpperCase(),
          category: "",
          items: [],
        };

        slots.push(currentSlot);

        foundCategory = false;

        continue;
      }

      /*
       * Ignore content before the first SLOT.
       */
      if (!currentSlot) {
        continue;
      }

      /*
       * The FIRST non-empty value after SLOT X
       * is the subsection/category.
       *
       * This is important because "Backpack",
       * "Specialist Weapon", "Regiment Specialty",
       * and "Universal" are categories, not
       * stratagems.
       */
      if (!foundCategory) {
        currentSlot.category = value;
        foundCategory = true;
        continue;
      }

      /*
       * Every subsequent non-empty value belongs
       * to this slot.
       *
       * This intentionally allows ONE item.
       */
      const itemName = cleanStratagemName(value);

      if (!itemName) {
        continue;
      }

      currentSlot.items.push({
        name: itemName,
        category: currentSlot.category,
      });
    }

    /*
     * Keep every slot that has a category.
     *
     * We do NOT require multiple entries.
     *
     * This is what allows:
     *
     * SLOT 1
     * Backpack
     * B-1 Supply Pack
     *
     * to remain visible.
     */
    const validSlots = slots.filter(
      (slot) => Boolean(slot.category)
    );

    if (validSlots.length > 0) {
      loadouts.push({
        title: regimentName,
        universalType: cleanCell(
          rows[0]?.[columnIndex]
        ),
        slots: validSlots,
      });
    }
  }

  return loadouts;
}



/*
 * ---------------------------------------------------------------------------
 * STRATAGEM ICONS
 * ---------------------------------------------------------------------------
 *
 * The icons are loaded from the public Helldivers 2 SVG repository.
 *
 * We use exact mappings for names that differ between the sheet and the
 * icon repository, then fall back to trying the item's name across the
 * known icon folders.
 */

const ICON_ROOT =
  ["https:", "", "raw.githubusercontent.com"].join("//") +
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
];

/*
 * Sheet names -> icon repository names.
 *
 * The first element is the folder.
 * The second element is the SVG filename without ".svg".
 */

const ICON_OVERRIDES = {
  "B-1 Supply Pack": ["Engineering Bay", "Supply Pack"],
  "Ballistic Shield": [
    "Engineering Bay",
    "Ballistic Shield Backpack",
  ],
  "Ballistic Shield Backpack": [
    "Engineering Bay",
    "Ballistic Shield Backpack",
  ],

  "Guard Dog": ["Robotics Workshop", "Guard Dog"],
  "Guard Dog Rover": ["Engineering Bay", "Guard Dog Rover"],

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
  return encodeURIComponent(value);
}

function buildIconCandidates(name) {
  const cleanedName = cleanStratagemName(name);

  const candidates = [];

  const exactOverride = ICON_OVERRIDES[cleanedName];

  if (exactOverride) {
    candidates.push(
      `${ICON_ROOT}/${encodePathPart(
        exactOverride[0]
      )}/${encodePathPart(exactOverride[1])}.svg`
    );
  }

  for (const folder of ICON_FOLDERS) {
    const candidate =
      `${ICON_ROOT}/${encodePathPart(folder)}/` +
      `${encodePathPart(cleanedName)}.svg`;

    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function StratagemIcon({ name }) {
  const candidates = useMemo(
    () => buildIconCandidates(name),
    [name]
  );

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(false);
  }, [name]);

  if (failed || candidates.length === 0) {
    return (
      <div className="regiment-icon-fallback" aria-hidden="true">
        <Shield size={27} />
      </div>
    );
  }

  return (
    <img
      src={candidates[candidateIndex]}
      alt=""
      className="regiment-stratagem-icon"
      onError={() => {
        if (candidateIndex + 1 < candidates.length) {
          setCandidateIndex((index) => index + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

/*
 * ---------------------------------------------------------------------------
 * STRATAGEM INFORMATION
 * ---------------------------------------------------------------------------
 *
 * These summaries are intentionally short. The Google Sheet remains the
 * source of truth for which stratagems are authorized in each loadout.
 *
 * Anything not listed gets a useful generic description rather than an
 * empty expansion panel.
 */

const STRATAGEM_INFO = {
  "B-1 Supply Pack": {
    type: "Backpack",
    description:
      "Carries additional ammunition, grenades, and stims for resupply on the battlefield.",
  },

  "Shield Generator Pack": {
    type: "Backpack",
    description:
      "Projects a personal energy shield that absorbs incoming damage before collapsing.",
  },

  "Ballistic Shield": {
    type: "Backpack",
    description:
      "Provides a portable ballistic shield for protection against conventional ranged fire.",
  },

  "Ballistic Shield Backpack": {
    type: "Backpack",
    description:
      "Provides a portable ballistic shield for protection against conventional ranged fire.",
  },

  "Guard Dog": {
    type: "Backpack",
    description:
      "Deploys an autonomous guard drone equipped with an assault rifle.",
  },

  "Guard Dog Rover": {
    type: "Backpack",
    description:
      "Deploys an autonomous drone equipped with a laser weapon for continuous battlefield support.",
  },

  "Machine Gun": {
    type: "Support Weapon",
    description:
      "A general-purpose machine gun designed for sustained fire against light and medium targets.",
  },

  "Anti Materiel Rifle": {
    type: "Support Weapon",
    description:
      "A high-caliber rifle designed for long-range precision fire against armored targets.",
  },

  "Anti-Materiel Rifle": {
    type: "Support Weapon",
    description:
      "A high-caliber rifle designed for long-range precision fire against armored targets.",
  },

  "Grenade Launcher": {
    type: "Support Weapon",
    description:
      "Launches explosive grenades for clearing groups of enemies and fortified positions.",
  },

  "Railgun": {
    type: "Support Weapon",
    description:
      "A charged electromagnetic weapon capable of penetrating heavily armored targets.",
  },

  "Flamethrower": {
    type: "Support Weapon",
    description:
      "Projects sustained flames for close-range area denial and incendiary damage.",
  },

  "Arc Thrower": {
    type: "Support Weapon",
    description:
      "Projects charged arcs of electricity that can strike multiple nearby targets.",
  },

  "Commando": {
    type: "Support Weapon",
    description:
      "A disposable guided rocket launcher carrying multiple anti-armor rockets.",
  },

  "Heavy Machine Gun": {
    type: "Support Weapon",
    description:
      "A high-powered machine gun intended for sustained fire against tougher targets.",
  },

  "Laser Cannon": {
    type: "Support Weapon",
    description:
      "A continuous-beam energy weapon effective against armored targets without conventional ammunition.",
  },

  "Quasar Cannon": {
    type: "Support Weapon",
    description:
      "A charge-based energy cannon that fires a powerful explosive anti-armor projectile.",
  },

  "HMG Emplacement": {
    type: "Defensive Stratagem",
    description:
      "Deploys a stationary heavy machine gun emplacement for sustained defensive fire.",
  },

  "Grenadier Battlement": {
    type: "Defensive Stratagem",
    description:
      "Deploys ballistic cover with a mounted grenade launcher for holding defensive positions.",
  },

  "Supply FRV": {
    type: "Vehicle",
    description:
      "Deploys a fast reconnaissance vehicle equipped with an automated turret and onboard supplies.",
  },

  "M-103 Supply FRV": {
    type: "Vehicle",
    description:
      "Deploys a fast reconnaissance vehicle equipped with an automated turret and onboard supplies.",
  },

  "M-102 Fast Recon Vehicle": {
    type: "Vehicle",
    description:
      "Deploys a fast reconnaissance vehicle for rapid squad movement and mounted fire support.",
  },

  "Fast Recon Vehicle": {
    type: "Vehicle",
    description:
      "Deploys a fast reconnaissance vehicle for rapid squad movement and mounted fire support.",
  },

  "Incendiary FRV": {
    type: "Vehicle",
    description:
      "Deploys an armored reconnaissance vehicle equipped with a roof-mounted heavy flamethrower.",
  },

  "M-104 Incinerator FRV": {
    type: "Vehicle",
    description:
      "Deploys an armored reconnaissance vehicle equipped with a roof-mounted heavy flamethrower.",
  },

  "FAF-14 Spear": {
    type: "Anti-Tank",
    description:
      "A guided anti-tank launcher designed to lock onto and destroy heavily armored targets.",
  },

  "Spear": {
    type: "Anti-Tank",
    description:
      "A guided anti-tank launcher designed to lock onto and destroy heavily armored targets.",
  },

  "AC-8 Autocannon": {
    type: "Support Weapon",
    description:
      "A powerful autocannon effective against medium and heavy targets, with a dedicated ammunition backpack.",
  },

  "Autocannon": {
    type: "Support Weapon",
    description:
      "A powerful autocannon effective against medium and heavy targets, with a dedicated ammunition backpack.",
  },

  "GR-8 Recoilless Rifle": {
    type: "Anti-Tank",
    description:
      "A crew-served recoilless rifle designed to destroy armored targets and fortified positions.",
  },

  "Recoilless Rifle": {
    type: "Anti-Tank",
    description:
      "A crew-served recoilless rifle designed to destroy armored targets and fortified positions.",
  },

  "Orbital 120 HE Barrage": {
    type: "Orbital",
    description:
      "Calls in a concentrated barrage of high-explosive orbital artillery rounds.",
  },

  "Orbital 120MM HE Barrage": {
    type: "Orbital",
    description:
      "Calls in a concentrated barrage of high-explosive orbital artillery rounds.",
  },

  "Orbital EMS Strike": {
    type: "Orbital",
    description:
      "Creates an electromagnetic pulse field that slows and disables affected enemies.",
  },

  "Orbital Smoke Strike": {
    type: "Orbital",
    description:
      "Deploys an orbital smoke screen to obscure enemy sight lines and movement.",
  },

  "Orbital Walking Barrage": {
    type: "Orbital",
    description:
      "Sends a moving line of orbital artillery fire across the designated area.",
  },

  "Orbital Precision Strike": {
    type: "Orbital",
    description:
      "Calls down a precise high-explosive orbital strike on the designated location.",
  },

  "Orbital Gas Strike": {
    type: "Orbital",
    description:
      "Deploys a persistent cloud of corrosive gas over the target area.",
  },

  "Emancipator Exosuit": {
    type: "Exosuit",
    description:
      "Deploys a heavily armed combat exosuit equipped with dual autocannons.",
  },

  "Patriot Exosuit": {
    type: "Exosuit",
    description:
      "Deploys a combat exosuit equipped with heavy ballistic and rocket weaponry.",
  },

  "Machine Gun Sentry": {
    type: "Sentry",
    description:
      "Deploys an automated machine gun turret that independently engages nearby enemies.",
  },

  "Mortar Sentry": {
    type: "Sentry",
    description:
      "Deploys an automated mortar turret capable of indirect explosive fire.",
  },

  "EMS Mortar Sentry": {
    type: "Sentry",
    description:
      "Deploys an automated mortar that fires electromagnetic disruption rounds.",
  },

  "Autocannon Sentry": {
    type: "Sentry",
    description:
      "Deploys an automated autocannon turret for heavy defensive fire.",
  },

  "Rocket Sentry": {
    type: "Sentry",
    description:
      "Deploys an automated rocket turret for engaging larger targets.",
  },

  "Gatling Sentry": {
    type: "Sentry",
    description:
      "Deploys a rapid-fire automated turret for suppressing groups of enemies.",
  },

  "Tesla Tower": {
    type: "Defensive Stratagem",
    description:
      "Deploys an electrical tower that automatically shocks nearby enemies.",
  },

  "Incendiary Mines": {
    type: "Minefield",
    description:
      "Deploys proximity-triggered incendiary mines that ignite enemies in the blast area.",
  },

  "Anti-Personnel Minefield": {
    type: "Minefield",
    description:
      "Deploys a field of proximity-triggered mines designed to clear groups of infantry targets.",
  },

  "TD-220 Bastion": {
    type: "Vehicle",
    description:
      "Deploys a heavily armored tank destroyer equipped with a high-velocity main cannon and heavy machine gun.",
  },

  "TD-220 Bastion MK XVI": {
    type: "Vehicle",
    description:
      "Deploys a heavily armored tank destroyer equipped with a high-velocity main cannon and heavy machine gun.",
  },
};

function getStratagemInfo(name, category) {
  return (
    STRATAGEM_INFO[name] || {
      type: category || "Stratagem",
      description:
        "Authorized regiment stratagem. Select this entry to view its designation and loadout assignment.",
    }
  );
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
}) {
  const info = getStratagemInfo(name, category);

  return (
    <div
      className={`regiment-stratagem ${expanded ? "regiment-stratagem-expanded" : ""
        }`}
    >
      <button
        type="button"
        className="regiment-stratagem-button"
        onClick={onClick}
        aria-expanded={expanded}
        aria-label={`View ${name}`}
      >
        <span className="regiment-stratagem-icon-wrap">
          <StratagemIcon name={name} />
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

              <h3>{name}</h3>
            </div>

            <button
              type="button"
              className="regiment-stratagem-collapse"
              onClick={onClick}
              aria-label={`Collapse ${name}`}
            >
              <ChevronUp size={16} />
            </button>
          </div>

          <div className="regiment-stratagem-details-meta">
            <span>{info.type}</span>
            <span>{category}</span>
          </div>

          <p>{info.description}</p>
        </div>
      )}
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * SLOT SECTION
 * ---------------------------------------------------------------------------
 */

function SlotSection({
  loadoutIndex,
  slot,
  expandedItem,
  onToggle,
}) {
  return (
    <section className="regiment-slot">
      <header className="regiment-slot-header">
        <div className="regiment-slot-number">
          {String(slot.number).padStart(2, "0")}
        </div>

        <div>
          <div className="regiment-slot-label">
            {slot.label}
          </div>

          <h2>{slot.category}</h2>
        </div>
      </header>

      {slot.items.length > 0 ? (
        <div className="regiment-stratagem-grid">
          {slot.items.map((item, itemIndex) => {
            const itemKey =
              `${loadoutIndex}-${slot.number}-${itemIndex}-${item.name}`;

            return (
              <StratagemButton
                key={itemKey}
                name={item.name}
                category={item.category}
                expanded={
                  expandedItem === itemKey
                }
                onClick={() =>
                  onToggle(
                    expandedItem === itemKey
                      ? null
                      : itemKey
                  )
                }
              />
            );
          })}
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedItem, setExpandedItem] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const data = await getSheetData();

      setRows(data);
      setExpandedItem(null);
    } catch (err) {
      console.error(err);
      setError(
        "FAILED TO LOAD REGIMENT LOADOUT DATA"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadouts = useMemo(
    () => parseLoadouts(rows),
    [rows]
  );

  /*
   * Search works against the parsed data rather than raw spreadsheet rows.
   *
   * Searching for a loadout name:
   *   -> shows the complete loadout.
   *
   * Searching for a category:
   *   -> shows the complete matching slot.
   *
   * Searching for a stratagem:
   *   -> shows only the matching stratagems.
   */

  const visibleLoadouts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return loadouts;
    }

    return loadouts
      .map((loadout) => {
        const loadoutMatches =
          loadout.title
            .toLowerCase()
            .includes(query);

        if (loadoutMatches) {
          return loadout;
        }

        const slots = loadout.slots
          .map((slot) => {
            const categoryMatches =
              slot.category
                .toLowerCase()
                .includes(query);

            if (categoryMatches) {
              return slot;
            }

            const items = slot.items.filter(
              (item) =>
                item.name
                  .toLowerCase()
                  .includes(query)
            );

            if (!items.length) {
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
  }, [loadouts, search]);


  return (
    <div className="regiments-page">
      <header className="regiments-header">
        <div className="regiments-header-title">
          <Shield size={22} />

          <div>
            <span>S.E.A.F. // L.E.M.O.N</span>
            <small>
              REGIMENT LOADOUT DATABASE
            </small>
          </div>
        </div>

        <div className="regiments-header-status">
          <span>DATABASE</span>

          <strong>
            {loading ? "SYNCING" : "ONLINE"}
          </strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="regiments-content">
        <section className="regiments-title">
          <div>
            <div className="regiments-kicker">
              FORCE DATABASE // PERSONNEL EQUIPMENT
            </div>

            <h1>REGIMENT LOADOUTS</h1>

            <p>
              Authorized regiment equipment,
              specialist weapons, specialties
              and universal stratagems.
            </p>
          </div>

          <div className="regiments-source">
            <span>SOURCE</span>

            <strong>
              SICARIS // GOOGLE SHEETS
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
        </section>

        {loading && (
          <div className="regiments-state">
            <span>
              SYNCING REGIMENT DATABASE...
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="regiments-state regiments-state-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadData}
            >
              RETRY
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          visibleLoadouts.length > 0 && (
            <section className="regiments-loadouts">
              {visibleLoadouts.map(
                (loadout, loadoutIndex) => (
                  <article
                    className="regiment-loadout"
                    key={`${loadout.title}-${loadoutIndex}`}
                  >
                    <header className="regiment-loadout-header">
                      <div className="regiment-loadout-index">
                        {String(
                          loadoutIndex + 1
                        ).padStart(2, "0")}
                      </div>

                      <div>
                        <div className="regiment-loadout-kicker">
                          {loadout.universalType || "AUTHORIZED LOADOUT"}
                        </div>

                        <h2>{loadout.title}</h2>
                      </div>


                      <div className="regiment-loadout-count">
                        <span>SLOTS</span>
                        <strong>
                          {String(
                            loadout.slots.length
                          ).padStart(2, "0")}
                        </strong>
                      </div>
                    </header>

                    <div className="regiment-loadout-body">
                      {loadout.slots.map(
                        (slot) => (
                          <SlotSection
                            key={`${loadout.title}-${slot.number}`}
                            loadoutIndex={
                              loadoutIndex
                            }
                            slot={slot}
                            expandedItem={
                              expandedItem
                            }
                            onToggle={
                              setExpandedItem
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
          loadouts.length > 0 &&
          visibleLoadouts.length === 0 && (
            <div className="regiments-state">
              NO LOADOUTS MATCH SEARCH.
            </div>
          )}

        {!loading &&
          !error &&
          rows.length === 0 && (
            <div className="regiments-state">
              NO REGIMENT DATA FOUND.
            </div>
          )}
      </main>
    </div>
  );
}
