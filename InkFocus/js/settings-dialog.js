/**
 * settings-dialog.js
 * Ventana de ajustes: rellena el formulario, aplica presets, valida y entrega
 * los valores a main.js, que decide cómo aplicarlos.
 *
 * Los cambios se aplican al pulsar «Guardar ajustes». Cancelar o Escape no
 * cambian nada (salvo el permiso de notificaciones, que concede el navegador).
 */
import { PRESETS, LIMITS } from './config.js';
import { validateSettingsInput, BOOLEAN_KEYS, CHOICE_KEYS } from './settings.js';

const NUMBER_FIELDS = Object.keys(LIMITS);
const CHECKBOX_FIELDS = BOOLEAN_KEYS;
const RADIO_FIELDS = Object.keys(CHOICE_KEYS);

/**
 * @param {object} deps
 * @param {() => object} deps.getSettings
 * @param {() => boolean} deps.hasProgress  ¿Hay una fase empezada?
 * @param {(values) => Promise<boolean>} deps.onSave  Devuelve false si el guardado se cancela.
 * @param {(form: HTMLFormElement) => void} [deps.onOpen]  Para actualizar estados (permisos…)
 */
export function initSettingsDialog({ getSettings, hasProgress, onSave, onOpen }) {
  const dialog = document.getElementById('settings-dialog');
  const form = document.getElementById('settings-form');
  const applyNote = document.getElementById('settings-apply-note');
  const volumeOutput = document.getElementById('set-volume-value');
  let opener = null;

  function field(name) {
    return form.elements.namedItem(name);
  }

  function showError(name, message) {
    const input = field(name);
    const error = document.getElementById(`${input.id}-error`);
    error.textContent = message || '';
    error.hidden = !message;
    input.toggleAttribute('aria-invalid', Boolean(message));
  }

  function clearErrors() {
    NUMBER_FIELDS.forEach((name) => showError(name, ''));
    showError('demo', '');
  }

  function updateVolumeOutput() {
    volumeOutput.textContent = `${field('volume').value} %`;
  }

  function fill(settings) {
    NUMBER_FIELDS.forEach((name) => {
      field(name).value = settings[name];
    });
    CHECKBOX_FIELDS.forEach((name) => {
      field(name).checked = settings[name];
    });
    RADIO_FIELDS.forEach((name) => {
      const radio = form.querySelector(`input[name="${name}"][value="${settings[name]}"]`);
      if (radio) radio.checked = true;
    });
    field('volume').value = settings.volume;
    updateVolumeOutput();
  }

  /** Valores actuales del formulario (sin validar). También los usa «Probar sonido». */
  function readForm() {
    const raw = {};
    NUMBER_FIELDS.forEach((name) => {
      raw[name] = field(name).value;
    });
    CHECKBOX_FIELDS.forEach((name) => {
      raw[name] = field(name).checked;
    });
    RADIO_FIELDS.forEach((name) => {
      raw[name] = form.querySelector(`input[name="${name}"]:checked`)?.value;
    });
    raw.volume = field('volume').value;
    return raw;
  }

  /** @param {object} [options] focusField: nombre del campo que recibe el foco al abrir */
  function open({ focusField = 'focusMin' } = {}) {
    opener = document.activeElement;
    fill(getSettings());
    clearErrors();
    // Explicamos cuándo se aplican los cambios según el estado del temporizador.
    applyNote.textContent = hasProgress()
      ? 'Hay una fase en curso: conserva su duración. Los nuevos tiempos se aplicarán desde la siguiente fase. Colores, sonido y demás preferencias no la interrumpen.'
      : 'Los cambios se aplican en cuanto guardes. Ninguno reinicia el temporizador.';
    onOpen?.(form);
    dialog.showModal();
    dialog.scrollTop = 0;
    const target = form.querySelector(`[name="${focusField}"]`);
    target?.focus();
    target?.select?.();
  }

  function close() {
    dialog.close();
  }

  dialog.addEventListener('close', () => {
    if (opener && opener.isConnected) opener.focus();
  });

  dialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', close);
  });

  // Presets: solo rellenan los campos, no guardan.
  form.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = PRESETS[button.dataset.preset];
      Object.entries(preset).forEach(([name, value]) => {
        field(name).value = value;
        showError(name, '');
      });
    });
  });

  // Quitar el error de un campo en cuanto el usuario lo corrige.
  NUMBER_FIELDS.forEach((name) => {
    field(name).addEventListener('input', () => showError(name, ''));
  });
  field('volume').addEventListener('input', updateVolumeOutput);
  field('demo').addEventListener('change', () => showError('demo', ''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { values, errors } = validateSettingsInput(readForm());
    clearErrors();
    const invalid = Object.keys(errors);
    if (invalid.length) {
      invalid.forEach((name) => showError(name, errors[name]));
      field(invalid[0]).focus();
      return;
    }

    // onSave devuelve true (guardado), false (cancelado) o { field, message } si
    // hay que explicar por qué no se puede guardar (p. ej., entrar en demostración).
    const result = await onSave(values);
    if (result === true) close();
    else if (result && result.field) {
      showError(result.field, result.message);
      field(result.field).focus();
    }
  });

  return { open, readForm, isOpen: () => dialog.open };
}
