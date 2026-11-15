/**
 * timer.js
 * Motor del temporizador Pomodoro. No toca el DOM: solo gestiona el estado.
 *
 * DECISIÓN CLAVE: el tiempo se calcula con una referencia temporal.
 * Mientras corre, guardamos `endsAt` (instante de fin, en ms desde 1970) y el
 * tiempo restante es siempre `endsAt - Date.now()`. Así no se acumulan errores
 * aunque el navegador ralentice los setInterval de una pestaña oculta.
 *
 * Estados posibles:
 *  - idle     → fase preparada, sin empezar.
 *  - running  → en marcha (usa endsAt).
 *  - paused   → detenida (usa remainingMs).
 *  - expired  → una concentración terminó sin la app activa; esperamos a que
 *               el usuario decida si contarla (no inventamos sesiones).
 */
import { PHASE_IDS, LATE_COMPLETION_TOLERANCE_MS } from './config.js';
import { getPhaseDurations } from './settings.js';

const STATUSES = ['idle', 'running', 'paused', 'expired'];
const MAX_DURATION_MS = 4 * 60 * 60 * 1000;

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Identificador único de cada "ejecución" de fase. Sirve para no registrar dos veces el mismo final. */
function createRunId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialState(settings) {
  const durations = getPhaseDurations(settings);
  return {
    phase: 'focus',
    status: 'idle',
    durationMs: durations.focus,
    remainingMs: durations.focus,
    endsAt: null,
    startedAt: null,
    // Tiempo efectivo en marcha (sin pausas): se acumula al pausar y se cierra al terminar.
    activeMs: 0,
    runningSince: null,
    // POSICIÓN y RESULTADOS del ciclo son conceptos distintos:
    //  - cycleIndex: hueco de concentración en el que estamos (0 = sesión 1).
    //    Avanza tanto al completar como al saltar.
    //  - slotResults: qué pasó en cada hueco ya recorrido ('done' | 'skipped').
    //    Solo 'done' cuenta como sesión completada.
    cycleIndex: 0,
    slotResults: [],
    runId: createRunId(),
    lastCompletedRunId: null,
    demo: settings.demo,
  };
}

/**
 * Tiempo efectivo de concentración guardado. Los estados de v1/v2 no lo tenían:
 * si la fase estaba en marcha, suponemos que corría desde que le quedaba toda su
 * duración (endsAt − durationMs), lo que equivale a lo que marca la cuenta atrás,
 * que nunca avanza en pausa.
 */
function sanitizeActiveTime(raw) {
  const activeMs = isNumber(raw.activeMs) && raw.activeMs >= 0 ? Math.min(raw.activeMs, raw.durationMs) : null;
  if (raw.status !== 'running') {
    const elapsed = raw.durationMs - (isNumber(raw.remainingMs) ? raw.remainingMs : raw.durationMs);
    return { activeMs: activeMs ?? Math.max(0, elapsed), runningSince: null };
  }
  if (activeMs !== null && isNumber(raw.runningSince)) return { activeMs, runningSince: raw.runningSince };
  return { activeMs: 0, runningSince: raw.endsAt - raw.durationMs };
}

/**
 * Comprueba un estado leído de localStorage. Si algo no cuadra, empezamos de
 * cero en lugar de arrastrar un estado imposible.
 */
export function sanitizeTimerState(raw, settings) {
  const fresh = createInitialState(settings);
  if (!raw || typeof raw !== 'object') return fresh;
  if (!PHASE_IDS.includes(raw.phase) || !STATUSES.includes(raw.status)) return fresh;
  if (!isNumber(raw.durationMs) || raw.durationMs <= 0 || raw.durationMs > MAX_DURATION_MS) return fresh;
  // Un estado del modo demo no se mezcla con el modo normal (ni al revés).
  if (raw.demo !== settings.demo) return fresh;
  if ((raw.status === 'running' || raw.status === 'expired') && !isNumber(raw.endsAt)) return fresh;

  let cycleIndex;
  let slotResults;
  if (Number.isInteger(raw.cycleIndex) && raw.cycleIndex >= 0 && raw.cycleIndex <= 50 && Array.isArray(raw.slotResults)) {
    cycleIndex = raw.cycleIndex;
    slotResults = raw.slotResults.filter((r) => r === 'done' || r === 'skipped').slice(0, 51);
  } else {
    // Migración desde v1/v2, que solo guardaban completedInCycle (posición = completadas).
    const done =
      Number.isInteger(raw.completedInCycle) && raw.completedInCycle >= 0 && raw.completedInCycle <= 50
        ? raw.completedInCycle
        : 0;
    cycleIndex = raw.phase === 'focus' ? done : Math.max(done - 1, 0);
    slotResults = Array(done).fill('done');
  }

  return {
    ...fresh,
    phase: raw.phase,
    status: raw.status,
    durationMs: raw.durationMs,
    remainingMs: isNumber(raw.remainingMs) ? clamp(raw.remainingMs, 0, raw.durationMs) : raw.durationMs,
    endsAt: isNumber(raw.endsAt) ? raw.endsAt : null,
    startedAt: isNumber(raw.startedAt) ? raw.startedAt : null,
    ...sanitizeActiveTime(raw),
    cycleIndex,
    slotResults,
    runId: typeof raw.runId === 'string' && raw.runId ? raw.runId : fresh.runId,
    lastCompletedRunId: typeof raw.lastCompletedRunId === 'string' ? raw.lastCompletedRunId : null,
  };
}

