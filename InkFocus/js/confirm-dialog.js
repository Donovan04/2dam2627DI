/**
 * confirm-dialog.js
 * Confirmación accesible basada en <dialog>. Devuelve una promesa con true/false.
 * - showModal() deja inerte el resto de la página (el foco no se escapa).
 * - El foco empieza en «Cancelar» (la opción segura) y vuelve al botón de origen al cerrar.
 * - Escape equivale a cancelar.
 * La respuesta se resuelve en cuanto se pulsa un botón; el evento «close»
 * queda como respaldo (Escape u otros cierres).
 */
export function confirmAction({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' }) {
  const dialog = document.getElementById('confirm-dialog');
  const cancelButton = dialog.querySelector('[data-confirm-cancel]');
  const acceptButton = dialog.querySelector('[data-confirm-accept]');

  dialog.querySelector('#confirm-title').textContent = title;
  dialog.querySelector('#confirm-message').textContent = message;
  acceptButton.textContent = confirmLabel;
  cancelButton.textContent = cancelLabel;

  const opener = document.activeElement;

  return new Promise((resolve) => {
    let settled = false;

    function settle(answer) {
      if (settled) return;
      settled = true;
      acceptButton.removeEventListener('click', onAccept);
      cancelButton.removeEventListener('click', onCancel);
      dialog.removeEventListener('close', onClose);
      if (dialog.open) dialog.close();
      resolve(answer);
      if (opener && typeof opener.focus === 'function' && opener.isConnected) opener.focus();
    }

    const onAccept = (event) => {
      event.preventDefault();
      settle(true);
    };
    const onCancel = (event) => {
      event.preventDefault();
      settle(false);
    };
    const onClose = () => settle(dialog.returnValue === 'confirm');

    acceptButton.addEventListener('click', onAccept);
    cancelButton.addEventListener('click', onCancel);
    dialog.addEventListener('close', onClose);

    dialog.returnValue = '';
    dialog.showModal();
    cancelButton.focus();
  });
}
