/**
 * stats-view.js
 * Vista «Estadísticas»: hoy, últimos 7 días (gráfico + tabla), totales e historial.
 *
 * Todo sale del MISMO registro de sesiones que usan el calendario, el objetivo
 * y los contadores de las tareas, así que nunca pueden contradecirse.
 * Criterio de fecha: cada sesión cuenta en el día local en que TERMINA.
 * No existen contadores antiguos sin fecha (la v2 ya guardaba cada sesión con
 * su fecha), así que no hay nada que repartir ni que pueda contarse dos veces.
 */
import { addDays, dateFromKey, formatDateFull, formatDateShort } from './dates.js';
import { formatClockTime } from './format.js';
import { escapeHTML, prefersReducedMotion } from './html.js';

const PAGE_SIZE = 15;
const NO_TASK = '__none__';

const minutes = (ms) => Math.round(ms / 60000);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/** "3 h 25 min", "45 min" */
function formatLongDuration(ms) {
  const total = minutes(ms);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

const weekdayShort = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
const historyDate = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

function tile(label, value, unit = '', hint = '') {
  return `
    <div class="stat-tile">
      <dt>${label}</dt>
      <dd><span class="stat-tile__value">${value}</span>${unit ? ` <span class="stat-tile__unit">${unit}</span>` : ''}</dd>
      ${hint ? `<dd class="stat-tile__hint">${hint}</dd>` : ''}
    </div>`;
}

/** Escala "redonda" para el eje: múltiplos de 15 o 30 minutos. */
function niceMax(value) {
  if (value <= 30) return 30;
  if (value <= 60) return 60;
  const step = value <= 180 ? 30 : 60;
  return Math.ceil(value / step) * step;
}

export function createStatsView() {
  const $ = (id) => document.getElementById(id);
  const el = {
    today: $('stats-today'),
    weekTotals: $('stats-week-totals'),
    chart: $('stats-chart'),
    tableBody: $('stats-table-body'),
    weekEmpty: $('stats-week-empty'),
    weekData: $('stats-week-data'),
    totals: $('stats-totals'),
    filters: $('history-filters'),
    from: $('history-from'),
    to: $('history-to'),
    task: $('history-task'),
    rangeError: $('history-range-error'),
    count: $('history-count'),
    list: $('history-list'),
    empty: $('history-empty'),
    more: $('history-more'),
  };

  const filters = { from: '', to: '', task: '' };
  let visibleCount = PAGE_SIZE;
  let data = null; // último conjunto de datos recibido en render()

  /* ---------- Hoy ---------- */

  function renderToday({ todaySessions, todayTasks, goal }) {
    const focusMs = todaySessions.reduce((sum, s) => sum + s.focusMs, 0);
    const done = todayTasks.filter((task) => task.completed).length;
    el.today.innerHTML = [
      tile('Minutos de concentración', minutes(focusMs), 'min', 'Sin contar pausas ni descansos'),
      tile('Sesiones completadas', todaySessions.length, `de ${goal}`, 'Tu objetivo diario'),
      tile('Tareas de hoy completadas', done, `de ${todayTasks.length}`, 'Tareas planificadas para hoy que ya están completadas'),
    ].join('');
  }

  /* ---------- Últimos 7 días ---------- */

  function lastSevenDays(today, summary) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i - 6);
      const day = summary.get(date) ?? { sessions: 0, focusMs: 0 };
      return { date, sessions: day.sessions, minutes: minutes(day.focusMs), focusMs: day.focusMs, isToday: date === today };
    });
  }

  function chartSVG(days) {
    const width = 560;
    const height = 250;
    const left = 46;
    const right = 10;
    const top = 26;
    const bottom = 62;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const max = niceMax(Math.max(...days.map((d) => d.minutes)));
    const slot = plotW / days.length;
    const barW = Math.min(46, slot * 0.6);
    const y = (value) => top + plotH - (value / max) * plotH;

    const grid = [0, max / 2, max]
      .map((value) => `
        <line class="chart__grid" x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}"/>
        <text class="chart__axis" x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${value}</text>`)
      .join('');

    const bars = days
      .map((day, i) => {
        const cx = left + slot * i + slot / 2;
        const h = Math.max(day.minutes > 0 ? 3 : 0, (day.minutes / max) * plotH);
        const date = dateFromKey(day.date);
        const weekday = weekdayShort.format(date).replace('.', '');
        return `
          <g class="chart__day${day.isToday ? ' chart__day--today' : ''}">
            ${day.minutes > 0 ? `<rect class="chart__bar" x="${cx - barW / 2}" y="${top + plotH - h}" width="${barW}" height="${h}" rx="6"/>` : ''}
            <text class="chart__value" x="${cx}" y="${top + plotH - h - 7}" text-anchor="middle">${day.minutes}</text>
            <text class="chart__label" x="${cx}" y="${height - bottom + 20}" text-anchor="middle">${day.isToday ? 'Hoy' : weekday}</text>
            <text class="chart__label chart__label--date" x="${cx}" y="${height - bottom + 37}" text-anchor="middle">${date.getDate()}/${date.getMonth() + 1}</text>
            <text class="chart__sessions" x="${cx}" y="${height - bottom + 54}" text-anchor="middle">${day.sessions} ses.</text>
          </g>`;
      })
      .join('');

    const summary = days
      .map((d) => `${formatDateShort(d.date, days[6].date)}: ${d.minutes} minutos en ${plural(d.sessions, 'sesión', 'sesiones')}`)
      .join('; ');

    return `
      <svg class="chart__svg${prefersReducedMotion() ? '' : ' chart__svg--animated'}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="stats-chart-title stats-chart-desc">
        <title id="stats-chart-title">Minutos de concentración por día, últimos 7 días</title>
        <desc id="stats-chart-desc">${summary}.</desc>
        <text class="chart__unit" x="${left - 8}" y="${top - 12}" text-anchor="end">min</text>
        ${grid}
        <line class="chart__baseline" x1="${left}" x2="${width - right}" y1="${top + plotH}" y2="${top + plotH}"/>
        ${bars}
      </svg>`;
  }

  function renderWeek({ today, summary }) {
    const days = lastSevenDays(today, summary);
    const sessions = days.reduce((sum, d) => sum + d.sessions, 0);
    const focusMs = days.reduce((sum, d) => sum + d.focusMs, 0);
    const activeDays = days.filter((d) => d.sessions > 0).length;

    el.weekTotals.innerHTML = [
      tile('Sesiones', sessions),
      tile('Tiempo de concentración', formatLongDuration(focusMs)),
      tile('Días con actividad', activeDays, 'de 7'),
    ].join('');

    const hasActivity = sessions > 0;
    el.weekEmpty.hidden = hasActivity;
    el.weekData.hidden = !hasActivity;
    if (!hasActivity) return;

    el.chart.innerHTML = chartSVG(days);
    el.tableBody.innerHTML = days
      .map((d) => `
        <tr${d.isToday ? ' class="is-today"' : ''}>
          <th scope="row">${escapeHTML(formatDateFull(d.date))}${d.isToday ? ' (hoy)' : ''}</th>
          <td>${d.sessions}</td>
          <td>${d.minutes} min</td>
        </tr>`)
      .join('');
  }

  /* ---------- Totales ---------- */

  function renderTotals({ sessions }) {
    if (!sessions.length) {
      el.totals.innerHTML = tile('Sesiones registradas', 0, '', 'Aún no hay actividad: completa una concentración para empezar');
      return;
    }
    const focusMs = sessions.reduce((sum, s) => sum + s.focusMs, 0);
    const days = new Set(sessions.map((s) => s.date)).size;
    const first = sessions.reduce((min, s) => (s.date < min ? s.date : min), sessions[0].date);
    el.totals.innerHTML = [
      tile('Sesiones completadas', sessions.length),
      tile('Tiempo de concentración', formatLongDuration(focusMs)),
      tile('Días con actividad', days),
      tile('Primera sesión registrada', escapeHTML(formatDateShort(first, data.today)), '', escapeHTML(formatDateFull(first))),
    ].join('');
  }

  /* ---------- Historial ---------- */

  /** Nombre visible de la tarea de una sesión, sin inventar datos ausentes. */
  function taskInfo(session) {
    if (!session.taskId) return { title: null, category: null, deleted: false };
    const task = data.lookupTask(session.taskId);
    return {
      title: task ? task.title : session.taskTitle,
      // Categoría: la guardada con la sesión; si no se guardó (sesiones antiguas), la actual de la tarea si existe.
      category: session.taskCategory ?? task?.category ?? null,
      deleted: !task,
    };
  }

  function renderTaskOptions() {
    const options = new Map();
    let hasNoTask = false;
    for (const session of data.sessions) {
      if (!session.taskId) {
        hasNoTask = true;
        continue;
      }
      if (options.has(session.taskId)) continue;
      const info = taskInfo(session);
      const label = `${info.title ?? 'Tarea sin título registrado'}${info.deleted ? ' (eliminada)' : ''}`;
      options.set(session.taskId, label);
    }
    const sorted = [...options].sort((a, b) => a[1].localeCompare(b[1], 'es'));
    if (filters.task && filters.task !== NO_TASK && !options.has(filters.task)) filters.task = '';
    el.task.innerHTML = [
      '<option value="">Todas</option>',
      ...sorted.map(([id, label]) => `<option value="${escapeHTML(id)}">${escapeHTML(label)}</option>`),
      hasNoTask ? `<option value="${NO_TASK}">Sin tarea asociada</option>` : '',
    ].join('');
    el.task.value = filters.task;
  }

  function filteredSessions() {
    return data.sessions
      .filter((s) => (!filters.from || s.date >= filters.from) && (!filters.to || s.date <= filters.to))
      .filter((s) => {
        if (!filters.task) return true;
        if (filters.task === NO_TASK) return !s.taskId;
        return s.taskId === filters.task;
      })
      .sort((a, b) => b.endedAt - a.endedAt);
  }

  function historyItem(session) {
    const info = taskInfo(session);
    const start = session.startedAt ? `${formatClockTime(session.startedAt)}–` : 'Fin ';
    const task = info.title
      ? `<span class="history-item__task">«${escapeHTML(info.title)}»</span>${info.deleted ? ' <span class="history-item__note">(tarea eliminada)</span>' : ''}`
      : `<span class="history-item__note">${session.taskId ? 'Tarea sin título registrado' : 'Sin tarea asociada'}</span>`;
    const category = info.category ? `<span class="chip chip--category">${escapeHTML(info.category)}</span>` : '';
    return `
      <li class="history-item" tabindex="-1">
        <p class="history-item__when">
          <span class="history-item__date">${escapeHTML(historyDate.format(dateFromKey(session.date)))}</span>
          <span class="history-item__time">${start}${formatClockTime(session.endedAt)}</span>
        </p>
        <p class="history-item__what">${task} ${category}</p>
        <p class="history-item__minutes"><strong>${minutes(session.focusMs)}</strong> min</p>
      </li>`;
  }

  function renderHistory({ keepFocusIndex = null } = {}) {
    const rangeInvalid = filters.from && filters.to && filters.from > filters.to;
    el.rangeError.hidden = !rangeInvalid;
    el.rangeError.textContent = rangeInvalid ? 'La fecha «Desde» no puede ser posterior a «Hasta».' : '';
    el.from.toggleAttribute('aria-invalid', Boolean(rangeInvalid));
    el.to.toggleAttribute('aria-invalid', Boolean(rangeInvalid));

    const list = rangeInvalid ? [] : filteredSessions();
    const shown = list.slice(0, visibleCount);
    el.list.innerHTML = shown.map(historyItem).join('');
    el.list.hidden = shown.length === 0;

    const filtering = Boolean(filters.from || filters.to || filters.task);
    el.empty.hidden = shown.length > 0;
    if (!shown.length) {
      el.empty.innerHTML = data.sessions.length
        ? `<p class="empty__title">Ninguna sesión coincide</p>
           <p class="empty__text">Cambia las fechas o la tarea, o restablece los filtros.</p>`
        : `<p class="empty__title">Todavía no hay sesiones</p>
           <p class="empty__text">Cuando completes una concentración aparecerá aquí, con su fecha, duración y tarea.</p>`;
    }

    const total = list.length;
    el.count.textContent = rangeInvalid
      ? 'Revisa el intervalo de fechas.'
      : total
        ? `Mostrando ${shown.length} de ${plural(total, 'sesión', 'sesiones')}${filtering ? ' filtradas' : ''}, de la más reciente a la más antigua.`
        : '';

    const remaining = total - shown.length;
    el.more.hidden = remaining <= 0;
    el.more.textContent = `Cargar más (${remaining} ${remaining === 1 ? 'restante' : 'restantes'})`;

    if (keepFocusIndex !== null) {
      // Tras «Cargar más», el foco va a la primera sesión nueva.
      (el.list.children[keepFocusIndex] ?? el.more)?.focus();
    }
  }

  /* ---------- API ---------- */

  /**
   * @param {object} newData
   * @param {string} newData.today
   * @param {object[]} newData.sessions     todas las sesiones registradas
   * @param {Map} newData.summary           fecha → { sessions, focusMs }
   * @param {object[]} newData.todayTasks
   * @param {number} newData.goal
   * @param {(id: string) => object|null} newData.lookupTask
   */
  function render(newData) {
    data = newData;
    renderToday({
      todaySessions: data.sessions.filter((s) => s.date === data.today),
      todayTasks: data.todayTasks,
      goal: data.goal,
    });
    renderWeek(data);
    renderTotals(data);
    renderTaskOptions();
    renderHistory();
  }

  /* ---------- Eventos de filtros ---------- */

  function onFilterChange() {
    filters.from = el.from.value;
    filters.to = el.to.value;
    filters.task = el.task.value;
    visibleCount = PAGE_SIZE;
    renderHistory();
  }

  el.from.addEventListener('change', onFilterChange);
  el.to.addEventListener('change', onFilterChange);
  el.task.addEventListener('change', onFilterChange);

  el.filters.addEventListener('submit', (event) => event.preventDefault());
  el.filters.addEventListener('reset', () => {
    // El formulario vacía sus campos después de este evento.
    setTimeout(() => {
      onFilterChange();
      el.from.focus();
    });
  });

  el.more.addEventListener('click', () => {
    const firstNew = visibleCount;
    visibleCount += PAGE_SIZE;
    renderHistory({ keepFocusIndex: firstNew });
  });

  return { render };
}
