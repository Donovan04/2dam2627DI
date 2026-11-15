/**
 * html.js
 * Escapa texto del usuario antes de insertarlo con innerHTML.
 * Sin esto, un título como "<img onerror=...>" se ejecutaría como HTML.
 */
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

/**
 * ¿Hay que reducir el movimiento? Lo decide appearance.js (preferencia del
 * sistema o «Reducir animaciones» en Ajustes) y lo deja en <html data-motion>.
 */
export function prefersReducedMotion() {
  const motion = document.documentElement.dataset.motion;
  if (motion) return motion === 'reduce';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
