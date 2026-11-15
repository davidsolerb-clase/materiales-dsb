// El banco de trabajo: lienzo 3D propio del taller de montaje.
// Lleva la cámara, las animaciones y las «dianas»: los sitios que se pueden
// tocar (huecos donde va una pieza, tornillos, palancas, botones).
//
// Solo se vuelve a pintar cuando algo cambia, para no cansar a los
// ordenadores modestos.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const quieto = matchMedia("(prefers-reduced-motion: reduce)");
export const suave = (t) => t * t * (3 - 2 * t);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const COLOR = { guia: 0xc6f432, neutra: 0x8fb4ff };

export class Banco {
  constructor() {
    this.lienzo = document.createElement("canvas");
    this.lienzo.className = "lienzo";
    this.lienzo.setAttribute("aria-hidden", "true");
    this.render = new THREE.WebGLRenderer({ canvas: this.lienzo, antialias: true, alpha: true }); // lanza un error si no hay WebGL
    this.render.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.render.toneMapping = THREE.ACESFilmicToneMapping;
    this.render.toneMappingExposure = 1.05;
    this.render.shadowMap.enabled = true;
    this.render.shadowMap.type = THREE.PCFSoftShadowMap;
    this.render.shadowMap.autoUpdate = false;

    this.escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.render);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    this.escena.environmentIntensity = 0.85;
    const foco = new THREE.DirectionalLight(0xffffff, 1.9);
    foco.position.set(-30, 110, 60);
    foco.castShadow = true;
    foco.shadow.mapSize.set(2048, 2048);
    Object.assign(foco.shadow.camera, { left: -115, right: 95, top: 80, bottom: -70, near: 10, far: 260 });
    foco.shadow.bias = -0.0004;
    foco.shadow.normalBias = 0.06;
    const relleno = new THREE.DirectionalLight(0x9db8ff, 0.45);
    relleno.position.set(60, 40, -50);
    this.escena.add(foco, relleno);
    this.foco = foco;
    this.tiempos = []; // lo que tarda cada pintado, para detectar ordenadores lentos

    this.camara = new THREE.PerspectiveCamera(34, 1, 1, 700);
    this.camara.position.set(20, 90, 95);
    this.mandos = new OrbitControls(this.camara, this.lienzo);
    Object.assign(this.mandos, { enableDamping: true, dampingFactor: 0.1, rotateSpeed: 0.8, minDistance: 9, maxDistance: 210, maxPolarAngle: 1.5, zoomSpeed: 0.9 });
    this.mandos.addEventListener("change", () => (this.sucio = true));
    this.mandos.addEventListener("start", () => {
      this.animaciones = this.animaciones.filter((a) => a.canal !== "camara");
      this.lienzo.dispatchEvent(new CustomEvent("tocado", { bubbles: true }));
    });

    this.animaciones = [];
    this.giratorios = [];
    this.dianas = new Map();
    this.activas = new Set();
    this.rapido = false;
    this.sucio = true;
    this.sombras = true;
    this.alTocar = () => {};

