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

import { getSheetData } from "../api/sicarisRegiments.js";

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


function normalizeHeader(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}


/*
 * Convert the "Deployed Regiments" sheet into objects.
 *
 * The first row is treated as the header row.
 * Every subsequent row is one deployed regiment.
 */
function parseRegiments(rows) {
    if (
        !Array.isArray(rows) ||
        rows.length < 2
    ) {
        return {
            headers: [],
            regiments: [],
        };
    }

    /*
     * The first sheet column is intentionally
     * excluded from the database table.
     *
     * Sheet columns:
     * 0 = hidden
     * 1 = displayed as-is
     * 2 = displayed as-is
     * 3 = FDP
     * 4 = Warbonds Greenlight
     * 5 = Surplus
     * 6 = Deployment
     */

    const sheetHeaders = rows[0] || [];

    const headers = [
        {
            index: 1,
            label:
                String(
                    sheetHeaders[1] ?? ""
                ).trim() || "COLUMN 2",
            key: "column_2",
        },
        {
            index: 2,
            label:
                String(
                    sheetHeaders[2] ?? ""
                ).trim() || "COLUMN 3",
            key: "column_3",
        },
        {
            index: 3,
            label: "FDP",
            key: "fdp",
        },
        {
            index: 8,
            label: "Warbonds Greenlight",
            key: "warbonds_greenlight",
        },
        {
            index: 12,
            label: "Surplus",
            key: "surplus",
        },
        {
            index: 13,
            label: "Deployment",
            key: "deployment",
        },
    ];

    const regiments = rows
        .slice(1)
        .filter((row) =>
            Array.isArray(row) &&
            row.some(
                (value) =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
            )
        )
        .map((row, rowIndex) => {
            const data = {};

            headers.forEach(
                ({
                    index,
                    key,
                }) => {
                    data[key] =
                        row[index] ??
                        null;
                }
            );

            return {
                index: rowIndex + 1,
                data,
                raw: row,
            };
        });

    return {
        headers,
        regiments,
    };
}


/*
 * Find a useful value from a row.
 *
 * This lets the page identify the regiment name without
 * requiring a specific capitalization/spelling in the sheet.
 */
function getRegimentName(
    regiment,
    headers
) {
    const preferredKeys = [
        "regiment",
        "regiment_name",
        "name",
        "unit",
        "unit_name",
    ];

    for (
        const preferredKey of preferredKeys
    ) {
        const header =
            headers.find(
                (item) =>
                    item.key ===
                    preferredKey
            );

        if (header) {
            const value =
                regiment.data[
                header.key
                ];

            if (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
            ) {
                return String(value);
            }
        }
    }

    /*
     * Fall back to the first populated cell.
     */
    for (const header of headers) {
        const value =
            regiment.data[
            header.key
            ];

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {
            return String(value);
        }
    }

    return `REGIMENT ${regiment.index}`;
}


/*
 * ---------------------------------------------------------------------------
 * RAW DATA
 * ---------------------------------------------------------------------------
 */

