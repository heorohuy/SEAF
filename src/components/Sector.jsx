const MAP_CENTER_X = 480;
const MAP_CENTER_Y = 480;
const DEFAULT_MAP_RADIUS = 470;

const estimateTextWidth = (text) => {
  /*
   * Conservative approximation for the 3px Fragile Bombers
   * font used by sector labels.
   */
  return Math.max(
    String(text ?? '').length * 1.8,
    8
  );
};

const pointInPolygon = (x, y, points) => {
  let inside = false;

  for (
    let i = 0, j = points.length - 1;
    i < points.length;
    j = i++
  ) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];

    const intersects =
      yi > y !== yj > y &&
      x <
        ((xj - xi) * (y - yi)) /
          (yj - yi) +
          xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const rectsOverlap = (
  a,
  b,
  padding = 0
) => {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
};

const getLabelRect = (
  x,
  y,
  width
) => ({
  left: x - width / 2,
  right: x + width / 2,
  top: y - 3.2,
  bottom: y + 1.2,
});

const getSectorBounds = (sector) => {
  const hasPolygon =
    Array.isArray(sector.points) &&
    sector.points.length > 0;

  if (hasPolygon) {
    const xs = sector.points.map(
      ([x]) => x
    );

    const ys = sector.points.map(
      ([, y]) => y
    );

    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    };
  }

  return {
    left:
      sector.x -
      sector.width / 2,

    right:
      sector.x +
      sector.width / 2,

    top:
      sector.y -
      sector.height / 2,

    bottom:
      sector.y +
      sector.height / 2,
  };
};

const labelFitsInPolygon = (
  x,
  y,
  width,
  points
) => {
  if (
    !Array.isArray(points) ||
    points.length < 3
  ) {
    return true;
  }

  const halfWidth = width / 2;

  /*
   * Test the four corners of the text's
   * approximate bounding rectangle.
   */
  const corners = [
    [x - halfWidth, y - 3.2],
    [x + halfWidth, y - 3.2],
    [x - halfWidth, y + 1.2],
    [x + halfWidth, y + 1.2],
  ];

  return corners.every(([cx, cy]) =>
    pointInPolygon(cx, cy, points)
  );
};

const labelFitsInMap = (
  x,
  y,
  width,
  galaxyRadius
) => {
  const radius =
    galaxyRadius ?? DEFAULT_MAP_RADIUS;

  const halfWidth = width / 2;

  const corners = [
    [x - halfWidth, y - 3.2],
    [x + halfWidth, y - 3.2],
    [x - halfWidth, y + 1.2],
    [x + halfWidth, y + 1.2],
  ];

  return corners.every(([cx, cy]) => {
    return (
      Math.hypot(
        cx - MAP_CENTER_X,
        cy - MAP_CENTER_Y
      ) <= radius
    );
  });
};

export default function Sector({
  sector,
  planets = [],
  galaxyRadius = DEFAULT_MAP_RADIUS,
  showBox = true,
  showLabel = true,
}) {
  const hasPolygon =
    Array.isArray(sector.points) &&
    sector.points.length > 0;

  const polygonPoints = hasPolygon
    ? sector.points
        .map(([x, y]) => `${x},${y}`)
        .join(' ')
    : '';

  const centerX =
    sector.centerX ?? sector.x;

  const centerY =
    sector.centerY ?? sector.y;

  const bounds =
    getSectorBounds(sector);

  const labelWidth =
    estimateTextWidth(sector.name);

  /*
   * Keep labels a little away from the
   * sector boundary.
   */
  const padding = 4;

  const minX =
    bounds.left +
    labelWidth / 2 +
    padding;

  const maxX =
    bounds.right -
    labelWidth / 2 -
    padding;

  const minY =
    bounds.top + 4;

  const maxY =
    bounds.bottom - 2;

  /*
   * If a sector is very small, keep the
   * candidate area valid rather than producing
   * invalid coordinates.
   */
  const safeMinX = Math.min(
    minX,
    maxX
  );

  const safeMaxX = Math.max(
    minX,
    maxX
  );

  const safeMinY = Math.min(
    minY,
    maxY
  );

  const safeMaxY = Math.max(
    minY,
    maxY
  );

  /*
   * Candidate locations, ordered roughly from
   * preferred to least preferred.
   *
   * The center is preferred, but the other
   * positions let the label move away from
   * planets.
   */
  const candidates = [
    [centerX, centerY - 2],

    [centerX, safeMinY],
    [centerX, safeMaxY],

    [safeMinX, centerY - 2],
    [safeMaxX, centerY - 2],

    [safeMinX, safeMinY],
    [safeMaxX, safeMinY],
    [safeMinX, safeMaxY],
    [safeMaxX, safeMaxY],
  ];

  /*
   * Approximate the occupied area around each
   * planet. This includes room for the planet
   * name, FOB, and regiment icon.
   */
  const planetRects = planets.map(
    (planet) => {
      const nameWidth =
        estimateTextWidth(
          planet.name
        );

      return {
        left:
          planet.x - 4,

        right:
          planet.x +
          Math.max(
            nameWidth + 10,
            14
          ),

        top:
          planet.y - 7,

        bottom:
          planet.y + 8,
      };
    }
  );

  let labelX = centerX;
  let labelY = centerY - 2;

  let bestScore = Infinity;

  candidates.forEach(
    ([candidateX, candidateY], index) => {
      const x = Math.min(
        Math.max(
          candidateX,
          safeMinX
        ),
        safeMaxX
      );

      const y = Math.min(
        Math.max(
          candidateY,
          safeMinY
        ),
        safeMaxY
      );

      const rect = getLabelRect(
        x,
        y,
        labelWidth
      );

      /*
       * Polygon sectors:
       * require all four corners of the
       * label to remain inside the sector.
       */
      if (
        hasPolygon &&
        !labelFitsInPolygon(
          x,
          y,
          labelWidth,
          sector.points
        )
      ) {
        return;
      }

      /*
       * Rectangular sectors:
       * the candidate has already been
       * constrained to the sector bounds.
       */

      /*
       * The entire label must remain inside
       * the circular map boundary.
       */
      if (
        !labelFitsInMap(
          x,
          y,
          labelWidth,
          galaxyRadius
        )
      ) {
        return;
      }

      /*
       * Start with a small cost for moving away
       * from the natural sector center.
       */
      let score =
        Math.hypot(
          x - centerX,
          y - (centerY - 2)
        ) * 0.4;

      /*
       * Strong penalty for overlapping planets.
       */
      planetRects.forEach(
        (planetRect) => {
          if (
            rectsOverlap(
              rect,
              planetRect,
              2
            )
          ) {
            score += 1000;
          }
        }
      );

      /*
       * Prefer earlier candidates when scores
       * are otherwise similar.
       */
      score += index * 0.5;

      if (score < bestScore) {
        bestScore = score;
        labelX = x;
        labelY = y;
      }
    }
  );

  return (
    <g>
      {showBox &&
        (hasPolygon ? (
          <polygon
            className={`sector-box ${sector.faction}`}
            points={polygonPoints}
          />
        ) : (
          <rect
            className={`sector-box ${sector.faction}`}
            x={
              sector.x -
              sector.width / 2
            }
            y={
              sector.y -
              sector.height / 2
            }
            width={sector.width}
            height={sector.height}
          />
        ))}

      {showLabel && (
        <text
          className="sector-label"
          x={labelX}
          y={labelY}
          textAnchor="middle"
        >
          {sector.name}
        </text>
      )}
    </g>
  );
}