    this.rayo = new THREE.Raycaster();
    let abajo = null;
    this.lienzo.addEventListener("pointerdown", (e) => (abajo = [e.clientX, e.clientY]));
    this.lienzo.addEventListener("pointerup", (e) => {
      if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 7) return;
      abajo = null;
      this.alTocar(this.dianaEn(e.clientX, e.clientY));
    });

    this.reloj = new THREE.Clock();
    this.observador = new ResizeObserver(() => this.ajustar());
    this.render.setAnimationLoop(() => this.pintar());
  }

  montar(contenedor) {
    contenedor.prepend(this.lienzo);
    this.observador.observe(contenedor);
    this.ajustar();
  }

  ajustar() {
    const caja = this.lienzo.parentElement;
    if (!caja || !caja.clientWidth || !caja.clientHeight) return;
    this.render.setSize(caja.clientWidth, caja.clientHeight, false);
    this.camara.aspect = caja.clientWidth / caja.clientHeight;
    this.camara.updateProjectionMatrix();
    this.sucio = true;
  }

  destruir() {
    this.render.setAnimationLoop(null);
    this.observador.disconnect();
    this.mandos.dispose();
    this.escena.traverse((o) => {
      o.geometry?.dispose?.();
      for (const m of [o.material].flat()) {
        m?.map?.dispose?.();
        m?.dispose?.();
      }
    });
    this.render.dispose();
    this.render.forceContextLoss?.();
    this.lienzo.remove();
  }

  // ---------------------------------------------------------------- Animaciones

  // Llama a paso(k) con k de 0 a 1 durante `ms`. Con `rapido`, salta al final.
  anima(ms, paso, fin, canal) {
    if (this.rapido || quieto.matches || ms <= 0) {
      paso(1);
      fin?.();
      this.sucio = this.sombras = true;
      return;
    }
    if (canal) this.animaciones = this.animaciones.filter((a) => a.canal !== canal);
    this.animaciones.push({ t: 0, ms, paso, fin, canal });
  }

  // Lleva un objeto a una posición (y giro) de su padre. `arco` lo levanta por el camino.
  mueve(objeto, { a, giro, ms = 550, arco = 0, fin } = {}) {
    const p0 = objeto.position.clone();
    const q0 = objeto.quaternion.clone();
    const p1 = a ? a.clone() : p0;
    this.anima(ms, (k) => {
      const e = suave(k);
      objeto.position.lerpVectors(p0, p1, e);
      objeto.position.y += Math.sin(Math.PI * e) * arco;
      if (giro) objeto.quaternion.slerpQuaternions(q0, giro, e);
    }, fin);
  }

  // Deja caer un objeto en su sitio desde `desde` (desplazamiento respecto al destino).
  encaja(objeto, desde = V(0, 10, 0), ms = 520, fin) {
    const destino = objeto.position.clone();
    objeto.position.add(desde);
    objeto.visible = true;
    this.mueve(objeto, { a: destino, ms, fin });
  }

  ver(pos, objetivo, ms = 900) {
    const p0 = this.camara.position.clone();
    const t0 = this.mandos.target.clone();
    this.anima(ms, (k) => {
      const e = suave(k);
      this.camara.position.lerpVectors(p0, pos, e);
      this.mandos.target.lerpVectors(t0, objetivo, e);
    }, null, "camara");
  }

  // ---------------------------------------------------------------- Dianas

  // Un sitio que se puede tocar. `en` es el objeto del que cuelga, `pos` y `tam`
  // van en las medidas de ese objeto. tipo: "zona" (hueco para una pieza) o
  // "punto" (tornillo, palanca, botón).
  diana(id, { en, pos = [0, 0, 0], tam = [2, 2, 2], tipo = "zona", holgura = 0.6 }) {
    this.quitaDiana(id);
    const [w, h, d] = tam;
    const vol = new THREE.Mesh(new THREE.BoxGeometry(w + holgura * 2, h + holgura * 2, d + holgura * 2), new THREE.MeshBasicMaterial({ visible: false }));
    vol.position.set(...pos);
    vol.userData.diana = id;
    let marca;
    if (tipo === "zona") {
      const geo = new THREE.BoxGeometry(w, h, d);
      marca = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COLOR.guia, transparent: true, opacity: 0.25, depthTest: false, depthWrite: false }));
      const borde = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: COLOR.guia, depthTest: false, transparent: true }));
      borde.renderOrder = 31;
      marca.add(borde);
    } else {
      marca = new THREE.Sprite(new THREE.SpriteMaterial({ map: aro(), color: COLOR.guia, depthTest: false, transparent: true }));
      marca.scale.setScalar(Math.max(w, h, d) * 1.5 + 1);
    }
    marca.renderOrder = 30;
    marca.visible = false;
    vol.add(marca);
    en.add(vol);
    const d0 = { id, vol, marca, tipo };
    this.dianas.set(id, d0);
    return d0;
  }

  quitaDiana(id) {
    const d = this.dianas.get(id);
    if (!d) return;
    d.vol.removeFromParent();
    this.dianas.delete(id);
    this.activas.delete(d);
  }

  // Deja tocables solo estas dianas. `marcas`: "guia" (se iluminan), "neutra" o null.
  activa(ids, marcas = "guia") {
    for (const d of this.activas) d.marca.visible = false;
    this.activas = new Set();
    for (const id of ids) {
      const d = this.dianas.get(id);
      if (!d) continue;
      this.activas.add(d);
      d.marca.visible = !!marcas;
      if (marcas) {
        d.marca.material.color.set(COLOR[marcas]);
        d.marca.children[0]?.material.color.set(COLOR[marcas]);
      }
    }
    this.sucio = true;
  }

  dianaEn(x, y) {
    const r = this.lienzo.getBoundingClientRect();
    const punto = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.rayo.setFromCamera(punto, this.camara);
    const toque = this.rayo.intersectObjects([...this.activas].map((d) => d.vol), false)[0];
    return toque ? toque.object.userData.diana : null;
  }

  // ---------------------------------------------------------------- Miniaturas

  // Foto pequeña de un objeto suelto, para la bandeja de piezas.
  miniatura(objeto, [giro, altura] = [35, 30]) {
    const escena = new THREE.Scene();
    escena.environment = this.escena.environment;
    const foco = new THREE.DirectionalLight(0xffffff, 1.8);
    foco.position.set(3, 6, 4);
    escena.add(foco, objeto);
    const caja = new THREE.Box3().setFromObject(objeto);
    const centro = caja.getCenter(V(0, 0, 0));
    const d = caja.getSize(V(0, 0, 0)).length() * 1.55;
    const camara = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 1000);
    const [g, a] = [giro, altura].map(THREE.MathUtils.degToRad);
    camara.position.set(centro.x + Math.sin(g) * Math.cos(a) * d, centro.y + Math.sin(a) * d, centro.z + Math.cos(g) * Math.cos(a) * d);
    camara.lookAt(centro);
    const tam = this.render.getSize(new THREE.Vector2());
    const pr = this.render.getPixelRatio();
    this.render.setPixelRatio(1);
    this.render.setSize(240, 180, false);
    this.render.render(escena, camara);
    const url = this.lienzo.toDataURL("image/webp", 0.85);
    this.render.setPixelRatio(pr);
    this.render.setSize(tam.x, tam.y, false);
    escena.remove(objeto);
    this.sucio = true;
    return url;
  }

  // ---------------------------------------------------------------- Pintar

  pintar() {
    if (!this.lienzo.isConnected || document.hidden) return;
    const dt = Math.min(this.reloj.getDelta(), 0.1);
    if (this.animaciones.length) {
      for (const a of [...this.animaciones]) {
        a.t += dt * 1000;
        const k = Math.min(1, a.t / a.ms);
        a.paso(k);
        if (k === 1) {
          this.animaciones = this.animaciones.filter((x) => x !== a);
          a.fin?.();
        }
      }
      this.sucio = this.sombras = true;
    }
    if (this.encendido && !quieto.matches) {
      for (const o of this.giratorios) o.rotation.y -= o.userData.gira * Math.PI * 2 * dt * 2.2;
      this.sucio = true;
    }
    if (this.activas.size) {
      const pulso = 0.5 + 0.5 * Math.sin(performance.now() / 240);
      for (const d of this.activas) {
        if (!d.marca.visible) continue;
        d.marca.material.opacity = d.tipo === "zona" ? 0.14 + 0.2 * pulso : 0.65 + 0.35 * pulso;
        this.sucio = true;
      }
    }
    if (this.mandos.update()) this.sucio = true;
    if (!this.sucio) return (this.seguido = false);
    if (this.seguido) this.mide(dt * 1000); // tiempo entre dos pintados seguidos
    this.seguido = true;
    if (this.sombras) this.render.shadowMap.needsUpdate = true;
    this.sucio = this.sombras = false;
    this.render.render(this.escena, this.camara);
  }

  // Si el ordenador va justo, se quitan las sombras y se baja la resolución.
  mide(ms) {
    if (!this.tiempos || this.rapido) return;
    this.tiempos.push(ms);
    if (this.tiempos.length < 24) return;
    const medio = this.tiempos.slice(4).reduce((a, b) => a + b, 0) / (this.tiempos.length - 4);
    this.tiempos = null;
    if (medio < 40) return; // va a más de 25 imágenes por segundo
    this.foco.castShadow = false;
    this.render.shadowMap.enabled = false;
    this.render.setPixelRatio(1);
    this.escena.traverse((o) => o.material && [o.material].flat().forEach((m) => (m.needsUpdate = true)));
    this.ajustar();
  }
}

let aroHecho;
function aro() {
  if (!aroHecho) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    x.strokeStyle = "#fff";
    x.lineWidth = 12;
    x.beginPath();
    x.arc(64, 64, 50, 0, 7);
    x.stroke();
    x.fillStyle = "rgba(255,255,255,.28)";
    x.beginPath();
    x.arc(64, 64, 44, 0, 7);
    x.fill();
    aroHecho = new THREE.CanvasTexture(c);
  }
  return aroHecho;
}
