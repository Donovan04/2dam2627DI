/**
 * timer-view.js
 * Pinta el estado del temporizador en la página. No contiene lógica de tiempo:
 * recibe una "foto" (snapshot) del motor y actualiza solo lo que ha cambiado.
 */
import { PHASES } from './config.js';
import { getPhaseDurations } from './settings.js';
import { createTank } from './tank.js';
import {
  formatClock,
  formatSpokenDuration,
  formatShortDuration,
  formatClockTime,
} from './format.js';

/** Escribe texto solo si cambia (evita trabajo inútil 4 veces por segundo). */
function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

function statusText(snapshot) {
  const isFocus = snapshot.phase === 'focus';
  switch (snapshot.status) {
    case 'running':
      return isFocus ? 'En marcha · el tanque se vacía' : 'Descansando · el tanque se recarga';
    case 'paused':
      return 'En pausa · el tanque está detenido';
    case 'expired':
      return 'La sesión terminó sin la app activa';
    default:
      return isFocus ? 'Preparado para concentrarte' : 'Descanso preparado';
  }
}

/** Posición en la secuencia (no confundir con sesiones completadas). */
function sessionText({ phase, cycleIndex, sessionsPerCycle: total }) {
  if (phase === 'focus') return `Sesión ${cycleIndex + 1} de ${total}`;
  if (phase === 'longBreak') return `Fin del ciclo · ${total} de ${total}`;
  return `Tras la sesión ${cycleIndex + 1} de ${total}`;
}

/** Resumen de resultados reales del ciclo. */
function resultsText({ completedInCycle: done, skippedInCycle: skipped }) {
  const doneText = `${done} ${done === 1 ? 'completada' : 'completadas'}`;
  return skipped ? `${doneText} · ${skipped} ${skipped === 1 ? 'saltada' : 'saltadas'}` : doneText;
}

function endTimeText(snapshot, demo) {
  const { status, remainingMs, endsAt, now } = snapshot;
  const at = (timestamp) => formatClockTime(timestamp, demo);
  switch (status) {
    case 'running':
      return `Termina a las ${at(endsAt)}`;
    case 'paused':
      return `Si continúas ahora, terminaría a las ${at(now + remainingMs)}`;
    case 'expired':
      return `Terminó a las ${at(endsAt)}`;
    default:
      return `Si empiezas ahora, terminaría a las ${at(now + remainingMs)}`;
  }
}

function tabTitle(snapshot) {
  const phaseLabel = PHASES[snapshot.phase].label;
  const clock = formatClock(snapshot.remainingMs);
  if (snapshot.status === 'expired') return '¡Fase terminada! · InkFocus';
  if (snapshot.status === 'paused') return `En pausa ${clock} · ${phaseLabel} · InkFocus`;
  return `${clock} · ${phaseLabel} · InkFocus`;
}

const PRIMARY_LABEL = {
  idle: 'Iniciar',
  running: 'Pausar',
  paused: 'Continuar',
  expired: 'Iniciar',
};

