/**
 * data-transfer.js
 * Exportar, importar y borrar los datos de InkFocus.
 *
 * Formato de exportación:
 * {
 *   "app": "InkFocus",
 *   "format": 1,                 ← versión del formato (EXPORT_FORMAT)
 *   "exportedAt": "2026-11-14T20:15:00.000Z",
 *   "data": { settings, tasks: { tasks, activeTaskId }, sessions: [...], badges: { unlocked } }
 * }
 * No se exporta el estado del temporizador (es transitorio) ni permisos del navegador.
 *
 * Importar: se valida TODO antes de tocar nada. Si algo no es válido, se
 * explica el primer error y no se cambia ningún dato. La escritura es atómica:
 * si falla a mitad (por ejemplo, almacenamiento lleno), se restaura lo anterior.
 */
import { STORAGE_KEYS, EXPORT_FORMAT, LIMITS, DEFAULT_SETTINGS } from './config.js';
import { BOOLEAN_KEYS, CHOICE_KEYS } from './settings.js';
import { PRIORITIES, TASK_LIMITS } from './tasks-model.js';
import { isValidDateKey, todayKey } from './dates.js';
import { BADGES } from './badges.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DURATION_MS = 4 * 60 * 60 * 1000;
const DATA_KEYS = [STORAGE_KEYS.settings, STORAGE_KEYS.tasks, STORAGE_KEYS.sessions, STORAGE_KEYS.badges];

/* ---------- Exportar ---------- */

export function buildExport({ settings, tasks, sessions, badges }) {
  return {
    app: 'InkFocus',
    format: EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    // Preferencias sin estados del navegador: «notifications» exige pedir permiso
    // de nuevo y «demo» es un modo temporal.
    data: { settings: { ...settings, notifications: false, demo: false }, tasks, sessions, badges },
  };
}

