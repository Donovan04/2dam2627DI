/**
 * tank.js
 * Controla el tanque de tinta (SVG definido en index.html).
 *
 * El líquido es un grupo <g> con dos ondas. Para cambiar el nivel solo lo
 * desplazamos en vertical: la máscara (clipPath) recorta lo que sale del vidrio.
 * Las animaciones (olas, burbujas, gotas) dependen de data-status en el CSS,
 * así que al pausar se detienen sin tocar JavaScript.
 */

// Coordenadas (en unidades del viewBox) de la superficie del líquido.
const SURFACE_EMPTY_Y = 272; // un poco por debajo del fondo: nada visible
const SURFACE_FULL_Y = 44; // un poco por encima del techo: lleno del todo

const STAMP_TEXT = {
  paused: 'En pausa',
  expired: 'Terminada',
};

export function createTank(root) {
  const liquid = root.querySelector('[data-tank-liquid]');
  const percentLabel = root.querySelector('[data-tank-percent]');
  const svgTitle = root.querySelector('[data-tank-title]');
  const stamp = root.querySelector('[data-tank-stamp]');
  let lastKey = '';

  function update({ level, phase, status, phaseLabel }) {
    root.dataset.phase = phase;
    root.dataset.status = status;

    const y = SURFACE_EMPTY_Y - level * (SURFACE_EMPTY_Y - SURFACE_FULL_Y);
    liquid.style.transform = `translateY(${y.toFixed(2)}px)`;

    // Los textos solo se reescriben cuando cambia el porcentaje entero o el estado.
    // Igual que el reloj (que redondea hacia arriba), el tanque no marca 0 % ni
    // 100 % hasta que la fase ha terminado de verdad.
    const percent = phase === 'focus' ? Math.ceil(level * 100) : Math.floor(level * 100);
    const key = `${percent}|${status}|${phase}`;
    if (key === lastKey) return;
    lastKey = key;

    percentLabel.textContent = `${percent} %`;
    svgTitle.textContent = `Tanque de tinta al ${percent} %. Fase: ${phaseLabel}.`;
    const stampText = STAMP_TEXT[status];
    stamp.hidden = !stampText;
    if (stampText) stamp.textContent = stampText;
  }

  return { update };
}
