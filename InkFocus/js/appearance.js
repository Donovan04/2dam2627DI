/**
 * appearance.js
 * Aplica tema, pareja de tintas y movimiento mediante atributos en <html>:
 *   data-theme  = "dark" | "light"   (si el ajuste es «Sistema», se resuelve aquí)
 *   data-ink    = clave de la pareja de tintas
 *   data-motion = "reduce" | "full"  (reduce si lo pide el sistema O los ajustes)
 * Todo el CSS depende de estos atributos; no se toca nada más.
 *
 * Un pequeño script en <head> (index.html) aplica lo mismo antes de pintar la
 * página para evitar un destello del tema equivocado al cargar.
 */
const media = {
  light: window.matchMedia('(prefers-color-scheme: light)'),
  motion: window.matchMedia('(prefers-reduced-motion: reduce)'),
};

export function resolveTheme(theme) {
  if (theme === 'system') return media.light.matches ? 'light' : 'dark';
  return theme === 'light' ? 'light' : 'dark';
}

export function applyAppearance(settings) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(settings.theme);
  root.dataset.ink = settings.inkPair;
  root.dataset.motion = settings.reduceMotion || media.motion.matches ? 'reduce' : 'full';

  // Color de la barra del navegador en móvil, acorde con el fondo del tema.
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

/** Si cambia la preferencia del sistema (tema o movimiento), se vuelve a aplicar. */
export function watchSystemPreferences(getSettings) {
  const reapply = () => applyAppearance(getSettings());
  media.light.addEventListener('change', reapply);
  media.motion.addEventListener('change', reapply);
}

/** ¿Hay que evitar animaciones? (sistema o ajustes) */
export function motionReduced() {
  return document.documentElement.dataset.motion === 'reduce';
}
