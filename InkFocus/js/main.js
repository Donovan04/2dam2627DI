/**
 * main.js
 * Punto de entrada: carga datos guardados, crea el temporizador, conecta los
 * botones, las vistas (Concentración / Calendario / Estadísticas) y mantiene el
 * bucle de refresco.
 */
import { STORAGE_KEYS, PHASES, TICK_MS } from './config.js';
import { readJSON, writeJSON } from './storage.js';
import { sanitizeSettings } from './settings.js';
import { PomodoroTimer, sanitizeTimerState, createInitialState } from './timer.js';
import { createTimerView } from './timer-view.js';
import { initSettingsDialog } from './settings-dialog.js';
import { confirmAction } from './confirm-dialog.js';
import { announce } from './announcer.js';
import { playPhaseSplash } from './splash.js';
import { formatClock, formatClockTime } from './format.js';
import { todayKey, formatDateShort, formatDateFull } from './dates.js';
import { compareForTerritory } from './tasks-model.js';
import { createTaskStore } from './tasks-store.js';
import { createSessionStore } from './sessions-store.js';
import { createTasksView } from './tasks-view.js';
import { initTaskDialog } from './task-dialog.js';
import { createActiveTaskView } from './active-task-view.js';
import { createTerritory } from './territory.js';
import { createCalendar } from './calendar.js';
import { createDayView } from './day-view.js';
import { initViews } from './views.js';
import { createGoalView } from './goal-view.js';
import { createStatsView } from './stats-view.js';
import { showToast } from './toast.js';
import { applyAppearance, watchSystemPreferences } from './appearance.js';
import { playSound, unlockAudioOnFirstGesture, audioSupported } from './sound.js';
import { notificationState, requestNotificationPermission, notifyPhaseEnd, STATE_TEXT } from './notifications.js';
import { createFocusMode } from './focus-mode.js';
import { initShortcuts } from './shortcuts.js';
import { initHelpDialog } from './help-dialog.js';
import { createBadgeStore, evaluateBadges, BADGES } from './badges.js';
import { createBadgesView } from './badges-view.js';
import { buildExport, writeImportedData, clearAppData } from './data-transfer.js';
import { initDataManagement } from './data-dialogs.js';

/* ---------- Estado inicial ---------- */

const tasks = createTaskStore();
const sessions = createSessionStore();
const badges = createBadgeStore();
// Sesiones de v2 sin título guardado: lo completamos si la tarea sigue existiendo.
sessions.backfillTaskInfo((id) => tasks.getById(id));
let currentDay = todayKey();

let settings = sanitizeSettings(readJSON(STORAGE_KEYS.settings));
// Si se recarga en modo demostración, las tareas vuelven a quedar «de prueba».
if (settings.demo) tasks.beginSandbox();
const loadStoredTimer = () => sanitizeTimerState(readJSON(STORAGE_KEYS.timer), settings);

// Tema, tintas y movimiento (el script de <head> ya lo hizo antes de pintar).
applyAppearance(settings);
watchSystemPreferences(() => settings);
// El navegador solo deja sonar audio tras una interacción: lo preparamos en la primera.
unlockAudioOnFirstGesture();

const timer = new PomodoroTimer({
  initialState: loadStoredTimer(),
  getSettings: () => settings,
  readStoredState: loadStoredTimer,
  onChange: (state) => writeJSON(STORAGE_KEYS.timer, state),
  onPhaseComplete: handlePhaseComplete,
  onExpired: handleExpired,
});

const view = createTimerView();

function update() {
  timer.tick();
  const snapshot = timer.getSnapshot();
  view.render(snapshot, settings);

  // Si la app sigue abierta al pasar la medianoche, «hoy» cambia.
  const today = todayKey();
  if (today !== currentDay) {
    currentDay = today;
    renderAll();
  }

  const active = tasks.getActive();
  activeTaskView.render({
    task: active,
    count: active ? sessions.countByTask().get(active.id) ?? 0 : 0,
    snapshot,
    demo: settings.demo,
    today,
  });

  // Fuera de la vista principal, la pestaña «Concentración» recuerda que hay una fase en curso.
  const busy = snapshot.status === 'running' || snapshot.status === 'paused';
  const status = views.current() !== 'focus' && busy
    ? snapshot.status === 'paused' ? `En pausa ${formatClock(snapshot.remainingMs)}` : formatClock(snapshot.remainingMs)
    : '';
  views.setFocusStatus(status);
}

