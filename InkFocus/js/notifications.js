/**
 * notifications.js
 * Notificaciones del navegador OPCIONALES al terminar una fase.
 *
 * - El permiso solo se pide cuando el usuario activa la opción (nunca al cargar).
 * - Si está denegado, no se vuelve a pedir: el navegador ya no lo permitiría y
 *   solo el usuario puede cambiarlo en la configuración del sitio.
 * - Solo se notifica si InkFocus NO está a la vista (otra pestaña, minimizada…):
 *   con la app delante ya están el aviso visual, el anuncio y el sonido.
 * - Limitación real: no hay servidor ni service worker, así que con la pestaña
 *   CERRADA no hay avisos. En segundo plano el navegador puede retrasar el
 *   temporizador hasta ~1 minuto.
 * - Requiere contexto seguro (https o localhost). En algunos móviles (Chrome
 *   para Android) las notificaciones de página no están disponibles sin service
 *   worker: se informa como «no disponible» o se omite sin errores.
 */
let lastNotifiedRunId = null;

/** @returns {'unsupported'|'insecure'|'default'|'granted'|'denied'} */
export function notificationState() {
  if (!('Notification' in window)) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  return Notification.permission;
}

export const STATE_TEXT = {
  unsupported: 'No disponible en este navegador. Seguirás viendo los avisos dentro de la app.',
  insecure: 'Solo funcionan en un contexto seguro (https o localhost). Seguirás viendo los avisos dentro de la app.',
  default: 'Permiso pendiente: al activar la opción, el navegador te preguntará.',
  granted: 'Permiso concedido.',
  denied: 'Permiso denegado en el navegador. No volveremos a pedirlo: si quieres usarlas, cámbialo en la configuración del sitio (icono junto a la dirección).',
};

/** Pide permiso solo si está pendiente. Devuelve el estado final. */
export async function requestNotificationPermission() {
  const state = notificationState();
  if (state !== 'default') return state;
  try {
    return await Notification.requestPermission();
  } catch {
    return notificationState();
  }
}

/**
 * Envía la notificación de fin de fase (una sola vez por fase).
 * @returns {boolean} true si se mostró
 */
export function notifyPhaseEnd({ runId, title, body }) {
  if (notificationState() !== 'granted') return false;
  if (runId && runId === lastNotifiedRunId) return false;
  // Con la app a la vista, ya hay avisos dentro de ella: no duplicamos.
  if (document.visibilityState === 'visible' && document.hasFocus()) return false;
  lastNotifiedRunId = runId;
  try {
    // tag: si hay varias pestañas abiertas, la notificación se sustituye en vez de repetirse.
    const notification = new Notification(title, { body, tag: 'inkfocus-fase', icon: 'assets/favicon.svg' });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
