import NavigationMenu from "../components/NavigationMenu";
import "./LegalPage.css";
import SiteFooter from "../components/SiteFooter";


export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-title">
          <div>
            <span>S.E.A.F. // L.E.M.O.N</span>
            <small>TERMS &amp; DISCLAIMERS</small>
          </div>
        </div>

        <div className="legal-header-status">
          <span>REFERENCE SYSTEM</span>
          <strong>TERMS</strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="legal-content">
        <section className="legal-hero">
          <div className="legal-kicker">
            PERSONNEL OPERATIONS // SERVICE CONDITIONS
          </div>

          <h1>TERMS &amp; DISCLAIMERS</h1>

          <p>
            These terms describe the conditions and limitations
            associated with using S.E.A.F. L.E.M.O.N.
          </p>

          <div className="legal-meta">
            <span>LAST UPDATED</span>
            <strong>August 2026</strong>
          </div>
        </section>

        <section className="legal-section">
          <h2>01 // ACCEPTANCE</h2>

          <p>
            By using S.E.A.F. L.E.M.O.N., you agree to use the site
            responsibly and in accordance with applicable laws.
          </p>

          <p>
            If you do not agree with these terms, please discontinue
            use of the website.
          </p>
        </section>

        <section className="legal-section">
          <h2>02 // UNOFFICIAL FAN PROJECT</h2>

          <p>
            S.E.A.F. L.E.M.O.N. is an unofficial fan-made reference
            project for Helldivers 2.
          </p>

          <p>
            The site is not affiliated with, operated by, sponsored by,
            or endorsed by Arrowhead Game Studios or Sony Interactive
            Entertainment.
          </p>
        </section>

        <section className="legal-section">
          <h2>03 // INTELLECTUAL PROPERTY</h2>

          <p>
            Helldivers 2 and related names, logos, characters,
            locations, artwork, trademarks, and other intellectual
            property belong to their respective owners.
          </p>

          <p>
            S.E.A.F. L.E.M.O.N. does not claim ownership of third-party
            intellectual property merely because it is referenced or
            displayed by the site.
          </p>

          <p>
            If you believe material displayed by the site infringes
            your rights, please contact the project maintainers with
            sufficient information to identify the material and the
            alleged infringement.
          </p>
        </section>

        <section className="legal-section">
          <h2>04 // DATA ACCURACY</h2>

          <p>
            Information displayed on S.E.A.F. L.E.M.O.N. may come from
            external sources and may change without notice.
          </p>

          <p>
            The site does not guarantee that planetary information,
            faction information, regiment information, operational
            status, or other displayed data is complete, current, or
            error-free.
          </p>
        </section>

        <section className="legal-section">
          <h2>05 // AVAILABILITY</h2>

          <p>
            The website is provided on an availability basis.
            Features may be changed, interrupted, removed, or
            temporarily unavailable.
          </p>

          <p>
            External APIs, spreadsheets, reference services, hosting
            services, or other dependencies may become unavailable
            without notice.
          </p>
        </section>

        <section className="legal-section">
          <h2>06 // NO WARRANTY</h2>

          <p>
            S.E.A.F. L.E.M.O.N. is provided without guarantees that the
            site will always be accurate, available, secure, or
            suitable for a particular purpose.
          </p>

          <p>
            Information on this website should be treated as a
            community reference rather than an authoritative source.
          </p>
        </section>

        <section className="legal-section">
          <h2>07 // THIRD-PARTY SERVICES</h2>

          <p>
            The website may contain or rely on third-party services,
            websites, APIs, advertising providers, and reference
            resources.
          </p>

          <p>
            S.E.A.F. L.E.M.O.N. is not responsible for the availability,
            content, privacy practices, or policies of third-party
            services.
          </p>
        </section>

        <section className="legal-section">
          <h2>08 // ADVERTISING</h2>

          <p>
            S.E.A.F. L.E.M.O.N. may display advertisements supplied by
            third-party advertising providers.
          </p>

          <p>
            Advertisements are provided by those advertising providers
            and are not necessarily an endorsement or recommendation by
            S.E.A.F. L.E.M.O.N.
          </p>
        </section>

        <section className="legal-section">
          <h2>09 // PROHIBITED USE</h2>

          <p>
            You may not use the website to interfere with its operation,
            attempt to gain unauthorized access to its systems, abuse
            external services, introduce malicious code, or otherwise
            use the service in a way that could harm the site or other
            users.
          </p>
        </section>

        <section className="legal-section">
          <h2>10 // CHANGES TO THESE TERMS</h2>

          <p>
            These terms may be updated when the website, its
            functionality, or its operating requirements change.
          </p>

          <p>
            Continued use of the website after an update constitutes
            acceptance of the revised terms to the extent permitted by
            applicable law.
          </p>
        </section>

        <section className="legal-section">
          <h2>11 // CONTACT</h2>

          <p>
            Questions about these terms, copyright, corrections, or the
            operation of the site can be submitted through the project's
            GitHub repository and Issues section.
          </p>
        </section>

        <section className="legal-final">
          <strong>TERMS // END OF TRANSMISSION</strong>
          <span>
            S.E.A.F. L.E.M.O.N. remains an unofficial fan reference.
          </span>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
