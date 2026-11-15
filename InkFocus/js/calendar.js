/**
 * calendar.js
 * Calendario mensual (semanas de lunes a domingo) con patrón de cuadrícula ARIA.
 *
 * Teclado (solo una celda es tabulable a la vez, «tabindex itinerante»):
 *   ← → ↑ ↓      día anterior / siguiente / semana anterior / siguiente
 *   Inicio / Fin  lunes / domingo de esa semana
 *   Re Pág / Av Pág  mes anterior / siguiente (Mayús: año)
 *   Enter / Espacio  seleccionar el día
 * Si el foco sale del mes visible, el calendario cambia de mes solo.
 *
 * Cada celda indica, con formas distintas y también en su nombre accesible:
 *   anillo = tareas pendientes · gota rellena = tareas completadas ·
 *   barra violeta = sesiones de concentración registradas.
 * Hoy lleva un aro alrededor del número (y «hoy» en su nombre accesible);
 * el día seleccionado, relleno de tinta con borde e inclinación.
 */
import {
  todayKey,
  monthOf,
  monthWeeks,
  formatMonthYear,
  formatDateFull,
  addDays,
  addMonths,
  weekdayIndex,
} from './dates.js';

const WEEKDAYS = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['X', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
];

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * @param {object} options
 * @param {(dateKey: string) => {pending:number, done:number, sessions:number, focusMs:number}} options.getDayInfo
 * @param {(dateKey: string) => void} options.onSelect
 */
export function createCalendar({ getDayInfo, onSelect }) {
  const el = {
    title: document.getElementById('calendar-title'),
    grid: document.getElementById('calendar-grid'),
    prev: document.getElementById('calendar-prev'),
    next: document.getElementById('calendar-next'),
    today: document.getElementById('calendar-today'),
  };

  let selected = todayKey();
  let { year, month } = monthOf(selected);
  let focusKey = selected;

  const inVisibleMonth = (key) => {
    const m = monthOf(key);
    return m.year === year && m.month === month;
  };

  function cellLabel(key, info, today) {
    const parts = [];
    if (info.pending) parts.push(plural(info.pending, 'tarea pendiente', 'tareas pendientes'));
    if (info.done) parts.push(plural(info.done, 'tarea completada', 'tareas completadas'));
    if (info.sessions) {
      parts.push(`${plural(info.sessions, 'sesión de concentración', 'sesiones de concentración')} (${Math.round(info.focusMs / 60000)} min)`);
    }
    const prefix = `${formatDateFull(key)}${key === today ? ', hoy' : ''}`;
    return `${prefix}: ${parts.length ? parts.join(', ') : 'sin tareas ni actividad'}`;
  }

  /** Celda que recibe tabindex=0 dentro del mes visible. */
  function rovingKey(today) {
    for (const candidate of [focusKey, selected, today]) if (inVisibleMonth(candidate)) return candidate;
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  }

  function cellHTML(key, today, roving) {
    if (!key) return '<td class="day-cell day-cell--outside" role="gridcell" aria-hidden="true"></td>';
    const info = getDayInfo(key);
    const isToday = key === today;
    const isSelected = key === selected;
    const day = Number(key.slice(8));
    const marks = [
      info.pending ? `<span class="mark mark--pending"><i></i><b>${info.pending}</b></span>` : '',
      info.done ? `<span class="mark mark--done"><i></i><b>${info.done}</b></span>` : '',
      info.sessions ? `<span class="mark mark--focus"><i></i><b>${info.sessions}</b></span>` : '',
    ].join('');
    return `
      <td role="gridcell" class="day-cell${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${key < today ? ' is-past' : ''}"
          data-date="${key}" tabindex="${key === roving ? 0 : -1}" aria-selected="${isSelected}"${isToday ? ' aria-current="date"' : ''}
          aria-label="${cellLabel(key, info, today)}">
        <span class="day-cell__num">${day}</span>
        <span class="day-cell__marks" aria-hidden="true">${marks}</span>
      </td>`;
  }

  function render() {
    const today = todayKey();
    const hadFocus = el.grid.contains(document.activeElement);
    const roving = rovingKey(today);

    const title = formatMonthYear(year, month);
    if (el.title.textContent !== title) el.title.textContent = title;

    const head = WEEKDAYS.map(
      ([short, long]) => `<th scope="col" abbr="${long}"><span aria-hidden="true">${short}</span><span class="visually-hidden">${long}</span></th>`,
    ).join('');
    const body = monthWeeks(year, month)
      .map((week) => `<tr>${week.map((key) => cellHTML(key, today, roving)).join('')}</tr>`)
      .join('');

    el.grid.innerHTML = `
      <table class="calendar__table" role="grid" aria-labelledby="calendar-title" aria-describedby="calendar-help">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>`;

    if (hadFocus) focusCell(roving);
  }

  function focusCell(key) {
    el.grid.querySelector(`[data-date="${key}"]`)?.focus();
  }

  /** Mueve el foco a una fecha (cambiando de mes si hace falta) sin seleccionarla. */
  function moveFocus(key) {
    focusKey = key;
    if (!inVisibleMonth(key)) ({ year, month } = monthOf(key));
    render();
    focusCell(key);
  }

  /** Selecciona una fecha: la muestra en el calendario y avisa al panel del día. */
  function select(key, { focus = false } = {}) {
    selected = key;
    focusKey = key;
    ({ year, month } = monthOf(key));
    render();
    if (focus) focusCell(key);
    onSelect(key);
  }

  function changeMonth(delta) {
    const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    ({ year, month } = monthOf(addMonths(first, delta)));
    render();
  }

  /* ---------- Eventos ---------- */

  el.prev.addEventListener('click', () => changeMonth(-1));
  el.next.addEventListener('click', () => changeMonth(1));
  el.today.addEventListener('click', () => select(todayKey()));

  el.grid.addEventListener('click', (event) => {
    const cell = event.target.closest('[data-date]');
    if (cell) select(cell.dataset.date, { focus: true });
  });

  // Recordar qué día tiene el foco (también al entrar con Tab).
  el.grid.addEventListener('focusin', (event) => {
    const cell = event.target.closest('[data-date]');
    if (cell) focusKey = cell.dataset.date;
  });

  el.grid.addEventListener('keydown', (event) => {
    const cell = event.target.closest('[data-date]');
    if (!cell) return;
    const key = cell.dataset.date;
    const moves = {
      ArrowLeft: () => addDays(key, -1),
      ArrowRight: () => addDays(key, 1),
      ArrowUp: () => addDays(key, -7),
      ArrowDown: () => addDays(key, 7),
      Home: () => addDays(key, -weekdayIndex(key)),
      End: () => addDays(key, 6 - weekdayIndex(key)),
      PageUp: () => addMonths(key, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(key, event.shiftKey ? 12 : 1),
    };
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(key, { focus: true });
      return;
    }
    if (!moves[event.key]) return;
    event.preventDefault();
    moveFocus(moves[event.key]());
  });

  render();

  return {
    render,
    select,
    getSelected: () => selected,
  };
}