/* ---------- Eventos del temporizador ---------- */

function handlePhaseComplete(record, { nextPhase, autoStarted, late }) {
  const nextLabel = PHASES[nextPhase].label;
  const wasFocus = record.phase === 'focus';
  const finished = wasFocus ? 'Sesión de concentración completada' : `${PHASES[record.phase].label} terminado`;
  const followUp = autoStarted ? 'Ha empezado automáticamente.' : 'Pulsa Iniciar cuando quieras.';
  const taskNote = wasFocus ? registerFocusSession(record) : '';

  // La transición visual, el sonido y la notificación solo tienen sentido si la
  // fase terminó con la app abierta (no al confirmar una sesión caducada).
  if (!late) {
    playPhaseSplash({
      phase: nextPhase,
      title: wasFocus ? '¡Tanque vacío!' : '¡Tanque recargado!',
      subtitle: wasFocus ? `Sesión completada · ahora ${nextLabel.toLowerCase()}` : 'Vuelve la concentración',
    });
    phaseEndAlerts(record, nextLabel, autoStarted);
  }
  announce(`${finished}.${taskNote} Ahora: ${nextLabel}. ${followUp}`);
}

/* ---------- Sonido y notificaciones de fin de fase ---------- */

let lastAlertRunId = null;
let soundBlockedWarned = false;

/**
 * Aviso sonoro y notificación (si están activados), una sola vez por fase.
 * Solo se llama desde un final natural: saltar una fase nunca llega aquí.
 */
async function phaseEndAlerts(record, nextLabel, autoStarted) {
  if (record.runId === lastAlertRunId) return;
  lastAlertRunId = record.runId;

  const wasFocus = record.phase === 'focus';
  if (settings.notifications) {
    // notifyPhaseEnd comprueba además el permiso y que la app no esté a la vista.
    notifyPhaseEnd({
      runId: record.runId,
      title: wasFocus ? 'Concentración completada' : `${PHASES[record.phase].label} terminado`,
      body: `Ahora: ${nextLabel}. ${autoStarted ? 'Ya ha empezado.' : 'Vuelve a InkFocus para continuar.'}`,
    });
  }

  const result = await playSound(wasFocus ? 'focusEnd' : 'breakEnd', { volume: settings.volume, muted: settings.soundMuted });
  if (result === 'blocked' && !soundBlockedWarned) {
    soundBlockedWarned = true;
    showToast({ message: 'El navegador ha bloqueado el sonido hasta que pulses algo en la página. Los avisos visuales siguen activos.', duration: 7000 });
  }
}

/**
 * Registra una concentración COMPLETADA y la asocia a la tarea activa en el
 * momento de terminar. Solo llega aquí un final real (no saltos, reinicios ni
 * descansos). Las sesiones del modo demo no se registran.
 * La sesión se guarda en la fecha en que TERMINA; la fecha planificada de la
 * tarea se anota aparte y nunca se modifica.
 * Devuelve un texto para el anuncio accesible.
 */
function registerFocusSession(record) {
  const active = tasks.getActive();
  if (record.demo) {
    return active ? ` Modo demostración: no se suma a «${active.title}».` : '';
  }
  const today = todayKey();
  const doneBefore = sessions.getForDate(today).length;
  const isNew = sessions.record({
    ...record,
    taskId: active?.id ?? null,
    taskTitle: active?.title ?? null,
    taskCategory: active?.category ?? null,
    taskDate: active?.date ?? null,
  });
  if (!isNew) return '';
  const newBadges = checkBadges();
  renderAll();

  const messages = [];
  if (active) {
    const count = sessions.countByTask().get(active.id) ?? 0;
    messages.push(`+1 pomodoro para «${active.title}» (${count} de ${active.estimate}).`);
  }
  // Celebración solo al CRUZAR la meta con una sesión real (no al cambiar la meta ni al recargar).
  const doneAfter = sessions.getForDate(today).length;
  if (doneBefore < settings.dailyGoal && doneAfter >= settings.dailyGoal) {
    if (settings.celebrations) goalView.celebrate();
    messages.push(`¡Objetivo diario cumplido: ${doneAfter} de ${settings.dailyGoal} sesiones!`);
  }
  if (newBadges.length) messages.push(badgeMessage(newBadges));
  if (!messages.length) return '';
  // El aviso visual es la «celebración»: se puede desactivar. El anuncio accesible se mantiene.
  if (settings.celebrations || active) showToast({ message: messages.join(' '), duration: 5000 });
  return ` ${messages.join(' ')}`;
}

