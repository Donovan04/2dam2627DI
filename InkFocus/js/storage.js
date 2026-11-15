/**
 * storage.js
 * Lectura y escritura segura en localStorage.
 * Si el almacenamiento no está disponible (modo privado, cuota llena) o el
 * contenido está dañado, devolvemos null en lugar de romper la aplicación.
 */

export function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
