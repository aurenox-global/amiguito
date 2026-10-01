<div align="center">

# 🧠 Amiguito

**Una mascota virtual 3D para la web: adorable, con *machine learning*, educativa y con una voz amable.**

Funciona online, sin servidores, sin claves de API y sin instalar nada.

`Three.js` · `WebGL` · `Machine Learning (Q-Learning + red neuronal)` · `Web Speech API` · `Cero dependencias de runtime`

</div>

---

## ✨ ¿Qué es Amiguito?

Amiguito es un **amigo virtual** en el navegador, un primito moderno del Tamagotchi. Es una criatura 3D
adorable que **tiene vida propia**: come, juega, duerme, se aburre, se ensucia, aprende y te busca cuando
necesita mimos. Además **te enseña cosas** y te **habla con una voz amable**.

No es un decorado: por dentro tiene un pequeño cerebro que **aprende de verdad**.

## 🧬 La criatura (3D, sin errores)

- Modelo **generado por código** con geometrías de Three.js: **no hay archivos `.glb`/`.fbx` que puedan faltar**, por lo que no hay errores de carga.
- Cuerpo *blob* suave, ojos grandes con pupilas que **siguen tu cursor**, mejillas, antenas luminosas, bracitos, pies y colita.
- **Animaciones suaves** con máquina de estados + *one-shots* (saltar, girar, comer, saludar, ponerse triste…), *squash & stretch*, respiración, parpadeo aleatorio y sombra de contacto.
- Iluminación cuidada (hemisférica + direccional con sombras suaves), plataforma y jardín decorados.
- Se renderiza a pantalla completa y se adapta a móvil (incluye modo sin animaciones para accesibilidad).

## 🤖 Machine Learning de verdad ("vida propia")

El "cerebro" del amiguito vive en `src/brain/` y **no usa librerías**: es código propio, pequeño y testeado.

1. **Aprendizaje por refuerzo — Q-Learning tabular** (`brain/qlearning.js`)
   Discretiza su estado (hambre, energía, ánimo, aburrimiento, limpieza) y aprende, por prueba y error,
   **qué acción le conviene** en cada situación (descansar, pasear, jugar solo, reflexionar, buscarte,
   acicalarse). Actualiza con la ecuación de Bellman y usa *ε-greedy* con decaimiento. Con el tiempo,
   su comportamiento **cambia de forma visible**: aprende a jugar solo cuando se aburre o a buscarte
   cuando está solo.
2. **Red neuronal propia — MLP con retropropagación** (`brain/neural.js`)
   La usamos como **auto-modelo**: la criatura predice cómo se siente a partir de sus necesidades y
   ajusta sus pesos con descenso de gradiente. Incluye *forward*, *backprop* y serialización.
3. **Personalidad que evoluciona** (`brain/personality.js`)
   Rasgos (curiosidad, energía, sociabilidad, apetito, juguetón, pulcritud) que **derivan despacio según
   cómo la cuidas** y modulan sus recompensas y su temperamento (explorador, mimoso, gourmet, soñador).
4. **Aprendizaje adaptativo educativo** — **repetición espaciada tipo SM-2** (`src/spaced.js`):
   repasa lo que peor sabe y menos lo que ya domina.

Todo el aprendizaje **se guarda** en `localStorage`: al volver, tu amiguito recuerda.

## 🎓 Educativo y amigable

- **Lecciones bilingües** (español/inglés): colores, números, matemáticas, animales, ciencia, vocabulario y letras.
- Responde por **clic o por voz**: lee la pregunta, escucha tu respuesta con el micrófono y te corrige con cariño.
- **Dato curioso** después de cada respuesta y refuerzo positivo (se alegra si aciertas, te anima si fallas).

## 🗣️ Voz amable

- **Voz integrada del navegador (Web Speech API)**: sin claves, sin coste, funciona online.
- Elige voces femeninas/suaves cuando existen, con **tono agudo adorable** y velocidad ajustable.
- **Reconocimiento de voz** opcional para charlar y responder el quiz.

## 💛 Sistema tipo Tamagotchi

Hambre, energía, alegría, limpieza y salud decaen con el **tiempo real**: si cierras la web, **sigue viviendo**
(hasta una semana de vida mientras no estás). Cuídalo y crecerá; descuidado, se pondrá triste o enfermo.

## 🚀 Cómo usarlo

### En local (2 comandos)
```bash
npm start        # servidor estático sin dependencias → http://localhost:5173
npm test         # 15 tests del cerebro y el sistema de necesidades
```
> Requiere Node 18+ solo para el servidor de desarrollo. La app en sí **no necesita build**: es HTML + ES Modules.

### Online (GitHub Pages)
El repositorio incluye `.github/workflows/pages.yml`. Al hacer *push* a `main`, se publica automáticamente.
Necesitas activar Pages con origen **GitHub Actions** en *Settings → Pages*.

## 🗂️ Estructura

```
amiguito/
├── index.html              # estructura + import map de Three.js
├── styles.css              # interfaz pastel, responsive
├── assets/favicon.svg
├── src/
│   ├── main.js             # escena 3D, ciclo de vida, wiring
│   ├── creature.js         # criatura 3D + animaciones
│   ├── needs.js            # sistema Tamagotchi (necesidades)
│   ├── education.js        # contenido educativo bilingüe
│   ├── spaced.js           # repetición espaciada (SM-2)
│   ├── voice.js            # Web Speech API (voz + reconocimiento)
│   ├── i18n.js             # español / inglés
│   ├── store.js            # guardado, exportar/importar
│   ├── ui.js               # HUD, burbujas, diario, ventanas
│   └── brain/
│       ├── neural.js       # MLP con backprop
│       ├── qlearning.js    # Q-Learning (refuerzo)
│       └── personality.js  # rasgos + auto-modelo
├── tests/                  # node --test (sin frameworks)
├── tools/serve.mjs         # servidor estático mínimo
└── .github/workflows/      # despliegue a GitHub Pages
```

## 🧪 Calidad

- **15 tests** unitarios (`node --test`) cubren la red neuronal (aprende XOR), Q-Learning (elige la mejor acción),
  el sistema de necesidades (decaimiento y límites), la repetición espaciada y la personalidad.
- Código modular, comentado en español, **sin dependencias de runtime**.

## 🛣️ Roadmap

- [ ] Más materias (música, geografía) y niveles de dificultad.
- [ ] Exportar/importar el "ADN" del amiguito para compartirlo.
- [ ] Modo "dos amiguitos" que interactúan entre sí.
- [ ] Integrar un LLM opcional para conversaciones libres (manteniendo el modo local por defecto).

## 📄 Licencia

MIT © 2026 Andrés · aurenox-global

---

<details>
<summary><b>English</b></summary>

**Amiguito** is an adorable 3D virtual pet for the web with genuine machine learning (tabular Q-Learning +
a from-scratch neural net), a Tamagotchi-style needs system, bilingual educational mini-games and a friendly
browser voice. It runs entirely in the browser with no build step, no servers and no API keys.

```bash
npm start   # http://localhost:5173
npm test    # 15 unit tests
```

Push to `main` to deploy to GitHub Pages (enable *Settings → Pages → GitHub Actions*).

</details>
