/**
 * splash.js
 * Transición breve de tinta al terminar una fase.
 * Es decorativa (aria-hidden) y no bloquea clics: el anuncio accesible lo
 * hace announcer.js. Con movimiento reducido, el CSS la convierte en un fundido.
 */
const VISIBLE_MS = 1600;
let hideTimeout;

export function playPhaseSplash({ phase, title, subtitle }) {
  const splash = document.getElementById('splash');
  if (!splash) return;

  splash.dataset.phase = phase;
  splash.querySelector('[data-splash-title]').textContent = title;
  splash.querySelector('[data-splash-subtitle]').textContent = subtitle;

  splash.hidden = false;
  // Reiniciar la animación si ya se estaba reproduciendo.
  splash.classList.remove('is-playing');
  void splash.offsetWidth;
  splash.classList.add('is-playing');

  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    splash.classList.remove('is-playing');
    splash.hidden = true;
  }, VISIBLE_MS);
}
