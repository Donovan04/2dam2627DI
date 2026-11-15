/**
 * tasks-store.js
 * Estado de las tareas + guardado en localStorage.
 * Cualquier cambio avisa a los suscriptores (las vistas se vuelven a pintar).
 *
 * Datos guardados: { tasks: Tarea[], activeTaskId: string | null }
 * Cada tarea lleva su fecha planificada ("AAAA-MM-DD"); por eso el calendario
 * podrá consultar cualquier día con getForDate() sin cambiar este formato.
 */
import { STORAGE_KEYS } from './config.js';
import { readJSON, writeJSON } from './storage.js';
import { createTaskId, sanitizeTask } from './tasks-model.js';

function sanitizeStore(raw) {
  const list = Array.isArray(raw?.tasks) ? raw.tasks : [];
  const seen = new Set();
  const tasks = [];
  for (const item of list) {
    const task = sanitizeTask(item);
    if (task && !seen.has(task.id)) {
      seen.add(task.id);
      tasks.push(task);
    }
  }
  // La tarea activa debe existir y estar pendiente.
  const active = tasks.find((task) => task.id === raw?.activeTaskId && !task.completed);
  return { tasks, activeTaskId: active ? active.id : null };
}

/**
 * Lee y sanea las tareas guardadas. Si el saneado cambió algo (por ejemplo, una
 * tarea antigua sin fecha válida recibe la de hoy), se guarda la versión migrada.
 * Solo se escribe cuando hay diferencias, para que dos pestañas no se reenvíen
 * cambios sin fin.
 */
function loadStore() {
  const raw = readJSON(STORAGE_KEYS.tasks);
  const data = sanitizeStore(raw);
  if (raw !== null && JSON.stringify(raw) !== JSON.stringify(data)) writeJSON(STORAGE_KEYS.tasks, data);
  return data;
}

export function createTaskStore() {
  let data = loadStore();
  const listeners = new Set();
  // Modo demostración: los cambios se hacen sobre una copia en memoria y NO se
  // guardan; al salir se vuelve a leer lo guardado (las tareas reales intactas).
  let sandbox = false;

  function commit(change) {
    if (!sandbox) writeJSON(STORAGE_KEYS.tasks, data);
    listeners.forEach((listener) => listener(change));
  }

  const findIndex = (id) => data.tasks.findIndex((task) => task.id === id);

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Empieza el modo demostración: a partir de aquí nada se guarda. */
    beginSandbox() {
      sandbox = true;
      data = structuredClone(data);
    },

    /** Termina el modo demostración: se descartan los cambios y se recargan las tareas reales. */
    endSandbox() {
      if (!sandbox) return;
      sandbox = false;
      data = loadStore();
      listeners.forEach((listener) => listener({ type: 'reload' }));
    },

    inSandbox: () => sandbox,

    /** Vuelve a leer localStorage (cambios hechos en otra pestaña o tras importar/borrar). */
    reload() {
      if (sandbox) return;
      data = loadStore();
      listeners.forEach((listener) => listener({ type: 'reload' }));
    },

    getAll: () => data.tasks,
    getById: (id) => data.tasks.find((task) => task.id === id) ?? null,
    getForDate: (dateKey) => data.tasks.filter((task) => task.date === dateKey),
    getActiveId: () => data.activeTaskId,
    getActive: () => data.tasks.find((task) => task.id === data.activeTaskId) ?? null,

    /** Categorías usadas, ordenadas alfabéticamente (para filtros y sugerencias). */
    getCategories() {
      const names = new Set(data.tasks.map((task) => task.category).filter(Boolean));
      return [...names].sort((a, b) => a.localeCompare(b, 'es'));
    },

    add(values) {
      const now = Date.now();
      const task = { id: createTaskId(), ...values, completed: false, completedAt: null, createdAt: now, updatedAt: now };
      data.tasks.push(task);
      commit({ type: 'add', id: task.id });
      return task;
    },

    update(id, values) {
      const index = findIndex(id);
      if (index === -1) return null;
      data.tasks[index] = { ...data.tasks[index], ...values, updatedAt: Date.now() };
      commit({ type: 'update', id });
      return data.tasks[index];
    },

    /** Completar o reabrir. Completar la tarea activa la deja de marcar como activa. */
    setCompleted(id, completed) {
      const index = findIndex(id);
      if (index === -1) return null;
      const task = data.tasks[index];
      if (task.completed === completed) return task;
      data.tasks[index] = { ...task, completed, completedAt: completed ? Date.now() : null, updatedAt: Date.now() };
      const wasActive = data.activeTaskId === id;
      if (completed && wasActive) data.activeTaskId = null;
      commit({ type: completed ? 'complete' : 'reopen', id, wasActive });
      return data.tasks[index];
    },

    setActive(id) {
      const task = id ? data.tasks.find((item) => item.id === id) : null;
      if (id && (!task || task.completed)) return false;
      data.activeTaskId = task ? task.id : null;
      commit({ type: 'active', id: data.activeTaskId });
      return true;
    },

    /** Elimina y devuelve lo necesario para deshacer. */
    remove(id) {
      const index = findIndex(id);
      if (index === -1) return null;
      const [task] = data.tasks.splice(index, 1);
      const wasActive = data.activeTaskId === id;
      if (wasActive) data.activeTaskId = null;
      commit({ type: 'remove', id });
      return { task, index, wasActive };
    },

    /** Deshace una eliminación: la tarea vuelve a su posición (y a su zona del territorio). */
    restore({ task, index, wasActive }) {
      if (findIndex(task.id) !== -1) return;
      data.tasks.splice(Math.min(index, data.tasks.length), 0, task);
      if (wasActive && !task.completed) data.activeTaskId = task.id;
      commit({ type: 'restore', id: task.id });
    },
  };
}
