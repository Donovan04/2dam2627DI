/**
 * sound.js
 * Avisos sonoros ORIGINALES generados con Web Audio (sin archivos de audio).
 *
 *  - Fin de concentración: un «splash» de tinta y dos gotas que bajan (relax).
 *  - Fin de descanso: tres gotas que suben (vuelta a la concentración).
 *
 * Restricciones del navegador: el audio solo puede empezar tras una interacción
 * del usuario. Por eso el contexto de audio se crea/reanuda en el primer clic o
 * tecla (unlockAudioOnFirstGesture). Si aun así el navegador lo bloquea (por
 * ejemplo, al recargar con una fase en marcha y sin tocar la página), el sonido
 * se omite: los avisos visuales y anunciados siguen funcionando.
 */
let context = null;

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

export const audioSupported = Boolean(AudioContextClass);

function getContext() {
  if (!AudioContextClass) return null;
  if (!context) context = new AudioContextClass();
  return context;
}

/** Prepara el audio en la primera interacción (clic, toque o tecla). */
export function unlockAudioOnFirstGesture() {
  const unlock = () => {
    const ctx = getContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
}

/** Gota: un tono que se desliza de una frecuencia a otra con caída rápida. */
function drop(ctx, output, start, fromHz, toHz, duration = 0.22, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, start);
  osc.frequency.exponentialRampToValueAtTime(toHz, start + duration * 0.8);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(1, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(output);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** «Splash»: ruido filtrado que barre de agudo a grave. */
function splash(ctx, output, start, duration = 0.28) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(2200, start);
  filter.frequency.exponentialRampToValueAtTime(350, start + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.7, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  noise.connect(filter).connect(gain).connect(output);
  noise.start(start);
  noise.stop(start + duration);
}

/**
 * Reproduce un aviso.
 * @param {'focusEnd'|'breakEnd'} kind
 * @param {{ volume: number, muted: boolean }} options  volumen 0-100
 * @returns {Promise<'played'|'muted'|'unsupported'|'blocked'>}
 */
export async function playSound(kind, { volume, muted }) {
  if (muted || volume <= 0) return 'muted';
  const ctx = getContext();
  if (!ctx) return 'unsupported';
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return 'blocked';
    }
    if (ctx.state !== 'running') return 'blocked';
  }

  const master = ctx.createGain();
  // Curva suave: el 100 % no llega a saturar; el 10 % sigue siendo audible.
  master.gain.value = Math.pow(volume / 100, 1.6) * 0.45;
  master.connect(ctx.destination);
  const t = ctx.currentTime + 0.03;

  if (kind === 'focusEnd') {
    splash(ctx, master, t);
    drop(ctx, master, t + 0.12, 880, 520, 0.24, 'triangle');
    drop(ctx, master, t + 0.34, 660, 392, 0.3, 'triangle');
  } else {
    drop(ctx, master, t, 392, 523, 0.18);
    drop(ctx, master, t + 0.15, 523, 659, 0.18);
    drop(ctx, master, t + 0.3, 659, 988, 0.3);
  }
  return 'played';
}
