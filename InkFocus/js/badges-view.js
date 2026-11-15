/**
 * badges-view.js
 * Sección «Insignias» de la vista Estadísticas.
 * Conseguida: mancha de tinta rellena + fecha. Pendiente: contorno discontinuo
 * + cuánto falta. El estado también va en texto (no depende del color).
 */
import { BADGES, badgeProgress } from './badges.js';
import { escapeHTML } from './html.js';

const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

export function createBadgesView() {
  const list = document.getElementById('badge-list');
  const summary = document.getElementById('badge-summary');
  let highlight = new Set();

  /**
   * @param {object} data
   * @param {Record<string, {at:number}>} data.unlocked
   * @param {object[]} data.sessions
   * @param {object[]} data.todaySessions
   * @param {number} data.goal
   */
  function render({ unlocked, sessions, todaySessions, goal }) {
    const earned = BADGES.filter((badge) => unlocked[badge.id]).length;
    summary.textContent = `${earned} de ${BADGES.length} conseguidas`;
    list.innerHTML = BADGES.map((badge) => {
      const got = unlocked[badge.id];
      const status = got
        ? `Conseguida el ${dateFormat.format(new Date(got.at))}`
        : badgeProgress(badge.id, { sessions, todaySessions, goal });
      return `
        <li class="badge${got ? ' badge--earned' : ''}${highlight.has(badge.id) ? ' is-new' : ''}">
          <svg class="badge__art" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><use href="#splat-shape"/></svg>
          <div class="badge__text">
            <p class="badge__name">${escapeHTML(badge.name)}</p>
            <p class="badge__description">${escapeHTML(badge.description)}</p>
            <p class="badge__status"><span class="badge__state">${got ? 'Conseguida' : 'Pendiente'}:</span> ${escapeHTML(status.replace(/^Conseguida /, ''))}</p>
          </div>
        </li>`;
    }).join('');
    highlight = new Set();
  }

  /** Marca insignias recién conseguidas para resaltarlas en el siguiente pintado. */
  function markNew(ids) {
    highlight = new Set(ids);
  }

  return { render, markNew };
}
