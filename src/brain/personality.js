// "Yo" del amiguito: rasgos de personalidad + una pequeña red que aprende a predecir
// cómo se siente (auto-modelo). Los rasgos derivan despacio según cómo lo cuidas.
import { NeuralNet } from './neural.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export class Personality {
  constructor() {
    this.traits = { curiosity: 0.62, energy: 0.58, sociability: 0.64, appetite: 0.55, playfulness: 0.6, tidiness: 0.5 };
    this.net = new NeuralNet([4, 6, 3]);
    this.feelings = 0;   // 0..1 ánimo percibido
    this.temperament = this._pick();
  }
  _pick() {
    const t = this.traits;
    const scores = {
      explorer: t.curiosity * 1.2 + t.playfulness,
      cuddler: t.sociability * 1.3 + t.playfulness * 0.6,
      gourmet: t.appetite * 1.3 + t.tidiness * 0.5,
      dreamer: (1 - t.energy) * 1.1 + t.curiosity * 0.6
    };
    return Object.keys(scores).reduce((a, b) => (scores[b] > scores[a] ? b : a));
  }

  features(needs) {
    return [needs.hunger, needs.energy, needs.happiness, needs.boredom];
  }

  // Auto-modelo: la red predice [ánimo, activación, apetito] a partir de las necesidades.
  predict(needs) {
    const out = this.net.forward(this.features(needs));
    this.feelings = clamp01((out[0] + 1) / 2);
    return out;
  }

  learn(needs, targetMood) {
    const target = [clamp01(targetMood) * 2 - 1, needs.energy * 2 - 1, needs.hunger * 2 - 1];
    return this.net.train(this.features(needs), target, 0.03);
  }

  nudge(trait, delta) {
    if (this.traits[trait] == null) return;
    this.traits[trait] = clamp01(this.traits[trait] + delta);
  }

  // Modula una recompensa según personalidad (el explorador disfruta deambulando, etc.).
  weight(action) {
    const t = this.traits;
    const w = {
      rest: 1 + (1 - t.energy) * 0.5,
      wander: 1 + t.curiosity * 0.6,
      selfplay: 1 + t.playfulness * 0.6,
      ponder: 1 + t.curiosity * 0.3,
      seek: 1 + t.sociability * 0.7,
      groom: 1 + t.tidiness * 0.6
    };
    return w[action] || 1;
  }

  toJSON() { return { traits: this.traits, net: this.net.toJSON(), temperament: this.temperament }; }
  static fromJSON(j) {
    const p = new Personality();
    if (!j) return p;
    if (j.traits) Object.assign(p.traits, j.traits);
    if (j.net) p.net = NeuralNet.fromJSON(j.net);
    if (j.temperament) p.temperament = j.temperament;
    return p;
  }
  get label() {
    const n = { explorer: 'explorador', cuddler: 'mimoso', gourmet: 'gourmet', dreamer: 'soñador' };
    const en = { explorer: 'explorer', cuddler: 'cuddler', gourmet: 'foodie', dreamer: 'dreamer' };
    return { es: n[this.temperament] || this.temperament, en: en[this.temperament] || this.temperament };
  }
}
