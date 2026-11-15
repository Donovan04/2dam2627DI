/**
 * tasks-model.js
 * Forma de una tarea, validación del formulario y saneado de datos guardados.
 * Funciones puras: no tocan el DOM ni localStorage.
 *
 * Una tarea:
 * {
 *   id, title, notes, date ("AAAA-MM-DD", día planificado),
 *   category, priority ("low" | "medium" | "high"), estimate (pomodoros, 1-20),
 *   completed, completedAt, createdAt, updatedAt
 * }
 * Los pomodoros COMPLETADOS no se guardan en la tarea: se cuentan a partir del
 * registro de sesiones (sessions-store.js). Así un mismo final de sesión no
 * puede sumarse dos veces y el dato servirá después para historial y calendario.
 */
import { isValidDateKey, todayKey } from './dates.js';

export const TASK_LIMITS = {
  title: 120,
  notes: 500,
  category: 40,
  estimate: [1, 20],
};

export const PRIORITIES = {
  high: { label: 'Alta', order: 0, level: 3 },
  medium: { label: 'Media', order: 1, level: 2 },
  low: { label: 'Baja', order: 2, level: 1 },
};

export function createTaskId() {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Valida los valores (texto) del formulario.
 * @returns {{ values: object, errors: Record<string,string> }}
 */
export function validateTaskInput(input) {
  const errors = {};
  const title = String(input.title ?? '').trim().replace(/\s+/g, ' ');
  const notes = String(input.notes ?? '').trim();
  const category = String(input.category ?? '').trim().replace(/\s+/g, ' ');
  const date = String(input.date ?? '').trim();
  const estimateText = String(input.estimate ?? '').trim();
  const estimate = Number(estimateText);
  const [minEstimate, maxEstimate] = TASK_LIMITS.estimate;

  if (!title) errors.title = 'El título es obligatorio.';
  else if (title.length > TASK_LIMITS.title) errors.title = `Máximo ${TASK_LIMITS.title} caracteres.`;

  if (notes.length > TASK_LIMITS.notes) errors.notes = `Máximo ${TASK_LIMITS.notes} caracteres (ahora ${notes.length}).`;

  if (category.length > TASK_LIMITS.category) errors.category = `Máximo ${TASK_LIMITS.category} caracteres.`;

  if (!date) errors.date = 'Elige una fecha.';
  else if (!isValidDateKey(date)) errors.date = 'La fecha no es válida.';

  if (estimateText === '') errors.estimate = 'Indica cuántos pomodoros calculas.';
  else if (!Number.isInteger(estimate)) errors.estimate = 'Usa un número entero.';
  else if (estimate < minEstimate || estimate > maxEstimate) {
    errors.estimate = `Elige entre ${minEstimate} y ${maxEstimate}.`;
  }

  const priority = Object.hasOwn(PRIORITIES, input.priority) ? input.priority : 'medium';

  return { values: { title, notes, category, date, estimate, priority }, errors };
}

/**
 * Sanea una tarea leída de localStorage. Devuelve null si no se puede recuperar
 * (sin id o sin título); el resto de campos dañados se corrigen.
 */
export function sanitizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, TASK_LIMITS.title) : '';
  if (!title) return null;

  const isTime = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
  const [minEstimate, maxEstimate] = TASK_LIMITS.estimate;
  const createdAt = isTime(raw.createdAt) ? raw.createdAt : Date.now();
  const completed = raw.completed === true;

  return {
    id: raw.id,
    title,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, TASK_LIMITS.notes) : '',
    date: isValidDateKey(raw.date) ? raw.date : todayKey(),
    category: typeof raw.category === 'string' ? raw.category.trim().slice(0, TASK_LIMITS.category) : '',
    priority: Object.hasOwn(PRIORITIES, raw.priority) ? raw.priority : 'medium',
    estimate:
      Number.isInteger(raw.estimate) && raw.estimate >= minEstimate && raw.estimate <= maxEstimate
        ? raw.estimate
        : 1,
    completed,
    completedAt: completed && isTime(raw.completedAt) ? raw.completedAt : completed ? createdAt : null,
    createdAt,
    updatedAt: isTime(raw.updatedAt) ? raw.updatedAt : createdAt,
  };
}

/** Texto en minúsculas y sin tildes, para búsquedas tolerantes ("matematicas" = "Matemáticas"). */
export function normalizeText(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Orden de la lista: pendientes primero; dentro, por fecha, prioridad y
 * antigüedad. Las completadas, al final.
 */
export function compareTasks(a, b) {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const byPriority = PRIORITIES[a.priority].order - PRIORITIES[b.priority].order;
  if (byPriority) return byPriority;
  return a.createdAt - b.createdAt;
}

/**
 * Orden ESTABLE del territorio: por fecha de creación. Completar, reabrir o
 * editar una tarea no lo altera; solo cambia si se añaden, quitan o mueven
 * tareas de ese día.
 */
export function compareForTerritory(a, b) {
  return a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1);
}
