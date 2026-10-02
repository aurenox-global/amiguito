// Capa de interfaz: HUD, burbujas, diario y ventanas (ajustes, quiz, chat).
// No conoce el motor 3D: solo pinta y avisa por callbacks.
const $ = (id) => document.getElementById(id);
const pct = (v) => Math.round(Math.max(0, Math.min(1, v)) * 100);

export class UI {
  constructor(i18n) {
    this.i18n = i18n;
    this.logEl = $('log');
    this.bubbleEl = $('bubble');
    this.zzzEl = $('zzz');
    this.modal = $('modal');
    this.body = $('modal-body');
    this._bubbleTimer = null;
    this._logCount = 0;
  }

  t(k, v) { return this.i18n.t(k, v); }

  setLangLabels() {
    const map = { 'lbl-feed': 'feed', 'lbl-play': 'play', 'lbl-sleep': 'sleep', 'lbl-clean': 'clean_act', 'lbl-teach': 'teach', 'lbl-talk': 'talk' };
    for (const id in map) { const el = $(id); if (el) el.textContent = this.t(map[id]); }
    const v = this.i18n.lang === 'es' ? 'ES' : 'EN';
    const lb = $('btn-lang'); if (lb) lb.textContent = v;
    if (this.logEl && !this.logEl.dataset.init) {
      this.logEl.dataset.init = '1';
      this.logEl.innerHTML = `<h4>${this.t('log_title')}</h4>`;
    }
  }

  bindTopbar({ onVoice, onLang, onSettings, onLog, onCustom }) {
    $('btn-voice').addEventListener('click', onVoice);
    $('btn-lang').addEventListener('click', onLang);
    const bl = $('btn-log');
    if (bl && onLog) bl.addEventListener('click', onLog);
    $('btn-settings').addEventListener('click', onSettings);
    const bc = $('btn-custom');
    if (bc && onCustom) bc.addEventListener('click', onCustom);
  }