/* ---------- Insignias ---------- */

function badgeMessage(ids) {
  const names = ids.map((id) => `«${BADGES.find((badge) => badge.id === id).name}»`);
  return ids.length === 1 ? `Nueva insignia: ${names[0]}.` : `Nuevas insignias: ${names.join(', ')}.`;
}

/**
 * Desbloquea (y guarda) las insignias que se cumplan con los datos reales.
 * Nunca se quitan: si luego cambia el objetivo, la insignia sigue conseguida.
 * @returns {string[]} ids recién desbloqueados
 */
function checkBadges({ highlight = true } = {}) {
  const today = todayKey();
  const met = evaluateBadges({
    sessions: sessions.getAll(),
    todaySessions: sessions.getForDate(today),
    goal: settings.dailyGoal,
  });
  const fresh = Object.entries(met)
    .filter(([id, at]) => badges.unlock(id, at))
    .map(([id]) => id);
  if (fresh.length && highlight && settings.celebrations) badgesView.markNew(fresh);
  return fresh;
}

function handleExpired(snapshot) {
  announce(
    `Tu sesión de concentración terminó a las ${formatClockTime(snapshot.endsAt, settings.demo)} sin la app activa. Elige si quieres contarla.`,
  );
}

/* ---------- Confirmaciones ---------- */

/** Pedimos confirmación solo si se perdería una concentración con avance real. */
function wouldLoseProgress() {
  const snapshot = timer.getSnapshot();
  if (snapshot.phase !== 'focus') return false;
  if (snapshot.status !== 'running' && snapshot.status !== 'paused') return false;
  const elapsed = snapshot.durationMs - snapshot.remainingMs;
  return elapsed >= Math.min(60_000, snapshot.durationMs * 0.2);
}

/* ---------- Controles ---------- */

const $ = (selector) => document.querySelector(selector);

$('#btn-primary').addEventListener('click', () => {
  const { status, phase } = timer.getSnapshot();
  const label = PHASES[phase].label;
  if (status === 'running') {
    timer.pause();
    announce(`${label} en pausa.`);
  } else if (timer.start()) {
    const { endsAt } = timer.getSnapshot();
    announce(`${label} ${status === 'paused' ? 'reanudada' : 'en marcha'}. Termina a las ${formatClockTime(endsAt, settings.demo)}.`);
  }
  update();
});

$('#btn-reset').addEventListener('click', async () => {
  if (wouldLoseProgress()) {
    const ok = await confirmAction({
      title: '¿Reiniciar la sesión?',
      message: 'El tanque volverá a llenarse y esta sesión de concentración no se contará como completada.',
      confirmLabel: 'Reiniciar',
    });
    if (!ok) return;
  }
  if (timer.reset()) announce(`${PHASES[timer.getSnapshot().phase].label} reiniciada. No se ha contado.`);
  update();
});

$('#btn-skip').addEventListener('click', async () => {
  if (wouldLoseProgress()) {
    const ok = await confirmAction({
      title: '¿Saltar esta sesión?',
      message: 'Avanzarás a la siguiente fase del ciclo, pero esta sesión de concentración no se contará como completada ni sumará pomodoros.',
      confirmLabel: 'Saltar',
    });
    if (!ok) return;
  }
  const result = timer.skip();
  if (!result) return;
  // Misma transición de tinta que un final natural, pero indicando que no cuenta.
  // El salto no emite ningún registro: no suma pomodoros ni tiempo de estudio.
  const nextLabel = PHASES[result.next].label;
  const position = timer.getSnapshot();
  const where = result.next === 'focus' ? ` (sesión ${position.cycleIndex + 1} de ${position.sessionsPerCycle})` : '';
  playPhaseSplash({
    phase: result.next,
    title: 'Fase saltada',
    subtitle: `No cuenta como completada · ahora ${nextLabel.toLowerCase()}${where}`,
  });
  announce(`${PHASES[result.skipped].label} saltada, no se cuenta como completada. Ahora: ${nextLabel}${where}.`);
  update();
});

$('#btn-restart-cycle').addEventListener('click', async () => {
  const ok = await confirmAction({
    title: '¿Reiniciar el ciclo?',
    message: 'Volverás a la sesión 1. Lo que esté en curso no se contará; las sesiones ya completadas no se borran.',
    confirmLabel: 'Reiniciar ciclo',
  });
  if (!ok) return;
  timer.restartCycle();
  announce('Ciclo reiniciado. Sesión 1 preparada.');
  update();
});

