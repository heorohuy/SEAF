import { useState } from 'react';
import NavigationMenu from './NavigationMenu';
import './SiteHeader.css';
import { Shield } from 'lucide-react';

export default function SiteHeader({
  databaseStatus,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoExpanded, setLogoExpanded] = useState(false);

  return (
    <>
      <header className="app-header">
        <div
          className={`logo ${logoExpanded
              ? 'expanded'
              : ''
            }`}
          onClick={() =>
            setLogoExpanded(
              (previous) =>
                !previous,
            )
          }
        >
          <Shield size={24} />

          <span>
            S.E.A.F. -
            L.E.M.O.N
          </span>

          {logoExpanded && (
            <div className="logo-expanded">
              <div>
                SUPER EARTH ARMED
                FORCES
              </div>

              <div>
                LOGISTICS &
                EMERGENCY
                MOVEMENT
                OPERATIONS
                NETWORK
              </div>
            </div>
          )}
        </div>

        <div className="app-header-status">
          {databaseStatus && (
            <div className="app-header-status-item">
              <span className="app-header-status-label">
                DATABASE STATUS
              </span>

              <span
                className={`app-header-status-value app-header-status-${databaseStatus.state}`}
              >
                
                {databaseStatus.label}
              </span>
            </div>
          )}

        </div>

        <div className="app-header-actions">
          {children}

          <NavigationMenu />
        </div>
      </header>

      
    </>
  );
}
