/**
 * dates.js
 * Fechas LOCALES en formato "AAAA-MM-DD" (claves de día).
 *
 * DECISIÓN: no usamos toISOString(), que convierte a UTC y puede cambiar el
 * día (por ejemplo, a las 00:30 en España devolvería el día anterior).
 * Todo se calcula con la fecha local del navegador.
 */

const pad = (number) => String(number).padStart(2, '0');

/** Clave de día local de una fecha o marca de tiempo. */
export function toDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

/** Comprueba que la clave tiene formato válido y corresponde a un día real. */
export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Convierte una clave en Date (a las 12:00 para evitar problemas con cambios de hora). */
export function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Días de diferencia entre dos claves (b − a). */
export function daysBetween(keyA, keyB) {
  return Math.round((dateFromKey(keyB) - dateFromKey(keyA)) / 86_400_000);
}

/** Suma (o resta) días a una clave. Usa el calendario local, no milisegundos fijos. */
export function addDays(key, days) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/**
 * Suma meses conservando el día si existe; si no, usa el último día del mes
 * (31 de enero + 1 mes → 28 o 29 de febrero).
 */
export function addMonths(key, months) {
  const [year, month, day] = key.split('-').map(Number);
  const target = new Date(year, month - 1 + months, 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toDateKey(target);
}

/** Año y mes (0-11) de una clave. */
export function monthOf(key) {
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
}

/** Lunes = 0 … domingo = 6. */
export function weekdayIndex(key) {
  return (dateFromKey(key).getDay() + 6) % 7;
}

/**
 * Semanas de un mes, de lunes a domingo. Los huecos de otros meses son null.
 * @returns {(string|null)[][]}
 */
export function monthWeeks(year, month) {
  const first = toDateKey(new Date(year, month, 1, 12));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(weekdayIndex(first)).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(toDateKey(new Date(year, month, day, 12)));
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const fullFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "Noviembre de 2026" */
export function formatMonthYear(year, month) {
  const text = monthFormatter.format(new Date(year, month, 1, 12));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "lunes, 16 de noviembre de 2026" */
export function formatDateFull(key) {
  return fullFormatter.format(dateFromKey(key));
}

const shortFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const longFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

/** Etiqueta breve y relativa: "Hoy", "Mañana", "Ayer" o "lun, 16 nov". */
export function formatDateShort(key, reference = todayKey()) {
  const diff = daysBetween(reference, key);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return shortFormatter.format(dateFromKey(key));
}

/** Etiqueta larga: "sábado, 14 de noviembre". */
export function formatDateLong(key) {
  return longFormatter.format(dateFromKey(key));
}
