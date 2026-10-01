// Sistema tipo Tamagotchi. Los valores van 0..1 y decaen con el tiempo REAL:
// si cierras la web, el amiguito sigue viviendo. "hunger" alto = tiene hambre.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export const RATES = { hunger: 0.10, energy: 0.075, happiness: 0.05, hygiene: 0.05, boredom: 0.14 };
export const MAX_OFFLINE_HOURS = 24 * 7; // una semana de vida como máximo estando fuera

export class Needs {
  constructor() {
    this.hunger = 0.30;
    this.energy = 0.72;
    this.happiness = 0.82;
    this.hygiene = 0.92;
    this.boredom = 0.20;
    this.health = 1.00;
    this.last = Date.now();
    this.ageHours = 0;
    this.asleep = false;
  }

  tick(now = Date.now()) {
    let hours = (now - this.last) / 3_600_000;
    this.last = now;
    if (!(hours > 0)) return 0;
    hours = Math.min(hours, MAX_OFFLINE_HOURS);
    this.ageHours += hours;

    if (!this.asleep) {
      this.hunger = clamp(this.hunger + hours * RATES.hunger);
      this.energy = clamp(this.energy - hours * RATES.energy);
      this.hygiene = clamp(this.hygiene - hours * RATES.hygiene);
      this.boredom = clamp(this.boredom + hours * RATES.boredom);
      const strain = (this.hunger + this.boredom + (1 - this.hygiene) + (1 - this.energy)) / 4;
      this.happiness = clamp(this.happiness - hours * RATES.happiness * (0.5 + strain));
    } else {
      // mientras duerme: recupera energía y se le pasa el hambre despacio
      this.energy = clamp(this.energy + hours * 0.14);
      this.hunger = clamp(this.hunger + hours * 0.03);
      this.boredom = clamp(this.boredom - hours * 0.02);
      this.happiness = clamp(this.happiness + hours * 0.02);
    }

    const bad = (this.hunger > 0.9 ? 1 : 0) + (this.energy < 0.1 ? 1 : 0) + (this.hygiene < 0.1 ? 1 : 0);
    if (bad > 0) this.health = clamp(this.health - hours * 0.15 * bad);
    else this.health = clamp(this.health + hours * 0.05);

    return hours;
  }

  feed() { this.hunger = clamp(this.hunger - 0.42); this.happiness = clamp(this.happiness + 0.06); this.hygiene = clamp(this.hygiene - 0.05); }
  play() { this.boredom = clamp(this.boredom - 0.5); this.happiness = clamp(this.happiness + 0.15); this.energy = clamp(this.energy - 0.07); this.hunger = clamp(this.hunger + 0.05); }
  rest(amount) { this.energy = clamp(this.energy + amount); this.boredom = clamp(this.boredom + amount * 0.15); }
  clean() { this.hygiene = clamp(this.hygiene + 0.6); this.happiness = clamp(this.happiness + 0.05); }
  teach(good) { this.happiness = clamp(this.happiness + (good ? 0.12 : -0.02)); this.boredom = clamp(this.boredom - (good ? 0.25 : 0.05)); }
  cuddle() { this.happiness = clamp(this.happiness + 0.05); this.boredom = clamp(this.boredom - 0.08); }

  mood() {
    const m = this.happiness * 0.5 + (1 - this.hunger) * 0.14 + this.energy * 0.14 +
      (1 - this.boredom) * 0.1 + this.hygiene * 0.06 + this.health * 0.06;
    return clamp(m);
  }

  // Vector 0..1 para el cerebro (hunger se invierte: "saciedad").
  features() { return [this.hunger, this.energy, this.happiness, this.boredom, this.hygiene]; }

  critical() { return this.hunger > 0.85 || this.energy < 0.15 || this.hygiene < 0.15 || this.health < 0.4; }

  toJSON() {
    return { hunger: this.hunger, energy: this.energy, happiness: this.happiness, hygiene: this.hygiene, boredom: this.boredom, health: this.health, last: this.last, ageHours: this.ageHours, asleep: this.asleep };
  }
  static fromJSON(j) {
    const n = new Needs();
    if (j) for (const k in j) if (j[k] !== undefined) n[k] = j[k];
    return n;
  }
}