$('#btn-expired-yes').addEventListener('click', () => {
  timer.resolveExpired(true);
  update();
  $('#btn-primary').focus();
});

$('#btn-expired-no').addEventListener('click', () => {
  timer.resolveExpired(false);
  announce('Sesión no contada. Concentración preparada de nuevo.');
  update();
  $('#btn-primary').focus();
});

/* ---------- Ajustes ---------- */

const settingsDialog = initSettingsDialog({
  getSettings: () => settings,
  hasProgress: () => timer.hasProgress(),
  onSave: async (values) => {
    const entering = values.demo && !settings.demo;
    const leaving = !values.demo && settings.demo;
    // No se mezcla una sesión real con la demostración: primero hay que resolverla.
    if (entering && timer.hasProgress()) {
      return {
        field: 'demo',
        message: 'Hay una sesión real iniciada, en pausa o pendiente de confirmar. Termínala o pulsa «Reiniciar» antes de activar el modo demostración.',
      };
    }
    // Antes de cambiar nada, guardamos aparte el temporizador real (está preparado, sin progreso).
    if (entering) writeJSON(STORAGE_KEYS.timerBackup, timer.exportState());

    const previous = settings;
    const timingChanged = ['focusMin', 'shortMin', 'longMin', 'sessionsPerCycle'].some((key) => values[key] !== previous[key]);
    settings = values;
    writeJSON(STORAGE_KEYS.settings, settings);
    // Colores, tema, sonido y demás preferencias nunca tocan el temporizador.
    applyAppearance(settings);

    if (entering) {
      enterDemo();
      announce('Modo demostración activado: fases de 10, 5 y 8 segundos. No se suma nada a tus datos reales.');
    } else if (leaving) {
      leaveDemo();
      announce('Modo demostración desactivado. El temporizador vuelve a tu sesión normal, sin el progreso de la demostración.');
    } else if (timingChanged && timer.applySettings()) {
      announce('Ajustes guardados y aplicados.');
    } else if (timingChanged) {
      announce('Ajustes guardados. Las nuevas duraciones se aplicarán desde la siguiente fase.');
    } else {
      announce('Ajustes guardados.');
    }
    // Si al cambiar la meta hoy ya se alcanza, se gana «Primera meta» (si no se tenía).
    // Bajar o subir la meta después nunca quita una insignia.
    const newBadges = settings.demo ? [] : checkBadges();
    renderAll(); // el objetivo diario puede haber cambiado: solo cambia su representación
    update();
    if (newBadges.length) {
      announce(badgeMessage(newBadges));
      if (settings.celebrations) showToast({ message: badgeMessage(newBadges), duration: 5000 });
    }
    return true;
  },
  onOpen: () => {
    updatePreferenceStatus();
    dataManagement.clearStatus();
  },
});

$('#btn-settings').addEventListener('click', () => settingsDialog.open());

/* ---------- Modo demostración ----------
   Separado de los datos reales:
   - el temporizador real se guarda aparte (inkfocus.timer-real.v1) y se restaura al salir;
   - las tareas pasan a una copia en memoria que se descarta al salir;
   - las sesiones demo no se registran (registerFocusSession), así que no suman
     minutos, sesiones, pomodoros, objetivo, insignias ni actividad del calendario. */

function enterDemo() {
  tasks.beginSandbox();
  timer.restartCycle(); // ciclo de demostración (10 s / 5 s / 8 s)
  update();
}

function leaveDemo() {
  tasks.endSandbox();
  const backup = sanitizeTimerState(readJSON(STORAGE_KEYS.timerBackup), settings);
  // Solo se recupera si estaba preparado; nunca se traslada tiempo ni progreso ficticio.
  timer.loadState(backup.status === 'idle' ? backup : createInitialState(settings));
  timer.applySettings(); // por si cambiaron las duraciones reales mientras tanto
  localStorage.removeItem(STORAGE_KEYS.timerBackup);
  update();
}

/* ---------- Tus datos: exportar, importar y borrar ---------- */

function dataBlockReason() {
  if (settings.demo) return 'Sal del modo demostración antes de importar o borrar datos.';
  if (timer.hasProgress()) {
    return 'Hay una sesión iniciada, en pausa o pendiente de confirmar. Termínala o pulsa «Reiniciar» antes de importar o borrar datos.';
  }
  return null;
}

