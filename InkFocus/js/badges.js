/**
 * badges.js
 * Insignias por hitos, calculadas con datos REALES del registro de sesiones.
 *
 * - Las sesiones del modo demostración, los descansos y las fases saltadas
 *   nunca llegan al registro, así que no cuentan.
 * - Una insignia desbloqueada se guarda con su fecha (inkfocus.badges.v1) y ya
 *   no desaparece aunque luego cambie el objetivo diario o se borren tareas.
 * - Sin penalizaciones: las pendientes solo muestran cuánto falta.
 *
 * «Primera meta» solo puede comprobarse hoy (con el objetivo actual): de días
 * pasados no se guardó qué objetivo había, y no lo inventamos.
 */
import { STORAGE_KEYS } from './config.js';
import { readJSON, writeJSON } from './storage.js';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

export const BADGES = [
  { id: 'first-session', name: 'Primera mancha', description: 'Completa tu primera sesión de concentración.' },
  { id: 'ten-sessions', name: 'Diez manchas', description: 'Completa 10 sesiones de concentración.' },
  { id: 'five-hours', name: 'Cinco horas de tinta', description: 'Acumula 5 horas de concentración.' },
  { id: 'first-goal', name: 'Primera meta', description: 'Alcanza tu objetivo diario por primera vez.' },
];

const BADGE_IDS = BADGES.map((badge) => badge.id);
const isTime = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

/** Sanea { unlocked: { id: { at } } }: solo ids conocidos y fechas válidas. */
export function sanitizeBadges(raw) {
  const unlocked = {};
  const source = raw && typeof raw === 'object' && raw.unlocked && typeof raw.unlocked === 'object' ? raw.unlocked : {};
  for (const id of BADGE_IDS) {
    if (source[id] && isTime(source[id].at)) unlocked[id] = { at: source[id].at };
  }
  return { unlocked };
}

export function createBadgeStore() {
  let data = sanitizeBadges(readJSON(STORAGE_KEYS.badges));

  return {
    reload() {
      data = sanitizeBadges(readJSON(STORAGE_KEYS.badges));
    },
    getUnlocked: () => data.unlocked,
    /** Guarda una insignia nueva. Devuelve false si ya estaba (nunca se duplica). */
    unlock(id, at) {
      if (data.unlocked[id] || !BADGE_IDS.includes(id)) return false;
      data.unlocked[id] = { at };
      writeJSON(STORAGE_KEYS.badges, data);
      return true;
    },
    toJSON: () => structuredClone(data),
  };
}

/**
 * Qué insignias se cumplen con los datos actuales y desde cuándo.
 * @returns {Record<string, number>} id → momento en que se cumplió
 */
export function evaluateBadges({ sessions, todaySessions, goal }) {
  const met = {};
  const sorted = [...sessions].sort((a, b) => a.endedAt - b.endedAt);
  if (sorted.length >= 1) met['first-session'] = sorted[0].endedAt;
  if (sorted.length >= 10) met['ten-sessions'] = sorted[9].endedAt;

  let total = 0;
  for (const session of sorted) {
    total += session.focusMs;
    if (total >= FIVE_HOURS_MS) {
      met['five-hours'] = session.endedAt;
      break;
    }
  }

  const today = [...todaySessions].sort((a, b) => a.endedAt - b.endedAt);
  if (today.length > 0 && today.length >= goal) met['first-goal'] = today[goal - 1]?.endedAt ?? today.at(-1).endedAt;
  return met;
}

/** Texto de progreso para una insignia todavía pendiente (sin tono de culpa). */
export function badgeProgress(id, { sessions, todaySessions, goal }) {
  const count = sessions.length;
  const hours = sessions.reduce((sum, s) => sum + s.focusMs, 0) / 3_600_000;
  switch (id) {
    case 'first-session':
      return 'Llegará con tu primera concentración completada.';
    case 'ten-sessions':
      return `Llevas ${count} de 10.`;
    case 'five-hours':
      return `Llevas ${hours.toLocaleString('es-ES', { maximumFractionDigits: 1 })} h de 5 h.`;
    case 'first-goal':
      return `Hoy llevas ${todaySessions.length} de ${goal} sesiones.`;
    default:
      return '';
  }
}
