// Aprendizaje por refuerzo (Q-learning tabular con discretización de estado).
// El amiguito aprende qué acciones le sientan mejor en cada situación.
export class QLearner {
  constructor(opts = {}) {
    const o = Object.assign(
      { actions: ['rest', 'wander', 'selfplay', 'ponder', 'seek', 'groom'],
        alpha: 0.28, gamma: 0.85, epsilon: 0.25, minEpsilon: 0.03, decay: 0.9993, bins: 3 },
      opts);
    this.actions = o.actions;
    this.alpha = o.alpha; this.gamma = o.gamma;
    this.epsilon = o.epsilon; this.minEpsilon = o.minEpsilon; this.decay = o.decay;
    this.bins = o.bins;
    this.Q = new Map();
    this.updates = 0;
  }

  key(features) {
    let s = '';
    for (let i = 0; i < features.length; i++) {
      let v = features[i];
      if (!(v >= 0)) v = 0; if (v > 1) v = 1;
      s += Math.min(this.bins - 1, Math.floor(v * this.bins));
    }
    return s;
  }

  values(k) {
    let v = this.Q.get(k);
    if (!v) { v = new Float32Array(this.actions.length); this.Q.set(k, v); }
    return v;
  }

  bestIndex(k) {
    const q = this.values(k);
    let bi = 0;
    for (let i = 1; i < q.length; i++) if (q[i] > q[bi]) bi = i;
    return bi;
  }

  act(k, allowed) {
    const pool = (allowed && allowed.length) ? allowed : this.actions.map((_, i) => i);
    if (Math.random() < this.epsilon) return pool[(Math.random() * pool.length) | 0];
    const q = this.values(k);
    let bi = pool[0], bv = -Infinity;
    for (const i of pool) { if (q[i] > bv) { bv = q[i]; bi = i; } }
    return bi;
  }

  learn(k, a, reward, k2, allowed2) {
    const q = this.values(k);
    const q2 = this.values(k2);
    const pool = (allowed2 && allowed2.length) ? allowed2 : this.actions.map((_, i) => i);
    let bestNext = -Infinity;
    for (const i of pool) if (q2[i] > bestNext) bestNext = q2[i];
    const target = reward + this.gamma * bestNext;
    q[a] += this.alpha * (target - q[a]);
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.decay);
    this.updates++;
  }

  // Nivel de "experiencia" 0..1 para mostrar en la UI (según nº de estados/updates).
  confidence() {
    const states = this.Q.size;
    return Math.max(0, Math.min(1, (states / 40) * 0.5 + (this.updates / 200) * 0.5));
  }

  toJSON() {
    const o = {};
    for (const [k, v] of this.Q) o[k] = Array.from(v);
    return { actions: this.actions, epsilon: this.epsilon, updates: this.updates, Q: o };
  }
  static fromJSON(j) {
    const q = new QLearner({ actions: (j && j.actions) || undefined });
    if (!j) return q;
    q.epsilon = j.epsilon != null ? j.epsilon : q.epsilon;
    q.updates = j.updates || 0;
    for (const k in (j.Q || {})) q.Q.set(k, Float32Array.from(j.Q[k]));
    return q;
  }
}