/** Tras importar o borrar: todas las vistas leen de nuevo los datos guardados. */
function reloadEverything() {
  settings = sanitizeSettings(readJSON(STORAGE_KEYS.settings));
  applyAppearance(settings);
  tasks.reload();
  sessions.reload();
  badges.reload();
  focusMode.exit();
  timer.loadState(createInitialState(settings));
  renderAll();
  update();
}

const dataManagement = initDataManagement({
  blockReason: dataBlockReason,
  getExport: () =>
    buildExport({
      settings,
      tasks: { tasks: tasks.getAll(), activeTaskId: tasks.getActiveId() },
      sessions: sessions.getAll(),
      badges: badges.toJSON(),
    }),
  applyImport: (data) => {
    if (!writeImportedData(data)) return false;
    reloadEverything();
    checkBadges({ highlight: false }); // la copia puede traer sesiones que ya merecían insignias
    renderAll();
    if (settingsDialog.isOpen()) document.getElementById('settings-dialog').close();
    announce('Datos importados. Todas las vistas muestran ya la copia.');
    const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    showToast({
      message: `Copia importada: ${count(data.tasks.tasks.length, 'tarea', 'tareas')} y ${count(data.sessions.length, 'sesión', 'sesiones')}.`,
      duration: 6000,
    });
    return true;
  },
  resetAll: () => {
    clearAppData();
    reloadEverything();
    if (settingsDialog.isOpen()) document.getElementById('settings-dialog').close();
    views.show('focus');
    announce('Se han borrado todos los datos de InkFocus.');
    showToast({ message: 'Datos borrados. InkFocus vuelve a su estado inicial.', duration: 6000 });
  },
});

/* ---------- Ajustes de sonido y notificaciones (dentro de la ventana) ---------- */

const soundStatus = $('#sound-status');
const notificationsBox = $('#settings-form').elements.namedItem('notifications');
const notificationsStatus = $('#notifications-status');
const SOUND_HINT = soundStatus.textContent;

function showNotificationState(state = notificationState()) {
  notificationsStatus.dataset.state = state;
  notificationsStatus.textContent = STATE_TEXT[state];
  // Sin soporte o en contexto inseguro la opción no puede funcionar.
  notificationsBox.disabled = state === 'unsupported' || state === 'insecure';
}

function updatePreferenceStatus() {
  showNotificationState();
  soundStatus.textContent = audioSupported ? SOUND_HINT : 'Este navegador no admite Web Audio: no habrá sonido, pero sí avisos visuales.';
  $('#btn-test-focus-sound').disabled = !audioSupported;
  $('#btn-test-break-sound').disabled = !audioSupported;
}

// Activar la opción es el único momento en que se pide permiso (y solo si está pendiente).
notificationsBox.addEventListener('change', async () => {
  if (!notificationsBox.checked) {
    showNotificationState();
    return;
  }
  const state = await requestNotificationPermission();
  showNotificationState(state);
  if (state !== 'granted') notificationsBox.checked = false;
});

async function testSound(kind) {
  const form = settingsDialog.readForm();
  const result = await playSound(kind, { volume: Number(form.volume), muted: form.soundMuted });
  const messages = {
    played: 'Sonando… Así sonará al terminar la fase.',
    muted: 'Los avisos están silenciados o el volumen está a 0.',
    blocked: 'El navegador no ha permitido reproducir el sonido.',
    unsupported: 'Este navegador no admite Web Audio.',
  };
  soundStatus.textContent = messages[result];
}

$('#btn-test-focus-sound').addEventListener('click', () => testSound('focusEnd'));
$('#btn-test-break-sound').addEventListener('click', () => testSound('breakEnd'));

/* ---------- Tareas: acciones compartidas por todas las vistas ---------- */

/** Número de zona de una tarea en el territorio de SU día (orden estable), o null. */
function zoneNumber(task) {
  if (!task) return null;
  return tasks.getForDate(task.date).sort(compareForTerritory).findIndex((item) => item.id === task.id) + 1 || null;
}

function isFocusInProgress() {
  const { phase, status } = timer.getSnapshot();
  return phase === 'focus' && (status === 'running' || status === 'paused');
}

/** Fecha que propone el formulario: la seleccionada en el calendario o, si no, hoy. */
function defaultNewTaskDate() {
  return views.current() === 'calendar' ? calendar.getSelected() : todayKey();
}

const openNewTask = (date = defaultNewTaskDate()) => taskDialog.openNew({ date });

