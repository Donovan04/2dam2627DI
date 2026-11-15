/**
 * shortcuts.js
 * Atajos de teclado. La lista SHORTCUTS es la única fuente: la usa el manejador
 * y también la ayuda, así la documentación nunca se queda desfasada.
 *
 * Reglas para no molestar:
 *  - Sin Ctrl, Alt, Cmd ni Mayús: no chocan con los atajos del navegador.
 *  - No actúan mientras se escribe (campos, selectores, contenido editable) ni
 *    con una ventana (diálogo) abierta.
 *  - Espacio no actúa si el foco está en un botón, enlace, pestaña, día del
 *    calendario u otro control: ahí Espacio ya tiene su función.
 *  - Los atajos de una tecla se pueden desactivar en Ajustes (útil con lectores
 *    de pantalla, que usan letras para navegar). Escape sigue funcionando.
 */
export const SHORTCUTS = [
  { keys: ['Espacio'], code: ' ', action: 'primary', description: 'Iniciar, pausar o continuar' },
  { keys: ['R'], code: 'r', action: 'reset', description: 'Reiniciar la fase actual (no se cuenta)' },
  { keys: ['S'], code: 's', action: 'skip', description: 'Saltar fase (avanza el ciclo sin contarla)' },
  { keys: ['C'], code: 'c', action: 'focusMode', description: 'Entrar o salir del modo concentración' },
  { keys: ['Esc'], code: 'Escape', action: 'exitFocus', description: 'Salir del modo concentración', always: true },
  { keys: ['N'], code: 'n', action: 'newTask', description: 'Nueva tarea' },
  { keys: ['T'], code: 't', action: 'tasks', description: 'Ver la lista de tareas' },
  { keys: ['1'], code: '1', action: 'viewFocus', description: 'Vista Concentración' },
  { keys: ['2'], code: '2', action: 'viewCalendar', description: 'Vista Calendario' },
  { keys: ['3'], code: '3', action: 'viewStats', description: 'Vista Estadísticas' },
  { keys: ['H'], code: 'h', action: 'help', description: 'Abrir esta ayuda' },
];

const TYPING_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
const CONTROL_SELECTOR = 'button, a[href], summary, label, [role="button"], [role="tab"], [role="gridcell"], [tabindex]:not([tabindex="-1"])';

/**
 * @param {object} options
 * @param {() => boolean} options.enabled  ¿Están activados los atajos de una tecla?
 * @param {Record<string, () => void>} options.actions
 */
export function initShortcuts({ enabled, actions }) {
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.isComposing) return;
    if (document.querySelector('dialog[open]')) return;

    const target = event.target instanceof Element ? event.target : document.body;
    if (target.closest(TYPING_SELECTOR) || target.isContentEditable) return;

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const shortcut = SHORTCUTS.find((item) => item.code === key);
    if (!shortcut) return;
    if (!shortcut.always && !enabled()) return;

    // Escape dentro de un aviso o del mensaje «No hay ninguna tarea» lo gestionan ellos.
    if (key === 'Escape' && target.closest('.toast, .active-task__prompt')) return;
    // Espacio sobre un control activa ese control, no el temporizador.
    if (key === ' ' && target !== document.body && target.closest(CONTROL_SELECTOR)) return;

    const run = actions[shortcut.action];
    if (!run) return;
    const handled = run();
    if (handled !== false) event.preventDefault();
  });
}
