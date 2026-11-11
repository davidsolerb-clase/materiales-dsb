// Visor 3D: un solo lienzo WebGL que se mueve de pantalla en pantalla.
// Construye las piezas con modelos/, las deja girar, las abre para ver el
// interior y avisa cuando se toca una parte. Si el navegador no tiene WebGL,
// `visor.ok` es false y la app enseña una imagen fija.
//
// Eventos que lanza el lienzo (suben por el DOM):
//   "tocado"  alguien ha empezado a girar la pieza
//   "parte"   se ha tocado una parte con nombre; detail = id

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { construir } from "./modelos/index.js";

const CAMPO = 32; // ángulo de la cámara, en grados
const PAUSA_GIRO = 4000; // ms sin tocar antes de volver a girar sola
const quieto = matchMedia("(prefers-reduced-motion: reduce)");
const suave = (t) => t * t * (3 - 2 * t);

export class Visor {
  constructor() {
    this.lienzo = document.createElement("canvas");
    this.lienzo.className = "lienzo";
    this.lienzo.setAttribute("aria-hidden", "true");
    this.hechos = new Map(); // id de pieza -> modelo preparado
    this.ok = false;
    this.apertura = 0;
    this.meta = 0;

    try {
      this.render = new THREE.WebGLRenderer({ canvas: this.lienzo, antialias: true, alpha: true });
    } catch {
      return;
    }
    this.ok = true;
    this.render.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.render.toneMapping = THREE.ACESFilmicToneMapping;
    this.render.toneMappingExposure = 1.1;

    this.escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.render);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    const foco = new THREE.DirectionalLight(0xffffff, 1.7);
    foco.position.set(3, 6, 4);
    const relleno = new THREE.DirectionalLight(0x9db8ff, 0.5);
    relleno.position.set(-4, 2, -3);
    this.escena.add(foco, relleno);

    this.camara = new THREE.PerspectiveCamera(CAMPO, 1, 0.05, 60);
    this.pivote = new THREE.Group();
    this.escena.add(this.pivote);

    this.mandos = new OrbitControls(this.camara, this.lienzo);
    this.mandos.enablePan = false;
    this.mandos.enableDamping = true;
    this.mandos.dampingFactor = 0.09;
    this.mandos.rotateSpeed = 0.9;
    this.mandos.autoRotateSpeed = 1.4;
    this.mandos.minPolarAngle = 0.12;
    this.mandos.maxPolarAngle = Math.PI - 0.12;
    this.mandos.addEventListener("start", () => {
      clearTimeout(this.espera);
      this.mandos.autoRotate = false;
      this.lienzo.dispatchEvent(new CustomEvent("tocado", { bubbles: true }));
    });
    this.mandos.addEventListener("end", () => {
      clearTimeout(this.espera);
      this.espera = setTimeout(() => (this.mandos.autoRotate = this.girar && !quieto.matches), PAUSA_GIRO);
    });

