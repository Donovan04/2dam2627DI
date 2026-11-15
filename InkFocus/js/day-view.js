/**
 * day-view.js
 * Panel del día seleccionado en el calendario:
 *   - resumen (tareas completadas, sesiones y minutos de concentración),
 *   - territorio de ese día (segunda instancia de territory.js),
 *   - tareas planificadas para ese día (mismas tarjetas que la ventana «Tareas»),
 *   - actividad de concentración registrada ese día.
 *
 * Consultar otro día no toca el temporizador, la fase ni la tarea activa:
 * este módulo solo lee datos y llama a los mismos manejadores que el resto.
 */
import { compareTasks, compareForTerritory } from './tasks-model.js';
import { formatDateFull, formatDateShort } from './dates.js';
import { formatClockTime } from './format.js';
import { escapeHTML, prefersReducedMotion } from './html.js';
import { taskCardHTML, renderTaskList, bindTaskList, focusCard } from './task-card.js';
import { createTerritory } from './territory.js';

const minutes = (ms) => Math.round(ms / 60000);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * @param {object} handlers  Mismos que la lista de tareas (onToggle, onActivate,
 *   onDeactivate, onEdit, onDelete) + onNew(dateKey) y onTerritoryToggle(id).
 */
export function createDayView(handlers) {
  const $ = (selector) => document.getElementById(selector);
  const el = {
    relation: $('day-relation'),
    title: $('day-title'),
    newButton: $('day-new-task'),
    summary: $('day-summary'),
    list: $('day-task-list'),
    empty: $('day-tasks-empty'),
    activity: $('day-activity'),
    activityEmpty: $('day-activity-empty'),
  };

  let date = null;

  const territory = createTerritory(
    $('day-territory'),
    {
      onToggle: handlers.onTerritoryToggle,
      onShowInList: (id) => focusTask(id),
      onNew: () => handlers.onNew(date),
    },
    { idPrefix: 'day-zone' },
  );

  bindTaskList(el.list, {
    ...handlers,
    onZone: (id) => territory.select(id, { focus: true, speak: false }),
  });

  el.newButton.addEventListener('click', () => handlers.onNew(date));
  el.empty.addEventListener('click', (event) => {
    if (event.target.closest('[data-empty-action="new"]')) handlers.onNew(date);
  });

  function renderSummary(dayTasks, daySessions) {
    const done = dayTasks.filter((task) => task.completed).length;
    const focusMs = daySessions.reduce((sum, session) => sum + session.focusMs, 0);
    el.summary.innerHTML = `
      <div class="day-stat"><dt>Tareas completadas</dt><dd>${done} <span>de ${dayTasks.length}</span></dd></div>
      <div class="day-stat"><dt>Sesiones de concentración</dt><dd>${daySessions.length}</dd></div>
      <div class="day-stat"><dt>Minutos de concentración</dt><dd>${minutes(focusMs)} <span>min</span></dd></div>`;
  }

  function sessionTaskText(session, lookupTask, today) {
    if (!session.taskId) return 'Sin tarea asociada';
    const task = lookupTask(session.taskId);
    const title = task ? task.title : session.taskTitle;
    let text = title ? `«${escapeHTML(title)}»` : 'Tarea sin título registrado';
    if (!task) text += ' <span class="activity__note">(tarea eliminada)</span>';
    if (session.taskDate && session.taskDate !== session.date) {
      text += ` <span class="activity__note">· planificada para ${escapeHTML(formatDateShort(session.taskDate, today).toLowerCase())}</span>`;
    }
    return text;
  }

  function renderActivity(daySessions, lookupTask, today) {
    el.activity.hidden = daySessions.length === 0;
    el.activityEmpty.hidden = daySessions.length > 0;
    if (!daySessions.length) {
      el.activityEmpty.textContent = date > today
        ? 'Este día todavía no ha llegado: aquí aparecerán las sesiones que completes.'
        : 'No hay sesiones de concentración registradas este día.';
      el.activity.innerHTML = '';
      return;
    }
    el.activity.innerHTML = daySessions
      .map((session) => {
        const range = session.startedAt
          ? `${formatClockTime(session.startedAt)}–${formatClockTime(session.endedAt)}`
          : `Terminó a las ${formatClockTime(session.endedAt)}`;
        const pause = session.pausedMs && session.pausedMs >= 60000
          ? ` <span class="activity__note">· ${minutes(session.pausedMs)} min en pausa (no cuentan)</span>`
          : '';
        return `
          <li class="activity">
            <span class="activity__time">${range}</span>
            <span class="activity__minutes">${minutes(session.focusMs)} min</span>
            <span class="activity__task">${sessionTaskText(session, lookupTask, today)}${pause}</span>
          </li>`;
      })
      .join('');
  }

  /**
   * @param {object} data
   * @param {string} data.date
   * @param {string} data.today
   * @param {object[]} data.dayTasks
   * @param {object[]} data.daySessions
   * @param {Map} data.counts
   * @param {string|null} data.activeId
   * @param {(id: string) => object|null} data.lookupTask
   */
  function render({ date: newDate, today, dayTasks, daySessions, counts, activeId, lookupTask }) {
    date = newDate;
    const fullDate = formatDateFull(date);
    el.title.textContent = fullDate.charAt(0).toUpperCase() + fullDate.slice(1);
    el.relation.textContent = date === today ? 'Hoy' : date < today ? 'Día pasado' : 'Día futuro';
    el.relation.dataset.relation = date === today ? 'today' : date < today ? 'past' : 'future';
    el.newButton.setAttribute('aria-label', `Nueva tarea para ${fullDate}`);

    renderSummary(dayTasks, daySessions);

    const zones = new Map([...dayTasks].sort(compareForTerritory).map((task, index) => [task.id, index + 1]));
    const sorted = [...dayTasks].sort(compareTasks);
    renderTaskList(
      el.list,
      sorted
        .map((task) =>
          taskCardHTML(task, {
            count: counts.get(task.id) ?? 0,
            zone: zones.get(task.id),
            activeId,
            today,
            showDate: false,
            idPrefix: 'day-task',
            zoneLabel: `Ver la zona ${zones.get(task.id)} en el territorio de este día`,
          }),
        )
        .join(''),
    );
    el.list.hidden = sorted.length === 0;
    el.empty.hidden = sorted.length > 0;
    if (!sorted.length) {
      el.empty.innerHTML = `
        <p class="empty__title">Sin tareas planificadas</p>
        <p class="empty__text">${date < today ? 'Este día no tuvo tareas planificadas.' : 'Planifica algo para este día y aparecerá en su territorio.'}</p>
        <button type="button" class="btn btn--solid btn--small" data-empty-action="new">Crear tarea para este día</button>`;
    }

    territory.render({ dayTasks, counts, activeId, date, today });
    renderActivity(daySessions, lookupTask, today);
  }

  /** Foco en la tarjeta de una tarea de este día (o en uno de sus controles). */
  function focusTask(id, key = null) {
    const card = document.getElementById(`day-task-${id}`);
    if (card) focusCard(card, id, key, prefersReducedMotion());
  }

  return {
    render,
    focusTask,
    focusHeading: () => el.title.focus(),
    getDate: () => date,
  };
}
