/**
 * goal-view.js
 * Panel «Objetivo de hoy»: sesiones de concentración COMPLETADAS hoy frente a la meta.
 *
 * - Es independiente del territorio (que mide tareas terminadas).
 * - Los datos salen del registro de sesiones: saltar, descansar, reiniciar o
 *   el modo demo no generan sesiones, así que nunca suman aquí.
 * - Cambiar la meta solo cambia cómo se representa; la actividad no se toca.
 * - Al alcanzarla se muestra una celebración breve; se puede seguir sumando.
 */
const MAX_DROPS = 12;
const CELEBRATION_MS = 2400;

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * @param {object} handlers  onEdit(): abre los ajustes en el campo del objetivo
 */
export function createGoalView({ onEdit }) {
  const $ = (id) => document.getElementById(id);
  const el = {
    panel: $('goal-panel'),
    count: $('goal-count'),
    progress: $('goal-progress'),
    status: $('goal-status'),
    minutes: $('goal-minutes'),
    edit: $('btn-goal-edit'),
  };
  let lastKey = '';
  let celebrationTimeout;

  el.edit.addEventListener('click', () => onEdit());

  function dropsHTML(done, goal) {
    // Con metas grandes, una barra continua es más legible que muchas gotas.
    if (goal > MAX_DROPS) {
      const percent = Math.min(100, (done / goal) * 100);
      return `<span class="goal__bar"><span class="goal__bar-fill" style="width:${percent}%"></span></span>`;
    }
    let html = '';
    for (let i = 0; i < goal; i += 1) html += `<i class="goal-drop${i < done ? ' goal-drop--done' : ''}"></i>`;
    const extra = done - goal;
    if (extra > 0) html += `<span class="goal__extra">+${extra}</span>`;
    return html;
  }

  /**
   * @param {object} data
   * @param {number} data.done     sesiones completadas hoy
   * @param {number} data.goal     meta diaria
   * @param {number} data.focusMs  tiempo de concentración de hoy
   */
  function render({ done, goal, focusMs }) {
    const key = `${done}|${goal}|${Math.round(focusMs / 60000)}`;
    if (key === lastKey) return;
    lastKey = key;

    const reached = done >= goal;
    el.panel.dataset.state = reached ? 'reached' : 'pending';
    el.count.innerHTML = `<strong>${done}</strong> de ${plural(goal, 'sesión', 'sesiones')}`;

    el.progress.setAttribute('aria-valuemax', String(goal));
    el.progress.setAttribute('aria-valuenow', String(Math.min(done, goal)));
    el.progress.setAttribute('aria-valuetext', `${done} de ${plural(goal, 'sesión', 'sesiones')} de concentración`);
    el.progress.innerHTML = dropsHTML(done, goal);

    let status;
    if (reached) {
      const extra = done - goal;
      status = extra > 0
        ? `¡Objetivo cumplido! Llevas ${plural(extra, 'sesión', 'sesiones')} de más; puedes seguir sumando.`
        : '¡Objetivo cumplido! Puedes seguir sumando sesiones si quieres.';
    } else if (done === 0) {
      status = 'Cada concentración completada suma una gota.';
    } else {
      status = `${plural(goal - done, 'sesión más', 'sesiones más')} para llegar a tu objetivo.`;
    }
    el.status.textContent = status;
    el.minutes.textContent = `${Math.round(focusMs / 60000)} min de concentración hoy`;
  }

  /** Celebración breve y discreta (sin movimiento si se prefiere movimiento reducido). */
  function celebrate() {
    el.panel.classList.remove('is-celebrating');
    void el.panel.offsetWidth;
    el.panel.classList.add('is-celebrating');
    clearTimeout(celebrationTimeout);
    celebrationTimeout = setTimeout(() => el.panel.classList.remove('is-celebrating'), CELEBRATION_MS);
  }

  return { render, celebrate };
}