    // Un toque sin arrastrar elige una parte.
    this.rayo = new THREE.Raycaster();
    let abajo = null;
    this.lienzo.addEventListener("pointerdown", (e) => (abajo = [e.clientX, e.clientY]));
    this.lienzo.addEventListener("pointerup", (e) => {
      if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 6) return;
      const id = this.parteEn(e.clientX, e.clientY);
      if (id) this.lienzo.dispatchEvent(new CustomEvent("parte", { bubbles: true, detail: id }));
    });

    this.reloj = new THREE.Clock();
    this.observador = new ResizeObserver(() => this.ajustar());
    this.render.setAnimationLoop(() => this.pintar());
  }

  // Coloca el lienzo dentro de un elemento de la página.
  montar(contenedor) {
    if (!this.ok || this.lienzo.parentElement === contenedor) return;
    this.observador.disconnect();
    contenedor.prepend(this.lienzo);
    this.observador.observe(contenedor);
    this.ajustar();
  }

  ajustar() {
    const caja = this.lienzo.parentElement;
    if (!caja) return;
    const ancho = caja.clientWidth;
    const alto = caja.clientHeight;
    if (!ancho || !alto) return;
    this.render.setSize(ancho, alto, false);
    this.camara.aspect = ancho / alto;
    this.camara.updateProjectionMatrix();
    this.encuadrar(false);
  }

  // Distancia a la que la pieza cabe entera en pantalla.
  distancia() {
    const medio = THREE.MathUtils.degToRad(CAMPO / 2);
    const vertical = 1 / Math.sin(medio);
    const horizontal = 1 / Math.sin(Math.atan(Math.tan(medio) * this.camara.aspect));
    const holgura = this.modelo ? THREE.MathUtils.lerp(1, this.modelo.holgura, suave(this.apertura)) : 1;
    return Math.max(vertical, horizontal) * 0.9 * (this.zoom || 1) * holgura;
  }

  encuadrar(reiniciar = true) {
    const d = this.distancia();
    this.mandos.minDistance = d * 0.45;
    this.mandos.maxDistance = d * 1.5;
    if (reiniciar) {
      const [giro, altura] = (this.vista || [35, 30]).map(THREE.MathUtils.degToRad);
      this.camara.position.set(Math.sin(giro) * Math.cos(altura) * d, Math.sin(altura) * d, Math.cos(giro) * Math.cos(altura) * d);
      this.mandos.target.set(0, 0, 0);
    } else {
      this.camara.position.setLength(d);
    }
    this.mandos.update();
  }

  preparar(id, anonima) {
    const clave = id + (anonima ? "-anonima" : "");
    if (!this.hechos.has(clave)) this.hechos.set(clave, preparar(construir(id, anonima)));
    return this.hechos.get(clave);
  }

  // Enseña una pieza. `pieza` necesita { id, vista?, zoom? }.
  // Con `anonima`, los rótulos del modelo no dicen qué pieza es.
  mostrar(pieza, { girar = true, abierta = 0, anonima = false } = {}) {
    if (!this.ok) return false;
    this.resaltar(null);
    this.marcar([]);
    this.pivote.clear();
    try {
      this.modelo = this.preparar(pieza.id, anonima);
    } catch (e) {
      console.error(e);
      this.modelo = null;
      return false;
    }
    this.pivote.add(this.modelo.caja);
    this.zoom = pieza.zoom || 1;
    this.vista = pieza.vista;
    this.girar = girar;
    this.entrada = 0;
    this.apertura = this.meta = abierta;
    this.colocar();
    clearTimeout(this.espera);
    this.mandos.autoRotate = girar && !quieto.matches;
    this.encuadrar();
    return true;
  }

  vaciar() {
    if (!this.ok) return;
    this.resaltar(null);
    this.marcar([]);
    this.pivote.clear();
    this.modelo = null;
  }

  // 0 = cerrada, 1 = abierta del todo.
  abrir(cuanto, { ya = false } = {}) {
    this.meta = THREE.MathUtils.clamp(cuanto, 0, 1);
    if (ya || quieto.matches) {
      this.apertura = this.meta;
      this.colocar();
      this.encuadrar(false);
    }
  }

  colocar() {
    const m = this.modelo;
    if (!m) return;
    const t = suave(this.apertura);
    for (const o of m.moviles) o.position.copy(o.userData.casa).addScaledVector(o.userData.abre, t);
    m.contenido.position.lerpVectors(m.centroCerrada, m.centroAbierta, t).multiplyScalar(-1);
  }

  // Ilumina una parte (o ninguna). `color` en hexadecimal.
  resaltar(id, color = 0xc6f432) {
    for (const malla of this.encendidas || []) malla.material = malla.userData.original;
    this.encendidas = [];
    this.resaltada = id;
    if (!id || !this.modelo) return;
    for (const o of this.modelo.partes[id] || []) {
      o.traverse((malla) => {
        if (!malla.isMesh || malla.userData.marca) return;
        malla.userData.original = malla.material;
        const copia = (x) => {
          const c = x.clone();
          c.emissive = new THREE.Color(color);
          c.emissiveIntensity = 0.5;
          return c;
        };
        malla.material = Array.isArray(malla.material) ? malla.material.map(copia) : copia(malla.material);
        this.encendidas.push(malla);
      });
    }
  }

  // Pone chapas numeradas sobre las partes: [[id, "1"], [id, "2"]…]
  marcar(lista) {
    for (const s of this.chapas || []) s.removeFromParent();
    this.chapas = [];
    if (!this.modelo) return;
    for (const [id, rotulo] of lista) {
      const o = this.modelo.partes[id]?.[0];
      if (!o) continue;
      const s = chapa(rotulo);
      const caja = new THREE.Box3().setFromObject(o);
      const arriba = new THREE.Vector3((caja.min.x + caja.max.x) / 2, caja.max.y, (caja.min.z + caja.max.z) / 2);
      o.worldToLocal(arriba);
      s.position.copy(arriba);
      s.userData.parte = id;
      s.userData.marca = true;
      s.scale.setScalar(this.modelo.lado * 0.075);
      s.center.set(0.5, -0.15);
      s.renderOrder = 10;
      o.add(s);
      this.chapas.push(s);
    }
  }

  parteEn(x, y) {
    if (!this.modelo) return null;
    const r = this.lienzo.getBoundingClientRect();
    const punto = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.rayo.setFromCamera(punto, this.camara);
    for (const toque of this.rayo.intersectObject(this.modelo.caja, true)) {
      for (let o = toque.object; o; o = o.parent) if (o.userData.parte) return o.userData.parte;
      if (!toque.object.userData.sombra) return null; // hay algo sin nombre delante
    }
    return null;
  }

  pintar() {
    if (!this.lienzo.isConnected || document.hidden) return;
    const dt = Math.min(this.reloj.getDelta(), 0.1);
    const m = this.modelo;
    if (m) {
      if (this.apertura !== this.meta) {
        const paso = dt * 1.6;
        this.apertura = Math.abs(this.meta - this.apertura) <= paso ? this.meta : this.apertura + Math.sign(this.meta - this.apertura) * paso;
        this.colocar();
        this.encuadrar(false);
      }
      if (!quieto.matches) for (const o of m.giratorios) o.rotation.y -= o.userData.gira * Math.PI * 2 * dt;
      if (this.encendidas?.length) {
        const pulso = 0.4 + 0.3 * Math.sin(performance.now() / 260);
        for (const malla of this.encendidas) for (const x of [malla.material].flat()) x.emissiveIntensity = pulso;
      }
    }
    if (this.entrada < 1) {
      // La pieza entra creciendo un poco.
      this.entrada = quieto.matches ? 1 : Math.min(1, this.entrada + dt * 2.6);
      this.pivote.scale.setScalar(0.72 + 0.28 * (1 - Math.pow(1 - this.entrada, 3)));
    }
    this.mandos.update();
    this.render.render(this.escena, this.camara);
  }
}

