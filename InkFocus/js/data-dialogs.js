/**
 * data-dialogs.js
 * Sección «Tus datos» de Ajustes: exportar, importar y borrar.
 *
 * - Importar y borrar se bloquean con una sesión iniciada o en pausa (o en modo
 *   demostración): hay que resolverla antes.
 * - Ambos piden confirmación en su propia ventana, explican qué se sustituye o
 *   se borra y ofrecen descargar una copia antes.
 * - Borrar exige además marcar «Entiendo que…» (confirmación explícita).
 */
import { readImportFile, downloadJSON } from './data-transfer.js';

const dateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' });
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * @param {object} deps
 * @param {() => string|null} deps.blockReason  Motivo por el que no se puede importar/borrar ahora, o null
 * @param {() => object} deps.getExport         Objeto de exportación con los datos actuales
 * @param {(data: object) => boolean} deps.applyImport  Sustituye los datos; false si falla
 * @param {() => void} deps.resetAll            Borra los datos de InkFocus
 */
export function initDataManagement({ blockReason, getExport, applyImport, resetAll }) {
  const $ = (id) => document.getElementById(id);
  const status = $('data-status');
  const fileInput = $('import-file');
  const importDialog = $('import-dialog');
  const resetDialog = $('reset-dialog');
  const resetCheck = $('reset-confirm-check');
  const resetConfirm = $('reset-confirm');
  let pending = null; // datos validados esperando confirmación
  let opener = null;

  function setStatus(message, kind = 'info') {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function exportNow(target = status) {
    const filename = downloadJSON(getExport());
    const message = `Copia descargada: ${filename}`;
    if (target === status) setStatus(message, 'ok');
    else target.textContent = message;
  }

  function openDialog(dialog, focusTarget) {
    opener = document.activeElement;
    dialog.showModal();
    focusTarget.focus();
  }

  function closeDialog(dialog) {
    if (dialog.open) dialog.close();
    if (opener && opener.isConnected) opener.focus();
  }

  /* ---------- Exportar ---------- */
  $('btn-export').addEventListener('click', () => exportNow());

  /* ---------- Importar ---------- */
  $('btn-import').addEventListener('click', () => {
    const reason = blockReason();
    if (reason) {
      setStatus(reason, 'error');
      return;
    }
    setStatus('');
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const result = await readImportFile(file);
    if (!result.ok) {
      // Nada se ha modificado: solo se informa.
      setStatus(`No se ha importado nada. ${result.error}`, 'error');
      $('btn-import').focus();
      return;
    }
    pending = result.data;
    const { tasks, sessions, badges, exportedAt } = result.summary;
    $('import-summary').innerHTML = `
      <li>${plural(tasks, 'tarea', 'tareas')}</li>
      <li>${plural(sessions, 'sesión registrada', 'sesiones registradas')}</li>
      <li>${plural(badges, 'insignia', 'insignias')}</li>
      <li>Preferencias y objetivo diario</li>`;
    $('import-date').textContent = exportedAt ? `Copia creada el ${dateTime.format(new Date(exportedAt))}.` : '';
    $('import-backup-status').textContent = '';
    openDialog(importDialog, importDialog.querySelector('[data-action="cancel"]'));
  });

  importDialog.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'backup') exportNow($('import-backup-status'));
    if (action === 'cancel') {
      pending = null;
      closeDialog(importDialog);
      setStatus('Importación cancelada. No se ha cambiado nada.');
    }
    if (action === 'confirm' && pending) {
      const reason = blockReason();
      if (reason) {
        closeDialog(importDialog);
        setStatus(reason, 'error');
        return;
      }
      const ok = applyImport(pending);
      pending = null;
      closeDialog(importDialog);
      if (!ok) setStatus('No se ha podido guardar la importación (¿almacenamiento lleno?). Tus datos anteriores siguen intactos.', 'error');
    }
  });
  importDialog.addEventListener('cancel', () => {
    pending = null;
  });

  /* ---------- Borrar ---------- */
  $('btn-reset-data').addEventListener('click', () => {
    const reason = blockReason();
    if (reason) {
      setStatus(reason, 'error');
      return;
    }
    setStatus('');
    resetCheck.checked = false;
    resetConfirm.disabled = true;
    $('reset-backup-status').textContent = '';
    openDialog(resetDialog, resetDialog.querySelector('[data-action="cancel"]'));
  });

  resetCheck.addEventListener('change', () => {
    resetConfirm.disabled = !resetCheck.checked;
  });

  resetDialog.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'backup') exportNow($('reset-backup-status'));
    if (action === 'cancel') closeDialog(resetDialog);
    if (action === 'confirm' && resetCheck.checked) {
      closeDialog(resetDialog);
      resetAll();
    }
  });

  return { clearStatus: () => setStatus('') };
}
