// Amiguito · punto de entrada: escena 3D, ciclo de vida, cerebro (ML) y UI.
import * as THREE from '../vendor/three.module.js';
import { Creature } from './creature.js';
import { Needs } from './needs.js';
import { Personality } from './brain/personality.js';
import { QLearner } from './brain/qlearning.js';
import { SpacedRepetition } from './spaced.js';
import { LESSONS, shuffledOptions, SUBJECTS, loadSubject } from './education.js';
import { Voice } from './voice.js';
import { Sound } from './audio.js';
import { I18n } from './i18n.js';
import { UI } from './ui.js';
import * as store from './store.js';

const ACTIONS = ['rest', 'wander', 'selfplay', 'ponder', 'seek', 'groom'];
const DECIDE_EVERY = 4.5;
const PLATFORM_R = 1.85;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

class Game {
  constructor() {
    this.i18n = new I18n('es');
    this.ui = new UI(this.i18n);
    this.voice = new Voice({ lang: this.i18n.lang });
    this.sound = new Sound();
    this.settings = { voiceOn: true, lang: 'es', created: Date.now() };
    this.custom = { body: 0xfa9720, eye: 0x1a5fb0, acc: 'none' };
    this._listening = false;

    // Mundo (3D) ─ declarado antes de load() por si no hay WebGL
    this.creature = null;
    this.moving = false;
    this.wanderTarget = null;
    this.lastQ = null;
    this.pendingAttention = false;
    this.attentionWanted = false;
    this.lastInteractAt = Date.now();
    this.hudTimer = 0;
    this.saveTimer = 0;
    this.saved = store.load();
    this._applySaved(this.saved);
    this._restore();
  }

  _restore() {
    const s = this.saved || {};
    this.needs = Needs.fromJSON(s.needs);
    this.q = QLearner.fromJSON(s.q);
    this.personality = Personality.fromJSON(s.personality);
    this.spaced = SpacedRepetition.fromJSON(s.spaced);
    this.petName = s.petName || 'Amiguito';
    this.vocab = s.vocab || [];
    this.chat = s.chat || [];
    this.known = s.known || {};
    this.settings.lang = s.lang || this.settings.lang;
    if (s.voice) { this.settings.voiceOn = s.voice.on !== false; this.voice.pitch = s.voice.pitch || 1.15; this.voice.rate = s.voice.rate || 1; this.voice.voiceURI = s.voice.uri || null; }
    this.settings.created = s.created || this.settings.created;
    if (s.custom) Object.assign(this.custom, s.custom);
    this.i18n.set(this.settings.lang);
    this.voice.lang = this.settings.lang;
    this.voice.enabled = this.settings.voiceOn;
    this.sound.lang = this.settings.lang;
    this.sound.enabled = this.settings.voiceOn;
  }

  _applySaved(s) { /* hook por si en el futuro migramos formatos */ }

  start() {
    if (!this._init3D()) {
      this.ui.bubble('Tu navegador no soporta WebGL 😢', 8000);
      return;
    }
    this._restore2({ x: (this.saved && this.saved.pos && this.saved.pos.x) || 0, z: (this.saved && this.saved.pos && this.saved.pos.z) || 0 });
    // si estaba durmiendo al recargar, mantenemos la siesta y su cuenta regresiva
    if (this.needs.asleep) { this.creature.setSleeping(true); this.ui.setZZZ(true); this.ui.setSleepTimer(this.needs.remaining()); }
    this.ui.setLangLabels();
    this.ui.setVoiceIcon(this.settings.voiceOn);
    this._bindUI();
    this._greet();
    this.clock = new THREE.Clock();
    this._loop();
    setInterval(() => this.save(), 10000);
    window.addEventListener('pagehide', () => this.save());
    window.addEventListener('beforeunload', () => this.save());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
  }