// Escala el modelo para que su lado más largo mida 1,7 (cabe en una esfera de
// radio 1), calcula cuánto crece al abrirse y le pone una sombra en el suelo.
function preparar(modelo) {
  const medir = (t) => {
    for (const o of modelo.moviles) o.position.copy(o.userData.casa).addScaledVector(o.userData.abre, t);
    const caja = new THREE.Box3().setFromObject(modelo.raiz);
    const t3 = caja.getSize(new THREE.Vector3());
    // La pieza gira sobre sí misma: cuenta su diagonal, no solo el lado más largo.
    return { caja, centro: caja.getCenter(new THREE.Vector3()), lado: t3.length() * 0.82 };
  };
  const abierta = medir(1);
  const cerrada = medir(0);

  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(cerrada.lado * 2.1, cerrada.lado * 2.1),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.set(cerrada.centro.x, cerrada.caja.min.y - cerrada.lado * 0.012, cerrada.centro.z);
  sombra.userData.sombra = true;
  sombra.renderOrder = -1;

  const contenido = new THREE.Group();
  contenido.add(modelo.raiz, sombra);
  const caja = new THREE.Group();
  caja.add(contenido);
  caja.scale.setScalar(1.7 / cerrada.lado);

  const giratorios = [];
  modelo.raiz.traverse((o) => o.userData.gira && giratorios.push(o));

  return {
    caja, contenido, giratorios,
    moviles: modelo.moviles,
    partes: modelo.partes,
    lado: cerrada.lado,
    centroCerrada: cerrada.centro,
    centroAbierta: abierta.centro,
    holgura: Math.max(1, abierta.lado / cerrada.lado),
  };
}

let sombraHecha;
function texturaSombra() {
  if (!sombraHecha) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(128, 128, 20, 128, 128, 128);
    g.addColorStop(0, "rgba(0,0,0,.55)");
    g.addColorStop(0.55, "rgba(0,0,0,.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    sombraHecha = new THREE.CanvasTexture(c);
  }
  return sombraHecha;
}

function chapa(rotulo) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = "#0a0e1a";
  x.beginPath();
  x.arc(64, 64, 60, 0, 7);
  x.fill();
  x.fillStyle = "#c6f432";
  x.beginPath();
  x.arc(64, 64, 50, 0, 7);
  x.fill();
  x.fillStyle = "#0a0e1a";
  x.font = "800 68px Outfit, Arial, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(rotulo, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
}
