import test from 'node:test';
import assert from 'node:assert/strict';
import { SpacedRepetition } from '../src/spaced.js';

test('acertar aumenta el intervalo; fallar lo reinicia', () => {
  const sr = new SpacedRepetition();
  const c1 = sr.grade('a', 5);
  assert.equal(c1.reps, 1); assert.equal(c1.interval, 1);
  const c2 = sr.grade('a', 5);
  assert.equal(c2.reps, 2); assert.equal(c2.interval, 6);
  const c3 = sr.grade('a', 4);
  assert.ok(c3.interval > 6, 'el intervalo crece al acertar');
  const c4 = sr.grade('a', 0);
  assert.equal(c4.reps, 0); assert.equal(c4.interval, 0); assert.equal(c4.lapses, 1);
  assert.ok(c4.ef >= 1.3);
});

test('due() devuelve las tarjetas pendientes y mastery() sube', () => {
  const sr = new SpacedRepetition();
  sr.grade('x', 5); sr.grade('y', 5);
  const due = sr.due(['x', 'y', 'z']);
  assert.ok(due.includes('z'), 'una tarjeta nueva está pendiente');
  assert.ok(!due.includes('x'));
  assert.ok(sr.mastery() > 0);
});
