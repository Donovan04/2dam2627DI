/**
 * territory.js
 * Territorio de un día: cada tarea de esa fecha es una zona de un mapa SVG original.
 * Se usa dos veces: «Territorio de hoy» (pantalla principal, siempre hoy) y el
 * territorio del día seleccionado en el calendario. Cada instancia trabaja
 * dentro de su propio contenedor y con ids SVG propios (idPrefix).
 *
 * - El mapa solo se reconstruye si cambia la LISTA de tareas del día (se añade,
 *   se elimina o cambia de fecha alguna). Completar, reabrir o editar solo
 *   actualiza atributos, así la distribución se mantiene estable.
 * - Pintar/despintar es una transición CSS de la mancha de tinta de la zona.
 * - Ratón y pantalla táctil: clic o toque en una zona.
 * - Teclado: el mapa es una sola parada de tabulación; las flechas recorren
 *   las zonas (cada una se anuncia con su tarea) y Enter o Espacio la seleccionan.
 */
import { islandPolygon, seedPoints, voronoiCells, farthestDistance, toPath } from './territory-geometry.js';
import { compareForTerritory } from './tasks-model.js';
import { formatDateLong, formatDateShort } from './dates.js';
import { escapeHTML, prefersReducedMotion } from './html.js';
import { announce } from './announcer.js';

const ISLAND = islandPolygon();
const ISLAND_PATH = toPath(ISLAND);

/**
 * @param {HTMLElement} root   Contenedor con los elementos [data-territory="…"]
 * @param {object} handlers    onToggle(id), onShowInList(id), onNew()
 * @param {object} options
 * @param {string} options.idPrefix  Prefijo único para los ids del SVG
 */
