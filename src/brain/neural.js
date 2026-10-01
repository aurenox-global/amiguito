// Red neuronal pequeña (MLP) con activación tanh y entrenamiento por retropropagación.
// Sin dependencias: sirve igual en Node (tests) y en el navegador.
const rnd = (n) => (Math.random() * 2 - 1) * Math.sqrt(1 / Math.max(1, n));

export class NeuralNet {
  constructor(sizes) {
    if (!Array.isArray(sizes) || sizes.length < 2) throw new Error('NeuralNet: sizes inválido');
    this.sizes = sizes.slice();
    this.W = []; this.b = [];
    for (let l = 1; l < sizes.length; l++) {
      const nin = sizes[l - 1], nout = sizes[l];
      const w = new Float32Array(nin * nout);
      for (let i = 0; i < w.length; i++) w[i] = rnd(nin);
      this.W.push(w);
      this.b.push(new Float32Array(nout));
    }
    this._a = null;
  }

  forward(x) {
    const a = [Float32Array.from(x)];
    let cur = a[0];
    for (let l = 0; l < this.W.length; l++) {
      const nin = this.sizes[l], nout = this.sizes[l + 1];
      const W = this.W[l], b = this.b[l];
      const out = new Float32Array(nout);
      for (let j = 0; j < nout; j++) {
        let s = b[j];
        const base = j * nin;
        for (let i = 0; i < nin; i++) s += W[base + i] * cur[i];
        out[j] = Math.tanh(s);
      }
      a.push(out); cur = out;
    }
    this._a = a;
    return cur;
  }

  train(x, y, lr = 0.05) {
    const out = this.forward(x);
    const L = this.W.length;
    const deltas = new Array(L);
    let loss = 0;
    let d = new Float32Array(out.length);
    for (let j = 0; j < out.length; j++) {
      const err = (y[j] != null ? y[j] : 0) - out[j];
      loss += err * err;
      d[j] = err * (1 - out[j] * out[j]);
    }
    deltas[L - 1] = d;
    for (let l = L - 2; l >= 0; l--) {
      const nin = this.sizes[l + 1], nout = this.sizes[l + 2];
      const Wnext = this.W[l + 1];
      const dn = new Float32Array(nin);
      for (let i = 0; i < nin; i++) {
        let s = 0;
        for (let j = 0; j < nout; j++) s += Wnext[j * nin + i] * deltas[l + 1][j];
        const act = this._a[l + 1][i];
        dn[i] = s * (1 - act * act);
      }
      deltas[l] = dn;
    }
    for (let l = 0; l < L; l++) {
      const nin = this.sizes[l], nout = this.sizes[l + 1];
      const W = this.W[l], b = this.b[l], prev = this._a[l], dl = deltas[l];
      for (let j = 0; j < nout; j++) {
        const base = j * nin;
        for (let i = 0; i < nin; i++) W[base + i] += lr * dl[j] * prev[i];
        b[j] += lr * dl[j];
      }
    }
    return loss / out.length;
  }

  toJSON() {
    return { sizes: this.sizes, W: this.W.map((w) => Array.from(w)), b: this.b.map((v) => Array.from(v)) };
  }
  static fromJSON(j) {
    const n = new NeuralNet(j.sizes);
    n.W = j.W.map((w) => Float32Array.from(w));
    n.b = j.b.map((v) => Float32Array.from(v));
    return n;
  }
}
