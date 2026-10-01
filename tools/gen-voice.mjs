// Genera la lista de frases y el manifiesto de audios para la voz propia (Piper).
// Uso: node tools/gen-voice.mjs  → escribe assets/audio/manifest.json y /tmp/phrases.tsv
import { writeFileSync, mkdirSync } from 'node:fs';
import { LESSONS } from '../src/education.js';

const P = {
  greet: { es: '¡Hola! Soy Amiguito. ¿Jugamos o me enseñas algo?', en: 'Hi! I am Amiguito. Shall we play, or will you teach me something?' },
  ate: { es: '¡Ñam! Gracias, estaba delicioso.', en: 'Yum! Thank you, that was delicious.' },
  played: { es: '¡Qué divertido! Me encanta jugar contigo.', en: 'So much fun! I love playing with you.' },
  sleeping: { es: 'Voy a dormir un poquito. Hasta luego.', en: 'I will take a little nap. See you soon.' },
  woke: { es: '¡Buenos días! He descansado genial.', en: 'Good morning! I feel so rested.' },
  cleaned: { es: '¡Qué limpio! Me encanta estar reluciente.', en: 'So clean! I love being sparkly.' },
  poked: { es: '¡Jijiji! Me haces cosquillas.', en: 'Hee hee! That tickles.' },
  full: { es: 'Estoy lleno, ¡gracias! Pero me gustan tus mimos.', en: 'I am full, thank you! But I do love your cuddles.' },
  tired_now: { es: 'Estoy muy cansado, prefiero dormir un poco.', en: 'I am very sleepy, I would rather rest a bit.' },
  learned_good: { es: '¡Bien! Lo has bordado.', en: 'Yes! You nailed it.' },
  learned_bad: { es: '¡Ups! No pasa nada, se aprende fallando.', en: 'Oops! That is okay, we learn from mistakes.' },
  need_help: { es: '¿Estás ahí? Me gustaría un poquito de atención.', en: 'Are you there? I would love a little attention.' },
  ok: { es: '¡Vale!', en: 'Okay!' },
  no_understand: { es: 'Mmm, aún no lo entiendo del todo. ¡Enséñame más cosas!', en: 'Hmm, I do not quite get it yet. Teach me more things!' },
  asleep_msg: { es: 'Estoy durmiendo, hablamos luego.', en: 'I am sleeping, let us talk later.' },
  thanks_name: { es: '¡Gracias por contármelo! Lo recordaré.', en: 'Thanks for telling me! I will remember it.' },
  name_learned: { es: '¡Me encanta! Me llamo Amiguito, encantado.', en: 'I love it! I am Amiguito, nice to meet you.' },
  auto_rest: { es: 'Descansando un momento.', en: 'Taking a little rest.' },
  auto_wander: { es: 'Explorando el jardín.', en: 'Exploring the garden.' },
  auto_selfplay: { es: 'Jugando un ratito.', en: 'Playing on my own.' },
  auto_ponder: { es: 'Pensando cosas bonitas.', en: 'Thinking nice thoughts.' },
  auto_seek: { es: 'Buscando tu mirada.', en: 'Looking for you.' },
  auto_groom: { es: 'Acicalándome un poco.', en: 'Grooming myself.' }
};

const manifest = { es: [], en: [] };
const rows = [];
for (const id of Object.keys(P)) {
  for (const lang of ['es', 'en']) {
    manifest[lang].push(id);
    rows.push(`${lang}\t${id}\t${P[id][lang]}`);
  }
}
for (const l of LESSONS) {
  for (const lang of ['es', 'en']) {
    const id = 'lesson_' + l.id;
    manifest[lang].push(id);
    rows.push(`${lang}\t${id}\t${l.prompt[lang]}`);
  }
}

mkdirSync('assets/audio', { recursive: true });
writeFileSync('assets/audio/manifest.json', JSON.stringify(manifest, null, 2));
writeFileSync('/tmp/phrases.tsv', rows.join('\n') + '\n');
console.log('frases:', rows.length, '| es:', manifest.es.length, '| en:', manifest.en.length);