function toggleTask(id, completed) {
  const before = tasks.getById(id);
  if (!before) return;
  const wasActive = tasks.getActiveId() === id;
  tasks.setCompleted(id, completed);
  const zone = zoneNumber(before);
  if (completed) {
    const extra = zone ? ` Zona ${zone} pintada.` : '';
    announce(`Tarea «${before.title}» completada.${extra}${wasActive ? ' Ya no es la tarea activa.' : ''}`);
  } else {
    announce(`Tarea «${before.title}» reabierta.${zone ? ` La zona ${zone} vuelve a estar pendiente.` : ''}`);
  }
}

/**
 * Elimina con opción de deshacer. Las sesiones ya registradas NO se borran:
 * conservan el título de la tarea para el historial.
 * @param {'list'|'day'} origin  Lista desde la que se eliminó (para devolver el foco).
 */
function deleteTask(id, origin) {
  const removed = tasks.remove(id);
  if (!removed) return;
  showToast({
    message: `Tarea «${removed.task.title}» eliminada.`,
    actionLabel: 'Deshacer',
    duration: 8000,
    focusAction: true,
    onAction: () => {
      tasks.restore(removed);
      announce(`Tarea «${removed.task.title}» recuperada.`);
      if (origin === 'day') dayView.focusTask(removed.task.id);
      else tasksView.focusTask(removed.task.id);
    },
    onFocusLost: () => (origin === 'day' ? dayView.focusHeading() : tasksView.focusPanel()),
  });
}

/** Lleva el calendario a una fecha (y cambia a esa vista si hace falta). */
function showDateInCalendar(date, taskId = null) {
  tasksView.close({ restoreFocus: false });
  views.show('calendar');
  calendar.select(date);
  if (taskId) dayView.focusTask(taskId);
  else dayView.focusHeading();
}

/**
 * Tras guardar en el formulario. Devuelve una función que coloca el foco:
 * - si se activó al crearla → en la franja «Tarea activa» del temporizador;
 * - ventana «Tareas» abierta → en la tarjeta (o su botón Editar);
 * - vista Calendario y la tarea es del día seleccionado → en su tarjeta del día;
 * - si la tarea queda en otro día del que se está viendo → aviso con enlace a ese día.
 */
function afterTaskSaved(task, isNew, { activate }) {
  const today = todayKey();
  const verb = isNew ? 'creada' : 'actualizada';
  if (activate) {
    tasks.setActive(task.id);
    activeTaskView.hidePrompt();
    announce(`Tarea «${task.title}» creada y elegida como tarea activa.`);
    return () => activeTaskView.focus();
  }

  if (tasksView.isOpen()) {
    const hiddenInList = tasksView.getScope() === 'today' && task.date !== today;
    if (!hiddenInList) {
      announce(`Tarea «${task.title}» ${verb}.`);
      return () => tasksView.focusTask(task.id, isNew ? null : 'edit');
    }
  }

  const visibleDate = views.current() === 'calendar' ? calendar.getSelected() : today;
  if (task.date === visibleDate && !tasksView.isOpen()) {
    announce(`Tarea «${task.title}» ${verb}.`);
    if (views.current() === 'calendar') return () => dayView.focusTask(task.id, isNew ? null : 'edit');
    return () => territoryToday.select(task.id, { focus: true, speak: false });
  }

  // La tarea queda en otro día del que se está viendo.
  showToast({
    message: `Tarea ${verb} para el ${formatDateFull(task.date)}.`,
    actionLabel: 'Ver ese día',
    duration: 8000,
    onAction: () => showDateInCalendar(task.date, task.id),
  });
  return views.current() === 'calendar' && !tasksView.isOpen() ? () => dayView.focusHeading() : null;
}

const taskDialog = initTaskDialog({
  getCategories: () => tasks.getCategories(),
  getPomodoros: (id) => sessions.countByTask().get(id) ?? 0,
  onSubmit: (values, id, options) => {
    if (id) return afterTaskSaved(tasks.update(id, values), false, options);
    return afterTaskSaved(tasks.add(values), true, options);
  },
});

/** «Elegir tarea»: abre la lista de pendientes o, si no hay ninguna, el aviso integrado. */
function chooseTask() {
  const all = tasks.getAll();
  const pending = all.filter((task) => !task.completed);
  if (pending.length) {
    tasksView.openForChoosing();
    return;
  }
  activeTaskView.showNoTasksPrompt({ completedCount: all.length - pending.length });
  announce('No hay ninguna tarea disponible. ¿Quieres crear una?');
}

