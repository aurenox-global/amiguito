import test from 'node:test';
import assert from 'node:assert/strict';
import { Needs, MAX_OFFLINE_HOURS } from '../src/needs.js';

test('el hambre crece y la energía baja con el tiempo', () => {
  const n = new Needs();
  const h0 = n.hunger, e0 = n.energy;
  n.last = Date.now() - 5 * 3_600_000; // 5 horas
  const h = n.tick();
  assert.ok(Math.abs(h - 5) < 0.1, 'deben pasar ~5 horas');
  assert.ok(n.hunger > h0, 'el hambre aumenta');
  assert.ok(n.energy < e0, 'la energía baja');
});

test('las necesidades se quedan dentro de 0..1 y el tiempo offline se acota', () => {
  const n = new Needs();
  n.last = Date.now() - 1000 * 3_600_000; // 1000 horas
  n.tick();
  for (const k of ['hunger', 'energy', 'happiness', 'hygiene', 'boredom', 'health']) {
    assert.ok(n[k] >= 0 && n[k] <= 1, `${k} fuera de rango: ${n[k]}`);
  }
  assert.ok(n.ageHours <= MAX_OFFLINE_HOURS + 0.001, 'no debe acumular más de una semana');
});

test('las acciones del usuario mejoran el bienestar', () => {
  const n = new Needs();
  n.hunger = 0.9; n.feed(); assert.ok(n.hunger < 0.6);
  n.boredom = 0.9; n.play(); assert.ok(n.boredom < 0.5);
  n.hygiene = 0.1; n.clean(); assert.ok(n.hygiene > 0.6);
  const m = n.mood();
  assert.ok(m > 0 && m <= 1);
});

test('dormir recupera energía', () => {
  const n = new Needs();
  n.energy = 0.2; n.asleep = true; n.last = Date.now() - 3 * 3_600_000;
  n.tick();
  assert.ok(n.energy > 0.2);
});
