import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";

import NavigationMenu from "../components/NavigationMenu";
import SiteFooter from "../components/SiteFooter";

import { getSheetData } from "../api/sicarisLoadouts.js";

import "../AppNavigation.css";
import "./PlanetsPage.css";

/*
 * ---------------------------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------------------------
 */

function formatValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function cleanCell(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function cleanStratagemName(value) {
  return cleanCell(value)
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

const SLOT_PATTERN = /^SLOT\s+(\d+)/i;

/*
 * Convert the Google Sheet into a list of regiment records.
 *
 * The current sheet is column-oriented:
 *
 *   Row 1 -> regiment name
 *   Row 2+ -> SLOT / category / stratagems
 */
function parseRegiments(rows) {
  if (
    !Array.isArray(rows) ||
    rows.length < 2
  ) {
    return [];
  }

  const columnCount = Math.max(
    0,
    ...rows.map((row) =>
      Array.isArray(row)
        ? row.length
        : 0
    )
  );

  const regiments = [];

  for (
    let columnIndex = 0;
    columnIndex < columnCount;
    columnIndex += 1
  ) {
    const name = cleanCell(
      rows[1]?.[columnIndex]
    );

    if (!name) {
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
      const value = cleanCell(
        rows[rowIndex]?.[columnIndex]
      );

      if (!value) {
        continue;
      }

      const slotMatch =
        value.match(SLOT_PATTERN);

      /*
       * New slot.
       */
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

        slots.push(currentSlot);

        expectingCategory =
          !categoryFromSlot;

        continue;
      }

      /*
       * Some rows contain the category
       * immediately after "SLOT X".
       */
      if (
        currentSlot &&
        expectingCategory
      ) {
        currentSlot.category =
          value;

        expectingCategory =
          false;

        continue;
      }

      /*
       * Everything after the category
       * is treated as an item.
       */
      if (currentSlot) {
        const itemName =
          cleanStratagemName(
            value
          );

        if (itemName) {
          currentSlot.items.push({
            name: itemName,
            category:
              currentSlot.category,
          });
        }
      }
    }

    const validSlots =
      slots.filter(
        (slot) =>
          Boolean(slot.category)
      );

    const categories = [
      ...new Set(
        validSlots
          .map(
            (slot) =>
              slot.category
          )
          .filter(Boolean)
      ),
    ];

    const items = validSlots.flatMap(
      (slot) => slot.items
    );

    regiments.push({
      index: regiments.length + 1,
      name,
      slots: validSlots,
      categories,
      items,
      itemCount: items.length,
      slotCount: validSlots.length,

      /*
       * Keep the original column data
       * available for the raw-data viewer.
       */
      raw: {
        name,
        columnIndex,
        rows: rows.map(
          (row) =>
            row?.[columnIndex] ??
            null
        ),
        slots: validSlots,
      },
    });
  }

  return regiments;
}

/*
 * ---------------------------------------------------------------------------
 * RAW DATA
 * ---------------------------------------------------------------------------
 */

function RawData({ regiment }) {
  const [open, setOpen] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const rawData = useMemo(
    () =>
      JSON.stringify(
        regiment?.raw ??
          regiment,
        null,
        2
      ),
    [regiment]
  );

  const copyRawData =
    async () => {
      try {
        await navigator.clipboard.writeText(
          rawData
        );

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(false);
          },
          1500
        );
      } catch {
        /*
         * Clipboard may be unavailable
         * in some browsers.
         */
      }
    };

  return (
    <div className="planet-raw">
      <div className="planet-raw-actions">
        <button
          type="button"
          className="planet-raw-toggle"
          onClick={() =>
            setOpen(
              (value) =>
                !value
            )
          }
        >
          {open ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}

          {open
            ? "HIDE RAW DATA"
            : "VIEW RAW DATA"}
        </button>

        {open && (
          <button
            type="button"
            className="planet-copy-button"
            onClick={
              copyRawData
            }
          >
            {copied ? (
              <Check size={14} />
            ) : (
              <Copy size={14} />
            )}

            {copied
              ? "COPIED"
              : "COPY"}
          </button>
        )}
      </div>

      {open && (
        <pre className="planet-raw-content">
          {rawData}
        </pre>
      )}
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * PAGE
 * ---------------------------------------------------------------------------
 */

export default function RegimentsPage() {
  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [search, setSearch] =
    useState("");

  /*
   * -------------------------------------------------------------------------
   * LOAD DATA
   * -------------------------------------------------------------------------
   */

  const loadRegiments =
    async ({
      initial = false,
    } = {}) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError(null);

        const data =
          await getSheetData();

        setRows(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load regiment data:",
          err
        );

        setError(
          err?.message ||
            "Unable to retrieve regiment data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadRegiments({
      initial: true,
    });
  }, []);

  /*
   * -------------------------------------------------------------------------
   * PARSE
   * -------------------------------------------------------------------------
   */

  const regiments =
    useMemo(
      () =>
        parseRegiments(rows),
      [rows]
    );

  /*
   * -------------------------------------------------------------------------
   * SEARCH
   * -------------------------------------------------------------------------
   */

  const filteredRegiments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return regiments;
      }

      return regiments.filter(
        (regiment) => {
          const values = [
            regiment.index,
            regiment.name,
            regiment.slotCount,
            regiment.itemCount,
            ...regiment.categories,
            ...regiment.items.map(
              (item) =>
                item.name
            ),
          ];

          return values.some(
            (value) =>
              String(
                value ?? ""
              )
                .toLowerCase()
                .includes(
                  query
                )
          );
        }
      );
    }, [
      regiments,
      search,
    ]);

  /*
   * -------------------------------------------------------------------------
   * RENDER
   * -------------------------------------------------------------------------
   */

  return (
    <div className="planets-page">

      {/* ----------------------------------------------------------------- */}
      {/* HEADER                                                            */}
      {/* ----------------------------------------------------------------- */}

      <header className="planets-topbar">
        <div className="planets-logo">
          <Database size={23} />

          <div>
            <span>
              S.E.A.F. - L.E.M.O.N
            </span>

            <small>
              REGIMENT DATABASE
            </small>
          </div>
        </div>

        <div className="planets-status">
          <span>
            DATABASE STATUS
          </span>

          <strong>
            {loading
              ? "SYNCING"
              : error
                ? "OFFLINE"
                : "ONLINE"}
          </strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="planets-content">

        {/* --------------------------------------------------------------- */}
        {/* HEADING                                                         */}
        {/* --------------------------------------------------------------- */}

        <section className="planets-heading">
          <div>
            <div className="planets-kicker">
              <Database size={14} />

              FORCE ARCHIVE // LIVE DATA
            </div>

            <h1>
              REGIMENT DATABASE
            </h1>

            <p>
              Regiment identifiers,
              authorized equipment,
              specialties, categories
              and stratagem assignments.
            </p>
          </div>

          <div className="planets-count">
            <strong>
              {
                filteredRegiments.length
              }
            </strong>

            <span>
              OF{" "}
              {regiments.length}{" "}
              REGIMENTS
            </span>
          </div>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* CONTROLS                                                        */}
        {/* --------------------------------------------------------------- */}

        <section className="planets-controls">
          <div className="planet-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="SEARCH REGIMENT, CATEGORY OR STRATAGEM..."
              aria-label="Search regiments"
            />
          </div>

          <div />

          <div />

          <button
            type="button"
            className="planet-refresh"
            onClick={() =>
              loadRegiments()
            }
            disabled={
              refreshing
            }
            title="Refresh regiment data"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "planet-refresh-spinning"
                  : ""
              }
            />

            <span>
              REFRESH
            </span>
          </button>
        </section>

        {/* --------------------------------------------------------------- */}
        {/* LOADING                                                         */}
        {/* --------------------------------------------------------------- */}

        {loading && (
          <div className="planets-message">
            <RefreshCw
              size={17}
              className="planet-refresh-spinning"
            />

            <span>
              SYNCHRONIZING REGIMENT DATA...
            </span>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* ERROR                                                           */}
        {/* --------------------------------------------------------------- */}

        {error && (
          <div className="planets-message planets-message--error">
            <strong>
              API ERROR
            </strong>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                loadRegiments()
              }
            >
              RETRY
            </button>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* TABLE                                                           */}
        {/* --------------------------------------------------------------- */}

        {!loading &&
          !error && (
            <section className="planet-table-shell">
              <div className="planet-table-scroll">

                <table className="planet-table">

                  <thead>
                    <tr>
                      <th>
                        ID
                      </th>

                      <th>
                        REGIMENT
                      </th>

                      <th>
                        SLOTS
                      </th>

                      <th>
                        CATEGORIES
                      </th>

                      <th>
                        STRATAGEMS
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRegiments.map(
                      (
                        regiment
                      ) => (
                        <tr
                          key={`${regiment.index}-${regiment.name}`}
                        >
                          <td className="planet-index">
                            {formatValue(
                              regiment.index
                            )}
                          </td>

                          <td className="planet-name">
                            {formatValue(
                              regiment.name
                            )}
                          </td>

                          <td className="planet-coordinate">
                            {formatValue(
                              regiment.slotCount
                            )}
                          </td>

                          <td className="planet-biome">
                            {regiment.categories
                              .length >
                            0
                              ? regiment.categories.join(
                                  " / "
                                )
                              : "—"}
                          </td>

                          <td className="planet-coordinate">
                            {formatValue(
                              regiment.itemCount
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                </table>

              </div>

              {filteredRegiments.length ===
                0 && (
                <div className="planet-empty">
                  NO REGIMENTS MATCH
                  THE CURRENT SEARCH.
                </div>
              )}
            </section>
          )}

        {/* --------------------------------------------------------------- */}
        {/* RAW DATA                                                        */}
        {/* --------------------------------------------------------------- */}

        {!loading &&
          !error &&
          filteredRegiments.map(
            (regiment) => (
              <div
                key={`raw-${regiment.index}-${regiment.name}`}
                className="planet-debug-row"
              >
                <div className="planet-debug-heading">
                  <span>
                    {regiment.index}
                  </span>

                  <strong>
                    {regiment.name}
                  </strong>
                </div>

                <RawData
                  regiment={
                    regiment
                  }
                />
              </div>
            )
          )}

      </main>

      <SiteFooter />
    </div>
  );
}