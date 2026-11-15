/**
 * settings.js
 * Validación y saneado de los ajustes (temporizador, objetivo, apariencia,
 * sonido, notificaciones y atajos). Todo se guarda en un único objeto.
 */
import { DEFAULT_SETTINGS, LIMITS, DEMO_DURATIONS_MS, THEMES, INK_PAIRS } from './config.js';

export const BOOLEAN_KEYS = [
  'autoStartBreaks',
  'autoStartFocus',
  'demo',
  'reduceMotion',
  'soundMuted',
  'notifications',
  'shortcuts',
  'celebrations',
];

/** Campos de opción cerrada: solo se aceptan los valores de la lista. */
export const CHOICE_KEYS = {
  theme: THEMES,
  inkPair: Object.keys(INK_PAIRS),
};

const VOLUME_RANGE = [0, 100];

/**
 * Devuelve siempre un objeto de ajustes válido.
 * Cada campo incorrecto o ausente se sustituye por su valor por defecto,
 * así unos datos guardados dañados (o de una versión anterior, sin los campos
 * nuevos) nunca dejan la app inutilizable.
 */
export function sanitizeSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const settings = { ...DEFAULT_SETTINGS };

  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const value = source[key];
    if (Number.isInteger(value) && value >= min && value <= max) settings[key] = value;
  }
  for (const key of BOOLEAN_KEYS) {
    if (typeof source[key] === 'boolean') settings[key] = source[key];
  }
  for (const [key, options] of Object.entries(CHOICE_KEYS)) {
    if (options.includes(source[key])) settings[key] = source[key];
  }
  const [minVolume, maxVolume] = VOLUME_RANGE;
  if (Number.isInteger(source.volume) && source.volume >= minVolume && source.volume <= maxVolume) {
    settings.volume = source.volume;
  }
  return settings;
}

/**
 * Valida los valores que llegan del formulario.
 * @returns {{ values: object, errors: Record<string,string> }}
 */
export function validateSettingsInput(input) {
  const errors = {};
  const values = {};

  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const text = String(input[key] ?? '').trim();
    const number = Number(text);
    if (text === '') {
      errors[key] = 'Escribe un número.';
    } else if (!Number.isInteger(number)) {
      errors[key] = 'Usa un número entero, sin decimales.';
    } else if (number < min || number > max) {
      errors[key] = `Elige un valor entre ${min} y ${max}.`;
    } else {
      values[key] = number;
    }
  }
  for (const key of BOOLEAN_KEYS) values[key] = Boolean(input[key]);
  for (const [key, options] of Object.entries(CHOICE_KEYS)) {
    values[key] = options.includes(input[key]) ? input[key] : DEFAULT_SETTINGS[key];
  }
  const volume = Number.parseInt(input.volume, 10);
  values.volume = Number.isInteger(volume) ? Math.min(VOLUME_RANGE[1], Math.max(VOLUME_RANGE[0], volume)) : DEFAULT_SETTINGS.volume;

  return { values, errors };
}

/** Duración en milisegundos de cada fase según los ajustes (o el modo demo). */
export function getPhaseDurations(settings) {
  if (settings.demo) return { ...DEMO_DURATIONS_MS };
  return {
    focus: settings.focusMin * 60_000,
    shortBreak: settings.shortMin * 60_000,
    longBreak: settings.longMin * 60_000,
  };
}
