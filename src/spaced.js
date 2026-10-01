// Repetición espaciada (algoritmo tipo SM-2) para el aprendizaje educativo.
export class SpacedRepetition {
  constructor() { this.cards = {}; }

  ensure(id) {
    if (!this.cards[id]) this.cards[id] = { ef: 2.5, interval: 0, reps: 0, lapses: 0, due: Date.now() };
    return this.cards[id];
  }

  grade(id, quality, now = Date.now()) {
    const c = this.ensure(id);
    const q = Math.max(0, Math.min(5, quality));
    if (q < 3) {
      c.reps = 0; c.interval = 0; c.lapses++;
      c.ef = Math.max(1.3, c.ef - 0.2);
      c.due = now + 10 * 60 * 1000;
    } else {
      c.reps++;
      c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      if (c.reps === 1) c.interval = 1;
      else if (c.reps === 2) c.interval = 6;
      else c.interval = Math.round(c.interval * c.ef);
      c.due = now + c.interval * 24 * 3_600_000;
    }
    c.lastQ = q;
    return c;
  }

  due(ids, now = Date.now()) {
    const list = ids && ids.length ? ids : Object.keys(this.cards);
    return list.filter((id) => !this.cards[id] || this.cards[id].due <= now);
  }

  mastery() {
    const ks = Object.keys(this.cards);
    if (!ks.length) return 0;
    let s = 0;
    for (const k of ks) s += Math.min(1, this.cards[k].reps / 5);
    return s / ks.length;
  }

  toJSON() { return this.cards; }
  static fromJSON(j) { const s = new SpacedRepetition(); if (j) s.cards = j; return s; }
}
