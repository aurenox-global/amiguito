// La criatura 3D: se construye por completo con geometrías de Three.js (sin modelos externos,
// así nunca falla por un archivo que falte). Expone update() para las animaciones.
//
// Diseño: robot flotante esférico (naranja brillante) con visor negro y ojos azules, bracitos
// cortos con manitas de 3 dedos y una tobera oscura debajo. Flota sobre la plataforma.
import * as THREE from '../vendor/three.module.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const ONE_SHOTS = { pop: 0.5, hop: 0.75, spin: 0.9, shake: 0.6, nod: 0.7, eat: 1.1, cheer: 1.2, sad: 1.4 };

// Color del cuerpo y materiales compartidos
const ORANGE = 0xfa9720;
const DARK = 0x24242a;

function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(40,22,4,0.40)');
  g.addColorStop(0.55, 'rgba(40,22,4,0.17)');
  g.addColorStop(1, 'rgba(40,22,4,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Rounded-rect negro (visor) sobre fondo transparente: se mapea sobre un casquete esférico.
function visorTexture() {
  const w = 512, h = 340, m = 26, r = 96;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const x = m, y = m, ww = w - m * 2, hh = h - m * 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + ww, y, x + ww, y + hh, r);
  ctx.arcTo(x + ww, y + hh, x, y + hh, r);
  ctx.arcTo(x, y + hh, x, y, r);
  ctx.arcTo(x, y, x + ww, y, r);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, y, 0, y + hh);
  g.addColorStop(0, 'rgba(26,20,17,1)');
  g.addColorStop(0.45, 'rgba(9,8,11,1)');
  g.addColorStop(1, 'rgba(28,22,19,1)');
  ctx.fillStyle = g; ctx.fill();
  // brillo sutil superior (cristal)
  ctx.globalAlpha = 0.12; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.stroke();
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class Creature {
  constructor() {
    this.root = new THREE.Group();
    this.t = 0;
    this.blink = 0;
    this.nextBlink = 1.6 + Math.random() * 2.4;
    this.look = { x: 0, y: 0 };
    this.lookTarget = { x: 0, y: 0 };
    this.act = null;
    this.baseY = 1.34;
    this.mood = 0.8;
    this.sleeping = false;
    this._build();
  }

  _build() {
    const g = this.root;

    // ── sombra de contacto ──
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 3.0),
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

    const head = new THREE.Group();
    this.head = head;
    body.add(head);

    // ── materiales ──
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: ORANGE, roughness: 0.32, metalness: 0.10,
      clearcoat: 0.85, clearcoatRoughness: 0.16
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.5, metalness: 0.6 });

    // ── cuerpo: esfera naranja brillante ──
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), bodyMat);
    headMesh.scale.set(1, 0.99, 1);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    head.add(headMesh);
    this.headMesh = headMesh;

    // costura del ecuador (línea fina)
    const seam = new THREE.Mesh(
      new THREE.TorusGeometry(0.998, 0.010, 8, 96),
      new THREE.MeshStandardMaterial({ color: 0xbb6316, roughness: 0.6, metalness: 0.2 })
    );
    seam.rotation.x = Math.PI / 2;
    seam.position.y = -0.06;
    head.add(seam);

    // ── tobera debajo (flota) ──
    const nozzle = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 28), darkMat);
    nozzle.scale.set(1, 0.6, 1);
    nozzle.position.set(0, -0.92, 0);
    nozzle.castShadow = true;
    head.add(nozzle);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.032, 10, 48),
      new THREE.MeshStandardMaterial({ color: 0x51515a, roughness: 0.4, metalness: 0.7 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.89;
    head.add(ring);

    // ── visor: casquete esférico con textura de rectángulo redondeado ──
    const vGeo = new THREE.SphereGeometry(1.02, 64, 48,
      Math.PI / 2 - 0.80, 1.60,      // phi: centrado en +Z
      Math.PI / 2 - 0.50, 1.00);     // theta: banda frontal
    const visor = new THREE.Mesh(vGeo, new THREE.MeshStandardMaterial({
      map: visorTexture(), transparent: true, roughness: 0.12, metalness: 0.35,
      color: 0xffffff, side: THREE.DoubleSide
    }));
    visor.renderOrder = 1;
    head.add(visor);

    // ── ojos: anillos azules que siguen al cursor ──
    this.eyes = [];
    for (const sx of [-1, 1]) {
      const n = new THREE.Vector3(0.36 * sx, 0.16, 0.92).normalize();
      const eye = new THREE.Group();
      eye.position.copy(n).multiplyScalar(1.035);
      eye.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);

      const halo = new THREE.Mesh(new THREE.CircleGeometry(0.215, 40),
        new THREE.MeshBasicMaterial({ color: 0x2e7fe0, transparent: true, opacity: 0.20, blending: THREE.AdditiveBlending, depthWrite: false }));
      eye.add(halo);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.150, 0.195, 48),
        new THREE.MeshBasicMaterial({ color: 0x7bd8ff }));
      eye.add(ring);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.150, 40),
        new THREE.MeshStandardMaterial({ color: 0x1a5fb0, emissive: 0x1f5fc0, emissiveIntensity: 0.55, roughness: 0.35 }));
      eye.add(iris);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.070, 28),
        new THREE.MeshBasicMaterial({ color: 0x9fe4ff }));
      pupil.position.set(0, 0, 0.012);
      eye.add(pupil);

      eye.renderOrder = 2;
      head.add(eye);
      this.eyes.push({ group: eye, pupil, base: eye.position.clone() });
    }

    // boca (oculta: el diseño no lleva, pero se mantiene por compatibilidad de animaciones)
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 20, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x101010 }));
    mouth.visible = false;
    mouth.position.set(0, -0.2, 0.9);
    this.mouth = mouth;
    head.add(mouth);

    // sin antenas ni cola en este diseño (se conservan vacíos por compatibilidad)
    this.antenna = [];
    this.tail = new THREE.Group();
    body.add(this.tail);
    this.feet = [];

    // ── bracitos con manitas de 3 dedos ──
    this.arms = [];
    for (const sx of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(0.86 * sx, -0.04, 0.06);
      arm.userData.sx = sx;
      arm.userData.wave = (sx === -1); // el brazo izquierdo saluda

      const upper = new THREE.Mesh(new THREE.SphereGeometry(0.31, 32, 24), bodyMat);
      upper.scale.set(1.25, 1.0, 1.0);
      upper.position.set(0.30 * sx, 0, 0);
      upper.castShadow = true;
      arm.add(upper);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.215, 28, 22), bodyMat);
      hand.position.set(0.63 * sx, 0, 0.02);
      hand.castShadow = true;
      arm.add(hand);

      for (let k = -1; k <= 1; k++) {
        const f = new THREE.Group();
        f.position.set(0.82 * sx, 0.02 * k, 0.03);
        f.rotation.z = 0.52 * k * sx;
        f.rotation.y = -0.6 * k * sx;
        const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.15, 6, 10), bodyMat);
        seg.rotation.z = Math.PI / 2;
        seg.position.set(0.10, 0, 0);
        f.add(seg);
        const tip = new THREE.Mesh(new THREE.CapsuleGeometry(0.054, 0.06, 6, 10), darkMat);
        tip.rotation.z = Math.PI / 2;
        tip.position.set(0.21, 0, 0);
        f.add(tip);
        arm.add(f);
      }

      body.add(arm);
      this.arms.push(arm);
    }
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

    // respiración / flotación (levita)
    const breathSpeed = sleeping ? 1.1 : 2.1;
    const breathAmt = sleeping ? 0.055 : 0.032;
    const bob = Math.sin(t * breathSpeed) * breathAmt;
    this.body.scale.set(1 + bob * 0.5, 1 + bob, 1 + bob * 0.5);
    this.body.position.y = this.baseY + (sleeping ? Math.sin(t * 1.1) * 0.03 : Math.sin(t * 1.5) * 0.05);

    // desplazarse: rebote suave
    if (moving) this.body.position.y += Math.abs(Math.sin(t * 7)) * 0.10;

    // cabeza: sigue el cursor + balanceo
    this.head.rotation.y = this.look.x * 0.26 + Math.sin(t * 0.7) * 0.03;
    this.head.rotation.x = -this.look.y * 0.15 + (sleeping ? 0.16 : Math.sin(t * 0.9) * 0.02);
    this.head.rotation.z = Math.sin(t * 1.1) * 0.02;

    // ojos: parpadeo (se aplastan) + la pupila sigue al cursor
    const blinkY = sleeping ? 0.08 : (this.blink > 0 ? 0.12 : 1);
    for (let i = 0; i < this.eyes.length; i++) {
      const e = this.eyes[i];
      e.group.scale.y = blinkY * (1 + bob * 0.3);
      e.pupil.position.x = this.look.x * 0.05;
      e.pupil.position.y = -this.look.y * 0.045;
    }

    // bracitos: uno saluda, el otro se balancea
    for (let i = 0; i < this.arms.length; i++) {
      const arm = this.arms[i];
      const sx = arm.userData.sx;
      if (arm.userData.wave && !sleeping) {
        arm.rotation.z = -1.12 + Math.sin(t * 5.5) * 0.26;
        arm.rotation.x = 0.10 + Math.cos(t * 5.5) * 0.12;
      } else {
        arm.rotation.z = -0.38 * sx + Math.sin(t * 1.9 + i) * 0.09;
        arm.rotation.x = Math.sin(t * 1.5 + i * 1.3) * 0.10;
      }
      arm.position.y = -0.04 + Math.sin(t * 2.0 + i * 2) * 0.02;
    }

    // one-shot
    if (this.act) {
      this.act.t += dt;
      const p = clamp(this.act.t / this.act.dur, 0, 1);
      this._applyOneShot(this.act.name, p, dt);
      if (p >= 1) { this.act = null; this.body.rotation.set(0, 0, 0); this.body.scale.set(1, 1, 1); }
    }

    // ánimo bajo
    if (this.mood < 0.4 && !sleeping && !this.act) {
      this.head.position.y = -0.05 + Math.sin(t * 1.2) * 0.01;
      this.body.rotation.z = Math.sin(t * 0.8) * 0.03;
    } else {
      this.head.position.y = this.head.position.y * 0.9;
    }
  }

  _applyOneShot(name, p, dt) {
    const body = this.body;
    const up = Math.sin(Math.PI * p);
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
