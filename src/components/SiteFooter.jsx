import { Link } from "react-router-dom";
import "./SiteFooter.css";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <strong>S.E.A.F. // L.E.M.O.N</strong>
        <span>UNOFFICIAL HELLDIVERS 2 FAN REFERENCE</span>
      </div>

      <nav
        className="site-footer-links"
        aria-label="Site information"
      >
        <Link to="/about">ABOUT</Link>
        <span aria-hidden="true">|</span>

        <Link to="/privacy">PRIVACY</Link>
        <span aria-hidden="true">|</span>

        <Link to="/terms">TERMS</Link>
        <span aria-hidden="true">|</span>

        <a href="/about#contact">CONTACT</a>
      </nav>

      <div className="site-footer-disclaimer">
        <span>
          S.E.A.F. L.E.M.O.N. is an unofficial fan-made project and
          is not affiliated with or endorsed by the owners of
          Helldivers 2.
        </span>
      </div>
    </footer>
  );
}
