import NavigationMenu from "../components/NavigationMenu";
import "./LegalPage.css";
import SiteFooter from "../components/SiteFooter";


export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-title">
          <div>
            <span>S.E.A.F. // L.E.M.O.N</span>
            <small>PRIVACY &amp; DATA USE</small>
          </div>
        </div>

        <div className="legal-header-status">
          <span>DOCUMENTATION</span>
          <strong>PRIVACY</strong>
        </div>

        <NavigationMenu />
      </header>

      <main className="legal-content">
        <section className="legal-hero">
          <div className="legal-kicker">
            PERSONNEL INFORMATION // DATA POLICY
          </div>

          <h1>PRIVACY POLICY</h1>

          <p>
            This Privacy Policy explains how S.E.A.F. L.E.M.O.N.
            handles information when you use the website.
          </p>

          <div className="legal-meta">
            <span>LAST UPDATED</span>
            <strong>August 2026</strong>
          </div>
        </section>

        <section className="legal-section">
          <h2>01 // OVERVIEW</h2>

          <p>
            S.E.A.F. L.E.M.O.N. is an unofficial, fan-made reference
            website for Helldivers 2. The site provides an interactive
            Galactic Map, planetary database, regiment information,
            and related reference material.
          </p>

          <p>
            This policy describes the types of information that may be
            processed when you visit the site and how third-party
            services used by the site may process information.
          </p>
        </section>

        <section className="legal-section">
          <h2>02 // INFORMATION WE COLLECT</h2>

          <p>
            S.E.A.F. L.E.M.O.N. does not require users to create an
            account and does not intentionally request information such
            as your name, address, telephone number, or payment
            information in order to use the site's core features.
          </p>

          <p>
            Like most websites, however, information may be processed
            automatically by the website infrastructure, hosting
            provider, advertising services, analytics services, or
            other third-party services used by the site.
          </p>

          <p>
            This may include information such as IP address, browser
            type, device information, approximate location, pages
            visited, referring pages, and information about how the
            website is used.
          </p>
        </section>

        <section className="legal-section">
          <h2>03 // COOKIES &amp; SIMILAR TECHNOLOGIES</h2>

          <p>
            S.E.A.F. L.E.M.O.N. may use cookies, local storage, or
            similar technologies for website functionality, security,
            analytics, and advertising.
          </p>

          <p>
            Some cookies may be placed by third-party service providers
            rather than directly by S.E.A.F. L.E.M.O.N.
          </p>
        </section>

        <section className="legal-section">
          <h2>04 // GOOGLE ADSENSE</h2>

          <p>
            S.E.A.F. L.E.M.O.N. may display advertisements provided by
            Google AdSense or other advertising partners.
          </p>

          <p>
            Google and its advertising partners may use cookies or
            similar technologies to deliver, measure, and personalize
            advertising based on a user's visit to this and other
            websites.
          </p>

          <p>
            Advertising and consent settings may vary depending on
            your location and applicable privacy requirements.
          </p>

          <p>
            Users may have options to manage advertising personalization
            and consent through Google's available privacy and
            advertising controls.
          </p>
        </section>

        <section className="legal-section">
          <h2>05 // THIRD-PARTY SERVICES</h2>

          <p>
            The website may rely on third-party services to provide
            hosting, advertising, data retrieval, analytics, or other
            functionality.
          </p>

          <p>
            These services may independently process information
            according to their own privacy policies and terms.
            S.E.A.F. L.E.M.O.N. does not control the privacy practices
            of third-party services.
          </p>
        </section>

        <section className="legal-section">
          <h2>06 // EXTERNAL DATA SOURCES</h2>

          <p>
            Some information displayed by S.E.A.F. L.E.M.O.N. is
            retrieved from external data sources. These requests may
            expose technical information such as your IP address or
            browser information to the service providing the requested
            resource, depending on how that service operates.
          </p>

          <p>
            S.E.A.F. L.E.M.O.N. does not claim ownership of third-party
            data that it references or displays.
          </p>
        </section>

        <section className="legal-section">
          <h2>07 // DATA RETENTION</h2>

          <p>
            S.E.A.F. L.E.M.O.N. does not maintain user accounts or an
            internal user profile database as part of the site's core
            functionality.
          </p>

          <p>
            Information processed by hosting providers, advertising
            providers, analytics services, or other third parties may
            be retained according to their respective policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>08 // YOUR CHOICES</h2>

          <p>
            Depending on your location, you may have rights relating
            to access, correction, deletion, objection, restriction,
            or portability of personal information processed by
            applicable services.
          </p>

          <p>
            You may also be able to control cookies through your
            browser settings and manage advertising preferences through
            available advertising controls.
          </p>
        </section>

        <section className="legal-section">
          <h2>09 // CHILDREN</h2>

          <p>
            S.E.A.F. L.E.M.O.N. is not directed toward children under
            the age required by applicable law. We do not knowingly
            request personal information from children.
          </p>
        </section>

        <section className="legal-section">
          <h2>10 // POLICY CHANGES</h2>

          <p>
            This Privacy Policy may be updated from time to time to
            reflect changes to the website, third-party services,
            advertising practices, or applicable requirements.
          </p>

          <p>
            The date shown at the beginning of this policy indicates
            when it was most recently updated.
          </p>
        </section>

        <section className="legal-section">
          <h2>11 // CONTACT</h2>

          <p>
            If you have a privacy question, data request, or concern
            about this website, use the contact method provided on the
            About &amp; Contact page.
          </p>
        </section>

        <section className="legal-final">
          <strong>DATA POLICY // END</strong>
          <span>
            S.E.A.F. L.E.M.O.N. is an unofficial fan reference project.
          </span>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
