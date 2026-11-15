/**
 * sessions-store.js
 * Registro de sesiones de concentración COMPLETADAS (solo modo normal).
 *
 * Cada sesión:
 * {
 *   id          runId de la fase en el temporizador (impide registrar dos veces el mismo final)
 *   taskId      tarea activa al terminar, o null
 *   taskTitle   título de la tarea en ese momento (el historial lo conserva aunque la tarea se borre)
 *   taskCategory categoría de la tarea en ese momento (v4+; en sesiones anteriores, null)
 *   taskDate    fecha PLANIFICADA de la tarea en ese momento ("AAAA-MM-DD"), o null
 *   startedAt   primer «Iniciar» de la fase (ms)
 *   endedAt     momento REAL de fin (ms)
 *   durationMs  duración configurada de la fase
 *   focusMs     tiempo efectivo de concentración, sin pausas
 *   pausedMs    tiempo en pausa entre el inicio y el fin (si se conoce el inicio)
 *   date        fecha LOCAL en la que termina ("AAAA-MM-DD")
 * }
 *
 * Criterios:
 * - Solo se registran concentraciones que terminan de verdad: ni saltadas,
 *   ni reiniciadas, ni descansos, ni sesiones del modo demostración.
 * - La sesión cuenta en el día en que TERMINA (23:50 → 00:15 cuenta para el día
 *   nuevo), aunque la tarea esté planificada para otro día. La fecha de la tarea
 *   nunca se cambia por ello.
 * - Borrar una tarea o cambiar su fecha no toca este registro.
 */
import { STORAGE_KEYS } from './config.js';
import { readJSON, writeJSON } from './storage.js';
import { isValidDateKey, toDateKey } from './dates.js';

const isTime = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
/** Duración medida (puede ser 0); distinta de «no se midió» (undefined en datos antiguos). */
const isMeasured = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** Sanea y, si hace falta, completa registros de versiones anteriores. */
function sanitizeSessions(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const result = [];
  for (const item of raw) {
    const valid =
      item &&
      typeof item.id === 'string' &&
      !seen.has(item.id) &&
      (item.taskId === null || item.taskId === undefined || typeof item.taskId === 'string') &&
      isTime(item.endedAt) &&
      isTime(item.durationMs) &&
      isValidDateKey(item.date);
    if (!valid) continue;
    seen.add(item.id);

    // Un inicio posterior al fin es incoherente: se descarta ese dato (no la sesión).
    const startedAt = isTime(item.startedAt) && item.startedAt <= item.endedAt ? item.startedAt : null;
    // v2 no guardaba focusMs: su cuenta atrás no avanzaba en pausa, así que el
    // tiempo efectivo de una sesión completada era exactamente su duración.
    const focusMs = isMeasured(item.focusMs) ? Math.min(item.focusMs, item.durationMs) : item.durationMs;
    result.push({
      id: item.id,
      taskId: item.taskId ?? null,
      taskTitle: typeof item.taskTitle === 'string' ? item.taskTitle : null,
      taskCategory: typeof item.taskCategory === 'string' && item.taskCategory ? item.taskCategory : null,
      taskDate: isValidDateKey(item.taskDate) ? item.taskDate : null,
      startedAt,
      endedAt: item.endedAt,
      durationMs: item.durationMs,
      focusMs,
      pausedMs: startedAt ? Math.max(0, item.endedAt - startedAt - focusMs) : null,
      date: item.date,
    });
  }
  return result;
}

export function createSessionStore() {
  let sessions = [];

  /** Lee, sanea y, si la migración cambió algo, lo guarda (solo entonces). */
  function load() {
    const raw = readJSON(STORAGE_KEYS.sessions);
    sessions = sanitizeSessions(raw);
    if (raw !== null && JSON.stringify(raw) !== JSON.stringify(sessions)) {
      writeJSON(STORAGE_KEYS.sessions, sessions);
    }
  }
  load();

  return {
    reload: load,

    getAll: () => sessions,

    /** Sesiones que terminaron en una fecha local, por orden de fin. */
    getForDate(dateKey) {
      return sessions.filter((session) => session.date === dateKey).sort((a, b) => a.endedAt - b.endedAt);
    },

    /**
     * Registra una sesión completada. Devuelve false si ya existía.
     * Antes de comprobar, relee localStorage por si otra pestaña la registró.
     */
    record({ runId, taskId, taskTitle, taskCategory, taskDate, startedAt, endedAt, durationMs, focusMs }) {
      load();
      if (sessions.some((session) => session.id === runId)) return false;
      const effective = isMeasured(focusMs) ? Math.min(focusMs, durationMs) : durationMs;
      const start = isTime(startedAt) && startedAt <= endedAt ? startedAt : null;
      sessions.push({
        id: runId,
        taskId: taskId ?? null,
        taskTitle: taskTitle ?? null,
        taskCategory: taskCategory || null,
        taskDate: isValidDateKey(taskDate) ? taskDate : null,
        startedAt: start,
        endedAt,
        durationMs,
        focusMs: effective,
        pausedMs: start ? Math.max(0, endedAt - start - effective) : null,
        date: toDateKey(endedAt),
      });
      writeJSON(STORAGE_KEYS.sessions, sessions);
      return true;
    },

    /**
     * Completa el título de sesiones antiguas (v2) que solo guardaban taskId,
     * mientras la tarea siga existiendo. No inventa nada si ya no existe.
     */
    backfillTaskInfo(lookup) {
      let changed = false;
      for (const session of sessions) {
        if (!session.taskId || session.taskTitle) continue;
        const task = lookup(session.taskId);
        if (task) {
          session.taskTitle = task.title;
          changed = true;
        }
      }
      if (changed) writeJSON(STORAGE_KEYS.sessions, sessions);
    },

    /** Mapa taskId → número de pomodoros completados. */
    countByTask() {
      const counts = new Map();
      for (const session of sessions) {
        if (session.taskId) counts.set(session.taskId, (counts.get(session.taskId) ?? 0) + 1);
      }
      return counts;
    },

    /** Mapa fecha → { sessions, focusMs } para el calendario. */
    summaryByDate() {
      const summary = new Map();
      for (const session of sessions) {
        const day = summary.get(session.date) ?? { sessions: 0, focusMs: 0 };
        day.sessions += 1;
        day.focusMs += session.focusMs;
        summary.set(session.date, day);
      }
      return summary;
    },
  };
}
