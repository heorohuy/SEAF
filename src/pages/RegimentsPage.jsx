import { useEffect, useMemo, useState } from "react";
import { Shield, Search, RefreshCw } from "lucide-react";

import NavigationMenu from "../components/NavigationMenu";
import { getSheetData } from "../api/sicarisLoadouts.js";

import "./RegimentsPage.css";

export default function RegimentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const data = await getSheetData();

      setRows(data);
    } catch (err) {
      console.error(err);
      setError("FAILED TO LOAD REGIMENT LOADOUT DATA");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * The Google Sheet returns:
   *
   * [
   *   [column1, column2, column3, ...],
   *   [column1, column2, column3, ...],
   *   ...
   * ]
   *
   * We keep those rows untouched.
   *
   * Search simply determines which rows are visible.
   */
  const visibleRows = useMemo(() => {
    if (!search.trim()) {
      return rows;
    }

    const query = search.toLowerCase();

    return rows.filter((row, index) => {
      // Always retain the header row.
      if (index === 0) {
        return true;
      }

      return row.some((cell) =>
        String(cell ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search]);

  return (
    <div className="regiments-page">
      

      <header className="regiments-header">
        <div className="regiments-header-title">
          <Shield size={22} />

          <div>
            <span>S.E.A.F. // L.E.M.O.N</span>
            <small>REGIMENT LOADOUT DATABASE</small>
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
            <strong>SIСARIS // GOOGLE SHEETS</strong>
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
            <span>SYNCING REGIMENT DATABASE...</span>
          </div>
        )}

        {error && !loading && (
          <div className="regiments-state regiments-state-error">
            <span>{error}</span>

            <button onClick={loadData}>
              RETRY
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          rows.length > 0 && (
            <section className="regiments-sheet-wrapper">
              <div className="regiments-sheet">
                {visibleRows.map(
                  (row, rowIndex) => (
                    <div
                      className={`regiments-row ${
                        rowIndex === 0
                          ? "regiments-row-header"
                          : ""
                      }`}
                      key={rowIndex}
                    >
                      {row.map(
                        (
                          cell,
                          cellIndex
                        ) => (
                          <div
                            className="regiments-cell"
                            key={`${rowIndex}-${cellIndex}`}
                          >
                            {cell ?? ""}
                          </div>
                        )
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
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
