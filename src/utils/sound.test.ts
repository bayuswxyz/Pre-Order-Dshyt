import test from 'node:test';
import assert from 'node:assert/strict';
import {
  playTransactionSuccessSound,
  SUCCESS_CHIME_NOTES,
  type AudioContextLike,
  type GainNodeLike,
  type OscillatorNodeLike,
} from './sound';

test('playTransactionSuccessSound schedules all chime notes cleanly', () => {
  const started: Array<{ freq: number; type: OscillatorType; start: number; stop: number }> = [];
  let resumed = false;

  const mockCtx: AudioContextLike = {
    currentTime: 10,
    state: 'suspended',
    destination: {},
    resume: async () => {
      resumed = true;
    },
    createOscillator: (): OscillatorNodeLike => {
      const record = { freq: 0, type: 'sine' as OscillatorType, start: 0, stop: 0 };
      return {
        get type() {
          return record.type;
        },
        set type(value: OscillatorType) {
          record.type = value;
        },
        frequency: {
          setValueAtTime: (val) => {
            record.freq = val;
          },
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {},
        },
        connect: () => {},
        start: (when = 0) => {
          record.start = when;
          started.push(record);
        },
        stop: (when = 0) => {
          record.stop = when;
        },
      };
    },
    createGain: (): GainNodeLike => ({
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
    }),
  };

  const result = playTransactionSuccessSound(mockCtx);
  assert.equal(result, true);
  assert.equal(resumed, true);
  assert.equal(started.length, SUCCESS_CHIME_NOTES.length);
  assert.equal(started[0].freq, 523.25);
  assert.equal(started[0].start, 10);
  assert.equal(started[3].freq, 1046.5);
  assert.ok(started[3].stop > started[3].start);
});

test('playTransactionSuccessSound returns false safely when Web Audio is unavailable', () => {
  assert.equal(playTransactionSuccessSound(null), false);
});
