// La criatura 3D: se construye por completo con geometrías de Three.js (sin modelos externos,
// así nunca falla por un archivo que falte). Expone update() para las animaciones.
import * as THREE from '../vendor/three.module.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.04 }, o));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const ONE_SHOTS = { pop: 0.5, hop: 0.75, spin: 0.9, shake: 0.6, nod: 0.7, eat: 1.1, cheer: 1.2, sad: 1.4 };

function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(18,58,51,0.42)');
  g.addColorStop(0.55, 'rgba(18,58,51,0.18)');
  g.addColorStop(1, 'rgba(18,58,51,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Creature {
  constructor() {
    this.root = new THREE.Group();
    this.t = 0;
    this.blink = 0;
    this.nextBlink = 1.6 + Math.random() * 2.4;
    this.look = { x: 0, y: 0 };      // suavizado
    this.lookTarget = { x: 0, y: 0 }; // objetivo (-1..1)
    this.act = null;                  // one-shot en curso
    this.baseY = 1.02;
    this.mood = 0.8;
    this.sleeping = false;
    this._build();
  }

  _build() {
    const g = this.root;

    // sombra de contacto (no escala con el "squash")
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 3.1),
      new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.shadow = shadow;
    g.add(shadow);

    const body = new THREE.Group();
    body.position.y = this.baseY;
    this.body = body;
    g.add(body);

    // ── cabeza (es el propio cuerpo, tipo blob) ──
    const head = new THREE.Group();
    this.head = head;
    body.add(head);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), mat(0x8ee3c8, { roughness: 0.48 }));
    headMesh.scale.set(1, 0.95, 0.97);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    head.add(headMesh);
    this.headMesh = headMesh;

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 24), mat(0xf8fceb, { roughness: 0.75 }));
    belly.scale.set(1, 0.92, 0.42);
    belly.position.set(0, -0.2, 0.66);
    head.add(belly);

    // ojos
    this.eyes = [];
    for (const sx of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(0.34 * sx, 0.17, 0.845);
      eye.lookAt(0, 0.17, 3); // mirar al frente
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 24), mat(0xffffff, { roughness: 0.25 }));
      sclera.scale.set(1, 1.06, 0.72);
      eye.add(sclera);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 18), mat(0x17323b, { roughness: 0.2 }));
      pupil.position.set(0, 0, 0.2);
      eye.add(pupil);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(0.06, 0.07, 0.29);
      eye.add(glint);
      head.add(eye);
      this.eyes.push({ group: eye, pupil, base: eye.position.clone() });
    }

    // mejillas
    for (const sx of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), mat(0xff9ec4, { roughness: 0.9, transparent: true, opacity: 0.72 }));
      cheek.scale.set(1.15, 0.7, 0.3);
      cheek.position.set(0.62 * sx, -0.16, 0.72);
      head.add(cheek);
    }

    // boca (arco que se abre/cierra): torus semicircular
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.032, 10, 28, Math.PI),
      mat(0x17323b, { roughness: 0.4 })
    );
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, -0.18, 0.9);
    this.mouth = mouth;
    head.add(mouth);

    // antenas
    this.antenna = [];
    for (const sx of [-1, 1]) {
      const a = new THREE.Group();
      a.position.set(0.24 * sx, 0.88, 0.06);
      a.rotation.z = -0.35 * sx;
      const stalk = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.34, 6, 12), mat(0x7fd6ba));
      stalk.position.y = 0.2;
      a.add(stalk);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16),
        mat(0xffe08a, { emissive: 0xffcf5c, emissiveIntensity: 0.5, roughness: 0.3 }));
      bulb.position.y = 0.42;
      a.add(bulb);
      head.add(a);
      this.antenna.push(a);
    }

    // bracitos
    this.arms = [];
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 6, 14), mat(0x8ee3c8));
      arm.position.set(0.92 * sx, -0.08, 0.06);
      arm.rotation.z = 0.5 * sx;
      arm.castShadow = true;
      body.add(arm);
      this.arms.push(arm);
    }

    // pies
    this.feet = [];
    for (const sx of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18), mat(0x74d3b4, { roughness: 0.6 }));
      foot.scale.set(1, 0.62, 1.25);
      foot.position.set(0.42 * sx, -0.92, 0.2);
      foot.castShadow = true;
      body.add(foot);
      this.feet.push(foot);
    }

    // colita
    this.tail = new THREE.Group();
    this.tail.position.set(0, -0.35, -0.9);
    const tailMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), mat(0x8ee3c8));
    tailMesh.scale.set(0.6, 0.6, 1.4);
    tailMesh.position.z = -0.25;
    this.tail.add(tailMesh);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), mat(0xffe08a, { emissive: 0xffcf5c, emissiveIntensity: 0.35 }));
    tailTip.position.z = -0.5;
    this.tail.add(tailTip);
    body.add(this.tail);
  }

  setLook(nx, ny) {
    this.lookTarget.x = clamp(nx, -1, 1);
    this.lookTarget.y = clamp(ny, -1, 1);
  }

  play(name) {
    if (!ONE_SHOTS[name]) return;
    if (this.act && this.act.name === name) return;
    this.act = { name, t: 0, dur: ONE_SHOTS[name] };
  }

  setSleeping(on) { this.sleeping = on; }

  update(dt, ctx = {}) {
    this.t += dt;
    const t = this.t;
    if (ctx.mood != null) this.mood = ctx.mood;
    const moving = !!ctx.moving;
    const sleeping = this.sleeping;

    // parpadeo
    this.nextBlink -= dt;
    if (this.nextBlink <= 0 && !sleeping) { this.blink = 0.13; this.nextBlink = 2 + Math.random() * 3.5; }
    if (this.blink > 0) this.blink = Math.max(0, this.blink - dt);

    // mirada suavizada
    this.look.x += (this.lookTarget.x - this.look.x) * Math.min(1, dt * 5);
    this.look.y += (this.lookTarget.y - this.look.y) * Math.min(1, dt * 5);

    // respiración / flotación
    const breathSpeed = sleeping ? 1.1 : 2.1;
    const breathAmt = sleeping ? 0.055 : 0.032;
    const bob = Math.sin(t * breathSpeed) * breathAmt;
    this.body.scale.set(1 + bob * 0.5, 1 + bob, 1 + bob * 0.5);
    this.body.position.y = this.baseY + (sleeping ? Math.sin(t * 1.1) * 0.02 : Math.abs(Math.sin(t * 1.4)) * 0.03);

    // caminar: pequeño salto
    if (moving) this.body.position.y += Math.abs(Math.sin(t * 7)) * 0.12;

    // cabeza: sigue el cursor + balanceo
    this.head.rotation.y = this.look.x * 0.28 + Math.sin(t * 0.7) * 0.03;
    this.head.rotation.x = -this.look.y * 0.16 + (sleeping ? 0.18 : Math.sin(t * 0.9) * 0.02);
    this.head.rotation.z = Math.sin(t * 1.1) * 0.02;

    // ojos: pupila sigue + párpados
    const blinkScale = sleeping ? 0.06 : (this.blink > 0 ? 0.08 + Math.abs(Math.sin((1 - this.blink / 0.13) * Math.PI)) * 0.4 : 1);
    // (blink: 1 -> cerrado -> 1). Simplificamos: si parpadeando, escala baja.
    const blinkY = sleeping ? 0.07 : (this.blink > 0 ? 0.1 : 1);
    for (let i = 0; i < this.eyes.length; i++) {
      const e = this.eyes[i];
      e.group.scale.y = blinkY * (1 + bob * 0.3);
      e.pupil.position.x = this.look.x * 0.05;
      e.pupil.position.y = -this.look.y * 0.045;
    }

    // boca: sonrisa según ánimo; abierta si come
    const joy = clamp((this.mood - 0.4) / 0.6, 0, 1);
    let mouthScale = 0.8 + joy * 0.5;
    this.mouth.rotation.z = Math.PI;
    this.mouth.scale.set(1, mouthScale, 1);
    this.mouth.position.y = -0.18;
    if (sleeping) { this.mouth.scale.set(0.7, 0.25, 1); }

    // antenas: ondulan
    for (let i = 0; i < this.antenna.length; i++) {
      const a = this.antenna[i];
      const sx = i === 0 ? -1 : 1;
      a.rotation.z = -0.35 * sx + Math.sin(t * 2.3 + i) * 0.12;
      a.rotation.x = Math.cos(t * 2.0 + i * 1.7) * 0.1;
    }

    // bracitos
    for (let i = 0; i < this.arms.length; i++) {
      const sx = i === 0 ? -1 : 1;
      this.arms[i].rotation.z = 0.5 * sx + Math.sin(t * 2.0 + i * 2) * 0.08;
      this.arms[i].position.y = -0.08 + Math.sin(t * 2.0 + i * 2) * 0.02;
    }

    // colita
    this.tail.rotation.y = Math.sin(t * 3.1) * (0.25 + joy * 0.35);

    // one-shot
    if (this.act) {
      this.act.t += dt;
      const p = clamp(this.act.t / this.act.dur, 0, 1);
      this._applyOneShot(this.act.name, p, dt);
      if (p >= 1) { this.act = null; this.body.rotation.set(0, 0, 0); this.body.scale.set(1, 1, 1); }
    }

    // cara triste/baja
    if (this.mood < 0.4 && !sleeping && !this.act) {
      this.head.position.y = -0.05 + Math.sin(t * 1.2) * 0.01;
      this.mouth.rotation.z = Math.PI;
      this.mouth.scale.set(1, 0.2, 1);
      this.body.rotation.z = Math.sin(t * 0.8) * 0.03;
    } else {
      this.head.position.y = this.head.position.y * 0.9;
    }
  }

  _applyOneShot(name, p, dt) {
    const body = this.body;
    const up = Math.sin(Math.PI * p); // 0->1->0
    switch (name) {
      case 'pop':
      case 'hop': {
        body.position.y += up * 0.55;
        body.scale.set(1 - up * 0.12, 1 + up * 0.16, 1 - up * 0.12);
        break;
      }
      case 'cheer': {
        body.position.y += Math.abs(Math.sin(p * Math.PI * 2)) * 0.4;
        body.rotation.y += p * Math.PI * 2;
        body.rotation.z = Math.sin(p * Math.PI * 4) * 0.12;
        break;
      }
      case 'spin': {
        body.rotation.y = p * Math.PI * 2;
        body.position.y += up * 0.2;
        break;
      }
      case 'shake': {
        body.rotation.z = Math.sin(p * Math.PI * 8) * 0.18;
        break;
      }
      case 'nod': {
        this.head.rotation.x += Math.sin(p * Math.PI * 3) * 0.25;
        break;
      }
      case 'eat': {
        const chew = Math.abs(Math.sin(p * Math.PI * 6));
        body.scale.set(1 + chew * 0.06, 1 - chew * 0.08, 1 + chew * 0.06);
        this.mouth.scale.set(1 + chew * 0.5, 0.5 + chew, 1);
        body.position.y += Math.abs(Math.sin(p * Math.PI * 3)) * 0.06;
        break;
      }
      case 'sad': {
        body.rotation.z = Math.sin(p * Math.PI * 2) * 0.06;
        body.position.y -= up * 0.1;
        this.head.position.y = -0.08;
        break;
      }
      default: break;
    }
  }
}
