/**
 * announcer.js
 * Mensajes para lectores de pantalla mediante una región aria-live.
 * Solo anunciamos eventos (inicio, pausa, cambio de fase...), nunca cada segundo.
 */
let pendingTimeout;

export function announce(message) {
  const region = document.getElementById('announcer');
  if (!region) return;
  // Vaciar y volver a escribir garantiza que se anuncie aunque el texto se repita.
  region.textContent = '';
  clearTimeout(pendingTimeout);
  pendingTimeout = setTimeout(() => {
    region.textContent = message;
  }, 80);
}
