/**
 * active-task-view.js
 * Franja «Tarea activa» dentro del temporizador.
 * Se llama en cada tick, pero solo reescribe el HTML cuando algo cambia.
 *
 * Tiene tres estados:
 *  - con tarea activa: título, pomodoros y botones «Ver tareas» / «Quitar»;
 *  - sin tarea activa: botón «Elegir tarea»;
 *  - aviso integrado cuando se pulsa «Elegir tarea» y no hay ninguna pendiente.
 */
import { formatDateShort } from './dates.js';
import { escapeHTML } from './html.js';

/**
 * @param {object} handlers  onShow(), onClear(), onChoose(), onCreate(), onList()
 */
export function createActiveTaskView(handlers) {
  const container = document.getElementById('active-task');
  const content = document.getElementById('active-task-content');
  let lastKey = '';
  let prompt = null; // { completedCount } mientras se muestra el aviso «No hay ninguna tarea…»

  function hintText(snapshot, demo) {
    if (demo) return 'Modo demostración: las sesiones no suman pomodoros a la tarea.';
    const inFocus = snapshot.phase === 'focus' && (snapshot.status === 'running' || snapshot.status === 'paused');
    return inFocus
      ? 'Al completar esta sesión se sumará un pomodoro a esta tarea.'
      : 'Cada sesión de concentración completada suma un pomodoro.';
  }

  function promptTemplate({ completedCount }) {
    const completedNote = completedCount
      ? `<p class="active-task__meta">${completedCount === 1
          ? 'Tienes 1 tarea completada: puedes consultarla o reabrirla'
          : `Tienes ${completedCount} tareas completadas: puedes consultarlas o reabrirlas`} en «Ver tareas».</p>`
      : '';
    return `
      <div class="active-task__prompt" role="group" aria-labelledby="active-task-prompt-text">
        <p id="active-task-prompt-text" class="active-task__prompt-text">No hay ninguna tarea disponible. ¿Quieres crear una?</p>
        ${completedNote}
        <div class="active-task__actions">
          <button type="button" class="btn btn--small btn--solid" data-action="create" aria-haspopup="dialog">Crear tarea</button>
          <button type="button" class="btn btn--small" data-action="cancel">Cancelar</button>
          ${completedCount ? '<button type="button" class="btn btn--small" data-action="list" aria-haspopup="dialog">Ver tareas</button>' : ''}
        </div>
      </div>`;
  }

  function render({ task, count, snapshot, demo, today }) {
    if (task) prompt = null; // al haber tarea activa, el aviso ya no tiene sentido
    const key = JSON.stringify([task?.id, task?.title, task?.category, task?.estimate, task?.date, count, today,
      snapshot.phase, snapshot.status, demo, prompt]);
    if (key === lastKey) return;
    lastKey = key;

    // Conservar el foco si estaba en un botón de esta franja.
    const focusedAction = content.contains(document.activeElement) ? document.activeElement.dataset.action : null;
    container.dataset.state = task ? 'set' : prompt ? 'prompt' : 'empty';

    if (task) {
      const meta = [
        task.category ? escapeHTML(task.category) : null,
        `${count} de ${task.estimate} ${task.estimate === 1 ? 'pomodoro' : 'pomodoros'}`,
        task.date !== today ? `Planificada: ${escapeHTML(formatDateShort(task.date, today))}` : null,
      ].filter(Boolean);
      content.innerHTML = `
        <p class="active-task__title">${escapeHTML(task.title)}</p>
        <p class="active-task__meta">${meta.join(' · ')}</p>
        <p class="active-task__hint">${hintText(snapshot, demo)}</p>
        <div class="active-task__actions">
          <button type="button" class="btn btn--small" data-action="show" aria-haspopup="dialog">Ver tareas</button>
          <button type="button" class="btn btn--small" data-action="clear">Quitar</button>
        </div>`;
    } else if (prompt) {
      content.innerHTML = promptTemplate(prompt);
    } else {
      content.innerHTML = `
        <p class="active-task__empty">Sin tarea activa: las sesiones se registran sin tarea asociada.</p>
        <div class="active-task__actions">
          <button type="button" class="btn btn--small" data-action="choose" aria-haspopup="dialog">Elegir tarea</button>
        </div>`;
    }

    if (focusedAction) {
      (content.querySelector(`[data-action="${focusedAction}"]`) ?? content.querySelector('button'))?.focus();
    }
  }

  /** Muestra el aviso integrado y lleva el foco a «Crear tarea». */
  function showNoTasksPrompt({ completedCount }) {
    prompt = { completedCount };
    lastKey = '';
    handlers.onRequestRender();
    content.querySelector('[data-action="create"]')?.focus();
  }

  function hidePrompt({ focusChoose = false } = {}) {
    if (!prompt) return;
    prompt = null;
    lastKey = '';
    handlers.onRequestRender();
    if (focusChoose) content.querySelector('[data-action="choose"]')?.focus();
  }

  /** Pone el foco en el primer botón de la franja (p. ej., tras activar una tarea). */
  function focus() {
    content.querySelector('button')?.focus();
  }

  content.addEventListener('click', (event) => {
    const action = event.target.closest('button[data-action]')?.dataset.action;
    const actions = {
      show: handlers.onShow,
      clear: handlers.onClear,
      choose: handlers.onChoose,
      create: handlers.onCreate,
      list: handlers.onList,
      cancel: () => hidePrompt({ focusChoose: true }),
    };
    actions[action]?.();
  });

  // Escape cierra el aviso, igual que «Cancelar».
  content.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && prompt) hidePrompt({ focusChoose: true });
  });

  return { render, showNoTasksPrompt, hidePrompt, focus };
}
