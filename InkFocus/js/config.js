/**
 * config.js
 * Constantes de la aplicación: fases, valores por defecto, límites y claves de guardado.
 * Centralizarlas aquí evita "números mágicos" repartidos por el código.
 */

/** Claves de localStorage. El sufijo .v1 permite migrar el formato en el futuro. */
export const STORAGE_KEYS = {
  settings: 'inkfocus.settings.v1',
  timer: 'inkfocus.timer.v1',
  tasks: 'inkfocus.tasks.v1',
  sessions: 'inkfocus.sessions.v1',
  badges: 'inkfocus.badges.v1',
  // Copia del temporizador REAL mientras se usa el modo demostración
  timerBackup: 'inkfocus.timer-real.v1',
};

/** Versión del formato de exportación JSON (sube si cambia la estructura). */
export const EXPORT_FORMAT = 1;

/** Identificadores de fase y sus textos visibles. */
export const PHASES = {
  focus: { id: 'focus', label: 'Concentración', kind: 'focus' },
  shortBreak: { id: 'shortBreak', label: 'Descanso corto', kind: 'break' },
  longBreak: { id: 'longBreak', label: 'Descanso largo', kind: 'break' },
};

export const PHASE_IDS = Object.keys(PHASES);

/** Ajustes iniciales (técnica Pomodoro clásica). */
export const DEFAULT_SETTINGS = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  sessionsPerCycle: 4,
  // Objetivo diario: sesiones de concentración completadas (independiente del territorio).
  dailyGoal: 6,
  autoStartBreaks: false,
  autoStartFocus: false,
  demo: false,
  // Personalización y utilidades (v5)
  theme: 'dark', // 'system' | 'dark' | 'light'
  inkPair: 'lima-violeta',
  reduceMotion: false, // además de la preferencia del sistema
  soundMuted: false,
  volume: 60, // 0-100
  notifications: false,
  shortcuts: true, // atajos de una tecla (se pueden desactivar para lectores de pantalla)
  celebrations: true, // celebraciones breves del objetivo diario y las insignias
};

/** Temas disponibles. «system» sigue la preferencia del sistema operativo. */
export const THEMES = ['system', 'dark', 'light'];

/**
 * Parejas de tintas. Los colores reales (y sus variantes de contraste) están en
 * css/tokens.css; aquí solo el nombre visible y las muestras para Ajustes.
 */
export const INK_PAIRS = {
  'lima-violeta': { name: 'Lima y violeta', hint: 'Original', a: '#c4f53a', b: '#7b47f5' },
  'naranja-azul': { name: 'Naranja y azul', hint: '', a: '#ff8a1f', b: '#1a5fe0' },
  'turquesa-rosa': { name: 'Turquesa y rosa', hint: '', a: '#2ee6c5', b: '#c8106f' },
  'menta-coral': { name: 'Menta y coral', hint: '', a: '#5ff0a8', b: '#c73a2e' },
};

/** Límites [mínimo, máximo] de los campos numéricos de ajustes. */
export const LIMITS = {
  focusMin: [1, 180],
  shortMin: [1, 60],
  longMin: [1, 90],
  sessionsPerCycle: [2, 12],
  dailyGoal: [1, 24],
};

/** Presets rápidos. Solo rellenan el formulario; se guardan al pulsar «Guardar». */
export const PRESETS = {
  classic: { focusMin: 25, shortMin: 5, longMin: 15 },
  long: { focusMin: 50, shortMin: 10, longMin: 30 },
};

/** Duraciones del modo demostración (en milisegundos). */
export const DEMO_DURATIONS_MS = {
  focus: 10_000,
  shortBreak: 5_000,
  longBreak: 8_000,
};

/**
 * Margen para considerar que una fase terminó "con la app abierta".
 * Los navegadores ralentizan los temporizadores de pestañas en segundo plano
 * (hasta 1 vez por minuto), así que 3 minutos cubren ese retraso.
 * Si una concentración se detecta terminada más tarde (app cerrada, equipo
 * suspendido...), no se cuenta automáticamente: se pregunta al usuario.
 */
export const LATE_COMPLETION_TOLERANCE_MS = 3 * 60 * 1000;

/** Frecuencia de refresco de la interfaz. El tiempo NO se calcula sumando ticks. */
export const TICK_MS = 250;
