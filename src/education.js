// Contenido educativo bilingüe. Cada lección tiene pregunta, opciones y un dato curioso.
// El orden de las opciones se baraja al presentarlas, así el índice "correct" se recalcula.
export const LESSONS = [
  { id: 'col_red', cat: 'colors', emoji: '🎨',
    prompt: { es: '¿De qué color es el sol?', en: 'What color is the sun?' },
    opts: { es: ['Amarillo', 'Azul', 'Verde'], en: ['Yellow', 'Blue', 'Green'] }, correct: 0,
    fact: { es: 'El sol parece amarillo porque mezcla todos los colores de la luz.', en: 'The sun looks yellow because it mixes all the colors of light.' } },
  { id: 'col_sky', cat: 'colors', emoji: '🎨',
    prompt: { es: '¿De qué color es el cielo en un día despejado?', en: 'What color is a clear sky?' },
    opts: { es: ['Rojo', 'Azul celeste', 'Negro'], en: ['Red', 'Sky blue', 'Black'] }, correct: 1,
    fact: { es: 'El cielo es azul porque el aire dispersa más la luz azul.', en: 'The sky is blue because air scatters blue light more.' } },
  { id: 'col_mix', cat: 'colors', emoji: '🎨',
    prompt: { es: 'Si mezclas rojo y amarillo, ¿qué color sale?', en: 'Red plus yellow makes which color?' },
    opts: { es: ['Morado', 'Naranja', 'Rosa'], en: ['Purple', 'Orange', 'Pink'] }, correct: 1,
    fact: { es: '¡El naranja! Como una naranja de verdad 🍊', en: 'Orange! Just like the fruit 🍊' } },
  { id: 'num_1', cat: 'numbers', emoji: '🔢',
    prompt: { es: '¿Cuántos lados tiene un triángulo?', en: 'How many sides does a triangle have?' },
    opts: { es: ['3', '4', '5'], en: ['3', '4', '5'] }, correct: 0,
    fact: { es: 'Tri- significa tres. ¡Tres lados y tres esquinas!', en: 'Tri- means three. Three sides and three corners!' } },
  { id: 'num_even', cat: 'numbers', emoji: '🔢',
    prompt: { es: '¿Cuál de estos números es par?', en: 'Which of these numbers is even?' },
    opts: { es: ['7', '10', '13'], en: ['7', '10', '13'] }, correct: 1,
    fact: { es: 'Los pares se pueden repartir en dos grupos iguales.', en: 'Even numbers split into two equal groups.' } },
  { id: 'math_add', cat: 'math', emoji: '➕',
    prompt: { es: '¿Cuánto es 2 + 3?', en: 'What is 2 + 3?' },
    opts: { es: ['4', '5', '6'], en: ['4', '5', '6'] }, correct: 1,
    fact: { es: 'Sumar es juntar cantidades en una sola.', en: 'Adding means putting amounts together.' } },
  { id: 'math_carry', cat: 'math', emoji: '➕',
    prompt: { es: '¿Cuánto es 7 + 5?', en: 'What is 7 + 5?' },
    opts: { es: ['11', '12', '13'], en: ['11', '12', '13'] }, correct: 1,
    fact: { es: '7 + 5 = 12. ¡Pasa de diez por dos!', en: '7 + 5 = 12. Two past ten!' } },
  { id: 'math_double', cat: 'math', emoji: '✖️',
    prompt: { es: '¿Cuánto es 4 × 2?', en: 'What is 4 × 2?' },
    opts: { es: ['6', '8', '10'], en: ['6', '8', '10'] }, correct: 1,
    fact: { es: 'Multiplicar por 2 es sumar el número consigo mismo.', en: 'Times 2 is the number added to itself.' } },
  { id: 'ani_dog', cat: 'animals', emoji: '🐶',
    prompt: { es: '¿Qué animal dice "guau"?', en: 'Which animal says "woof"?' },
    opts: { es: ['El gato', 'El perro', 'La vaca'], en: ['The cat', 'The dog', 'The cow'] }, correct: 1,
    fact: { es: '¡El perro! Es un gran amigo de las personas.', en: 'The dog! A great friend to people.' } },
  { id: 'ani_bird', cat: 'animals', emoji: '🐦',
    prompt: { es: '¿Qué animal puede volar?', en: 'Which animal can fly?' },
    opts: { es: ['El pez', 'El pájaro', 'El caballo'], en: ['The fish', 'The bird', 'The horse'] }, correct: 1,
    fact: { es: 'Los pájaros tienen plumas y alas ligeras.', en: 'Birds have feathers and light wings.' } },
  { id: 'sci_water', cat: 'science', emoji: '🔬',
    prompt: { es: '¿En qué se convierte el agua cuando se congela?', en: 'What does water become when it freezes?' },
    opts: { es: ['Vapor', 'Hielo', 'Arena'], en: ['Steam', 'Ice', 'Sand'] }, correct: 1,
    fact: { es: 'A 0 °C el agua se congela y se hace hielo.', en: 'At 0 °C water freezes into ice.' } },
  { id: 'sci_plants', cat: 'science', emoji: '🌱',
    prompt: { es: '¿Qué necesitan las plantas para crecer?', en: 'What do plants need to grow?' },
    opts: { es: ['Luz y agua', 'Solo oscuridad', 'Chocolate'], en: ['Light and water', 'Only darkness', 'Chocolate'] }, correct: 0,
    fact: { es: 'Con luz y agua las plantas fabrican su comida.', en: 'With light and water plants make their own food.' } },
  { id: 'sci_earth', cat: 'science', emoji: '🌍',
    prompt: { es: '¿Cómo se llama nuestro planeta?', en: 'What is our planet called?' },
    opts: { es: ['Marte', 'La Tierra', 'La Luna'], en: ['Mars', 'Earth', 'The Moon'] }, correct: 1,
    fact: { es: 'La Tierra es el único lugar donde conocemos vida.', en: 'Earth is the only place we know with life.' } },
  { id: 'word_casa', cat: 'words', emoji: '🗣️',
    prompt: { es: '¿Cómo se dice "casa" en inglés?', en: 'How do you say "house" in Spanish?' },
    opts: { es: ['House', 'Horse', 'Mouse'], en: ['Casa', 'Caballo', 'Ratón'] }, correct: 0,
    fact: { es: 'House = casa. ¡Suenan parecido!', en: 'Casa = house. They sound a bit alike!' } },
  { id: 'word_agua', cat: 'words', emoji: '🗣️',
    prompt: { es: '¿Cómo se dice "agua" en inglés?', en: 'How do you say "water" in Spanish?' },
    opts: { es: ['Wind', 'Water', 'Wood'], en: ['Viento', 'Agua', 'Madera'] }, correct: 1,
    fact: { es: 'Water = agua. La necesitamos todos los días.', en: 'Agua = water. We need it every day.' } },
  { id: 'word_amigo', cat: 'words', emoji: '🗣️',
    prompt: { es: '¿Cómo se dice "amigo" en inglés?', en: 'How do you say "friend" in Spanish?' },
    opts: { es: ['Family', 'Friend', 'Fruit'], en: ['Familia', 'Amigo', 'Fruta'] }, correct: 1,
    fact: { es: 'Friend = amigo. ¡Tú eres mi amigo! 💛', en: 'Amigo = friend. You are my friend! 💛' } },
  { id: 'let_1', cat: 'letters', emoji: '🔤',
    prompt: { es: '¿Con qué letra empieza "mariposa"?', en: 'Which letter does "butterfly" start with?' },
    opts: { es: ['M', 'P', 'S'], en: ['B', 'M', 'K'] }, correct: 0,
    fact: { es: '¡Con la M! Mmm… mariposa. 🦋', en: 'With B! B… butterfly. 🦋' } },
  { id: 'let_2', cat: 'letters', emoji: '🔤',
    prompt: { es: '¿Cuántas letras tiene la palabra "sol"?', en: 'How many letters are in "sun"?' },
    opts: { es: ['2', '3', '4'], en: ['2', '3', '4'] }, correct: 1,
    fact: { es: 'S-O-L: tres letras que dan mucho calor ☀️', en: 'S-U-N: three letters full of warmth ☀️' } }
];

