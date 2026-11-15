/**
 * focus-mode.js
 * Modo concentración: oculta temporalmente lo secundario (pestañas, territorio,
 * objetivo, ciclo, pie) y deja el tanque, el tiempo, la fase, la posición en el
 * ciclo, la tarea activa y los controles principales.
 *
 * Es solo una clase en <body>: no toca el temporizador, así que la sesión
 * sigue exactamente igual al entrar o salir. No se guarda entre recargas.
 *
 * Pantalla completa es una opción aparte (botón propio) y se sale de ella con
 * el mismo botón o con Escape, como en cualquier web.
 */
import { announce } from './announcer.js';

/**
 * @param {object} options
 * @param {() => void} options.beforeEnter  p. ej., volver a la vista Concentración
 */
export function createFocusMode({ beforeEnter } = {}) {
  const button = document.getElementById('btn-focus-mode');
  const label = button.querySelector('[data-label]');
  const fullscreenButton = document.getElementById('btn-fullscreen');
  const fullscreenLabel = fullscreenButton.querySelector('[data-label]');
  const fullscreenSupported = Boolean(document.documentElement.requestFullscreen) && document.fullscreenEnabled !== false;
  let active = false;

  function set(on) {
    if (on === active) return;
    if (on) beforeEnter?.();
    active = on;
    document.body.toggleAttribute('data-focus-mode', on);
    button.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Salir del modo concentración' : 'Modo concentración';
    fullscreenButton.hidden = !on || !fullscreenSupported;
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    announce(on
      ? 'Modo concentración activado. Pulsa Escape o el botón «Salir del modo concentración» para volver.'
      : 'Modo concentración desactivado.');
  }

  button.addEventListener('click', () => set(!active));

  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      announce('El navegador no ha permitido la pantalla completa.');
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const isFull = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute('aria-pressed', String(isFull));
    fullscreenLabel.textContent = isFull ? 'Salir de pantalla completa' : 'Pantalla completa';
  });

  return {
    toggle: () => set(!active),
    exit: () => set(false),
    isActive: () => active,
  };
}
