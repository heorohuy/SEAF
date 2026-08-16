import NavigationMenu from "../components/NavigationMenu";
import "./LegalPage.css";
import SiteFooter from "../components/SiteFooter";


export default function AboutPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-title">
          <div>
            <span>S.E.A.F. // L.E.M.O.N</span>
            <small>ABOUT &amp; CONTACT</small>
          </div>
        </div>

        <div className="legal-header-status">
          <span>REFERENCE SYSTEM</span>
          <strong>ABOUT</strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="legal-content">
        <section className="legal-hero">
          <div className="legal-kicker">
            SUPER EARTH ARMED FORCES // REFERENCE NETWORK
          </div>

          <h1>ABOUT S.E.A.F. L.E.M.O.N.</h1>

          <p>
            An unofficial Helldivers 2 fan-made reference tool for
            exploring the Galactic Map, planetary information,
            deployed forces, and regiment loadouts.
          </p>
        </section>

        <section className="legal-section">
          <h2>01 // WHAT IS S.E.A.F. L.E.M.O.N.?</h2>

          <p>
            S.E.A.F. L.E.M.O.N. is an independent fan project designed
            to make Helldivers 2 reference information easier to
            explore.
          </p>

          <p>
            The site combines an interactive Galactic Map with
            searchable planetary information and regiment reference
            material.
          </p>

          <p>
            The goal is to provide a convenient reference interface
            rather than replace the game or its official services.
          </p>
        </section>

        <section className="legal-section">
          <h2>02 // WHAT CAN I DO HERE?</h2>

          <div className="legal-list">
            <div>
              <strong>GALACTIC MAP</strong>
              <span>
                Explore the galaxy, inspect planets, pan and zoom the
                map, and review associated information.
              </span>
            </div>

            <div>
              <strong>PLANET DATABASE</strong>
              <span>
                Search planets by name, ID, sector, faction, or biome.
              </span>
            </div>

            <div>
              <strong>REGIMENT LOADOUTS</strong>
              <span>
                Browse regiment equipment, specialties, and available
                stratagem information.
              </span>
            </div>

            <div>
              <strong>SITE GUIDE</strong>
              <span>
                Learn how the site's features work and how its
                information is organized.
              </span>
            </div>
          </div>
        </section>

        <section className="legal-section">
          <h2>03 // DATA &amp; METHODOLOGY</h2>

          <p>
            S.E.A.F. L.E.M.O.N. uses information from external data
            sources and reference material. Availability and accuracy
            may therefore change when those sources change or become
            unavailable.
          </p>

          <p>
            The site's contribution is the organization, presentation,
            visualization, filtering, and interpretation of that
            information through the S.E.A.F. L.E.M.O.N. interface.
          </p>

          <p>
            Information shown on the site should not be considered an
            official statement from the developers or publishers of
            Helldivers 2.
          </p>
        </section>

        <section className="legal-section">
          <h2>04 // OFFICIAL STATUS</h2>

          <p>
            S.E.A.F. L.E.M.O.N. is an unofficial fan-made project. It
            is not affiliated with, sponsored by, or endorsed by
            Arrowhead Game Studios or Sony Interactive Entertainment.
          </p>

          <p>
            Helldivers 2, its names, characters, artwork, trademarks,
            and related intellectual property belong to their
            respective owners.
          </p>
        </section>

        <section className="legal-section">
          <h2>05 // PROJECT PURPOSE</h2>

          <p>
            This project exists to provide players with a convenient
            reference interface and to organize publicly available
            game-related information in a useful format.
          </p>

          <p>
            The site does not provide game accounts, in-game purchases,
            authentication services, or access to private game data.
          </p>
        </section>

        <section className="legal-final">
          <strong>REFERENCE NETWORK // ONLINE</strong>
          <span>
            Built as a fan-made reference for the Helldivers community.
          </span>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