export function createTimerView() {
  const $ = (selector) => document.querySelector(selector);
  const el = {
    body: document.body,
    phaseLabel: $('#phase-label'),
    sessionLabel: $('#session-label'),
    status: $('#status-text'),
    time: $('#time-display'),
    endTime: $('#end-time'),
    primary: $('#btn-primary'),
    primaryText: $('#btn-primary [data-label]'),
    reset: $('#btn-reset'),
    skip: $('#btn-skip'),
    restartCycle: $('#btn-restart-cycle'),
    expiredNotice: $('#expired-notice'),
    expiredText: $('#expired-text'),
    cycleSummary: $('#cycle-summary'),
    cycleResults: $('#cycle-results'),
    cycleTrack: $('#cycle-track'),
    cycleHint: $('#cycle-hint'),
    durations: $('#durations-list'),
    demoBadge: $('#demo-badge'),
    demoStripe: $('#demo-stripe'),
  };
  const tank = createTank($('#tank'));

  let lastClock = '';
  let lastCycleKey = '';
  let lastSettingsKey = '';

  function renderTime(remainingMs) {
    const clock = formatClock(remainingMs);
    if (clock === lastClock) return;
    lastClock = clock;
    // Cada carácter va en su propia caja de ancho fijo: los números no "bailan".
    el.time.innerHTML = [...clock]
      .map((char) => `<span class="time__char${char === ':' ? ' time__char--sep' : ''}">${char}</span>`)
      .join('');
    el.time.setAttribute('aria-label', `Tiempo restante: ${formatSpokenDuration(remainingMs)}`);
  }

  function renderCycle(snapshot) {
    const { phase, cycleIndex: index, slotResults, sessionsPerCycle: total } = snapshot;
    const key = `${phase}|${index}|${slotResults.join(',')}|${total}`;
    if (key === lastCycleKey) return;
    lastCycleKey = key;

    // Recorrido: C1 · corto · C2 · corto · … · CN · largo.
    // Concentraciones: completada (rellena), saltada (tachada), actual (anillo) o pendiente.
    // Descansos: pasado, actual o pendiente.
    const STATE_TEXT = { done: 'completada', skipped: 'saltada, no cuenta', passed: 'pasado', current: 'posición actual', upcoming: 'pendiente' };
    const items = [];
    for (let i = 0; i < total; i += 1) {
      let focusState;
      if (phase === 'focus' && i === index) focusState = 'current';
      else if (i < index || (i === index && phase !== 'focus')) focusState = slotResults[i] === 'done' ? 'done' : 'skipped';
      else focusState = 'upcoming';
      items.push({ kind: 'focus', label: `Concentración ${i + 1}`, state: focusState });

      const isLast = i === total - 1;
      let breakState;
      if (phase !== 'focus' && i === index) breakState = 'current';
      else if (i < index) breakState = 'passed';
      else breakState = 'upcoming';
      items.push({ kind: isLast ? 'long' : 'short', label: isLast ? 'Descanso largo' : `Descanso corto ${i + 1}`, state: breakState });
    }

    el.cycleTrack.innerHTML = items
      .map(
        (item) => `<li class="step step--${item.kind} step--${item.state}"${item.state === 'current' ? ' aria-current="step"' : ''}>
          <span class="visually-hidden">${item.label}: ${STATE_TEXT[item.state]}</span>
        </li>`,
      )
      .join('');

    const position = phase === 'focus'
      ? `Posición: sesión ${index + 1} de ${total}`
      : phase === 'longBreak'
        ? `Posición: descanso largo (fin del ciclo)`
        : `Posición: descanso tras la sesión ${index + 1} de ${total}`;
    setText(el.cycleSummary, position);
    setText(el.cycleResults, `En este ciclo: ${resultsText(snapshot)}`);
  }

  function renderSettings(settings) {
    const key = JSON.stringify(settings);
    if (key === lastSettingsKey) return;
    lastSettingsKey = key;

    const d = getPhaseDurations(settings);
    el.durations.innerHTML = `
      <div><dt>Concentración</dt><dd>${formatShortDuration(d.focus)}</dd></div>
      <div><dt>Descanso corto</dt><dd>${formatShortDuration(d.shortBreak)}</dd></div>
      <div><dt>Descanso largo</dt><dd>${formatShortDuration(d.longBreak)}</dd></div>`;
    setText(
      el.cycleHint,
      `El descanso largo llega al final del recorrido de ${settings.sessionsPerCycle} sesiones, tanto si las completas como si las saltas. Solo las completadas suman pomodoros y tiempo de estudio.`,
    );
    el.demoBadge.hidden = !settings.demo;
    el.demoStripe.hidden = !settings.demo;
  }

  /** Pinta todo. Se llama en cada tick (4 veces por segundo). */
  function render(snapshot, settings) {
    const { phase, status } = snapshot;
    const phaseLabel = PHASES[phase].label;

    el.body.dataset.phase = phase;
    el.body.dataset.status = status;

    renderTime(snapshot.remainingMs);
    setText(el.phaseLabel, phaseLabel);
    setText(el.sessionLabel, sessionText(snapshot));
    setText(el.status, statusText(snapshot));
    setText(el.endTime, endTimeText(snapshot, settings.demo));

    const title = tabTitle(snapshot);
    if (document.title !== title) document.title = title;

    setText(el.primaryText, PRIMARY_LABEL[status]);
    el.primary.dataset.action = status === 'running' ? 'pause' : 'play';
    el.primary.disabled = status === 'expired';
    el.reset.disabled = status === 'idle' || status === 'expired';
    el.skip.disabled = status === 'expired';
    el.restartCycle.disabled =
      status === 'expired' || (phase === 'focus' && status === 'idle' && snapshot.cycleIndex === 0 && snapshot.slotResults.length === 0);

    el.expiredNotice.hidden = status !== 'expired';
    if (status === 'expired') {
      setText(
        el.expiredText,
        `Tu sesión de concentración de ${formatShortDuration(snapshot.durationMs)} terminó a las ${formatClockTime(snapshot.endsAt, settings.demo)} mientras InkFocus no estaba activa. ¿La completaste?`,
      );
    }

    renderCycle(snapshot);
    renderSettings(settings);
    tank.update({ level: snapshot.level, phase, status, phaseLabel });
  }

  return { render };
}