export class PomodoroTimer {
  #state;
  #options;

  /**
   * @param {object} options
   * @param {object} options.initialState      Estado ya saneado.
   * @param {() => object} options.getSettings Devuelve los ajustes actuales.
   * @param {() => object|null} [options.readStoredState] Lee el estado guardado (protección entre pestañas).
   * @param {(state) => void} [options.onChange]           Tras cada cambio de estado (para guardar).
   * @param {(record, info) => void} [options.onPhaseComplete] Cuando una fase termina de verdad.
   * @param {(snapshot) => void} [options.onExpired]       Cuando una concentración terminó sin la app activa.
   * @param {() => number} [options.now]                   Reloj inyectable (útil para pruebas).
   */
  constructor(options) {
    this.#options = options;
    this.#state = options.initialState;
  }

  /* ---------- Consultas ---------- */

  #now() {
    return this.#options.now ? this.#options.now() : Date.now();
  }

  #settings() {
    return this.#options.getSettings();
  }

  getRemainingMs(now = this.#now()) {
    const s = this.#state;
    if (s.status === 'running') return Math.max(0, s.endsAt - now);
    if (s.status === 'expired') return 0;
    return s.remainingMs;
  }

  getElapsedMs(now = this.#now()) {
    return this.#state.durationMs - this.getRemainingMs(now);
  }

  /** true si la fase actual ya se ha empezado (en marcha, en pausa o caducada). */
  hasProgress() {
    return this.#state.status !== 'idle';
  }

  /** Copia del estado con datos calculados, lista para pintar. */
  getSnapshot(now = this.#now()) {
    const s = this.#state;
    const remainingMs = this.getRemainingMs(now);
    const fractionLeft = s.durationMs > 0 ? remainingMs / s.durationMs : 0;
    // Concentración: el tanque se vacía. Descansos: se recarga de vacío a lleno.
    const level = s.phase === 'focus' ? fractionLeft : 1 - fractionLeft;
    const sessionsPerCycle = this.#settings().sessionsPerCycle;
    return {
      ...s,
      remainingMs,
      level: clamp(level, 0, 1),
      sessionsPerCycle,
      // Posición (avanza al completar O saltar) frente a sesiones realmente completadas.
      cycleIndex: Math.min(s.cycleIndex, sessionsPerCycle - 1),
      completedInCycle: s.slotResults.filter((result) => result === 'done').length,
      skippedInCycle: s.slotResults.filter((result) => result === 'skipped').length,
      now,
    };
  }

  /* ---------- Acciones del usuario ---------- */

  start() {
    const s = this.#state;
    if (s.status !== 'idle' && s.status !== 'paused') return false;
    const now = this.#now();
    s.endsAt = now + s.remainingMs;
    s.startedAt ??= now;
    s.runningSince = now;
    s.status = 'running';
    this.#commit();
    return true;
  }

  pause() {
    const s = this.#state;
    if (s.status !== 'running') return false;
    const now = this.#now();
    s.remainingMs = Math.max(0, s.endsAt - now);
    // El tiempo en pausa no cuenta como concentración.
    s.activeMs += Math.max(0, Math.min(now, s.endsAt) - s.runningSince);
    s.runningSince = null;
    s.endsAt = null;
    s.status = 'paused';
    this.#commit();
    return true;
  }

  /** Reinicia la fase actual con la duración configurada. No cuenta como completada. */
  reset() {
    if (this.#state.status === 'idle') return false;
    this.#preparePhase(this.#state.phase);
    this.#commit();
    return true;
  }

  /**
   * Salta a la siguiente posición de la secuencia SIN contarla como completada.
   * Usa el mismo avance que un final natural (#advance), pero marca el hueco
   * como 'skipped' y no emite ningún registro de sesión.
   * Si el temporizador estaba en marcha, la siguiente fase arranca sola;
   * si estaba detenido, queda preparada.
   * @returns {{ skipped: string, next: string } | null}
   */
  skip() {
    const s = this.#state;
    if (s.status === 'expired') return null;
    const wasRunning = s.status === 'running';
    const skipped = s.phase;
    const next = this.#advance(false);
    this.#preparePhase(next);
    if (wasRunning) this.start();
    else this.#commit();
    return { skipped, next };
  }

  /** Vuelve al inicio del ciclo: concentración 1. */
  restartCycle() {
    const keep = this.#state.lastCompletedRunId;
    this.#state = { ...createInitialState(this.#settings()), lastCompletedRunId: keep };
    this.#commit();
  }

  /**
   * Aplica nuevas duraciones. Solo afectan a la fase actual si todavía no se
   * ha empezado; si está en curso o en pausa, conserva su duración y los
   * cambios se aplican desde la siguiente fase (sin reinicios inesperados).
   */
  applySettings() {
    if (this.#state.status !== 'idle') return false;
    this.#preparePhase(this.#state.phase);
    this.#commit();
    return true;
  }

  /** Decide qué hacer con una concentración que terminó sin la app activa. */
  resolveExpired(countIt) {
    if (this.#state.status !== 'expired') return;
    if (countIt) {
      this.#completePhase({ late: true });
    } else {
      this.#preparePhase('focus');
      this.#commit();
    }
  }

  /** Sustituye el estado por uno cambiado en otra pestaña (sin volver a guardarlo). */
  adoptState(state) {
    this.#state = state;
  }

  /** Copia del estado actual (para guardarlo aparte, p. ej. al entrar en modo demostración). */
  exportState() {
    return structuredClone(this.#state);
  }

  /** Sustituye el estado y lo guarda (p. ej. al volver del modo demostración). */
  loadState(state) {
    this.#state = state;
    this.#commit();
  }

  /* ---------- Bucle ---------- */

  /** Se llama varias veces por segundo. Detecta el final de la fase. */
  tick() {
    const s = this.#state;
    if (s.status !== 'running') return;
    const now = this.#now();
    if (now < s.endsAt) return;

    const late = now - s.endsAt > LATE_COMPLETION_TOLERANCE_MS;
    if (late && s.phase === 'focus') {
      // No sabemos si el usuario estuvo concentrado: le preguntamos.
      s.status = 'expired';
      s.remainingMs = 0;
      this.#commit();
      this.#options.onExpired?.(this.getSnapshot(now));
      return;
    }
    this.#completePhase({ late });
  }

  /* ---------- Internos ---------- */

  #commit() {
    this.#options.onChange?.(this.#state);
  }

  #preparePhase(phase) {
    const durations = getPhaseDurations(this.#settings());
    Object.assign(this.#state, {
      phase,
      status: 'idle',
      durationMs: durations[phase],
      remainingMs: durations[phase],
      endsAt: null,
      startedAt: null,
      activeMs: 0,
      runningSince: null,
      runId: createRunId(),
      demo: this.#settings().demo,
    });
  }

  /**
   * Avanza UNA posición en la secuencia del ciclo y devuelve la fase siguiente.
   * Lo usan tanto los finales naturales (completed = true) como los saltos
   * (completed = false), así ambos recorren exactamente la misma secuencia:
   *   C1 → corto → C2 → corto → … → CN → largo → C1 (nuevo ciclo)
   * La única diferencia es el resultado que se apunta para ese hueco.
   */
  #advance(completed) {
    const s = this.#state;
    const total = this.#settings().sessionsPerCycle;
    // Si se redujo el número de sesiones a mitad de ciclo, ajustamos la posición.
    const index = Math.min(s.cycleIndex, total - 1);

    if (s.phase === 'focus') {
      const results = s.slotResults.slice(0, index);
      while (results.length < index) results.push('skipped');
      results.push(completed ? 'done' : 'skipped');
      s.slotResults = results;
      s.cycleIndex = index;
      return index >= total - 1 ? 'longBreak' : 'shortBreak';
    }
    if (s.phase === 'longBreak') {
      s.cycleIndex = 0;
      s.slotResults = [];
      return 'focus';
    }
    s.cycleIndex = Math.min(index + 1, total - 1);
    return 'focus';
  }

  #completePhase({ late }) {
    // Protección contra dobles registros: si otra pestaña ya cerró esta misma
    // fase (mismo runId), adoptamos su estado y no hacemos nada más.
    const stored = this.#options.readStoredState?.();
    if (stored && stored.lastCompletedRunId === this.#state.runId) {
      this.#state = stored;
      return;
    }
    if (this.#state.lastCompletedRunId === this.#state.runId) return;

    const s = this.#state;
    // Tiempo efectivo: lo acumulado en tramos anteriores + el último tramo hasta el fin.
    // Como la cuenta atrás nunca avanza en pausa, coincide con la duración de la fase.
    const lastStretch = s.runningSince !== null ? Math.max(0, s.endsAt - s.runningSince) : 0;
    const record = {
      runId: s.runId,
      phase: s.phase,
      durationMs: s.durationMs,
      focusMs: Math.min(s.durationMs, s.activeMs + lastStretch),
      startedAt: s.startedAt,
      endedAt: s.endsAt, // momento real de fin, no el momento en que lo detectamos
      demo: s.demo,
    };
    s.lastCompletedRunId = s.runId;

    const next = this.#advance(true);
    this.#preparePhase(next);

    // El inicio automático solo se aplica si la fase terminó con la app abierta.
    const settings = this.#settings();
    const wantsAuto = next === 'focus' ? settings.autoStartFocus : settings.autoStartBreaks;
    const autoStarted = !late && wantsAuto;
    if (autoStarted) this.start();
    else this.#commit();

    this.#options.onPhaseComplete?.(record, { nextPhase: next, autoStarted, late });
  }
}