/** Descarga un objeto como archivo .json (sin servidor: Blob + enlace temporal). */
export function downloadJSON(object, filename = `inkfocus-copia-${todayKey()}.json`) {
  const blob = new Blob([JSON.stringify(object, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

/* ---------- Validación estricta ---------- */

class ImportError extends Error {}
const fail = (message) => {
  throw new ImportError(message);
};

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isTime = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
const isOptionalString = (value, max) => value === undefined || value === null || (typeof value === 'string' && value.length <= max);

function validateSettings(raw) {
  if (raw === undefined) return { ...DEFAULT_SETTINGS };
  if (!isPlainObject(raw)) fail('Las preferencias no tienen un formato válido.');
  const settings = { ...DEFAULT_SETTINGS };
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    if (raw[key] === undefined) continue;
    if (!Number.isInteger(raw[key]) || raw[key] < min || raw[key] > max) fail(`La preferencia «${key}» debe ser un número entero entre ${min} y ${max}.`);
    settings[key] = raw[key];
  }
  for (const key of BOOLEAN_KEYS) {
    if (raw[key] === undefined) continue;
    if (typeof raw[key] !== 'boolean') fail(`La preferencia «${key}» debe ser verdadero o falso.`);
    settings[key] = raw[key];
  }
  for (const [key, options] of Object.entries(CHOICE_KEYS)) {
    if (raw[key] === undefined) continue;
    if (!options.includes(raw[key])) fail(`La preferencia «${key}» tiene un valor desconocido.`);
    settings[key] = raw[key];
  }
  if (raw.volume !== undefined) {
    if (!Number.isInteger(raw.volume) || raw.volume < 0 || raw.volume > 100) fail('El volumen debe estar entre 0 y 100.');
    settings.volume = raw.volume;
  }
  // Nunca se importan estados temporales ni permisos.
  settings.demo = false;
  settings.notifications = false;
  return settings;
}

function validateTasks(raw) {
  if (raw === undefined) return { tasks: [], activeTaskId: null };
  if (!isPlainObject(raw) || !Array.isArray(raw.tasks)) fail('La lista de tareas no tiene un formato válido.');
  if (raw.tasks.length > 5000) fail('El archivo contiene demasiadas tareas.');
  const ids = new Set();
  const tasks = raw.tasks.map((task, index) => {
    const where = `Tarea nº ${index + 1}`;
    if (!isPlainObject(task)) fail(`${where}: no tiene un formato válido.`);
    if (typeof task.id !== 'string' || !task.id || task.id.length > 80) fail(`${where}: falta su identificador.`);
    if (ids.has(task.id)) fail(`${where}: su identificador está repetido.`);
    ids.add(task.id);
    if (typeof task.title !== 'string' || !task.title.trim() || task.title.length > TASK_LIMITS.title) fail(`${where}: el título es obligatorio y como máximo de ${TASK_LIMITS.title} caracteres.`);
    if (!isOptionalString(task.notes, TASK_LIMITS.notes)) fail(`${where}: las notas no son válidas.`);
    if (!isOptionalString(task.category, TASK_LIMITS.category)) fail(`${where}: la categoría no es válida.`);
    if (!isValidDateKey(task.date)) fail(`${where}: la fecha no es válida.`);
    if (!Object.hasOwn(PRIORITIES, task.priority)) fail(`${where}: la prioridad no es válida.`);
    const [minEstimate, maxEstimate] = TASK_LIMITS.estimate;
    if (!Number.isInteger(task.estimate) || task.estimate < minEstimate || task.estimate > maxEstimate) fail(`${where}: la estimación de pomodoros no es válida.`);
    if (typeof task.completed !== 'boolean') fail(`${where}: el estado «completada» no es válido.`);
    if (!isTime(task.createdAt)) fail(`${where}: la fecha de creación no es válida.`);
    if (task.completedAt != null && !isTime(task.completedAt)) fail(`${where}: la fecha de finalización no es válida.`);
    return {
      id: task.id,
      title: task.title.trim(),
      notes: task.notes ?? '',
      date: task.date,
      category: (task.category ?? '').trim(),
      priority: task.priority,
      estimate: task.estimate,
      completed: task.completed,
      completedAt: task.completed ? task.completedAt ?? task.createdAt : null,
      createdAt: task.createdAt,
      updatedAt: isTime(task.updatedAt) ? task.updatedAt : task.createdAt,
    };
  });
  let activeTaskId = raw.activeTaskId ?? null;
  if (activeTaskId !== null) {
    const active = tasks.find((task) => task.id === activeTaskId);
    if (!active) fail('La tarea activa indicada no existe en el archivo.');
    if (active.completed) activeTaskId = null;
  }
  return { tasks, activeTaskId };
}

function validateSessions(raw) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) fail('El historial de sesiones no tiene un formato válido.');
  if (raw.length > 100000) fail('El historial contiene demasiadas sesiones.');
  const ids = new Set();
  return raw.map((session, index) => {
    const where = `Sesión nº ${index + 1}`;
    if (!isPlainObject(session)) fail(`${where}: no tiene un formato válido.`);
    if (typeof session.id !== 'string' || !session.id) fail(`${where}: falta su identificador.`);
    if (ids.has(session.id)) fail(`${where}: está repetida.`);
    ids.add(session.id);
    if (!(session.taskId === null || session.taskId === undefined || typeof session.taskId === 'string')) fail(`${where}: la tarea asociada no es válida.`);
    if (!isOptionalString(session.taskTitle, TASK_LIMITS.title)) fail(`${where}: el título de la tarea no es válido.`);
    if (!isOptionalString(session.taskCategory, TASK_LIMITS.category)) fail(`${where}: la categoría no es válida.`);
    if (session.taskDate != null && !isValidDateKey(session.taskDate)) fail(`${where}: la fecha planificada no es válida.`);
    if (!isTime(session.endedAt)) fail(`${where}: la hora de fin no es válida.`);
    if (session.startedAt != null && (!isTime(session.startedAt) || session.startedAt > session.endedAt)) fail(`${where}: la hora de inicio no es válida.`);
    if (!isTime(session.durationMs) || session.durationMs > MAX_DURATION_MS) fail(`${where}: la duración no es válida.`);
    if (session.focusMs !== undefined && (typeof session.focusMs !== 'number' || session.focusMs < 0 || session.focusMs > session.durationMs)) fail(`${where}: el tiempo de concentración no es válido.`);
    if (!isValidDateKey(session.date)) fail(`${where}: la fecha no es válida.`);
    const focusMs = session.focusMs ?? session.durationMs;
    return {
      id: session.id,
      taskId: session.taskId ?? null,
      taskTitle: session.taskTitle ?? null,
      taskCategory: session.taskCategory || null,
      taskDate: session.taskDate ?? null,
      startedAt: session.startedAt ?? null,
      endedAt: session.endedAt,
      durationMs: session.durationMs,
      focusMs,
      pausedMs: session.startedAt ? Math.max(0, session.endedAt - session.startedAt - focusMs) : null,
      date: session.date,
    };
  });
}

function validateBadges(raw) {
  if (raw === undefined) return { unlocked: {} };
  if (!isPlainObject(raw) || !isPlainObject(raw.unlocked)) fail('Las insignias no tienen un formato válido.');
  const unlocked = {};
  for (const [id, value] of Object.entries(raw.unlocked)) {
    if (!BADGES.some((badge) => badge.id === id)) fail(`Insignia desconocida: «${id}».`);
    if (!isPlainObject(value) || !isTime(value.at)) fail(`La insignia «${id}» no tiene una fecha válida.`);
    unlocked[id] = { at: value.at };
  }
  return { unlocked };
}

/**
 * Lee y valida un archivo. No modifica nada.
 * @returns {Promise<{ ok: true, data: object, summary: object } | { ok: false, error: string }>}
 */
export async function readImportFile(file) {
  try {
    if (!file) fail('No se ha elegido ningún archivo.');
    if (file.size > MAX_FILE_BYTES) fail('El archivo es demasiado grande para ser una copia de InkFocus.');
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      fail('El archivo no es un JSON válido.');
    }
    if (!isPlainObject(parsed) || parsed.app !== 'InkFocus') fail('El archivo no es una copia de InkFocus.');
    if (!Number.isInteger(parsed.format)) fail('El archivo no indica la versión de su formato.');
    if (parsed.format > EXPORT_FORMAT) fail('El archivo se creó con una versión más reciente de InkFocus y no es compatible.');
    if (parsed.format < 1) fail('La versión del formato no es compatible.');
    if (!isPlainObject(parsed.data)) fail('El archivo no contiene datos.');

    const data = {
      settings: validateSettings(parsed.data.settings),
      tasks: validateTasks(parsed.data.tasks),
      sessions: validateSessions(parsed.data.sessions),
      badges: validateBadges(parsed.data.badges),
    };
    const exportedAt = Date.parse(parsed.exportedAt);
    return {
      ok: true,
      data,
      summary: {
        tasks: data.tasks.tasks.length,
        sessions: data.sessions.length,
        badges: Object.keys(data.badges.unlocked).length,
        exportedAt: Number.isFinite(exportedAt) ? exportedAt : null,
      },
    };
  } catch (error) {
    if (error instanceof ImportError) return { ok: false, error: error.message };
    return { ok: false, error: 'No se ha podido leer el archivo.' };
  }
}

/* ---------- Escritura atómica ---------- */

/** Escribe todos los datos importados; si algo falla, deja todo como estaba. */
export function writeImportedData(data) {
  const backup = DATA_KEYS.map((key) => [key, localStorage.getItem(key)]);
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data.settings));
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(data.tasks));
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(data.sessions));
    localStorage.setItem(STORAGE_KEYS.badges, JSON.stringify(data.badges));
    // El ciclo del temporizador empieza de cero con las duraciones importadas.
    localStorage.removeItem(STORAGE_KEYS.timer);
    localStorage.removeItem(STORAGE_KEYS.timerBackup);
    return true;
  } catch {
    for (const [key, value] of backup) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        /* sin espacio: lo anterior se conserva en lo que no llegó a escribirse */
      }
    }
    return false;
  }
}

/**
 * Borra SOLO las claves de InkFocus (nunca localStorage.clear(), que borraría
 * datos de otras aplicaciones del mismo dominio).
 */
export function clearAppData() {
  for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key);
}
