// Reproductor de la VOZ PROPIA: audios generados con Piper e incluidos en el sitio.
// Así el español suena a español (y el inglés a inglés) en CUALQUIER dispositivo,
// sin depender de las voces instaladas en el navegador. Si falta un audio o está
// desactivado, se usa la Web Speech API como reserva.
export class Sound {
  constructor() {
    this.lang = 'es';
    this.enabled = true;
    this.manifest = { es: [], en: [] };
    this.ready = false;
    this._el = null;
    this._tried = 0;
    this._load();
  }

  async _load() {
    try {
      const res = await fetch(new URL('../assets/audio/manifest.json', import.meta.url));
      if (res.ok) { this.manifest = await res.json(); this.ready = true; }
    } catch (e) { this.ready = false; }
  }

  has(lang, id) {
    const list = this.manifest[lang];
    return Array.isArray(list) && list.indexOf(id) >= 0;
  }

  play(lang, id) {
    if (!this.enabled || !this.has(lang, id)) return false;
    try {
      if (!this._el) this._el = new Audio();
      // Si aún no se han tocado audios, intentamos desbloquear en el primer gesto.
      this._el.pause();
      this._el.src = new URL(`../assets/audio/${lang}/${id}.mp3`, import.meta.url).href;
      this._el.currentTime = 0;
      const p = this._el.play();
      if (p && p.catch) p.catch(() => {});
      return true;
    } catch (e) { return false; }
  }

  stop() { try { if (this._el) this._el.pause(); } catch (e) {} }
}