  toggleLog() {
    if (!this.logEl) return;
    const open = this.logEl.classList.toggle('open');
    const b = $('btn-log');
    if (b) b.classList.toggle('off', !open);
    if (open) this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  bindControls(onAct) {
    document.querySelectorAll('#controls .act').forEach((b) => {
      b.addEventListener('click', () => onAct(b.dataset.act));
    });
  }

  setVoiceIcon(on) {
    const b = $('btn-voice');
    if (!b) return;
    b.textContent = on ? '🔊' : '🔇';
    b.classList.toggle('off', !on);
  }

  updateHUD({ needs, face, moodLabel, moodSub, mastery, brain }) {
    const bars = {
      food: 1 - needs.hunger,
      energy: needs.energy,
      joy: needs.happiness,
      clean: needs.hygiene,
      health: needs.health
    };
    document.querySelectorAll('#hud .bar').forEach((el) => {
      const key = el.dataset.need;
      const v = bars[key] != null ? bars[key] : 0;
      const fill = el.querySelector('.fill');
      const label = el.querySelector('.pct');
      fill.style.width = pct(v) + '%';
      fill.style.background = v < 0.25 ? 'linear-gradient(90deg,#ffb3b3,#ef7d7d)'
        : v < 0.5 ? 'linear-gradient(90deg,#ffe08a,#f4c04a)' : '';
      label.textContent = pct(v) + '%';
    });
    $('face').textContent = face;
    $('mood-label').textContent = moodLabel;
    $('mood-sub').textContent = moodSub;
    $('mastery').textContent = '🎓 ' + pct(mastery) + '%';
    $('brain-lvl').textContent = '🧠 ' + Math.round(brain * 100);
    const h = needs.ageHours || 0;
    const d = Math.floor(h / 24), hh = Math.floor(h % 24);
    $('age').textContent = d > 0 ? `${d}d ${hh}h` : `${hh}h`;
  }

  log(text, emoji = '•') {
    if (!this.logEl) return;
    const time = new Date().toLocaleTimeString(this.i18n.lang === 'en' ? 'en-GB' : 'es-ES', { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = 'entry';
    entry.innerHTML = `<time>${time}</time><span>${emoji} ${text}</span>`;
    this.logEl.appendChild(entry);
    this._logCount++;
    while (this._logCount > 60 && this.logEl.querySelectorAll('.entry').length > 60) {
      const first = this.logEl.querySelector('.entry');
      if (first) first.remove(); else break;
    }
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  bubble(text, ms = 4200) {
    if (!text || !this.bubbleEl) return;
    this.bubbleEl.textContent = text;
    this.bubbleEl.classList.remove('hidden');
    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => this.bubbleEl.classList.add('hidden'), ms);
  }

  setZZZ(on) { if (this.zzzEl) this.zzzEl.classList.toggle('hidden', !on); }

  setBusy(act, on) {
    const b = document.querySelector(`#controls .act[data-act="${act}"]`);
    if (b) b.classList.toggle('busy', !!on);
  }

  openModal(html) {
    this.body.innerHTML = html;
    this.modal.classList.remove('hidden');
  }
  close() { this.modal.classList.add('hidden'); this.body.innerHTML = ''; }
  get isOpen() { return this.modal && !this.modal.classList.contains('hidden'); }

  // ── Ajustes ──
  openSettings(data, cb) {
    const t = this.t.bind(this);
    const lg = this.i18n.lang;
    const vs = data.voices || [];
    const vopts = [`<option value="">${lg === 'en' ? 'Automatic' : 'Automática'}</option>`]
      .concat(vs.map((v) => `<option value="${v.uri}" ${v.uri === data.voiceURI ? 'selected' : ''}>${v.name} (${v.lang})</option>`)).join('');
    const noVoices = vs.length === 0
      ? `<small class="hint" style="color:#c0392b">⚠️ ${lg === 'en' ? 'Your browser has no voices for this language.' : 'Tu navegador no tiene voces instaladas para este idioma.'}</small>` : '';
    this.openModal(`
      <h2>⚙️ ${t('settings')}</h2>
      <p class="sub">${this.i18n.t('tagline')}</p>
      <div class="toggle"><span>🔊 ${t('voice')}</span>
        <button class="switch" id="s-voice" aria-pressed="${data.voiceOn}"></button></div>
      <div class="toggle"><span>🌐 ${t('language')}</span>
        <button class="btn ghost" id="s-lang">${lg === 'es' ? 'Español ⇄ English' : 'English ⇄ Español'}</button></div>
      <div class="field" style="margin-top:14px"><label>🗣️ ${lg === 'en' ? 'Voice' : 'Voz'} ${lg === 'en' ? '(pick one you understand)' : '(elige una que se entienda)'}</label>
        <select id="s-voicelist">${vopts}</select>
        ${noVoices}
        <div class="row" style="margin-top:8px"><button class="btn ghost" id="s-test">🔊 ${lg === 'en' ? 'Test voice' : 'Probar voz'}</button></div>
      </div>
      <div class="field"><label>🎵 ${t('pitch')}: <b id="pv">${data.pitch}</b></label>
        <input type="range" id="s-pitch" min="0.6" max="1.8" step="0.05" value="${data.pitch}"></div>
      <div class="field"><label>⏩ ${t('rate')}: <b id="rv">${data.rate}</b></label>
        <input type="range" id="s-rate" min="0.6" max="1.4" step="0.05" value="${data.rate}"></div>
      <p class="hint" style="margin-top:4px">${lg === 'en' ? 'Tip: if the voice sounds odd, pick another one and test it.' : 'Consejo: si la voz suena rara, elige otra y pruébala.'}</p>
      <div class="row end" style="margin-top:14px">
        <button class="btn ghost" id="s-import">⬆️ ${t('import')}</button>
        <button class="btn ghost" id="s-export">⬇️ ${t('export')}</button>
        <button class="btn ghost" id="s-reset" style="color:#c0392b">♻️ ${t('reset')}</button>
      </div>
      <p class="hint">Amiguito funciona 100% en tu navegador.</p>`);
    $('modal-close').onclick = () => this.close();

    $('s-voice').onclick = (e) => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', String(on));
      cb({ voiceOn: on });
    };
    $('s-lang').onclick = () => cb({ lang: this.i18n.other, reopen: true });
    const sel = $('s-voicelist');
    if (sel) sel.onchange = () => cb({ voiceURI: sel.value || null });
    const tb = $('s-test');
    if (tb) tb.onclick = () => cb({ test: true });
    $('s-pitch').oninput = (e) => { $('pv').textContent = e.target.value; cb({ pitch: parseFloat(e.target.value), silent: true }); };
    $('s-rate').oninput = (e) => { $('rv').textContent = e.target.value; cb({ rate: parseFloat(e.target.value), silent: true }); };
    $('s-export').onclick = () => cb({ export: true });
    $('s-import').onclick = () => cb({ import: true });
    $('s-reset').onclick = () => { if (confirm(t('reset_warn'))) { cb({ reset: true }); } };
  }

  // ── Selección de materia ──
  openSubjects(subjects, lang, cb) {
    const en = lang === 'en';
    const cells = subjects.map((s) => `<button class="subj" data-id="${s.id}"><span class="subj-ico">${s.icon}</span><b>${(s.name && (s.name[lang] || s.name.es)) || s.id}</b></button>`).join('');
    this.openModal(`
      <h2>🎓 ${en ? 'What shall we learn?' : '¿Qué aprendemos hoy?'}</h2>
      <p class="sub">${en ? 'Pick a subject and I will ask you questions.' : 'Elige una materia y te haré preguntas.'}</p>
      <div class="subjects">${cells}</div>`, true);
    $('modal-close').onclick = () => this.close();
    this.body.querySelectorAll('.subj').forEach((b) => b.addEventListener('click', () => cb(b.dataset.id)));
  }

  // ── Personalizar (colores + accesorio) ──
  openCustomize(data, lang, cb) {
    const en = lang === 'en';
    const hex = (v) => '#' + (typeof v === 'number' ? v.toString(16) : String(v).replace('#', '')).padStart(6, '0').slice(-6).toLowerCase();
    const bodyColors = ['#fa9720', '#ff6b6b', '#ffd166', '#8ee3c8', '#6db3f2', '#c792ea', '#94f0a6', '#ff9ec4'];
    const eyeColors = ['#1a5fb0', '#12a37a', '#8e44ad', '#e0563f', '#f0a020', '#2b2b2b', '#e0568f', '#00b8d4'];
    const sw = (arr, cur, key) => arr.map((c) => `<button class="swatch ${hex(c) === hex(cur) ? 'on' : ''}" data-key="${key}" data-c="${c}" style="--c:${c}"></button>`).join('');
    const accs = [['none', en ? 'None' : 'Nada', '🚫'], ['gorro', en ? 'Hat' : 'Gorro', '🎉'], ['corona', en ? 'Crown' : 'Corona', '👑'], ['lazo', en ? 'Bow' : 'Lazo', '🎀']];
    const accBtns = accs.map(([v, label, ic]) => `<button class="acc ${data.acc === v ? 'on' : ''}" data-acc="${v}"><span>${ic}</span>${label}</button>`).join('');
    this.openModal(`
      <h2>🎨 ${en ? 'Make it yours' : 'Hazlo tuyo'}</h2>
      <p class="sub">${en ? 'Choose colors and a look for your friend.' : 'Elige colores y un toque para tu amigo.'}</p>
      <div class="field"><label>🎨 ${en ? 'Body color' : 'Color del cuerpo'}</label><div class="swatches">${sw(bodyColors, data.body, 'body')}</div></div>
      <div class="field"><label>👀 ${en ? 'Eye color' : 'Color de los ojos'}</label><div class="swatches">${sw(eyeColors, data.eye, 'eye')}</div></div>
      <div class="field"><label>🎀 ${en ? 'Accessory' : 'Accesorio'}</label><div class="accs">${accBtns}</div></div>`);
    $('modal-close').onclick = () => this.close();
    this.body.querySelectorAll('.swatch').forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.key, val = parseInt(b.dataset.c.slice(1), 16);
      this.body.querySelectorAll(`.swatch[data-key="${key}"]`).forEach((x) => x.classList.toggle('on', x === b));
      cb(key === 'body' ? { body: val } : { eye: val });
    }));
    this.body.querySelectorAll('.acc').forEach((b) => b.addEventListener('click', () => {
      this.body.querySelectorAll('.acc').forEach((x) => x.classList.toggle('on', x === b));
      cb({ acc: b.dataset.acc });
    }));
  }

  // ── Quiz educativo ──
  openQuiz(lesson, shuffled, onAnswer, onListen, title) {
    const lang = this.i18n.lang;
    const t = this.t.bind(this);
    const opts = shuffled.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('');
    const mic = onListen ? `<button class="btn ghost" id="q-mic" style="margin-right:auto">🎤 ${t('listening')}</button>` : `<span style="margin-right:auto"></span>`;
    this.openModal(`
      <h2>${lesson.emoji} ${title || t('teach')}</h2>
      <p class="sub">${t('quiz_intro')}</p>
      <p style="font-size:1.12rem;font-weight:800;margin:6px 0 2px">${lesson.prompt[lang] || lesson.prompt.es}</p>
      <div class="opts">${opts}</div>
      <div class="row">${mic}
        <button class="btn ghost" id="q-skip">${t('cancel')}</button>
        <button class="btn" id="q-next" style="display:none">${lang === 'en' ? 'Next' : 'Siguiente'} ▶</button>
      </div>
      <div class="quiz-fact" id="q-fact"></div>`);
    $('modal-close').onclick = () => this.close();

    const buttons = this.body.querySelectorAll('.opt');
    let answered = false;
    const answer = (idx) => {
      if (answered) return;
      answered = true;
      const ok = idx === shuffled.correct;
      buttons.forEach((b, i) => {
        if (i === shuffled.correct) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
      });
      const fact = $('q-fact');
      fact.style.display = 'block';
      fact.textContent = '💡 ' + (lesson.fact[lang] || lesson.fact.es);
      $('q-next').style.display = 'inline-block';
      onAnswer(ok, lesson, idx);
    };
    buttons.forEach((b) => b.addEventListener('click', () => answer(parseInt(b.dataset.i, 10))));
    $('q-skip').onclick = () => this.close();
    $('q-next').onclick = () => onAnswer(null, lesson, null, true);
    if (onListen) $('q-mic').onclick = () => onListen((spoken) => {
      const txt = (spoken || '').toLowerCase();
      const found = shuffled.options.findIndex((o) => txt.includes(o.toLowerCase()));
      if (found >= 0) answer(found);
      else this.bubble((lang === 'en' ? 'I heard: ' : 'He oído: ') + spoken);
    });
  }

  // ── Chat (hablar) ──
  openTalk(history, onSend, onListen) {
    const lang = this.i18n.lang;
    const t = this.t.bind(this);
    const msgs = history.map((m) => `<div class="msg ${m.from === 'me' ? 'me' : 'pet'}">${m.text}</div>`).join('');
    const mic = onListen ? `<button class="btn ghost" id="c-mic">🎤</button>` : '';
    this.openModal(`
      <h2>💬 ${t('talk')}</h2>
      <p class="sub">${t('talk_intro')}</p>
      <div class="chat" id="c-chat">${msgs}</div>
      <div class="row">
        <input type="text" id="c-in" placeholder="${t('talk_ph')}" style="flex:1;padding:11px 14px;border-radius:14px;border:1px solid var(--stroke)" />
        ${mic}
        <button class="btn" id="c-send">${t('send')}</button>
      </div>`);
    $('modal-close').onclick = () => this.close();
    const chat = $('c-chat');
    const scroll = () => { chat.scrollTop = chat.scrollHeight; };
    scroll();
    const push = (text, from) => {
      const d = document.createElement('div');
      d.className = 'msg ' + (from === 'me' ? 'me' : 'pet');
      d.textContent = text;
      chat.appendChild(d); scroll();
    };
    const send = () => {
      const v = $('c-in').value.trim();
      if (!v) return;
      push(v, 'me');
      $('c-in').value = '';
      const reply = onSend(v);
      if (reply) setTimeout(() => push(reply, 'pet'), 220);
    };
    $('c-send').onclick = send;
    $('c-in').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    const lang2 = this.i18n.lang;
    if (onListen) $('c-mic').onclick = () => onListen((spoken) => {
      $('c-in').value = spoken;
      send();
    });
    setTimeout(() => { const i = $('c-in'); if (i) i.focus(); }, 60);
  }
}
