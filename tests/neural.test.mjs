import test from 'node:test';
import assert from 'node:assert/strict';
import { NeuralNet } from '../src/brain/neural.js';

test('la red aprende XOR (entrenamiento converge)', () => {
  const net = new NeuralNet([2, 6, 1]);
  const data = [[[0, 0], [-1]], [[0, 1], [1]], [[1, 0], [1]], [[1, 1], [-1]]];
  let loss = Infinity;
  for (let e = 0; e < 4000; e++) {
    loss = 0;
    for (const [x, y] of data) loss += net.train(x, y, 0.35);
    loss /= data.length;
  }
  assert.ok(loss < 0.05, `loss final ${loss} debería ser < 0.05`);
  assert.ok(net.forward([1, 0])[0] > 0.6);
  assert.ok(net.forward([0, 0])[0] < -0.6);
});

test('serializar y reconstruir conserva las salidas', () => {
  const net = new NeuralNet([3, 4, 2]);
  const before = Array.from(net.forward([0.2, -0.4, 0.9]));
  const clone = NeuralNet.fromJSON(JSON.parse(JSON.stringify(net.toJSON())));
  const after = Array.from(clone.forward([0.2, -0.4, 0.9]));
  for (let i = 0; i < before.length; i++) assert.ok(Math.abs(before[i] - after[i]) < 1e-6);
});
