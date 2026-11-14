export interface AudioParamLike {
  setValueAtTime: (value: number, startTime: number) => void;
  exponentialRampToValueAtTime: (value: number, endTime: number) => void;
  linearRampToValueAtTime: (value: number, endTime: number) => void;
}

export interface OscillatorNodeLike {
  type: OscillatorType;
  frequency: AudioParamLike;
  connect: (destination: unknown) => void;
  start: (when?: number) => void;
  stop: (when?: number) => void;
}

export interface GainNodeLike {
  gain: AudioParamLike;
  connect: (destination: unknown) => void;
}

export interface AudioContextLike {
  currentTime: number;
  state?: AudioContextState | string;
  destination: unknown;
  resume?: () => Promise<void>;
  createOscillator: () => OscillatorNodeLike;
  createGain: () => GainNodeLike;
}

export interface ChimeNote {
  freq: number;
  delay: number;
  duration: number;
  peakGain: number;
  type: OscillatorType;
}

/**
 * Warm, crisp 4-note major arpeggio (C5 -> E5 -> G5 -> C6)
 * for transaction confirmation feedback without external audio files.
 */
export const SUCCESS_CHIME_NOTES: readonly ChimeNote[] = [
  { freq: 523.25, delay: 0, duration: 0.16, peakGain: 0.14, type: 'sine' },
  { freq: 659.25, delay: 0.08, duration: 0.18, peakGain: 0.14, type: 'sine' },
  { freq: 783.99, delay: 0.16, duration: 0.22, peakGain: 0.14, type: 'sine' },
  { freq: 1046.5, delay: 0.24, duration: 0.36, peakGain: 0.16, type: 'triangle' },
];

let sharedAudioContext: AudioContextLike | null = null;

function getAudioContextConstructor(): (new () => AudioContextLike) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    AudioContext?: new () => AudioContextLike;
    webkitAudioContext?: new () => AudioContextLike;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

/**
 * Creates or resumes the shared Web Audio context during a user gesture
 * so playback succeeds even after async network latency.
 */
export function unlockAudioContext(): AudioContextLike | null {
  try {
    const AudioCtx = getAudioContextConstructor();
    if (!AudioCtx) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioCtx();
    }

    if (sharedAudioContext.state === 'suspended' && typeof sharedAudioContext.resume === 'function') {
      void sharedAudioContext.resume().catch(() => {});
    }

    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function playTransactionSuccessSound(providedContext?: AudioContextLike | null): boolean {
  try {
    const ctx = providedContext ?? unlockAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      void ctx.resume().catch(() => {});
    }

    const baseTime = ctx.currentTime;

    for (const note of SUCCESS_CHIME_NOTES) {
      const startTime = baseTime + note.delay;
      const attackEnd = startTime + 0.015;
      const endTime = startTime + note.duration;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(note.peakGain, attackEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(endTime + 0.02);
    }

    return true;
  } catch {
    return false;
  }
}