function RawData({
    regiment,
    headers,
}) {
    const [open, setOpen] =
        useState(false);

    const [copied, setCopied] =
        useState(false);

    const rawData = useMemo(() => {
        const data = {};

        headers.forEach(
            ({
                key,
                label,
            }) => {
                data[label] =
                    regiment.data[key] ??
                    null;
            }
        );

        return JSON.stringify(
            data,
            null,
            2
        );
    }, [
        regiment,
        headers,
    ]);

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
                // Clipboard may be unavailable.
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


function renderCellValue(
    value,
    columnKey
) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return "—";
    }

    /*
     * Warbonds Greenlight can contain
     * multiple warbonds separated by
     * commas, newlines, semicolons, etc.
     */
    if (
        columnKey ===
        "warbonds_greenlight"
    ) {
        const warbonds = String(value)
            .split(/[\n,;|]+/)
            .map((item) =>
                item.trim()
            )
            .filter(Boolean);

        if (!warbonds.length) {
            return "—";
        }

        return (
            <div className="regiment-warbonds">
                {warbonds.map(
                    (
                        warbond,
                        index
                    ) => (
                        <span
                            className="regiment-warbond"
                            key={`${warbond}-${index}`}
                        >
                            {warbond}
                        </span>
                    )
                )}
            </div>
        );
    }

    return formatValue(value);
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
     * LOAD DEPLOYED REGIMENTS
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

                /*
                 * IMPORTANT:
                 *
                 * This is the API from sicarisRegiments.js,
                 * which points to the "Deployed Regiments"
                 * Google Sheet.
                 */
                const data =
                    await getSheetData();

                setRows(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (err) {
                console.error(
                    "Failed to load deployed regiments:",
                    err
                );

                setError(
                    err?.message ||
                    "Unable to retrieve deployed regiment data."
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

    const {
        headers,
        regiments,
    } =
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
                    return headers.some(
                        ({
                            key,
                        }) => {
                            const value =
                                regiment.data[
                                key
                                ];

                            return String(
                                value ?? ""
                            )
                                .toLowerCase()
                                .includes(
                                    query
                                );
                        }
                    );
                }
            );
        }, [
            regiments,
            headers,
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

                {/* ----------------------------------------------------------------- */}
                {/* HEADING                                                           */}
                {/* ----------------------------------------------------------------- */}

                <section className="planets-heading">
                    <div>
                        <div className="planets-kicker">
                            <Database size={14} />

                            GALACTIC ARCHIVE // LIVE DATA
                        </div>

                        <h1>
                            REGIMENT DATABASE
                        </h1>

                        <p>
                            Deployed regiment
                            identifiers, locations,
                            commanders and operational
                            status.
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


                {/* ----------------------------------------------------------------- */}
                {/* CONTROLS                                                          */}
                {/* ----------------------------------------------------------------- */}

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
                            placeholder="SEARCH DEPLOYED REGIMENTS..."
                            aria-label="Search deployed regiments"
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
                        title="Refresh deployed regiment data"
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


                {/* ----------------------------------------------------------------- */}
                {/* LOADING                                                           */}
                {/* ----------------------------------------------------------------- */}

                {loading && (
                    <div className="planets-message">
                        <RefreshCw
                            size={17}
                            className="planet-refresh-spinning"
                        />

                        <span>
                            SYNCHRONIZING DEPLOYED
                            REGIMENT DATA...
                        </span>
                    </div>
                )}


                {/* ----------------------------------------------------------------- */}
                {/* ERROR                                                             */}
                {/* ----------------------------------------------------------------- */}

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


                {/* ----------------------------------------------------------------- */}
                {/* TABLE                                                             */}
                {/* ----------------------------------------------------------------- */}

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

                                            {headers.map(
                                                ({
                                                    key,
                                                    label,
                                                }) => (
                                                    <th
                                                        key={key}
                                                    >
                                                        {label}
                                                    </th>
                                                )
                                            )}

                                        </tr>
                                    </thead>


                                    <tbody>

                                        {filteredRegiments.map(
                                            (
                                                regiment
                                            ) => (
                                                <tr
                                                    key={`${regiment.index}-${getRegimentName(
                                                        regiment,
                                                        headers
                                                    )}`}
                                                >

                                                    <td className="planet-index">
                                                        {
                                                            regiment.index
                                                        }
                                                    </td>


                                                    {headers.map(
                                                        ({
                                                            key,
                                                        }) => (
                                                            <td
                                                                key={key}
                                                                className={
                                                                    key ===
                                                                        "warbonds_greenlight"
                                                                        ? "regiment-warbonds-cell"
                                                                        : ""
                                                                }
                                                            >
                                                                {renderCellValue(
                                                                    regiment.data[key],
                                                                    key
                                                                )}
                                                            </td>
                                                        )
                                                    )}

                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>


                            {filteredRegiments.length ===
                                0 && (
                                    <div className="planet-empty">
                                        NO DEPLOYED REGIMENTS
                                        MATCH THE CURRENT
                                        SEARCH.
                                    </div>
                                )}

                        </section>
                    )}


                {/* ----------------------------------------------------------------- */}
                {/* RAW DATA                                                          */}
                {/* ----------------------------------------------------------------- */}

                {!loading &&
                    !error &&
                    filteredRegiments.map(
                        (
                            regiment
                        ) => (
                            <div
                                key={`raw-${regiment.index}`}
                                className="planet-debug-row"
                            >

                                <div className="planet-debug-heading">

                                    <span>
                                        {
                                            regiment.index
                                        }
                                    </span>

                                    <strong>
                                        {
                                            getRegimentName(
                                                regiment,
                                                headers
                                            )
                                        }
                                    </strong>

                                </div>

                                <RawData
                                    regiment={
                                        regiment
                                    }
                                    headers={
                                        headers
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