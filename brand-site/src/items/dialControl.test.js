import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSpeed, pointerDialDelta, speedAfterTurn, wrappedAngleDelta } from './dialControl.js';

test('clockwise turns speed up and counterclockwise turns slow down', () => {
  assert.equal(speedAfterTurn(1, Math.PI), 2.5);
  assert.equal(speedAfterTurn(2.5, -Math.PI), 1);
  assert.equal(speedAfterTurn(0.1, -Math.PI), 0);
  assert.equal(speedAfterTurn(2.9, Math.PI), 3);
});

test('crossing the angle seam does not reverse the knob or jump a full turn', () => {
  assert.ok(Math.abs(wrappedAngleDelta(-Math.PI + 0.05, Math.PI - 0.05) - 0.1) < 1e-10);
  assert.ok(Math.abs(wrappedAngleDelta(Math.PI - 0.05, -Math.PI + 0.05) + 0.1) < 1e-10);
});

test('a grab near the dial centre uses stable directional movement', () => {
  const center = { x: 50, y: 50 };
  assert.ok(pointerDialDelta(center, { x: 60, y: 50 }, center, 'linear') > 0);
  assert.ok(pointerDialDelta(center, { x: 40, y: 50 }, center, 'linear') < 0);
  assert.equal(pointerDialDelta(center, center, center, 'angular'), 0);
});

test('an edge grab follows a clockwise quarter-turn', () => {
  assert.equal(pointerDialDelta({ x: 100, y: 50 }, { x: 50, y: 100 }, { x: 50, y: 50 }, 'angular'), Math.PI / 2);
});

test('invalid slider values cannot corrupt animation playback', () => {
  assert.equal(clampSpeed(NaN), 1);
  assert.equal(clampSpeed(Infinity), 1);
  assert.equal(clampSpeed(-4), 0);
  assert.equal(clampSpeed(7), 3);
});
