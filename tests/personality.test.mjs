import test from 'node:test';
import assert from 'node:assert/strict';
import { Personality } from '../src/brain/personality.js';
import { Needs } from '../src/needs.js';

test('la personalidad tiene rasgos válidos y un temperamento', () => {
  const p = new Personality();
  for (const k in p.traits) assert.ok(p.traits[k] >= 0 && p.traits[k] <= 1);
  assert.ok(['explorer', 'cuddler', 'gourmet', 'dreamer'].includes(p.temperament));
});

test('nudge acota los rasgos y learn no rompe', () => {
  const p = new Personality();
  for (let i = 0; i < 100; i++) p.nudge('curiosity', 0.1);
  assert.ok(p.traits.curiosity <= 1);
  for (let i = 0; i < 200; i++) p.nudge('curiosity', -0.1);
  assert.ok(p.traits.curiosity >= 0);
  const n = new Needs();
  const loss = p.learn(n, n.mood());
  assert.ok(loss >= 0);
});

test('weight() modula según el rasgo', () => {
  const p = new Personality();
  p.traits.sociability = 1; p.traits.curiosity = 0;
  assert.ok(p.weight('seek') > p.weight('wander'));
});

test('serialización conserva rasgos y red', () => {
  const p = new Personality();
  p.nudge('playfulness', 0.2);
  const c = Personality.fromJSON(JSON.parse(JSON.stringify(p.toJSON())));
  assert.ok(Math.abs(c.traits.playfulness - p.traits.playfulness) < 1e-9);
  assert.deepEqual(c.net.sizes, p.net.sizes);
});
