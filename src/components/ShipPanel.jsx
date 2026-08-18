// src/components/ShipPanel.jsx

import {
  ExternalLink,
  Rocket,
  X,
} from 'lucide-react';
import { getShipDetailUrl } from '../api/hd2Clans';

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString()
    : String(value);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getConditionClass(key) {
  switch (key) {
    case 'deployed':
      return 'ship-condition-good';

    case 'preparing_deploy':
      return 'ship-condition-transit';

    case 'drydocked':
      return 'ship-condition-danger';

    case 'anchored':
    case 'reserve':
      return 'ship-condition-neutral';

    default:
      return 'ship-condition-neutral';
  }
}

function HullBar({ hull }) {
  const max =
    Number(hull?.max_segments) || 5;

  const filled =
    Number(hull?.segments) || 0;

  return (
    <div className="ship-hull">
      <div className="ship-hull-label">
        <span>HULL</span>
        <strong>
          {hull?.label || 'Unknown'}
        </strong>
      </div>

      <div className="ship-hull-segments">
        {Array.from(
          { length: max },
          (_, index) => (
            <span
              key={index}
              className={
                index < filled
                  ? 'filled'
                  : ''
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

export default function ShipPanel({
  ship,
  route,
  onClose,
}) {
  if (!ship) {
    return null;
  }

  const conditionKey =
    ship.condition?.key;

  const location =
    route?.destination?.name ||
    ship.condition?.location ||
    'Unknown';

  const detailUrl = getShipDetailUrl(
    ship.id,
  );

  const progress =
    Number(ship.progress_pct);

  return (
    <section className="planet-panel ship-panel">
      <div className="panel-header ship-panel-header">
        <Rocket size={20} />
        <span>SELECTED SHIP</span>

        <button
          className="ship-panel-close"
          type="button"
          onClick={onClose}
          aria-label="Close ship panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="ship-panel-title-row">
        {ship.image_url ? (
          <img
            className="ship-panel-image"
            src={ship.image_url}
            alt=""
          />
        ) : (
          <div className="ship-panel-image ship-panel-image-fallback">
            <Rocket size={20} />
          </div>
        )}

        <div>
          <h1>{ship.name || 'Unnamed Ship'}</h1>

          <div className="ship-panel-class">
            {ship.ship_class ||
              'Unknown Class'}
          </div>
        </div>
      </div>

      <div
        className={`ship-condition ${getConditionClass(
          conditionKey,
        )}`}
      >
        <span className="ship-condition-dot" />
        <span>
          {ship.condition?.label ||
            conditionKey ||
            'Unknown'}
        </span>
      </div>

      <div className="ship-panel-grid">
        <div>
          <span className="status-label">
            LOCATION
          </span>
          <strong>
            {location}
          </strong>
        </div>

        <div>
          <span className="status-label">
            CLASS
          </span>
          <strong>
            {ship.ship_class || '—'}
          </strong>
        </div>

        <div>
          <span className="status-label">
            LEVEL
          </span>
          <strong
            style={{
              color:
                ship.level_color ||
                undefined,
            }}
          >
            {ship.level ?? '—'}
          </strong>
        </div>

        <div>
          <span className="status-label">
            XP
          </span>
          <strong>
            {formatNumber(ship.xp)}
          </strong>
        </div>
      </div>

      <HullBar hull={ship.hull} />

      {conditionKey ===
        'preparing_deploy' &&
        Number.isFinite(progress) && (
          <div className="ship-progress">
            <div className="ship-progress-label">
              <span>DEPLOYMENT</span>
              <strong>
                {Math.round(progress)}%
              </strong>
            </div>

            <div className="ship-progress-track">
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, progress),
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

      {route && (
        <div className="ship-route-summary">
          <div>
            <span>ORIGIN</span>
            <strong>
              {route.origin.name}
            </strong>
          </div>

          <div className="ship-route-arrow">
            →
          </div>

          <div>
            <span>DESTINATION</span>
            <strong>
              {route.destination.name}
            </strong>
          </div>
        </div>
      )}

      {ship.battle_group && (
        <div className="status-block">
          <div className="status-label">
            BATTLE GROUP
          </div>

          <div className="status-value">
            {ship.battle_group.name ||
              '—'}
          </div>
        </div>
      )}

      {ship.condition?.forced && (
        <div className="ship-warning">
          HULL BREACH / FORCED STATE
        </div>
      )}

      <div className="status-block">
        <div className="status-label">
          AWARDED
        </div>

        <div className="status-value">
          {formatDate(ship.awarded_at)}
        </div>
      </div>

      <a
        className="ship-detail-link"
        href={detailUrl}
        target="_blank"
        rel="noreferrer"
      >
        <span>OPEN HANGAR RECORD</span>
        <ExternalLink size={14} />
      </a>
    </section>
  );
}