/** Manejadores comunes a las dos listas de tarjetas (ventana «Tareas» y día del calendario). */
function taskHandlers(origin) {
  return {
    onToggle: toggleTask,
    onActivate: (id) => {
      tasks.setActive(id);
      const task = tasks.getById(id);
      const note = isFocusInProgress() && !settings.demo ? ' La sesión en curso se sumará a esta tarea al completarse.' : '';
      announce(`«${task.title}» es ahora la tarea activa.${note}`);
    },
    onDeactivate: () => {
      tasks.setActive(null);
      announce('Ya no hay tarea activa.');
    },
    onEdit: (id) => taskDialog.openEdit(tasks.getById(id)),
    onDelete: (id) => deleteTask(id, origin),
  };
}

/* ---------- Vista Concentración: ventana «Tareas», territorio de hoy, tarea activa ---------- */

const tasksView = createTasksView({
  store: tasks,
  getCounts: () => sessions.countByTask(),
  // Al cerrar la ventana, si el botón de origen ya no existe, el foco va a la franja «Tarea activa».
  fallbackFocus: () => activeTaskView.focus(),
  handlers: {
    ...taskHandlers('list'),
    onNew: () => openNewTask(),
    // La zona puede estar en el territorio de hoy o en otro día (calendario).
    onZone: (id) => {
      const task = tasks.getById(id);
      tasksView.close({ restoreFocus: false });
      if (task.date === todayKey() && views.current() === 'focus') {
        territoryToday.select(id, { focus: true, speak: false });
      } else {
        showDateInCalendar(task.date);
        dayView.focusTask(id, 'zone');
      }
    },
  },
});

// «Territorio de hoy»: siempre muestra el día actual, aunque el calendario consulte otra fecha.
const territoryToday = createTerritory(
  document.getElementById('territory-panel'),
  {
    onToggle: (id) => toggleTask(id, !tasks.getById(id).completed),
    onShowInList: (id) => tasksView.focusTask(id),
    onNew: () => openNewTask(todayKey()),
  },
  { idPrefix: 'today-zone' },
);

$('#btn-territory-new').addEventListener('click', () => openNewTask(todayKey()));
$('#btn-territory-list').addEventListener('click', () => tasksView.openManage());

const activeTaskView = createActiveTaskView({
  onShow: () => tasksView.focusTask(tasks.getActiveId()),
  onClear: () => {
    tasks.setActive(null);
    announce('Ya no hay tarea activa.');
  },
  onChoose: chooseTask,
  // Desde el aviso «No hay ninguna tarea…»: el formulario llega con «Hacerla activa» marcado.
  onCreate: () => taskDialog.openNew({ date: todayKey(), activate: true }),
  onList: () => {
    // Primero el foco pasa a «Elegir tarea»: será adonde vuelva al cerrar la ventana.
    activeTaskView.hidePrompt({ focusChoose: true });
    tasksView.openManage();
  },
  onRequestRender: () => renderAll(),
});

/* ---------- Vista Calendario ---------- */

// Índices por fecha para los indicadores del calendario (se recalculan en cada cambio).
let taskIndex = new Map();
let sessionIndex = new Map();

function rebuildIndexes() {
  taskIndex = new Map();
  for (const task of tasks.getAll()) {
    const day = taskIndex.get(task.date) ?? { pending: 0, done: 0 };
    if (task.completed) day.done += 1;
    else day.pending += 1;
    taskIndex.set(task.date, day);
  }
  sessionIndex = sessions.summaryByDate();
}

const calendar = createCalendar({
  getDayInfo: (date) => ({
    pending: 0,
    done: 0,
    sessions: 0,
    focusMs: 0,
    ...taskIndex.get(date),
    ...sessionIndex.get(date),
  }),
  // Seleccionar un día solo cambia lo que se consulta: no toca temporizador, fase ni tarea activa.
  onSelect: () => renderDay(),
});

const dayView = createDayView({
  ...taskHandlers('day'),
  onNew: (date) => openNewTask(date),
  onTerritoryToggle: (id) => toggleTask(id, !tasks.getById(id).completed),
});

function renderDay() {
  const date = calendar.getSelected();
  dayView.render({
    date,
    today: todayKey(),
    dayTasks: tasks.getForDate(date),
    daySessions: sessions.getForDate(date),
    counts: sessions.countByTask(),
    activeId: tasks.getActiveId(),
    lookupTask: (id) => tasks.getById(id),
  });
}

