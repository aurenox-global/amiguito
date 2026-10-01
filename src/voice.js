// Voz amable con la Web Speech API (síntesis) + reconocimiento opcional.
// Sin claves ni servicios externos: funciona online en cualquier navegador moderno.
// Clave para que SE ENTIENDA: usar una voz del MISMO idioma y un tono/velocidad claros.
export class Voice {
  constructor({ lang = 'es' } = {}) {
    this.lang = lang;
    this.enabled = true;
    this.pitch = 1.15;   // claro pero algo agudo (antes 1.4 = demasiado "chipmunk")
    this.rate = 1.0;
    this.volume = 1;
    this.voiceURI = null; // voz elegida por el usuario (persistente)
    this.voices = [];
    this.ready = false;
    this._load();
  }

  _load() {
    if (typeof speechSynthesis === 'undefined') return;
    const load = () => {
      try { this.voices = speechSynthesis.getVoices() || []; } catch (e) { this.voices = []; }
      this.ready = this.voices.length > 0;
      if (typeof window !== 'undefined' && this._onReady) this._onReady();
    };
    load();
    try { speechSynthesis.onvoiceschanged = load; } catch (e) {}
  }

  onReady(cb) { this._onReady = cb; if (this.ready) cb(); }

  get canSpeak() { return typeof speechSynthesis !== 'undefined'; }
  get canListen() {
    return typeof window !== 'undefined' &&
      (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined');
  }

  _base(lang) { return (lang === 'en') ? 'en' : 'es'; }
  _bcp(lang) { return (lang === 'en') ? 'en-US' : 'es-ES'; }

  // Voces disponibles para un idioma (es/en).
  listFor(lang) {
    const base = this._base(lang);
    return this.voices.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(base));
  }
  hasLang(lang) { return this.listFor(lang).length > 0; }

  pick(lang) {
    // 1) la voz elegida por el usuario, si encaja con el idioma
    if (this.voiceURI) {
      const v = this.voices.find((x) => x.voiceURI === this.voiceURI);
      if (v) return v;
    }
    // 2) mejor voz del idioma (preferimos femeninas/suaves/naturales cuando existen)
    const pool = this.listFor(lang);
    if (!pool.length) return null; // NO usar una voz de otro idioma: sonaría ininteligible
    const exact = pool.filter((v) => v.lang.toLowerCase().replace('_', '-') === this._bcp(lang).toLowerCase());
    const cand = exact.length ? exact : pool;
    const friendly = cand.find((v) => /natural|neural|premium|enhanced|google|female|mujer|m[óo]nica|helena|laura|sabina|zira|aria|jenny|elvira|dalia/i.test(v.name));
    return friendly || cand[0];
  }

  speak(text, { lang, pitch, rate, interrupt = true } = {}) {
    if (!this.enabled || !this.canSpeak || !text) return false;
    const lg = lang || this.lang;
    try {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).slice(0, 420));
      const v = this.pick(lg);
      if (v) { u.voice = v; u.lang = v.lang; }
      else { u.lang = this._bcp(lg); } // sin voz del idioma: dejamos que el sistema decida
      u.pitch = Math.max(0.5, Math.min(2, pitch != null ? pitch : this.pitch));
      u.rate = Math.max(0.5, Math.min(2, rate != null ? rate : this.rate));
      u.volume = this.volume;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  // Lee una muestra corta en el idioma dado (para "probar voz").
  test(lang) {
    const sample = (lang === 'en')
      ? 'Hi! I am Amiguito. Can you understand me now?'
      : '¡Hola! Soy Amiguito. ¿Ahora me entiendes bien?';
    this.speak(sample, { lang });
  }

  stop() { try { if (this.canSpeak) speechSynthesis.cancel(); } catch (e) {} }

  listen({ lang, onResult, onEnd } = {}) {
    const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { onEnd && onEnd(); return null; }
    const r = new SR();
    r.lang = this._bcp(lang || this.lang);
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.continuous = false;
    r.onresult = (e) => { try { onResult && onResult((e.results[0][0].transcript || '').trim()); } catch (_) {} };
    r.onerror = () => onEnd && onEnd();
    r.onend = () => onEnd && onEnd();
    try { r.start(); } catch (e) { onEnd && onEnd(); }
    return r;
  }
}
