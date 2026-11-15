/**
 * format.js
 * Utilidades para mostrar tiempos en español.
 */

/** "MM:SS". Redondea hacia arriba para que al empezar se vea 25:00 y nunca 00:00 antes de tiempo. */
export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Versión hablada para lectores de pantalla: "24 minutos y 13 segundos". */
export function formatSpokenDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  if (seconds || !minutes) parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);
  return parts.join(' y ');
}

/** Duración corta para resúmenes: "25 min", "1 h 30 min", "15 s". */
export function formatShortDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });
const timeWithSecondsFormatter = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Hora del reloj local ("14:35"). Con segundos en modo demo, donde las fases duran segundos. */
export function formatClockTime(timestamp, withSeconds = false) {
  return (withSeconds ? timeWithSecondsFormatter : timeFormatter).format(new Date(timestamp));
}
