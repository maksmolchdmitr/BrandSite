import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClipOrigin } from './modelTime.js';

test('shared glTF sampler times are shifted only once', () => {
  const times = new Float32Array([0.05, 2.05, 4.05]);
  const clip = {
    tracks: [{ times }, { times }, { times }],
    resetDuration() { this.duration = Math.max(...this.tracks.map((track) => track.times.at(-1))); },
  };
  normalizeClipOrigin(clip);
  assert.equal(times[0], 0);
  assert.ok(Math.abs(clip.duration - 4) < 1e-6);
});

test('clips already starting at zero keep their timing', () => {
  const times = new Float32Array([0, 1, 4]);
  normalizeClipOrigin({ tracks: [{ times }], resetDuration() {} });
  assert.deepEqual([...times], [0, 1, 4]);
});
