import test from 'node:test';
import assert from 'node:assert/strict';
import { QLearner } from '../src/brain/qlearning.js';

test('Q-learning aprende a elegir la palanca con más recompensa', () => {
  const q = new QLearner({ actions: ['a', 'b', 'c'], epsilon: 1.0, minEpsilon: 0.02, alpha: 0.3, gamma: 0.0, decay: 0.995 });
  const rewards = { 0: 0.1, 1: 1.0, 2: -0.5 };
  const k = 's';
  for (let i = 0; i < 2000; i++) {
    const a = q.act(k);
    q.learn(k, a, rewards[a], k);
  }
  assert.equal(q.bestIndex(k), 1, 'debería preferir la acción "b"');
  assert.ok(q.epsilon < 0.2, 'epsilon debe decaer');
});

test('la clave de estado discretiza correctamente', () => {
  const q = new QLearner({ bins: 3 });
  assert.equal(q.key([0, 0.5, 0.99]), '012');
  assert.equal(q.key([1.5, -1, 0.5]), '201'); // saturado a [0..1]
});

test('serialización conserva la tabla Q', () => {
  const q = new QLearner({ actions: ['x', 'y'] });
  q.learn('s', 1, 2, 's');
  const c = QLearner.fromJSON(JSON.parse(JSON.stringify(q.toJSON())));
  assert.deepEqual(Array.from(c.values('s')), Array.from(q.values('s')));
  assert.deepEqual(c.actions, ['x', 'y']);
});
