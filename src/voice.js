// Voz amable con la Web Speech API (síntesis) + reconocimiento opcional.
// Sin claves ni servicios externos: funciona online en cualquier navegador moderno.
export class Voice {
  constructor({ lang = 'es' } = {}) {
    this.lang = lang;
    this.enabled = true;
    this.pitch = 1.4;   // tono más agudo = más adorable
    this.rate = 1.0;
    this.voices = [];
    this.ready = false;
    this._load();
  }

  _load() {
    if (typeof speechSynthesis === 'undefined') return;
    const load = () => {
      try { this.voices = speechSynthesis.getVoices() || []; } catch (e) { this.voices = []; }
      this.ready = this.voices.length > 0;
    };
    load();
    try { speechSynthesis.onvoiceschanged = load; } catch (e) {}
  }

  get canSpeak() { return typeof speechSynthesis !== 'undefined'; }
  get canListen() {
    return typeof window !== 'undefined' &&
      (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined');
  }

  _bcp(lang) { return lang === 'en' ? 'en-US' : 'es-ES'; }

  pick(lang) {
    const tag = this._bcp(lang);
    const base = tag.split('-')[0];
    const sameLang = this.voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(base));
    const exact = sameLang.filter((v) => v.lang.toLowerCase().replace('_', '-') === tag.toLowerCase());
    const pool = exact.length ? exact : sameLang;
    const friendly = pool.find((v) => /female|mujer|m[óo]nica|helena|laura|sabina|zira|aria|jenny|google|natural/i.test(v.name));
    return friendly || pool[0] || this.voices.find((v) => v.lang && v.lang.startsWith(base)) || null;
  }

  speak(text, { lang, pitch, rate, interrupt = true } = {}) {
    if (!this.enabled || !this.canSpeak || !text) return;
    try {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).slice(0, 400));
      u.lang = this._bcp(lang || this.lang);
      const v = this.pick(lang || this.lang);
      if (v) u.voice = v;
      u.pitch = pitch != null ? pitch : this.pitch;
      u.rate = rate != null ? rate : this.rate;
      u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  stop() { try { if (this.canSpeak) speechSynthesis.cancel(); } catch (e) {} }

  listen({ lang, onResult, onEnd } = {}) {
    const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { onEnd && onEnd(); return null; }
    const r = new SR();
    r.lang = this._bcp(lang || this.lang);
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => { try { onResult && onResult(e.results[0][0].transcript); } catch (_) {} };
    r.onerror = () => onEnd && onEnd();
    r.onend = () => onEnd && onEnd();
    try { r.start(); } catch (e) { onEnd && onEnd(); }
    return r;
  }
}
