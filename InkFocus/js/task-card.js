/**
 * task-card.js
 * Tarjeta de tarea compartida por la ventana «Tareas» y el panel del día del
 * calendario. Así ambas listas se ven y se comportan igual.
 *
 * - taskCardHTML(): devuelve el HTML de una tarjeta.
 * - bindTaskList(): conecta los eventos de una lista (delegación de eventos).
 * - renderTaskList(): pinta una lista conservando el foco del teclado.
 */
import { PRIORITIES } from './tasks-model.js';
import { formatDateShort } from './dates.js';
import { escapeHTML } from './html.js';

const MAX_DROPS = 10;

function pomodoroDrops(done, estimate) {
  const slots = Math.min(Math.max(estimate, done), MAX_DROPS);
  let drops = '';
  for (let i = 0; i < slots; i += 1) {
    const state = i < done ? (i < estimate ? 'done' : 'extra') : 'todo';
    drops += `<i class="drop drop--${state}"></i>`;
  }
  return `<span class="drops" aria-hidden="true">${drops}</span>`;
}

/**
 * @param {object} task
 * @param {object} options
 * @param {number} options.count      pomodoros completados
 * @param {number} [options.zone]     número de zona en el territorio de su día
 * @param {string} options.activeId   id de la tarea activa
 * @param {string} options.today      clave de hoy (para «Hoy», «Mañana»…)
 * @param {boolean} options.showDate  mostrar la fecha planificada
 * @param {string} options.idPrefix   prefijo de ids (dos listas pueden estar en el DOM a la vez)
 * @param {string} [options.zoneLabel] texto accesible del botón de zona
 */
export function taskCardHTML(task, { count, zone, activeId, today, showDate, idPrefix, zoneLabel }) {
  const id = escapeHTML(task.id);
  const domId = `${idPrefix}-${id}`;
  const title = escapeHTML(task.title);
  const isActive = task.id === activeId;
  const priority = PRIORITIES[task.priority];
  const done = task.completed;

  const zoneChip = zone
    ? `<li><button type="button" class="chip chip--zone" data-action="zone" data-focus-key="${id}:zone"
          aria-label="${escapeHTML(zoneLabel ?? `Ver la zona ${zone} en el territorio`)}">Zona ${zone}</button></li>`
    : '';
  const dateChip = showDate ? `<li class="chip chip--date">${escapeHTML(formatDateShort(task.date, today))}</li>` : '';
  const categoryChip = task.category ? `<li class="chip chip--category">${escapeHTML(task.category)}</li>` : '';

  const activeButton = done
    ? ''
    : isActive
      ? `<button type="button" class="btn btn--small btn--active-on" data-action="deactivate" data-focus-key="${id}:active">Quitar activa</button>`
      : `<button type="button" class="btn btn--small" data-action="activate" data-focus-key="${id}:active"
           aria-label="Activar «${title}»">Activar</button>`;

  return `
    <li class="task" id="${domId}" data-task-id="${id}" data-state="${done ? 'done' : 'pending'}"
        data-priority="${task.priority}"${isActive ? ' data-active' : ''} tabindex="-1" aria-labelledby="${domId}-title">
      <div class="task__check">
        <input type="checkbox" class="task__checkbox" id="${domId}-check" data-action="toggle"
               data-focus-key="${id}:check"${done ? ' checked' : ''}>
        <label for="${domId}-check" class="task__check-label">
          <span class="visually-hidden">Completada: ${title}</span>
        </label>
      </div>
      <div class="task__body">
        <div class="task__top">
          ${isActive ? '<span class="task__badge">Activa</span>' : ''}
          ${done ? '<span class="task__badge task__badge--done">Completada</span>' : ''}
          <h3 class="task__title" id="${domId}-title">${title}</h3>
        </div>
        ${task.notes ? `<p class="task__notes">${escapeHTML(task.notes)}</p>` : ''}
        <ul class="task__meta" aria-label="Detalles de la tarea">
          ${zoneChip}${dateChip}${categoryChip}
          <li class="chip chip--priority" data-level="${priority.level}">
            <span class="priority-bars" aria-hidden="true"><i></i><i></i><i></i></span>Prioridad ${priority.label.toLowerCase()}
          </li>
          <li class="pomodoros">${pomodoroDrops(count, task.estimate)}${count} de ${task.estimate} ${task.estimate === 1 ? 'pomodoro' : 'pomodoros'}</li>
        </ul>
        <div class="task__actions">
          ${activeButton}
          <button type="button" class="btn btn--small" data-action="edit" data-focus-key="${id}:edit"
                  aria-label="Editar «${title}»">Editar</button>
          <button type="button" class="btn btn--small btn--quiet-danger" data-action="delete"
                  aria-label="Eliminar «${title}»">Eliminar</button>
        </div>
      </div>
    </li>`;
}

/**
 * Pinta una lista de tarjetas. Si el foco estaba en un control de la lista,
 * se devuelve al control equivalente (mismo data-focus-key) tras pintar.
 */
export function renderTaskList(listEl, html) {
  const focusKey = listEl.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
  listEl.innerHTML = html;
  if (focusKey) listEl.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
}

/**
 * Conecta las acciones de una lista de tarjetas.
 * @param {HTMLElement} listEl
 * @param {object} handlers  onToggle(id, checked), onActivate, onDeactivate, onEdit, onDelete, onZone
 */
export function bindTaskList(listEl, handlers) {
  listEl.addEventListener('change', (event) => {
    if (event.target.dataset.action !== 'toggle') return;
    handlers.onToggle(event.target.closest('.task').dataset.taskId, event.target.checked);
  });

  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.closest('.task').dataset.taskId;
    const actions = {
      activate: handlers.onActivate,
      deactivate: handlers.onDeactivate,
      edit: handlers.onEdit,
      delete: handlers.onDelete,
      zone: handlers.onZone,
    };
    actions[button.dataset.action]?.(id);
  });
}

/** Lleva el foco a una tarjeta (o a uno de sus controles) y la resalta un momento. */
export function focusCard(card, id, key, reducedMotion) {
  const target = key ? card.querySelector(`[data-focus-key="${CSS.escape(`${id}:${key}`)}"]`) ?? card : card;
  card.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  target.focus({ preventScroll: true });
  card.classList.remove('is-highlighted');
  void card.offsetWidth;
  card.classList.add('is-highlighted');
}
