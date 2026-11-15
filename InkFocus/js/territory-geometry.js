/**
 * territory-geometry.js
 * Geometría del mapa del territorio. Funciones puras (sin DOM).
 *
 * Idea:
 * 1. La isla es una elipse "ondulada" fija: siempre el mismo contorno.
 * 2. Cada tarea recibe un punto semilla repartido en espiral de girasol
 *    (ángulo áureo), que distribuye los puntos de forma uniforme.
 * 3. Cada zona es la parte de la isla más cercana a su semilla que a ninguna
 *    otra (diagrama de Voronoi), calculada recortando la isla con semiplanos.
 * Sin números aleatorios: con la misma lista de tareas, el mapa es idéntico.
 */

export const MAP = { width: 400, height: 300, cx: 200, cy: 150, rx: 168, ry: 116 };

/** Contorno de la isla: elipse deformada con tres ondas suaves. */
export function islandPolygon(points = 96) {
  const polygon = [];
  for (let k = 0; k < points; k += 1) {
    const t = (k / points) * Math.PI * 2;
    const wobble = 1 + 0.055 * Math.sin(3 * t + 0.6) + 0.04 * Math.sin(5 * t + 2.1) + 0.025 * Math.sin(9 * t + 0.3);
    polygon.push([MAP.cx + Math.cos(t) * MAP.rx * wobble, MAP.cy + Math.sin(t) * MAP.ry * wobble]);
  }
  return polygon;
}

/** Semillas en espiral de girasol, siempre dentro de la isla. */
export function seedPoints(count) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const radius = count === 1 ? 0 : Math.sqrt((i + 0.5) / count) * 0.76;
    const angle = i * goldenAngle - Math.PI / 2;
    return [MAP.cx + Math.cos(angle) * radius * MAP.rx, MAP.cy + Math.sin(angle) * radius * MAP.ry];
  });
}

/**
 * Recorta un polígono y se queda con la parte que cumple a·x + b·y ≤ c
 * (algoritmo de Sutherland–Hodgman para un solo semiplano).
 */
function clipHalfPlane(polygon, a, b, c) {
  const result = [];
  for (let k = 0; k < polygon.length; k += 1) {
    const p = polygon[k];
    const q = polygon[(k + 1) % polygon.length];
    const fp = a * p[0] + b * p[1] - c;
    const fq = a * q[0] + b * q[1] - c;
    if (fp <= 0) result.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      result.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return result;
}

/** Zonas de Voronoi de cada semilla, limitadas por el contorno de la isla. */
export function voronoiCells(seeds, boundary) {
  return seeds.map((seed, i) => {
    let cell = boundary;
    seeds.forEach((other, j) => {
      if (i === j) return;
      // Puntos más cerca de `seed` que de `other`: (other − seed)·p ≤ (|other|² − |seed|²) / 2
      const a = other[0] - seed[0];
      const b = other[1] - seed[1];
      const c = (other[0] ** 2 + other[1] ** 2 - seed[0] ** 2 - seed[1] ** 2) / 2;
      cell = clipHalfPlane(cell, a, b, c);
    });
    return cell;
  });
}

/** Distancia máxima desde un punto a los vértices de un polígono. */
export function farthestDistance(point, polygon) {
  return polygon.reduce((max, vertex) => Math.max(max, Math.hypot(vertex[0] - point[0], vertex[1] - point[1])), 0);
}

/** Polígono → atributo d de un <path>. */
export function toPath(polygon) {
  return `M${polygon.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
}
