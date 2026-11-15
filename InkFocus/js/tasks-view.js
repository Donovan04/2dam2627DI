/**
 * tasks-view.js
 * Panel de tareas: lista, búsqueda, filtros y estados vacíos.
 *
 * La lista se vuelve a pintar entera cuando cambian los datos. Para no perder
 * el foco del teclado, cada control lleva data-focus-key ("idTarea:acción") y
 * tras pintar se devuelve el foco al control equivalente.
 */
import { compareTasks, compareForTerritory, normalizeText } from './tasks-model.js';
import { todayKey } from './dates.js';
import { escapeHTML, prefersReducedMotion } from './html.js';
import { taskCardHTML, renderTaskList, bindTaskList, focusCard } from './task-card.js';

const NO_CATEGORY = '__none__';

/**
 * @param {object} deps
 * @param {object} deps.store      tasks-store
 * @param {() => Map} deps.getCounts  pomodoros completados por tarea
 * @param {object} deps.handlers   onToggle, onActivate, onDeactivate, onEdit, onDelete, onZone, onNew
 */
export function createTasksView({ store, getCounts, handlers, fallbackFocus }) {
  const $ = (selector) => document.querySelector(selector);
  const el = {
    dialog: $('#tasks-dialog'),
    closeButton: $('[data-close-tasks]'),
    panel: $('#tasks-panel'),
    heading: $('#tasks-heading'),
    newButton: $('#btn-new-task'),
    search: $('#task-search'),
    scope: $('#task-scope'),
    category: $('#task-category-filter'),
    statusInputs: document.querySelectorAll('input[name="task-status"]'),
    count: $('#tasks-count'),
    list: $('#task-list'),
    empty: $('#tasks-empty'),
  };

  const filters = { query: '', scope: 'today', status: 'all', category: '' };
  let lastCategoriesKey = '';
  let lastCountText = '';

  /* ---------- Filtros ---------- */

  function hasActiveFilters() {
    return Boolean(filters.query.trim()) || filters.status !== 'all' || filters.category !== '';
  }

  function tasksInScope(today) {
    const all = store.getAll();
    return filters.scope === 'today' ? all.filter((task) => task.date === today) : all;
  }

  function matchesFilters(task) {
    if (filters.status === 'pending' && task.completed) return false;
    if (filters.status === 'done' && !task.completed) return false;
    if (filters.category === NO_CATEGORY && task.category) return false;
    if (filters.category && filters.category !== NO_CATEGORY && task.category !== filters.category) return false;
    const query = normalizeText(filters.query.trim());
    if (query) {
      const haystack = normalizeText(`${task.title} ${task.notes} ${task.category}`);
      if (!haystack.includes(query)) return false;
    }
    return true;
  }

  function renderCategoryOptions() {
    const categories = store.getCategories();
    const key = categories.join('|');
    if (key === lastCategoriesKey) return;
    lastCategoriesKey = key;
    // Si la categoría filtrada ya no existe, volvemos a «Todas».
    if (filters.category && filters.category !== NO_CATEGORY && !categories.includes(filters.category)) {
      filters.category = '';
    }
    el.category.innerHTML = [
      '<option value="">Todas</option>',
      ...categories.map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`),
      `<option value="${NO_CATEGORY}">Sin categoría</option>`,
    ].join('');
    el.category.value = filters.category;
  }

  /* ---------- Estados vacíos ---------- */

  function renderEmpty(total) {
    if (total === 0) {
      const today = filters.scope === 'today';
      el.empty.innerHTML = `
        <svg class="empty__art" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><use href="#splat-shape"/></svg>
        <p class="empty__title">${today ? 'Hoy aún no hay tareas' : 'Todavía no has creado tareas'}</p>
        <p class="empty__text">Cada tarea de hoy se convierte en una zona de tu territorio. Complétala para pintarla.</p>
        <button type="button" class="btn btn--solid btn--small" data-empty-action="new">Crear tarea para hoy</button>`;
    } else {
      el.empty.innerHTML = `
        <p class="empty__title">Ninguna tarea coincide</p>
        <p class="empty__text">Prueba con otra búsqueda o quita los filtros.</p>
        <button type="button" class="btn btn--small" data-empty-action="clear">Limpiar filtros</button>`;
    }
  }

  /* ---------- Pintado ---------- */

  function render() {
    const today = todayKey();
    const counts = getCounts();
    const activeId = store.getActiveId();
    renderCategoryOptions();

    // Números de zona: mismo orden estable que usa el territorio.
    const zones = new Map(
      store
        .getForDate(today)
        .sort(compareForTerritory)
        .map((task, index) => [task.id, index + 1]),
    );

    const inScope = tasksInScope(today);
    const visible = inScope.filter(matchesFilters).sort(compareTasks);

    renderTaskList(
      el.list,
      visible
        .map((task) =>
          taskCardHTML(task, {
            count: counts.get(task.id) ?? 0,
            zone: zones.get(task.id),
            activeId,
            today,
            showDate: filters.scope === 'all' || task.date !== today,
            idPrefix: 'task',
          }),
        )
        .join(''),
    );
    el.list.hidden = visible.length === 0;
    el.empty.hidden = visible.length > 0;
    if (!visible.length) renderEmpty(inScope.length);

    const completed = inScope.filter((task) => task.completed).length;
    const scopeLabel = filters.scope === 'today' ? 'hoy' : 'en total';
    const countText = hasActiveFilters()
      ? `Mostrando ${visible.length} de ${inScope.length} ${inScope.length === 1 ? 'tarea' : 'tareas'} ${scopeLabel}`
      : `${inScope.length} ${inScope.length === 1 ? 'tarea' : 'tareas'} ${scopeLabel} · ${completed} ${completed === 1 ? 'completada' : 'completadas'}`;
    if (countText !== lastCountText) {
      el.count.textContent = countText;
      lastCountText = countText;
    }
  }

  /* ---------- Acciones públicas ---------- */

  function clearFilters() {
    filters.query = '';
    filters.status = 'all';
    filters.category = '';
    el.search.value = '';
    el.category.value = '';
    el.statusInputs.forEach((input) => { input.checked = input.value === 'all'; });
  }

  function setScope(scope) {
    filters.scope = scope;
    el.scope.value = scope;
    render();
  }

  /* ---------- Ventana de tareas ---------- */

  let opener = null;
  let closingByCode = false;

  const isOpen = () => el.dialog.open;

  function open() {
    if (isOpen()) return;
    opener = document.activeElement;
    render();
    el.dialog.showModal();
    el.dialog.scrollTop = 0;
  }

  /** Devuelve el foco al botón que abrió la ventana; si ya no existe (p. ej.
   *  «Elegir tarea» desaparece al activar una), usa el foco de respaldo. */
  function restoreOpener() {
    if (opener && opener.isConnected) opener.focus();
    else fallbackFocus?.();
  }

  /** Cierra la ventana. Por defecto devuelve el foco al botón que la abrió. */
  function close({ restoreFocus = true } = {}) {
    if (!isOpen()) return;
    closingByCode = true;
    el.dialog.close();
    if (restoreFocus) restoreOpener();
  }

  // Cierre con Escape: el navegador cierra el diálogo; devolvemos el foco.
  el.dialog.addEventListener('close', () => {
    if (closingByCode) {
      closingByCode = false;
      return;
    }
    restoreOpener();
  });
  el.closeButton.addEventListener('click', () => close());

  /**
   * Abre la ventana para gestionar tareas, con el foco en el título.
   * Muestra todas (pendientes y completadas) para que las completadas sigan
   * siendo fáciles de consultar o reabrir.
   */
  function openManage() {
    clearFilters();
    open();
    render();
    el.heading.focus();
  }

  /** Muestra una tarea en la lista (quitando filtros si hace falta) y le da el foco. */
  function focusTask(id, key = null) {
    const task = store.getById(id);
    if (!task) return;
    open();
    if (!matchesFilters(task)) clearFilters();
    if (filters.scope === 'today' && task.date !== todayKey()) filters.scope = 'all';
    el.scope.value = filters.scope;
    render();

    const card = document.getElementById(`task-${id}`);
    if (card) focusCard(card, id, key, prefersReducedMotion());
  }

  /**
   * Abre la ventana para elegir tarea activa: muestra las pendientes (de hoy si
   * las hay; si no, de todas las fechas) y pone el foco en el primer «Activar».
   */
  function openForChoosing() {
    const pendingToday = store.getForDate(todayKey()).some((task) => !task.completed);
    clearFilters();
    filters.status = 'pending';
    el.statusInputs.forEach((input) => { input.checked = input.value === 'pending'; });
    filters.scope = pendingToday ? 'today' : 'all';
    el.scope.value = filters.scope;
    open();
    render();
    (el.list.querySelector('[data-action="activate"]') ?? el.heading).focus();
  }

  function focusPanel() {
    if (isOpen()) el.heading.focus();
  }

  /* ---------- Eventos ---------- */

  el.search.addEventListener('input', () => {
    filters.query = el.search.value;
    render();
  });
  el.scope.addEventListener('change', () => setScope(el.scope.value));
  el.category.addEventListener('change', () => {
    filters.category = el.category.value;
    render();
  });
  el.statusInputs.forEach((input) => {
    input.addEventListener('change', () => {
      filters.status = input.value;
      render();
    });
  });
  el.newButton.addEventListener('click', () => handlers.onNew());

  el.empty.addEventListener('click', (event) => {
    const action = event.target.closest('[data-empty-action]')?.dataset.emptyAction;
    if (action === 'new') handlers.onNew();
    if (action === 'clear') {
      clearFilters();
      render();
      el.search.focus();
    }
  });

  bindTaskList(el.list, handlers);

  return {
    render,
    focusTask,
    openForChoosing,
    openManage,
    close,
    isOpen,
    focusPanel,
    setScope,
    getScope: () => filters.scope,
  };
}
