/**
 * task-dialog.js
 * Ventana para crear y editar tareas. Valida antes de guardar y muestra
 * cada error junto a su campo; el foco va al primer campo incorrecto.
 */
import { TASK_LIMITS, validateTaskInput } from './tasks-model.js';

const TEXT_FIELDS = ['title', 'notes', 'date', 'category', 'estimate'];

/**
 * @param {object} deps
 * @param {() => string[]} deps.getCategories  Sugerencias para el campo categoría.
 * @param {(taskId: string) => number} deps.getPomodoros
 * @param {(values: object, taskId: string|null, options: {activate: boolean}) => (() => void) | void} deps.onSubmit
 *        Guarda y puede devolver una función que coloca el foco tras cerrar.
 */
export function initTaskDialog({ getCategories, getPomodoros, onSubmit }) {
  const dialog = document.getElementById('task-dialog');
  const form = document.getElementById('task-form');
  const heading = document.getElementById('task-dialog-title');
  const submitButton = document.getElementById('task-submit');
  const progressNote = document.getElementById('task-progress-note');
  const notesCounter = document.getElementById('task-notes-count');
  const datalist = document.getElementById('task-category-options');
  const activateRow = document.getElementById('task-activate-row');
  const field = (name) => form.elements.namedItem(name);

  let editingId = null;
  let opener = null;
  let submitting = false;

  function showError(name, message) {
    const input = field(name);
    const error = document.getElementById(`task-${name}-error`);
    error.textContent = message || '';
    error.hidden = !message;
    input.toggleAttribute('aria-invalid', Boolean(message));
  }

  function clearErrors() {
    TEXT_FIELDS.forEach((name) => showError(name, ''));
  }

  function updateNotesCounter() {
    notesCounter.textContent = `${field('notes').value.length} / ${TASK_LIMITS.notes}`;
  }

  function fillCategories() {
    datalist.innerHTML = '';
    getCategories().forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      datalist.append(option);
    });
  }

  function open(task, defaults = {}) {
    opener = document.activeElement;
    submitting = false;
    editingId = task ? task.id : null;
    const source = task ?? { title: '', notes: '', category: '', priority: 'medium', estimate: 1, ...defaults };

    // «Hacerla la tarea activa» solo al crear; marcada si se llega desde «Elegir tarea».
    activateRow.hidden = Boolean(task);
    field('activate').checked = !task && Boolean(defaults.activate);

    heading.textContent = task ? 'Editar tarea' : 'Nueva tarea';
    submitButton.textContent = task ? 'Guardar cambios' : 'Crear tarea';
    field('title').value = source.title;
    field('notes').value = source.notes;
    field('date').value = source.date;
    field('category').value = source.category;
    field('estimate').value = source.estimate;
    form.querySelector(`input[name="priority"][value="${source.priority}"]`).checked = true;

    // Al editar, informamos de los pomodoros ya hechos (no se editan a mano).
    progressNote.hidden = !task;
    if (task) {
      const done = getPomodoros(task.id);
      progressNote.textContent = `Pomodoros completados en esta tarea: ${done}. Se suman solos al terminar sesiones de concentración con la tarea activa.`;
    }

    fillCategories();
    clearErrors();
    updateNotesCounter();
    dialog.showModal();
    field('title').focus();
  }

  function restoreOpener() {
    if (opener && opener.isConnected) opener.focus();
  }

  // Cierre sin guardar (Cancelar, × o Escape): el foco vuelve a donde estaba.
  dialog.addEventListener('close', () => {
    if (submitting) {
      submitting = false;
      return;
    }
    restoreOpener();
  });

  dialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  // Botones − / + para la estimación (cómodos en pantallas táctiles).
  form.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = field('estimate');
      const [min, max] = TASK_LIMITS.estimate;
      const current = Number.parseInt(input.value, 10) || min;
      input.value = Math.min(max, Math.max(min, current + Number(button.dataset.step)));
      showError('estimate', '');
    });
  });

  TEXT_FIELDS.forEach((name) => {
    field(name).addEventListener('input', () => showError(name, ''));
  });
  field('notes').addEventListener('input', updateNotesCounter);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = Object.fromEntries(TEXT_FIELDS.map((name) => [name, field(name).value]));
    raw.priority = form.querySelector('input[name="priority"]:checked')?.value;

    const { values, errors } = validateTaskInput(raw);
    clearErrors();
    const invalid = TEXT_FIELDS.filter((name) => errors[name]);
    if (invalid.length) {
      invalid.forEach((name) => showError(name, errors[name]));
      field(invalid[0]).focus();
      return;
    }

    // Primero se cierra (para que los avisos aparezcan en la ventana de debajo)
    // y después se guarda; onSubmit puede devolver dónde colocar el foco.
    submitting = true;
    dialog.close();
    const placeFocus = onSubmit(values, editingId, { activate: !editingId && field('activate').checked });
    if (placeFocus) placeFocus();
    else restoreOpener();
  });

  return {
    openNew: (defaults) => open(null, defaults),
    openEdit: (task) => open(task),
  };
}
