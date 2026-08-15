import { useEffect, useState } from "react";
import {
  Ship,
  RefreshCw,
} from "lucide-react";

import NavigationMenu from "../components/NavigationMenu";
import {
  getSheetData,
} from "../api/sicarisShipStratagems.js";

import "./ShipsPage.css";

export default function ShipsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const data = await getSheetData();

      setRows(data);
    } catch (err) {
      console.error(err);
      setError(
        "FAILED TO LOAD SHIP STRATAGEM DATA"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="ships-page">
      

      <header className="ships-header">
        <div className="ships-header-title">
          <Ship size={22} />

          <div>
            <span>S.E.A.F. // L.E.M.O.N</span>
            <small>
              SHIP STRATAGEM DATABASE
            </small>
          </div>
        </div>

        <div className="ships-header-status">
          <span>DATABASE</span>
          <strong>
            {loading ? "SYNCING" : "ONLINE"}
          </strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="ships-content">
        <section className="ships-title">
          <div>
            <div className="ships-kicker">
              FLEET DATABASE // STRATAGEM AUTHORIZATION
            </div>

            <h1>SHIP STRATAGEMS</h1>

            <p>
              Ship-class stratagem
              availability and deployment
              restrictions.
            </p>
          </div>

          <div className="ships-source">
            <span>SOURCE</span>
            <strong>
              SICARIS // STREAMER STRATAGEMS
            </strong>
          </div>
        </section>

        <section className="ships-toolbar">
          <button
            className="ships-refresh"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={
                loading
                  ? "ships-refresh-spinning"
                  : ""
              }
            />

            REFRESH DATA
          </button>
        </section>

        {loading && (
          <div className="ships-state">
            SYNCING SHIP STRATAGEM DATABASE...
          </div>
        )}

        {error && !loading && (
          <div className="ships-state ships-state-error">
            <span>{error}</span>

            <button onClick={loadData}>
              RETRY
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          rows.length > 0 && (
            <section className="ships-sheet-wrapper">
              <div className="ships-sheet">
                {rows.map(
                  (row, rowIndex) => (
                    <div
                      className={`ships-row ${
                        rowIndex === 0
                          ? "ships-row-header"
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
                            className="ships-cell"
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
            <div className="ships-state">
              NO SHIP STRATAGEM DATA FOUND.
            </div>
          )}
      </main>
    </div>
  );
}
