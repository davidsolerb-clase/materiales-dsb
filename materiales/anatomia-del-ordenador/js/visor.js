// Visor 3D: un solo lienzo WebGL que se mueve de pantalla en pantalla.
// Carga los modelos .glb de modelos/ y los deja girar. Si el navegador
// no tiene WebGL, `visor.ok` es false y la app enseña una imagen fija.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const CAMPO = 32; // ángulo de la cámara, en grados
const PAUSA_GIRO = 4000; // ms sin tocar antes de volver a girar solo
const quieto = matchMedia("(prefers-reduced-motion: reduce)");

export class Visor {
  constructor() {
    this.lienzo = document.createElement("canvas");
    this.lienzo.className = "lienzo";
    this.lienzo.setAttribute("aria-hidden", "true");
    this.cache = new Map(); // ruta -> Promise<{ objeto, animaciones }>
    this.turno = 0;
    this.ok = false;

    try {
      this.render = new THREE.WebGLRenderer({ canvas: this.lienzo, antialias: true, alpha: true });
    } catch {
      return;
    }
    this.ok = true;
    this.render.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.render.toneMapping = THREE.ACESFilmicToneMapping;
    this.render.toneMappingExposure = 1.15;

    this.escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.render);
    this.escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const foco = new THREE.DirectionalLight(0xffffff, 1.6);
    foco.position.set(3, 5, 4);
    this.escena.add(foco);

    this.camara = new THREE.PerspectiveCamera(CAMPO, 1, 0.05, 50);
    this.pivote = new THREE.Group();
    this.escena.add(this.pivote);

    this.mandos = new OrbitControls(this.camara, this.lienzo);
    this.mandos.enablePan = false;
    this.mandos.enableDamping = true;
    this.mandos.dampingFactor = 0.08;
    this.mandos.autoRotateSpeed = 1.6;
    this.mandos.addEventListener("start", () => {
      clearTimeout(this.espera);
      this.mandos.autoRotate = false;
      this.lienzo.dispatchEvent(new CustomEvent("tocado", { bubbles: true }));
    });
    this.mandos.addEventListener("end", () => {
      clearTimeout(this.espera);
      this.espera = setTimeout(() => (this.mandos.autoRotate = this.girar && !quieto.matches), PAUSA_GIRO);
    });

    this.cargador = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
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

  // Distancia a la que el modelo (radio 1) cabe entero en pantalla.
  distancia() {
    const medio = THREE.MathUtils.degToRad(CAMPO / 2);
    const vertical = 1 / Math.sin(medio);
    const horizontal = 1 / Math.sin(Math.atan(Math.tan(medio) * this.camara.aspect));
    return Math.max(vertical, horizontal) * 1.0 * (this.zoom || 1);
  }

  encuadrar(reiniciar = true) {
    const d = this.distancia();
    this.mandos.minDistance = d * 0.45;
    this.mandos.maxDistance = d * 1.5;
    if (reiniciar) {
      this.camara.position.set(0, d * 0.34, d * 0.94);
      this.mandos.target.set(0, 0, 0);
    } else {
      this.camara.position.setLength(d);
    }
    this.mandos.update();
  }

  cargar(ruta, alAvanzar) {
    if (!this.cache.has(ruta)) {
      const promesa = new Promise((bien, mal) => {
        this.cargador.load(
          ruta,
          (gltf) => bien({ objeto: normalizar(gltf.scene), animaciones: gltf.animations }),
          (e) => e.total && alAvanzar?.(e.loaded / e.total),
          mal,
        );
      });
      promesa.catch(() => this.cache.delete(ruta));
      this.cache.set(ruta, promesa);
    }
    return this.cache.get(ruta);
  }

  // Enseña un modelo. `pieza` necesita { modelo, giro?, zoom? }.
  async mostrar(pieza, { girar = true, alAvanzar } = {}) {
    if (!this.ok) return false;
    const turno = ++this.turno;
    this.pivote.clear();
    this.mezclador = null;
    let datos;
    try {
      datos = await this.cargar(pieza.modelo, alAvanzar);
    } catch {
      return false;
    }
    if (turno !== this.turno) return true; // ya se pidió otra pieza

    const [x = 0, y = 0, z = 0] = pieza.giro || [];
    this.pivote.rotation.set(x, y, z);
    this.pivote.add(datos.objeto);
    this.zoom = pieza.zoom || 1;
    this.girar = girar;
    this.entrada = 0;
    clearTimeout(this.espera);
    this.mandos.autoRotate = girar && !quieto.matches;
    this.encuadrar();

    if (datos.animaciones.length && !quieto.matches) {
      this.mezclador = new THREE.AnimationMixer(datos.objeto);
      for (const clip of datos.animaciones) this.mezclador.clipAction(clip).play();
    }
    return true;
  }

  precargar(pieza) {
    if (this.ok) this.cargar(pieza.modelo).catch(() => {});
  }

  vaciar() {
    if (!this.ok) return;
    this.turno++;
    this.pivote.clear();
    this.mezclador = null;
  }

  pintar() {
    if (!this.lienzo.isConnected || document.hidden) return;
    const dt = Math.min(this.reloj.getDelta(), 0.1);
    this.mezclador?.update(dt);
    if (this.entrada < 1) {
      // La pieza entra creciendo un poco.
      this.entrada = quieto.matches ? 1 : Math.min(1, this.entrada + dt * 2.6);
      const t = 1 - Math.pow(1 - this.entrada, 3);
      this.pivote.scale.setScalar(0.72 + 0.28 * t);
    }
    this.mandos.update();
    this.render.render(this.escena, this.camara);
  }
}

// Centra el modelo en el origen y lo escala para que su lado más largo mida 1,7.
// Así cabe en una esfera de radio 1 y las piezas planas no se ven pequeñas.
function normalizar(objeto) {
  const caja = new THREE.Box3().setFromObject(objeto);
  const centro = caja.getCenter(new THREE.Vector3());
  const lado = caja.getSize(new THREE.Vector3());
  const grupo = new THREE.Group();
  objeto.position.sub(centro);
  grupo.add(objeto);
  grupo.scale.setScalar(1.7 / (Math.max(lado.x, lado.y, lado.z) || 1));
  return grupo;
}