/* ---------- Objetivo diario y estadísticas ---------- */

const goalView = createGoalView({ onEdit: () => settingsDialog.open({ focusField: 'dailyGoal' }) });
const statsView = createStatsView();
const badgesView = createBadgesView();

/* ---------- Pintado conjunto ---------- */

/**
 * Cualquier cambio de tareas o sesiones se refleja en todas las vistas a la vez.
 * Todas leen el mismo registro de sesiones: no hay contadores independientes.
 */
function renderAll() {
  const today = todayKey();
  const todaySessions = sessions.getForDate(today);
  goalView.render({
    done: todaySessions.length,
    goal: settings.dailyGoal,
    focusMs: todaySessions.reduce((sum, session) => sum + session.focusMs, 0),
  });
  statsView.render({
    today,
    sessions: sessions.getAll(),
    summary: sessions.summaryByDate(),
    todayTasks: tasks.getForDate(today),
    goal: settings.dailyGoal,
    lookupTask: (id) => tasks.getById(id),
  });
  badgesView.render({
    unlocked: badges.getUnlocked(),
    sessions: sessions.getAll(),
    todaySessions,
    goal: settings.dailyGoal,
  });
  tasksView.render();
  territoryToday.render({
    dayTasks: tasks.getForDate(today),
    counts: sessions.countByTask(),
    activeId: tasks.getActiveId(),
    date: today,
    today,
  });
  const active = tasks.getActive();
  activeTaskView.render({
    task: active,
    count: active ? sessions.countByTask().get(active.id) ?? 0 : 0,
    snapshot: timer.getSnapshot(),
    demo: settings.demo,
    today,
  });
  rebuildIndexes();
  calendar.render();
  renderDay();
}

tasks.subscribe(renderAll);

const views = initViews();

/* ---------- Modo concentración, ayuda y atajos ---------- */

const focusMode = createFocusMode({ beforeEnter: () => views.show('focus') });
const helpDialog = initHelpDialog();
$('#btn-help').addEventListener('click', () => helpDialog.open());

/** Cambia de vista desde el teclado y deja el foco en su pestaña. */
function showViewFromKeyboard(view) {
  focusMode.exit();
  views.show(view);
  document.getElementById({ focus: 'tab-focus', calendar: 'tab-calendar', stats: 'tab-stats' }[view]).focus();
}

/** Pulsa un botón solo si está habilitado (mismas confirmaciones que con el ratón). */
const press = (selector) => {
  const button = $(selector);
  if (!button || button.disabled) return false;
  button.click();
  return true;
};

initShortcuts({
  enabled: () => settings.shortcuts,
  actions: {
    primary: () => press('#btn-primary'),
    reset: () => press('#btn-reset'),
    skip: () => press('#btn-skip'),
    focusMode: () => focusMode.toggle(),
    exitFocus: () => {
      if (!focusMode.isActive()) return false;
      focusMode.exit();
      $('#btn-focus-mode').focus();
      return true;
    },
    newTask: () => openNewTask(),
    tasks: () => tasksView.openManage(),
    viewFocus: () => showViewFromKeyboard('focus'),
    viewCalendar: () => showViewFromKeyboard('calendar'),
    viewStats: () => showViewFromKeyboard('stats'),
    help: () => helpDialog.open(),
  },
});

/* ---------- Sincronización entre pestañas ---------- */

// Si InkFocus está abierta en dos pestañas, ambas comparten el mismo estado.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEYS.settings) {
    settings = sanitizeSettings(readJSON(STORAGE_KEYS.settings));
    applyAppearance(settings);
    renderAll();
  }
  if (event.key === STORAGE_KEYS.settings || event.key === STORAGE_KEYS.timer) {
    timer.adoptState(loadStoredTimer());
    view.render(timer.getSnapshot(), settings);
  }
  if (event.key === STORAGE_KEYS.tasks) tasks.reload();
  if (event.key === STORAGE_KEYS.sessions || event.key === STORAGE_KEYS.badges) {
    sessions.reload();
    badges.reload();
    renderAll();
  }
});

/* ---------- Arranque ---------- */

// Al volver a la pestaña, recalculamos al momento (no esperamos al siguiente tick).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') update();
});

// Insignias que ya se cumplían con datos anteriores: se guardan sin celebración.
checkBadges({ highlight: false });
renderAll();
update();
setInterval(update, TICK_MS);
