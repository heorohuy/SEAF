import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  Map,
  Database,
} from 'lucide-react';

import '../AppNavigation.css';

export default function NavigationMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="navigation-menu-trigger"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Menu size={24} />
      </button>

      {open && (
        <button
          type="button"
          className="navigation-menu-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`navigation-menu-panel ${
          open ? 'navigation-menu-panel--open' : ''
        }`}
        aria-hidden={!open}
      >
        <div className="navigation-menu-header">
          <div>
            <div className="navigation-menu-classification">
              S.E.A.F. // L.E.M.O.N
            </div>

            <div className="navigation-menu-title">
              NAVIGATION
            </div>
          </div>

          <button
            type="button"
            className="navigation-menu-close"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          >
            <X size={22} />
          </button>
        </div>

        <div className="navigation-menu-body">
          <div className="navigation-menu-section-label">
            GALACTIC OPERATIONS
          </div>

          <nav className="navigation-menu-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `navigation-menu-link ${
                  isActive ? 'navigation-menu-link--active' : ''
                }`
              }
              onClick={closeMenu}
            >
              <span className="navigation-menu-link-icon">
                <Map size={19} />
              </span>

              <span className="navigation-menu-link-content">
                <strong>GALACTIC MAP</strong>
                <small>LIVE WAR MAP</small>
              </span>
            </NavLink>

            <NavLink
              to="/planets"
              className={({ isActive }) =>
                `navigation-menu-link ${
                  isActive ? 'navigation-menu-link--active' : ''
                }`
              }
              onClick={closeMenu}
            >
              <span className="navigation-menu-link-icon">
                <Database size={19} />
              </span>

              <span className="navigation-menu-link-content">
                <strong>PLANET DATABASE</strong>
                <small>ID // POSITION // BIOME</small>
              </span>
            </NavLink>
          </nav>

          <div className="navigation-menu-footer">
            <div>SUPER EARTH ARMED FORCES</div>
            <div>LOGISTICS &amp; EMERGENCY MOVEMENT OPERATIONS NETWORK</div>
          </div>
        </div>
      </aside>
    </>
  );
}