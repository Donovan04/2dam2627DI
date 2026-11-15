/**
 * views.js
 * Pestañas principales: «Concentración», «Calendario» y «Estadísticas» (patrón ARIA tabs).
 *
 * - Las flechas izquierda/derecha, Inicio y Fin cambian de pestaña.
 * - La vista se refleja en la dirección (#calendario, #estadisticas): recargar
 *   la conserva y los botones Atrás/Adelante del navegador funcionan.
 * - Cambiar de vista solo muestra u oculta paneles: el temporizador sigue
 *   funcionando igual en segundo plano.
 */
const VIEWS = {
  focus: { hash: '', tab: 'tab-focus', panel: 'view-focus' },
  calendar: { hash: '#calendario', tab: 'tab-calendar', panel: 'view-calendar' },
  stats: { hash: '#estadisticas', tab: 'tab-stats', panel: 'view-stats' },
};

function viewFromHash() {
  const match = Object.entries(VIEWS).find(([, v]) => v.hash && v.hash === location.hash);
  return match ? match[0] : 'focus';
}

/**
 * @param {object} options
 * @param {(view: string) => void} [options.onChange]
 */
export function initViews({ onChange } = {}) {
  const tabs = Object.fromEntries(Object.entries(VIEWS).map(([name, v]) => [name, document.getElementById(v.tab)]));
  const panels = Object.fromEntries(Object.entries(VIEWS).map(([name, v]) => [name, document.getElementById(v.panel)]));
  const order = Object.keys(VIEWS);
  let current = null;

  function show(view, { updateHash = true } = {}) {
    if (view === current) return;
    current = view;
    for (const name of order) {
      const selected = name === view;
      tabs[name].setAttribute('aria-selected', String(selected));
      tabs[name].tabIndex = selected ? 0 : -1;
      panels[name].hidden = !selected;
    }
    document.body.dataset.view = view;
    if (updateHash) {
      const target = VIEWS[view].hash || location.pathname + location.search;
      // pushState no hace saltar la página como cambiar location.hash.
      if ((location.hash || '') !== VIEWS[view].hash) history.pushState(null, '', target);
    }
    onChange?.(view);
  }

  order.forEach((name) => tabs[name].addEventListener('click', () => show(name)));

  tabs.focus.parentElement.addEventListener('keydown', (event) => {
    const index = order.indexOf(current);
    let next = null;
    if (event.key === 'ArrowRight') next = order[(index + 1) % order.length];
    else if (event.key === 'ArrowLeft') next = order[(index - 1 + order.length) % order.length];
    else if (event.key === 'Home') next = order[0];
    else if (event.key === 'End') next = order[order.length - 1];
    if (!next) return;
    event.preventDefault();
    show(next);
    tabs[next].focus();
  });

  window.addEventListener('popstate', () => show(viewFromHash(), { updateHash: false }));

  show(viewFromHash(), { updateHash: false });

  return {
    show,
    current: () => current,
    /** Texto pequeño junto a «Concentración» (p. ej. el tiempo restante). */
    setFocusStatus(text) {
      const status = tabs.focus.querySelector('[data-tab-status]');
      if (status.textContent !== text) status.textContent = text;
      status.hidden = !text;
    },
  };
}