  // ── Escena 3D ──────────────────────────────────────────────
  _init3D() {
    const canvas = document.getElementById('scene');
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    this._framing();

    this.scene.add(new THREE.HemisphereLight(0xfdf6ff, 0x8fd3bd, 0.95));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(3.2, 6.2, 4.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
    key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0005;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe6f2, 0.5);
    rim.position.set(-3.5, 3, -3.5);
    this.scene.add(rim);

    // Plataforma
    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 2.35, 0.3, 64),
      new THREE.MeshStandardMaterial({ color: 0xd7f5e6, roughness: 0.9 })
    );
    plat.position.y = -0.15; plat.receiveShadow = true;
    this.scene.add(plat);
    const top = new THREE.Mesh(
      new THREE.CircleGeometry(2.05, 64),
      new THREE.MeshStandardMaterial({ color: 0xeafff5, roughness: 1 })
    );
    top.rotation.x = -Math.PI / 2; top.position.y = 0.001; top.receiveShadow = true;
    this.scene.add(top);

    // Detalles del jardín (piedritas y flores)
    const deco = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = 1.75 + Math.random() * 0.15;
      const flower = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.28, 6),
        new THREE.MeshStandardMaterial({ color: 0x9ede9e }));
      stem.position.y = 0.14; flower.add(stem);
      const petalColor = [0xffc7e0, 0xffe08a, 0xc9d8ff, 0xbff0e0][i % 4];
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10),
        new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.7 }));
      bud.position.y = 0.3; flower.add(bud);
      flower.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
      deco.add(flower);
    }
    this.scene.add(deco);

    this.creature = new Creature();
    this.scene.add(this.creature.root);
    this._applyCustom();

    this._resize();
    window.addEventListener('resize', () => this._resize());

    // puntero / mirada + toque (solo si tocas A ÉL) + mantener pulsado = hablar por voz
    this.pointer = new THREE.Vector2();
    this.ray = new THREE.Raycaster();
    let holdTimer = null, startX = 0, startY = 0, downHit = false, longFired = false;
    const cancelHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };
    canvas.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      this.pointer.set(nx, -ny);
      this.creature.setLook(nx, -ny);
      this.lastInteractAt = Date.now();
      if (holdTimer && Math.hypot(e.clientX - startX, e.clientY - startY) > 16) cancelHold();
    });
    canvas.addEventListener('pointerdown', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      this.pointer.set(nx, -ny);
      this.ray.setFromCamera(this.pointer, this.camera);
      downHit = this.ray.intersectObject(this.creature.root, true).length > 0;
      startX = e.clientX; startY = e.clientY; longFired = false;
      cancelHold();
      holdTimer = setTimeout(() => { holdTimer = null; longFired = true; this._talkByVoice(); }, 550);
      this._unlockAudio();
    });
    const endHold = () => {
      const wasLong = longFired;
      cancelHold();
      if (!wasLong && downHit) this._poke();
      longFired = false;
    };
    canvas.addEventListener('pointerup', endHold);
    canvas.addEventListener('pointercancel', () => { cancelHold(); longFired = false; });
    window.addEventListener('keydown', () => this._unlockAudio(), { once: true });
    return true;
  }

  _restore2(pos) {
    this.creature.root.position.set(pos.x || 0, 0, pos.z || 0);
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this._framing();
  }

  // Encuadre de la cámara: en vertical (móvil) alejamos la cámara para que la
  // mascota no ocupe toda la pantalla; en horizontal se ve más de cerca.
  _framing() {
    const w = window.innerWidth, h = Math.max(1, window.innerHeight);
    const a = w / h;
    const portrait = Math.max(0, 1 - a);      // 0 en horizontal; ~0.54 en un móvil vertical
    const dist = 4.55 * (1 + 1.15 * portrait);
    const fov = 42 + 6 * portrait;
    this.camera.fov = fov;
    this.camera.position.set(0, 1.62, dist);
    this.camera.lookAt(0, 0.98, 0);
    this.camera.aspect = a;
    this.camera.updateProjectionMatrix();
  }

  _unlockAudio() {
    if (this._audioUnlocked) return;
    this._audioUnlocked = true;
    try { if (this.settings.voiceOn && typeof speechSynthesis !== 'undefined') { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {}
  }

  // ── Bucle ──────────────────────────────────────────────────
  _loop() {
    const frame = () => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      try {
        this._update(dt);
        this.renderer.render(this.scene, this.camera);
      } catch (e) {
        if (!this._errored) { this._errored = true; console.error('[amiguito]', e); if (window.__amiguito_fatal) window.__amiguito_fatal(e.message); }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  _update(dt) {
    this.needs.tick();

    // despertar automático al terminar la siesta
    if (this.needs.asleep && this.needs.remaining() <= 0) this._wake(true);
    // cuenta regresiva de la siesta en pantalla
    if (this.needs.asleep) {
      this._sleepAcc = (this._sleepAcc || 0) + dt;
      if (this._sleepAcc >= 0.5) { this._sleepAcc = 0; this.ui.setSleepTimer(this.needs.remaining()); }
    }

    // decisiones autónomas (vida propia)
    if (!this.needs.asleep) {
      this.decideTimer -= dt;
      if (this.decideTimer <= 0) { this._decide(); this.decideTimer = DECIDE_EVERY + rand(-1, 2); }
    }

    // movimiento hacia el objetivo
    this.moving = false;
    if (this.wanderTarget && !this.needs.asleep) {
      const p = this.creature.root.position;
      const dx = this.wanderTarget.x - p.x, dz = this.wanderTarget.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.09) { this.wanderTarget = null; }
      else {
        const sp = 1.25 * dt;
        p.x += (dx / d) * sp; p.z += (dz / d) * sp;
        this.creature.root.rotation.y = lerpAngle(this.creature.root.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 6));
        this.moving = true;
      }
    }

    // mirar alrededor si no hay interacción reciente
    if (Date.now() - this.lastInteractAt > 6000 && !this.needs.asleep) {
      const gx = Math.sin(this.creature.t * 0.5) * 0.5;
      const gy = Math.sin(this.creature.t * 0.35 + 1) * 0.25;
      if (!this._wanderEye || this._wanderEye < performance.now()) { this._wanderEye = performance.now() + 2500; this.creature.setLook(gx, gy); }
    }

    this.creature.update(dt, { mood: this.needs.mood(), moving: this.moving });

    // HUD 4 veces por segundo
    this.hudTimer += dt;
    if (this.hudTimer > 0.25) { this.hudTimer = 0; this._refreshHUD(); }

    // educación/atención espontánea
    if (!this.needs.asleep && this.needs.critical() && Date.now() - this.lastInteractAt > 45000 && Date.now() - this._lastPlea > 60000) {
      this._lastPlea = Date.now();
      this.ui.bubble(this.i18n.t('need_help'));
      this.voice.speak(this.i18n.t('need_help'));
    }
  }

  _moodInfo() {
    const n = this.needs, t = this.i18n;
    if (n.asleep) return { face: '😴', label: t.t('mood_sleeping'), sub: t.t('sub_sleeping') };
    if (n.health < 0.4) return { face: '🤒', label: t.t('mood_sick'), sub: t.t('sub_sick') };
    if (n.hunger > 0.8) return { face: '🍽️', label: t.t('mood_hungry'), sub: t.t('sub_hungry') };
    if (n.energy < 0.2) return { face: '🥱', label: t.t('mood_tired'), sub: t.t('sub_tired') };
    if (n.hygiene < 0.25) return { face: '🫧', label: t.t('mood_dirty'), sub: t.t('sub_dirty') };
    const m = n.mood();
    if (m > 0.72) return { face: '😄', label: t.t('mood_happy'), sub: t.t('sub_happy') };
    if (m > 0.5) return { face: '🙂', label: t.t('mood_ok'), sub: t.t('sub_ok') };
    return { face: '😟', label: t.t('mood_sad'), sub: t.t('sub_sad') };
  }

  _refreshHUD() {
    const m = this._moodInfo();
    this.ui.updateHUD({
      needs: this.needs, face: m.face, moodLabel: m.label, moodSub: m.sub,
      mastery: this.spaced.mastery(), brain: this.q.confidence()
    });
  }

  // ── Cerebro / decisiones ───────────────────────────────────
  _features() {
    const n = this.needs;
    return [n.hunger, 1 - n.energy, n.happiness, n.boredom, n.hygiene];
  }
  _wellbeing() {
    const n = this.needs;
    return n.mood() * 0.6 + (1 - n.boredom) * 0.18 + n.energy * 0.12 + (1 - n.hunger) * 0.1;
  }
  _allowed() { return ACTIONS.map((_, i) => i); }

  _decide() {
    const k = this.q.key(this._features());
    const wb = this._wellbeing();
    if (this.lastQ) {
      let reward = (wb - this.lastQ.wb) * 8 * this.personality.weight(this.lastQ.action);
      if (this.lastQ.action === 'seek') reward += this.pendingAttention ? 2.0 : -0.5;
      this.q.learn(this.lastQ.k, this.lastQ.a, reward, k, this._allowed());
    }
    const a = this.q.act(k, this._allowed());
    this._runAction(a);
    this.lastQ = { k, a, wb, action: ACTIONS[a] };
    this.pendingAttention = false;
  }

  _runAction(a) {
    const name = ACTIONS[a];
    const n = this.needs;
    switch (name) {
      case 'rest':
        this.wanderTarget = null;
        n.rest(0.1);
        break;
      case 'wander':
        this._pickTarget(); n.boredom = clamp(n.boredom - 0.12); break;
      case 'selfplay':
        this.wanderTarget = null;
        this.creature.play(Math.random() < 0.5 ? 'cheer' : 'spin');
        n.boredom = clamp(n.boredom - 0.3); n.happiness = clamp(n.happiness + 0.05); n.energy = clamp(n.energy - 0.02);
        if (Math.random() < 0.34) this._sayAuto('autonomous.selfplay');
        break;
      case 'ponder':
        this.wanderTarget = null;
        this.creature.play('nod');
        n.happiness = clamp(n.happiness + 0.02);
        break;
      case 'groom':
        this.wanderTarget = null;
        this.creature.play('shake');
        n.hygiene = clamp(n.hygiene + 0.15);
        break;
      case 'seek':
        this._pickTarget(0.45);
        this.attentionWanted = true;
        if (Math.random() < 0.5) this._sayAuto('autonomous.seek');
        break;
    }
  }

  _pickTarget(scale = 1) {
    const a = Math.random() * Math.PI * 2;
    const r = rand(0.3, PLATFORM_R) * scale;
    this.wanderTarget = { x: Math.cos(a) * r, z: Math.sin(a) * r };
  }

  _sayAuto(key) {
    const txt = this.i18n.t(key);
    const id = 'auto_' + key.split('.').pop();
    if (Math.random() < 0.6) this.ui.bubble(txt, 2800);
    if (Math.random() < 0.5) this._spk(id, txt);
  }

  // ── Interacciones del usuario ──────────────────────────────
  _touch() {
    this.lastInteractAt = Date.now();
    if (this.attentionWanted) { this.pendingAttention = true; this.attentionWanted = false; }
  }

  _poke() {
    this._touch();
    if (this.needs.asleep) return; // dormido: no reacciona a nada
    this.needs.cuddle();
    this.creature.play('pop');
    this._say('poked');
    this.save();
  }

  _say(key, vars) {
    const text = this.i18n.t(key, vars);
    this.ui.bubble(text, 4000);
    this._spk(key, text, vars);
    return text;
  }

  // Habla: usa la VOZ PROPIA incluida (Piper) y, si no existe, la del navegador.
  _spk(id, text, vars) {
    if (!this.settings.voiceOn) return;
    const personalized = vars && vars.name && vars.name !== 'Amiguito';
    if (!personalized && this.sound.play(this.i18n.lang, id)) { this.voice.stop(); return; }
    this.voice.speak(text, { lang: this.i18n.lang });
  }

  _action(act) {
    if (this.needs.asleep && act !== 'sleep') return; // dormido: no reacciona a nada
    this._touch();
    switch (act) {
      case 'feed':
        if (this.needs.hunger < 0.12) { this._say('full'); this.creature.play('nod'); break; }
        this.needs.feed(); this.personality.nudge('appetite', 0.012);
        this.creature.play('eat');
        this._log(this._say('ate'), '🍎', 'feed');
        break;
      case 'play':
        if (this.needs.energy < 0.18) { this._say('tired_now'); this.creature.play('sad'); break; }
        this.needs.play(); this.personality.nudge('playfulness', 0.012); this.personality.nudge('sociability', 0.008);
        this.creature.play('cheer');
        this._log(this._say('played'), '🎈', 'play');
        break;
      case 'sleep': this._toggleSleep(); break;
      case 'clean':
        this.needs.clean(); this.personality.nudge('tidiness', 0.014);
        this.creature.play('shake');
        this._log(this._say('cleaned'), '🫧', 'clean');
        break;
      case 'teach': this._teach(); break;
      case 'talk': this._openTalk(); break;
    }
    this.personality.learn(this.needs, this.needs.mood());
    this._refreshHUD();
    this.save();
  }

  _toggleSleep() {
    if (this.needs.asleep) { this._wake(false); return; }
    const mins = this.needs.sleepMinutes();
    this.needs.startSleep(mins * 60 * 1000);
    this.wanderTarget = null;
    this.creature.setSleeping(true);
    this.ui.setZZZ(true);
    this.ui.setSleepTimer(this.needs.remaining());
    this._log(this._say('sleeping') + ' 😴 ' + mins + ' min', '💤', 'sleep');
    this.save();
  }
  _wake(auto) {
    this.needs.asleep = false;
    this.needs.sleepUntil = 0; this.needs.sleepStart = 0;
    this.creature.setSleeping(false);
    this.ui.setZZZ(false);
    this.ui.setSleepTimer(0);
    if (auto) this._log(this._say('woke'), '⚡', 'sleep');
    this._refreshHUD();
    this.save();
  }

  _log(text, emoji) { this.ui.log(text, emoji); }

  // ── Educación ──────────────────────────────────────────────
  _teach() {
    if (this.needs.asleep) return;
    this.ui.openSubjects(SUBJECTS, this.i18n.lang, (id) => {
      if (id === 'basics') this._openLesson();
      else this._openSubject(id);
    });
  }
  _pickLesson() {
    const ids = LESSONS.map((l) => l.id);
    const due = this.spaced.due(ids);
    const pool = due.length ? LESSONS.filter((l) => due.includes(l.id)) : LESSONS;
    return pool[(Math.random() * pool.length) | 0];
  }
  _openLesson() {
    const lang = this.i18n.lang;
    const lesson = this._pickLesson();
    const sh = shuffledOptions(lesson, lang);
    this._spk('lesson_' + lesson.id, lesson.prompt[lang] || lesson.prompt.es);
    this.ui.openQuiz(lesson, sh,
      (ok, lesson2, idx, next) => {
        if (next) { this._openLesson(); return; }
        const q = ok ? 5 : 2;
        this.spaced.grade(lesson2.id, q);
        this.needs.teach(ok);
        this.personality.nudge('curiosity', ok ? 0.012 : 0.004);
        this.creature.play(ok ? 'cheer' : 'sad');
        const fb = ok ? this._say('learned_good') : this._say('learned_bad');
        this._log(`${ok ? '✓' : '✗'} ${lesson2.prompt[lang] || lesson2.prompt.es} — ${fb}`, '🎓');
        this._refreshHUD();
        this.save();
      },
      this.voice.canListen ? (cb) => this.voice.listen({ lang, onResult: cb }) : null
    );
  }

  // Materias del "cole" (datos bilingües en /data/<id>.json)
  async _openSubject(id) {
    const lang = this.i18n.lang;
    this._subjCache = this._subjCache || {};
    if (!this._subjCache[id]) {
      try { this._subjCache[id] = await loadSubject(id); }
      catch (e) { this.ui.bubble(lang === 'en' ? 'I could not load that subject 😕' : 'No pude cargar esa materia 😕'); return; }
    }
    const data = this._subjCache[id];
    const all = [];
    (data.levels || []).forEach((lv, li) => (lv.items || []).forEach((it, ii) => all.push({ it, li, ii })));
    if (!all.length) return;
    const pick = all[(Math.random() * all.length) | 0];
    const item = pick.it;
    const subjectName = (data.name && (data.name[lang] || data.name.es)) || id;
    const lesson = {
      id: `subj_${id}_${pick.li}_${pick.ii}`,
      emoji: data.icon || '🎓',
      prompt: item.q, opts: item.options, correct: item.answer, fact: item.why
    };
    const sh = shuffledOptions(lesson, lang);
    this._spk('subj_' + lesson.id, lesson.prompt[lang] || lesson.prompt.es);
    this.ui.openQuiz(lesson, sh, (ok, lesson2, idx, next) => {
      if (next) { this._openSubject(id); return; }
      this.spaced.grade(lesson2.id, ok ? 5 : 2);
      this.needs.teach(ok);
      this.personality.nudge('curiosity', ok ? 0.012 : 0.004);
      this.creature.play(ok ? 'cheer' : 'sad');
      const fb = ok ? this._say('learned_good') : this._say('learned_bad');
      this._log(`${ok ? '✓' : '✗'} [${subjectName}] ${lesson2.prompt[lang] || lesson2.prompt.es} — ${fb}`, '🎓');
      this._refreshHUD(); this.save();
    }, this.voice.canListen ? (cb) => this.voice.listen({ lang, onResult: cb }) : null, subjectName);
  }

  // Personalización (colores y accesorio)
  _applyCustom() {
    if (!this.creature) return;
    this.creature.setPalette({ body: this.custom.body, eye: this.custom.eye });
    this.creature.setAccessory(this.custom.acc);
  }
  _openCustomize() { this.ui.openCustomize(this.custom, this.i18n.lang, (patch) => this._onCustom(patch)); }
  _onCustom(patch) { Object.assign(this.custom, patch); this._applyCustom(); this.save(); }

  // Mantener pulsada la pantalla → hablarle por voz
  _talkByVoice() {
    if (this.needs.asleep) return; // dormido: no reacciona a nada
    const lang = this.i18n.lang;
    if (!this.voice.canListen) { this.ui.bubble(lang === 'en' ? 'Voice input is not available here 🎤' : 'Aquí no puedo oírte por voz 🎤', 3200); return; }
    if (this._listening) return;
    this._listening = true;
    this._touch();
    this.ui.bubble(lang === 'en' ? '🎤 I am listening… talk to me!' : '🎤 Te escucho… ¡háblame!', 7000);
    this.voice.listen({ lang, onResult: (txt) => {
      if (!txt) return;
      const reply = this._reply(txt);
      this.chat.push({ from: 'me', text: txt }, { from: 'pet', text: reply });
      if (this.chat.length > 40) this.chat = this.chat.slice(-40);
      this.ui.bubble(reply, 5200);
      this._log('🎤 ' + txt, '💬');
      this.save();
    }, onEnd: () => { this._listening = false; } });
  }

  // ── Chat local (aprende por patrones, sin servicios externos) ──
  _openTalk() {
    const lang = this.i18n.lang;
    if (!this.chat.length) this.chat.push({ from: 'pet', text: this.i18n.t('greet', { name: this.petName }) });
    this.ui.openTalk(this.chat.slice(-12),
      (text) => {
        this._touch();
        const reply = this._reply(text);
        this.chat.push({ from: 'me', text }, { from: 'pet', text: reply });
        if (this.chat.length > 40) this.chat = this.chat.slice(-40);
        this.save();
        return reply;
      },
      this.voice.canListen ? (cb) => this.voice.listen({ lang, onResult: cb }) : null
    );
  }

  _reply(text) {
    const lang = this.i18n.lang;
    const s = (text || '').toLowerCase().trim();
    const say = (t) => { if (this.settings.voiceOn) this.voice.speak(t, { lang }); return t; };
    const m = s.match(/(?:me llamo|mi nombre es|soy|my name is|i am|i'm|call me)\s+([\p{L}]{2,20})/u);
    if (m) { this.known.user = cap(m[1]); this.needs.cuddle(); this.creature.play('cheer'); return say(this.i18n.t('name_learned', { name: this.petName })); }
    const nm = s.match(/(?:te llamas|tu nombre es|your name is|you are called)\s+([\p{L}]{2,20})/u);
    if (nm) { this.petName = cap(nm[1]); this.creature.play('cheer'); return say(this.i18n.t('thanks_name')); }
    const isEn = lang === 'en';
    const has = (...words) => words.some((w) => s.includes(w));
    if (has('hola', 'hello', 'hi', 'hey', 'buenos días', 'good morning')) return say(this.i18n.t('greet', { name: this.petName }));
    if (has('cómo estás', 'como estas', 'how are you', 'qué tal', 'how do you feel')) {
      const m2 = this._moodInfo();
      return say((isEn ? `I feel ${m2.label.toLowerCase()}! ` : `¡Me siento ${m2.label.toLowerCase()}! `) + (isEn ? 'And you?' : '¿Y tú?'));
    }
    if (has('te quiero', 'te amo', 'i love you', 'eres mi amigo', 'eres genial')) { this.needs.cuddle(); this.creature.play('cheer'); return say(isEn ? 'I love you too! 💛' : '¡Yo también te quiero! 💛'); }
    if (has('jugar', 'play', 'juego')) return say(isEn ? 'Yes! Tap "Play" and let\'s have fun 🎈' : '¡Sí! Toca "Jugar" y nos divertimos 🎈');
    if (has('enseñar', 'aprender', 'teach', 'learn', 'estudiar')) return say(isEn ? 'I\'d love to learn! Tap "Teach" 🎓' : '¡Me encantaría aprender! Toca "Enseñar" 🎓');
    if (has('adiós', 'adios', 'bye', 'chao', 'hasta luego')) return say(isEn ? 'See you soon! I\'ll be here living my life 🙂' : '¡Hasta pronto! Estaré aquí, viviendo mi vida 🙂');
    if (has('comer', 'hambre', 'hungry', 'food', 'snack')) return say(isEn ? "I'm a little hungry 🍎" : 'Tengo un poquito de hambre 🍎');
    if (has('dormir', 'sueño', 'sleepy', 'sleep')) return say(isEn ? "A nap sounds nice 💤" : 'Una siesta me vendría genial 💤');
    if (has('color favorito', 'favorite color')) { const c = s.split(/(?:es|is)\s+([\p{L} ]{3,20})/u)[1]; if (c) { this.known.color = cap(c.trim()); this.creature.play('cheer'); return say((isEn ? 'Cool! ' : '¡Qué bien! ') + cap(c.trim()) + (isEn ? ', noted 💾' : ', lo apunto 💾')); } }
    if (s.includes('?')) return say(isEn ? 'Hmm, good question! Teach me and I\'ll remember 🤔' : '¡Buena pregunta! Enséñame y lo recordaré 🤔');
    // aprende palabras nuevas
    const words = s.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) if (!this.vocab.includes(w)) this.vocab.push(w);
    if (this.vocab.length > 300) this.vocab = this.vocab.slice(-300);
    return say(this.i18n.t('no_understand'));
  }

  // ── Ciclo de vida del UI ───────────────────────────────────
  _greet() {
    const g = this.i18n.t('greet', { name: this.petName });
    this.ui.bubble(g, 5200);
    this._log(g, '👋');
    this._refreshHUD();
    if (this.settings.voiceOn) setTimeout(() => this._spk('greet', g, { name: this.petName }), 400);
  }

  _bindUI() {
    this.ui.bindControls((act) => this._action(act));
    this.ui.bindTopbar({
      onVoice: () => {
        this.settings.voiceOn = !this.settings.voiceOn;
        this.voice.enabled = this.settings.voiceOn;
        this.sound.enabled = this.settings.voiceOn;
        this.ui.setVoiceIcon(this.settings.voiceOn);
        if (this.settings.voiceOn) this._spk('ok', this.i18n.t('ok'));
        this.save();
      },
      onLang: () => this._setLang(this.i18n.other),
      onLog: () => this.ui.toggleLog(),
      onSettings: () => this.ui.openSettings(this._settingsData(), (patch) => this._onSettings(patch)),
      onCustom: () => this._openCustomize()
    });
    document.getElementById('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') this.ui.close(); });
  }

  _settingsData() {
    const voices = this.voice.listFor(this.i18n.lang).map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang }));
    return { voiceOn: this.settings.voiceOn, pitch: this.voice.pitch, rate: this.voice.rate, voiceURI: this.voice.voiceURI, voices };
  }

  _onSettings(p) {
    if (p.voiceOn != null) { this.settings.voiceOn = p.voiceOn; this.voice.enabled = p.voiceOn; this.sound.enabled = p.voiceOn; this.ui.setVoiceIcon(p.voiceOn); }
    if (p.pitch != null) this.voice.pitch = p.pitch;
    if (p.rate != null) this.voice.rate = p.rate;
    if (p.voiceURI !== undefined) this.voice.voiceURI = p.voiceURI || null;
    if (p.test) { if (!this.sound.play(this.i18n.lang, 'greet')) this.voice.test(this.i18n.lang); }
    if (p.lang) { this._setLang(p.lang); if (p.reopen) this.ui.openSettings(this._settingsData(), (x) => this._onSettings(x)); }
    if (p.export) store.download(this._serialize());
    if (p.import) store.upload().then((obj) => { if (obj) { store.save(obj); location.reload(); } else this.ui.bubble(this.i18n.t('import_fail')); });
    if (p.reset) { store.wipe(); location.reload(); }
    if (!p.silent) this.save();
  }

  _setLang(lang) {
    this.i18n.set(lang); this.voice.lang = lang; this.sound.lang = lang; this.settings.lang = lang;
    this.ui.setLangLabels();
    const g = this.i18n.t('greet', { name: this.petName });
    if (this.settings.voiceOn) { if (!this.sound.play(lang, 'greet')) this.voice.speak(g, { lang }); }
    this.save();
  }

  // ── Persistencia ───────────────────────────────────────────
  _serialize() {
    const p = this.creature ? this.creature.root.position : { x: 0, z: 0 };
    return {
      v: 1, created: this.settings.created, lang: this.settings.lang, petName: this.petName,
      voice: { on: this.settings.voiceOn, pitch: this.voice.pitch, rate: this.voice.rate, uri: this.voice.voiceURI },
      custom: this.custom,
      needs: this.needs.toJSON(), q: this.q.toJSON(), personality: this.personality.toJSON(),
      spaced: this.spaced.toJSON(), vocab: this.vocab, chat: this.chat.slice(-40), known: this.known,
      pos: { x: p.x, z: p.z }
    };
  }
  save() { try { store.save(this._serialize()); } catch (e) {} }
}

const game = new Game();
game.start();
if (typeof window !== 'undefined') window.__amiguito = game;