export function createTerritory(root, handlers, { idPrefix }) {
  const part = (name) => root.querySelector(`[data-territory="${name}"]`);
  const el = {
    date: part('date'),
    progress: part('progress'),
    meterFill: part('meter'),
    map: part('map'),
    info: part('info'),
    empty: part('empty'),
    emptyText: part('empty-text'),
    emptyButton: part('empty-button'),
    legend: part('legend'),
    help: part('help'),
  };
  const hatchId = `${idPrefix}-hatch`;
  const clipId = (index) => `${idPrefix}-clip-${index}`;

  let dateKey = null;
  let isToday = true;
  let layoutKey = null;
  let tasks = [];
  let byId = new Map();
  let counts = new Map();
  let activeId = null;
  let selectedId = null;
  let focusIndex = 0;
  let lastInfoKey = '';
  let cellPaths = [];

  /** Dibuja el contorno de selección o de foco sobre la zona indicada (o lo borra). */
  function setOverlay(kind, index) {
    const overlay = el.map.querySelector(`[data-overlay="${kind}"]`);
    if (overlay) overlay.setAttribute('d', index >= 0 ? cellPaths[index] ?? '' : '');
  }

  /* ---------- Construcción del mapa ---------- */

  function zoneTemplate(task, index, seed, cell, badgeRadius) {
    const d = toPath(cell);
    const [sx, sy] = seed;
    // La mancha debe cubrir toda la zona: su "radio interior" es ~0,55 de su tamaño.
    const size = (farthestDistance(seed, cell) + 6) * 3.8;
    const shade = size * 0.42;
    const pos = (value, length) => (value - length / 2).toFixed(1);
    return `
      <g class="zone" data-task-id="${escapeHTML(task.id)}" data-index="${index}" role="button" tabindex="-1">
        <title></title>
        <path class="zone__base" d="${d}" fill="url(#${hatchId})"/>
        <g clip-path="url(#${clipId(index)})">
          <g class="zone__paint" style="transform-origin: ${sx.toFixed(1)}px ${sy.toFixed(1)}px">
            <svg class="zone__splat" x="${pos(sx, size)}" y="${pos(sy, size)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" viewBox="0 0 200 200"><use href="#splat-shape"/></svg>
            <svg class="zone__splat zone__splat--shade" x="${pos(sx, shade)}" y="${pos(sy, shade)}" width="${shade.toFixed(1)}" height="${shade.toFixed(1)}" viewBox="0 0 200 200"><use href="#splat-shape" transform="rotate(${(index * 47) % 360} 100 100)"/></svg>
          </g>
        </g>
        <path class="zone__edge" d="${d}"/>
        <circle class="zone__badge" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${badgeRadius}"/>
        <text class="zone__number" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" dy="0.36em" text-anchor="middle" font-size="${(badgeRadius * 1.15).toFixed(1)}">${index + 1}</text>
      </g>`;
  }

  function buildMap() {
    const hadFocus = el.map.contains(document.activeElement);
    const focusedId = hadFocus ? document.activeElement.dataset.taskId : null;

    const seeds = seedPoints(tasks.length);
    const cells = voronoiCells(seeds, ISLAND);
    const badgeRadius = tasks.length > 14 ? 10 : tasks.length > 8 ? 13 : 16;

    el.map.innerHTML = `
      <svg class="territory__svg" viewBox="0 0 400 300" role="group"
           aria-label="Mapa del territorio: ${tasks.length} ${tasks.length === 1 ? 'zona' : 'zonas'}" aria-describedby="${el.help.id}">
        <defs>
          <pattern id="${hatchId}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect class="hatch__bg" width="9" height="9"/><rect class="hatch__line" width="3" height="9"/>
          </pattern>
          ${cells.map((cell, i) => `<clipPath id="${clipId(i)}"><path d="${toPath(cell)}"/></clipPath>`).join('')}
        </defs>
        <path class="island__shore" d="${ISLAND_PATH}"/>
        <path class="island__ground" d="${ISLAND_PATH}"/>
        ${tasks.map((task, i) => zoneTemplate(task, i, seeds[i], cells[i], badgeRadius)).join('')}
        <!-- Contornos de selección y foco: van encima de todas las zonas para verse completos -->
        <path class="zone-overlay zone-overlay--selected" data-overlay="selected" d=""/>
        <path class="zone-overlay zone-overlay--focus" data-overlay="focus" d=""/>
      </svg>`;
    cellPaths = cells.map(toPath);

    const keepIndex = tasks.findIndex((task) => task.id === (focusedId ?? selectedId));
    focusIndex = keepIndex >= 0 ? keepIndex : 0;
    if (hadFocus) zones()[focusIndex]?.focus();
  }

  const zones = () => [...el.map.querySelectorAll('.zone')];

  /* ---------- Estado de cada zona ---------- */

  function updateZones() {
    zones().forEach((zone, index) => {
      const task = byId.get(zone.dataset.taskId);
      const isActive = task.id === activeId;
      zone.dataset.state = task.completed ? 'done' : 'pending';
      zone.toggleAttribute('data-active', isActive);
      zone.toggleAttribute('data-selected', task.id === selectedId);
      zone.tabIndex = index === focusIndex ? 0 : -1;
      const label = `Zona ${index + 1}: ${task.title}. ${task.completed ? 'Completada' : 'Pendiente'}${isActive ? '. Tarea activa' : ''}.`;
      if (zone.getAttribute('aria-label') !== label) {
        zone.setAttribute('aria-label', label);
        zone.querySelector('title').textContent = label;
      }
    });
    setOverlay('selected', tasks.findIndex((task) => task.id === selectedId));
  }

  function renderInfo() {
    const task = byId.get(selectedId);
    const count = task ? counts.get(task.id) ?? 0 : 0;
    const key = task ? JSON.stringify([task.id, task.title, task.completed, task.category, task.estimate, count]) : 'none';
    if (key === lastInfoKey) return;
    lastInfoKey = key;

    const focusedAction = el.info.contains(document.activeElement) ? document.activeElement.dataset.action : null;
    el.info.dataset.state = task ? (task.completed ? 'done' : 'pending') : 'none';

    if (!task) {
      el.info.innerHTML = '<p class="zone-info__hint">Selecciona una zona para ver su tarea: haz clic o tócala, o usa las flechas del teclado y Enter.</p>';
      return;
    }
    const zoneNumber = tasks.indexOf(task) + 1;
    const meta = [
      task.completed ? 'Completada' : 'Pendiente',
      task.category ? escapeHTML(task.category) : null,
      `${count} de ${task.estimate} ${task.estimate === 1 ? 'pomodoro' : 'pomodoros'}`,
    ].filter(Boolean);
    el.info.innerHTML = `
      <p class="zone-info__zone">Zona ${zoneNumber}</p>
      <p class="zone-info__title">${escapeHTML(task.title)}</p>
      <p class="zone-info__meta">${meta.join(' · ')}</p>
      <div class="zone-info__actions">
        <button type="button" class="btn btn--small${task.completed ? '' : ' btn--solid'}" data-action="toggle">${task.completed ? 'Reabrir tarea' : 'Marcar como completada'}</button>
        <button type="button" class="btn btn--small" data-action="show">Ver en la lista</button>
      </div>`;
    if (focusedAction) el.info.querySelector(`[data-action="${focusedAction}"]`)?.focus();
  }

  function renderProgress() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.completed).length;
    let text;
    if (!total) text = isToday ? 'Sin tareas para hoy' : 'Sin tareas este día';
    else if (done === total) text = `¡${done} de ${total} ${total === 1 ? 'tarea completada' : 'tareas completadas'}! Territorio pintado`;
    else text = `${done} de ${total} ${total === 1 ? 'tarea completada' : 'tareas completadas'}`;
    if (el.progress.textContent !== text) el.progress.textContent = text;
    el.meterFill.style.width = `${total ? (done / total) * 100 : 0}%`;
  }

  /* ---------- API pública ---------- */

  /**
   * @param {object} data
   * @param {object[]} data.dayTasks  tareas planificadas para la fecha
   * @param {Map} data.counts         pomodoros por tarea
   * @param {string|null} data.activeId
   * @param {string} data.date        fecha que representa el mapa
   * @param {string} data.today       fecha de hoy
   */
  function render({ dayTasks, counts: newCounts, activeId: newActiveId, date, today }) {
    if (date !== dateKey) {
      // Otro día: otra lista de zonas. Se olvida la selección anterior.
      dateKey = date;
      selectedId = null;
      layoutKey = null;
    }
    isToday = date === today;
    tasks = [...dayTasks].sort(compareForTerritory);
    byId = new Map(tasks.map((task) => [task.id, task]));
    counts = newCounts;
    activeId = newActiveId;
    if (!byId.has(selectedId)) selectedId = null;

    const label = formatDateLong(date);
    const dateText = label.charAt(0).toUpperCase() + label.slice(1);
    if (el.date && el.date.textContent !== dateText) el.date.textContent = dateText;

    const isEmpty = tasks.length === 0;
    el.empty.hidden = !isEmpty;
    el.map.hidden = isEmpty;
    el.info.hidden = isEmpty;
    el.legend.hidden = isEmpty;
    if (isEmpty) {
      el.emptyText.textContent = isToday
        ? 'Cada tarea que planifiques para hoy se convertirá en una zona de este mapa. Complétala y la pintarás.'
        : 'Este día no tiene tareas planificadas. Cada tarea que añadas será una zona de su mapa.';
      el.emptyButton.textContent = isToday ? 'Crear tarea para hoy' : `Crear tarea para ${formatDateShort(date, today).toLowerCase()}`;
    }

    const key = tasks.map((task) => task.id).join('|');
    if (isEmpty) {
      el.map.innerHTML = '';
      layoutKey = '';
    } else if (key !== layoutKey) {
      layoutKey = key;
      buildMap();
    }
    updateZones();
    renderInfo();
    renderProgress();
  }

  /** Selecciona la zona de una tarea. */
  function select(id, { focus = false, speak = true } = {}) {
    if (!byId.has(id)) return;
    selectedId = id;
    focusIndex = tasks.findIndex((task) => task.id === id);
    updateZones();
    renderInfo();
    if (focus) {
      const zone = zones()[focusIndex];
      zone.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      zone.focus({ preventScroll: true });
    }
    if (speak) {
      const task = byId.get(id);
      announce(`Zona ${focusIndex + 1}: ${task.title}. ${task.completed ? 'Completada' : 'Pendiente'}.`);
    }
  }

  /* ---------- Eventos ---------- */

  el.map.addEventListener('click', (event) => {
    const zone = event.target.closest('.zone');
    if (zone) select(zone.dataset.taskId);
  });

  el.map.addEventListener('focusin', (event) => {
    const zone = event.target.closest('.zone');
    if (!zone) return;
    focusIndex = Number(zone.dataset.index);
    zones().forEach((item, index) => { item.tabIndex = index === focusIndex ? 0 : -1; });
    // Contorno de foco solo para navegación con teclado (como :focus-visible).
    setOverlay('focus', zone.matches(':focus-visible') ? focusIndex : -1);
  });

  el.map.addEventListener('focusout', () => setOverlay('focus', -1));

  el.map.addEventListener('keydown', (event) => {
    const zone = event.target.closest('.zone');
    if (!zone) return;
    const list = zones();
    let next = null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (focusIndex + 1) % list.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (focusIndex - 1 + list.length) % list.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = list.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        select(zone.dataset.taskId);
        return;
      default:
        return;
    }
    event.preventDefault();
    list[next].focus();
  });

  el.info.addEventListener('click', (event) => {
    const action = event.target.closest('button[data-action]')?.dataset.action;
    if (!selectedId) return;
    if (action === 'toggle') handlers.onToggle(selectedId);
    if (action === 'show') handlers.onShowInList(selectedId);
  });

  el.empty.addEventListener('click', (event) => {
    if (event.target.closest('[data-territory="empty-button"]')) handlers.onNew();
  });

  return { render, select };
}
