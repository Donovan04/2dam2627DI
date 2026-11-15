/**
 * help-dialog.js
 * Ventana de ayuda. La lista de atajos se genera desde SHORTCUTS (shortcuts.js).
 */
import { SHORTCUTS } from './shortcuts.js';
import { escapeHTML } from './html.js';

export function initHelpDialog() {
  const dialog = document.getElementById('help-dialog');
  const list = document.getElementById('help-shortcuts');
  let opener = null;

  list.innerHTML = SHORTCUTS.map(
    (item) => `
      <div class="shortcut">
        <dt>${item.keys.map((key) => `<kbd>${escapeHTML(key)}</kbd>`).join(' ')}</dt>
        <dd>${escapeHTML(item.description)}</dd>
      </div>`,
  ).join('');

  function open() {
    if (dialog.open) return;
    opener = document.activeElement;
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('[data-close-help]').focus();
  }

  function close() {
    dialog.close();
  }

  dialog.addEventListener('close', () => {
    if (opener && opener.isConnected) opener.focus();
  });
  dialog.querySelectorAll('[data-close-help]').forEach((button) => button.addEventListener('click', close));

  return { open };
}
