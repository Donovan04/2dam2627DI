/**
 * toast.js
 * Avisos temporales en la parte inferior (por ejemplo, «Tarea eliminada · Deshacer»).
 *
 * Accesibilidad:
 * - Se insertan en una región aria-live: el lector de pantalla los anuncia.
 * - La cuenta atrás se detiene mientras el ratón está encima o el foco dentro,
 *   para que nadie pierda la opción de deshacer por no llegar a tiempo.
 * - Escape cierra el aviso.
 * Solo hay un aviso a la vez: uno nuevo sustituye al anterior.
 */
let current = null;

const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/**
 * @param {object} options
 * @param {string} options.message
 * @param {string} [options.actionLabel]  Texto del botón de acción (p. ej. «Deshacer»).
 * @param {() => void} [options.onAction]
 * @param {number} [options.duration]     Milisegundos visibles.
 * @param {boolean} [options.focusAction] Mover el foco al botón de acción.
 * @param {() => void} [options.onFocusLost] Dónde dejar el foco si el aviso se cierra teniéndolo.
 */
/**
 * Mientras hay una ventana modal abierta, el resto de la página es inerte (no
 * se puede pulsar ni enfocar). Por eso el aviso se muestra dentro de la última
 * ventana abierta que tenga zona de avisos; si no hay ninguna, en la general.
 */
function currentRegion() {
  const openDialogs = [...document.querySelectorAll('dialog[open]')];
  for (let i = openDialogs.length - 1; i >= 0; i -= 1) {
    const region = openDialogs[i].querySelector('[data-toast-region]');
    if (region) return region;
  }
  return document.getElementById('toast-region');
}

export function showToast({ message, actionLabel, onAction, duration = 6000, focusAction = false, onFocusLost }) {
  const region = currentRegion();
  if (!region) return null;
  current?.close({ silent: true });

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.setProperty('--toast-duration', `${duration}ms`);
  toast.innerHTML = `
    <p class="toast__message"></p>
    <div class="toast__actions"></div>
    <span class="toast__timer" aria-hidden="true"></span>`;
  toast.querySelector('.toast__message').textContent = message;
  const actions = toast.querySelector('.toast__actions');

  let remaining = duration;
  let startedAt = 0;
  let timeoutId = null;
  let hovered = false;
  let focused = false;
  let closed = false;

  function close({ silent = false } = {}) {
    if (closed) return;
    closed = true;
    clearTimeout(timeoutId);
    const hadFocus = toast.contains(document.activeElement);
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 200);
    if (current === handle) current = null;
    if (hadFocus && !silent) onFocusLost?.();
  }

  let running = false;

  function run() {
    if (closed || running || hovered || focused) return;
    running = true;
    startedAt = Date.now();
    toast.classList.remove('is-paused');
    timeoutId = setTimeout(() => close(), remaining);
  }

  function pause() {
    toast.classList.add('is-paused');
    if (closed || !running) return;
    running = false;
    clearTimeout(timeoutId);
    remaining = Math.max(1500, remaining - (Date.now() - startedAt));
  }

  if (actionLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn--small toast__action';
    button.textContent = actionLabel;
    button.addEventListener('click', () => {
      close({ silent: true });
      onAction?.();
    });
    actions.append(button);
  }

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn btn--icon toast__close';
  closeButton.setAttribute('aria-label', 'Cerrar aviso');
  closeButton.innerHTML = CLOSE_ICON;
  closeButton.addEventListener('click', () => close());
  actions.append(closeButton);

  toast.addEventListener('mouseenter', () => { hovered = true; pause(); });
  toast.addEventListener('mouseleave', () => { hovered = false; run(); });
  toast.addEventListener('focusin', () => { if (!focused) { focused = true; pause(); } });
  toast.addEventListener('focusout', (event) => {
    if (!toast.contains(event.relatedTarget)) { focused = false; run(); }
  });
  toast.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  region.append(toast);
  const handle = { close };
  current = handle;

  if (focusAction) {
    (toast.querySelector('.toast__action') ?? closeButton).focus();
    if (toast.contains(document.activeElement)) {
      focused = true;
      pause();
    }
  }
  run();
  return handle;
}
