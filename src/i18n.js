// Textos en español e inglés. t('clave') usa el idioma activo.
const DICT = {
  es: {
    tagline: 'una criatura 3D que aprende contigo',
    mood_happy: 'Feliz', mood_ok: 'Tranquilo', mood_sad: 'Triste', mood_hungry: 'Con hambre',
    mood_tired: 'Cansado', mood_sleeping: 'Durmiendo', mood_dirty: 'Sucio', mood_sick: 'Enfermo',
    sub_happy: 'aprendiendo y jugando', sub_ok: 'a su aire', sub_sad: 'necesita mimos',
    sub_hungry: 'quiere comer algo', sub_tired: 'le pesan los párpados', sub_sleeping: 'zzz…',
    sub_dirty: 'le hace falta un baño', sub_sick: 'no se siente bien',
    food: 'Comida', energy: 'Energía', joy: 'Alegría', clean: 'Limpieza', health: 'Salud',
    feed: 'Comida', play: 'Jugar', sleep: 'Dormir', clean_act: 'Baño', teach: 'Enseñar', talk: 'Hablar',
    log_title: 'Diario',
    greet: '¡Hola! Soy {name}. ¿Jugamos o me enseñas algo?',
    ate: '¡Ñam! Gracias, estaba delicioso 😋',
    played: '¡Qué divertido! Me encanta jugar contigo 🎈',
    sleeping: 'Voy a dormir un poquito… 💤',
    woke: '¡Buenos días! He descansado genial ⚡',
    cleaned: '¡Qué limpio! Me encanta estar reluciente 🫧',
    poked: '¡Jijiji! Me haces cosquillas 💛',
    full: 'Estoy lleno, ¡gracias! Pero me gustan tus mimos 😊',
    tired_now: 'Estoy muy cansado, prefiero dormir un poco… 😴',
    learned_good: '¡Bien! Lo has bordado 🎉',
    learned_ok: '¡Casi! Lo intentamos otra vez 💪',
    learned_bad: '¡Ups! No pasa nada, se aprende fallando 🙂',
    quiz_intro: 'Vamos a aprender juntos. ¡Responde lo que puedas!',
    question: 'Pregunta',
    talk_intro: '¡Cuéntame algo! Puedo aprender tu nombre, tus colores y tus animales favoritos.',
    talk_ph: 'Escríbeme algo…',
    send: 'Enviar',
    settings: 'Ajustes', voice: 'Voz', language: 'Idioma', pitch: 'Tono de voz', rate: 'Velocidad de voz',
    save: 'Guardar', export: 'Exportar', import: 'Importar', reset: 'Empezar de cero',
    close: 'Cerrar', cancel: 'Cancelar', ok: '¡Vale!',
    reset_warn: 'Se borrará todo el progreso de tu Amiguito. ¿Seguro?',
    listening: 'Te escucho…', mic_no: 'Tu navegador no permite micrófono.',
    save_done: 'Guardado ✔', import_done: 'Progreso importado ✔', import_fail: 'No pude leer ese archivo.',
    name_learned: '¡Me encanta! Me llamo {name}, encantado 😊',
    thanks_name: '¡Gracias por contármelo! Lo recordaré 💾',
    no_understand: 'Mmm, aún no lo entiendo del todo. ¡Enséñame más cosas!',
    edu_mastery: 'Dominio', brain: 'Cerebro',
    asleep_msg: 'Estoy durmiendo… hablamos luego 💤',
    need_help: '¿Estás ahí? Me gustaría un poquito de atención 🥺',
    autonomous: {
      rest: 'descansando un momento', wander: 'explorando el jardín',
      selfplay: 'jugando solo', ponder: 'pensando cosas bonitas',
      seek: 'buscando tu mirada', groom: 'acicalándose'
    }
  },
  en: {
    tagline: 'a 3D creature that learns with you',
    mood_happy: 'Happy', mood_ok: 'Chill', mood_sad: 'Sad', mood_hungry: 'Hungry',
    mood_tired: 'Sleepy', mood_sleeping: 'Sleeping', mood_dirty: 'Dirty', mood_sick: 'Sick',
    sub_happy: 'learning and playing', sub_ok: 'doing its thing', sub_sad: 'needs some cuddles',
    sub_hungry: 'would love a snack', sub_tired: 'eyes are getting heavy', sub_sleeping: 'zzz…',
    sub_dirty: 'needs a bubble bath', sub_sick: 'is not feeling well',
    food: 'Food', energy: 'Energy', joy: 'Joy', clean: 'Clean', health: 'Health',
    feed: 'Feed', play: 'Play', sleep: 'Sleep', clean_act: 'Bath', teach: 'Teach', talk: 'Talk',
    log_title: 'Diary',
    greet: "Hi! I'm {name}. Shall we play or will you teach me something?",
    ate: 'Yum! Thank you, that was delicious 😋',
    played: 'So much fun! I love playing with you 🎈',
    sleeping: "I'll take a little nap… 💤",
    woke: 'Good morning! I feel so rested ⚡',
    cleaned: 'So clean! I love being sparkly 🫧',
    poked: 'Hee hee! That tickles 💛',
    full: "I'm full, thank you! But I do love your cuddles 😊",
    tired_now: "I'm very sleepy, I'd rather rest a bit… 😴",
    learned_good: 'Yes! You nailed it 🎉',
    learned_ok: "Almost! Let's try again 💪",
    learned_bad: "Oops! That's okay, we learn from mistakes 🙂",
    quiz_intro: "Let's learn together. Answer what you can!",
    question: 'Question',
    talk_intro: "Tell me something! I can learn your name, colors and favorite animals.",
    talk_ph: 'Write me something…',
    send: 'Send',
    settings: 'Settings', voice: 'Voice', language: 'Language', pitch: 'Voice pitch', rate: 'Voice speed',
    save: 'Save', export: 'Export', import: 'Import', reset: 'Start over',
    close: 'Close', cancel: 'Cancel', ok: 'Okay!',
    reset_warn: 'All of your Amiguito progress will be erased. Are you sure?',
    listening: "I'm listening…", mic_no: 'Your browser does not allow the microphone.',
    save_done: 'Saved ✔', import_done: 'Progress imported ✔', import_fail: "I couldn't read that file.",
    name_learned: "I love it! I'm {name}, nice to meet you 😊",
    thanks_name: "Thanks for telling me! I'll remember it 💾",
    no_understand: "Hmm, I don't quite get it yet. Teach me more things!",
    edu_mastery: 'Mastery', brain: 'Brain',
    asleep_msg: "I'm sleeping… let's talk later 💤",
    need_help: 'Are you there? I would love a little attention 🥺',
    autonomous: {
      rest: 'taking a little rest', wander: 'exploring the garden',
      selfplay: 'playing on my own', ponder: 'thinking nice thoughts',
      seek: 'looking for you', groom: 'grooming myself'
    }
  }
};

export class I18n {
  constructor(lang = 'es') { this.lang = DICT[lang] ? lang : 'es'; }
  set(lang) { if (DICT[lang]) this.lang = lang; }
  t(key, vars) {
    const parts = key.split('.');
    let cur = DICT[this.lang];
    for (const p of parts) { cur = cur && cur[p]; }
    if (cur == null) { // fallback a español
      cur = DICT.es; for (const p of parts) cur = cur && cur[p];
    }
    if (typeof cur !== 'string') return key;
    return vars ? cur.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : '')) : cur;
  }
  get other() { return this.lang === 'es' ? 'en' : 'es'; }
}