export const CATEGORIES = ['colors', 'numbers', 'math', 'animals', 'science', 'words', 'letters'];

// Materias del "colegio" de Amiguito. Cada una vive en data/<id>.json (bilingüe).
export const SUBJECTS = [
  { id: 'basics', icon: '🌟', name: { es: 'Básicos', en: 'Basics' } },
  { id: 'math', icon: '🔢', name: { es: 'Matemáticas', en: 'Math' } },
  { id: 'physics', icon: '🧲', name: { es: 'Física', en: 'Physics' } },
  { id: 'chemistry', icon: '⚗️', name: { es: 'Química', en: 'Chemistry' } },
  { id: 'programming', icon: '💻', name: { es: 'Programación', en: 'Programming' } },
  { id: 'language', icon: '🗣️', name: { es: 'Lengua', en: 'Language' } }
];

// Carga la "base de datos" de una materia desde /data/<id>.json
export async function loadSubject(id) {
  const url = new URL(`../data/${id}.json`, import.meta.url);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('materia no disponible: ' + id);
  return res.json();
}

// Baraja las opciones manteniendo la respuesta correcta.
export function shuffledOptions(lesson, lang) {
  const opts = lesson.opts[lang] || lesson.opts.es;
  const correctText = opts[lesson.correct];
  const arr = opts.map((text, i) => ({ text, i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { options: arr.map((a) => a.text), correct: arr.findIndex((a) => a.i === lesson.correct && a.text === correctText) };
}
