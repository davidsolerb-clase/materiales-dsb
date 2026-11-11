// Herramientas para construir las piezas con geometría, sin archivos de modelos.
// Las medidas van en centímetros. El eje Y mira hacia arriba.
//
// Un Modelo es un grupo de objetos sueltos. Cada uno sabe cuánto se desplaza
// al abrir la pieza (`abre`) y, si es una parte con nombre, lleva su `id`.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export { THREE };

// Las preguntas usan modelos sin rótulos que delaten la pieza.
export const ajustes = { anonima: false };
export const rotulo = (real, neutro) => (ajustes.anonima ? neutro : real);

export class Modelo {
  constructor() {
    this.raiz = new THREE.Group();
    this.moviles = [];
    this.partes = {}; // id -> [objetos]
  }

  // Añade un objeto ya colocado. `abre` es lo que se mueve al abrir la pieza.
  pon(objeto, { id, abre = [0, 0, 0] } = {}) {
    objeto.userData.casa = objeto.position.clone();
    objeto.userData.abre = new THREE.Vector3(...abre);
    if (id) {
      objeto.userData.parte = id;
      (this.partes[id] ||= []).push(objeto);
    }
    this.moviles.push(objeto);
    this.raiz.add(objeto);
    return objeto;
  }
}

// ---------------------------------------------------------------- Materiales

const hechos = new Map();
export function mat(color, { metal = 0, rug = 0.55, ...resto } = {}) {
  const clave = JSON.stringify([color, metal, rug, resto]);
  if (!hechos.has(clave)) {
    hechos.set(clave, new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rug, ...resto }));
  }
  return hechos.get(clave);
}

export const M = {
  negro: mat(0x15171c, { rug: 0.5 }),
  negroMate: mat(0x1b1d23, { rug: 0.85 }),
  gris: mat(0x4a4f5a, { rug: 0.6 }),
  grisClaro: mat(0xa9afba, { rug: 0.55 }),
  blanco: mat(0xeceff4, { rug: 0.5 }),
  acero: mat(0xcfd4dc, { metal: 1, rug: 0.28 }),
  aceroOscuro: mat(0x5a606b, { metal: 1, rug: 0.4 }),
  aluminio: mat(0xdfe3e8, { metal: 1, rug: 0.45 }),
  cobre: mat(0xe08a4a, { metal: 1, rug: 0.28 }),
  oro: mat(0xf2c14e, { metal: 1, rug: 0.3 }),
  espejo: mat(0xdde3ee, { metal: 1, rug: 0.06 }),
  silicio: mat(0x6f7fb0, { metal: 1, rug: 0.12 }),
  pcbVerde: mat(0x0f6b46, { rug: 0.45 }),
  rojo: mat(0xe5484d, { rug: 0.45 }),
  amarillo: mat(0xf5c518, { rug: 0.45 }),
  naranja: mat(0xf2852a, { rug: 0.45 }),
  azul: mat(0x2d7ff9, { rug: 0.4 }),
  lima: mat(0xc6f432, { rug: 0.4 }),
  vidrio: mat(0x9fd8ff, { metal: 0.2, rug: 0.05, transparent: true, opacity: 0.75 }),
};

// ---------------------------------------------------------------- Formas

export function en(objeto, x = 0, y = 0, z = 0) {
  objeto.position.set(x, y, z);
  return objeto;
}

export function grupo(...hijos) {
  const g = new THREE.Group();
  const lista = hijos.flat();
  if (lista.length) g.add(...lista);
  return g;
}

// Caja con los cantos redondeados.
export function caja(ancho, alto, fondo, material, radio) {
  const r = radio ?? Math.min(ancho, alto, fondo) * 0.12;
  const geo = r > 0 ? new RoundedBoxGeometry(ancho, alto, fondo, 3, r) : new THREE.BoxGeometry(ancho, alto, fondo);
  return new THREE.Mesh(geo, material);
}

export function cilindro(radio, alto, material, { lados = 48, radioAbajo = radio } = {}) {
  return new THREE.Mesh(new THREE.CylinderGeometry(radio, radioAbajo, alto, lados), material);
}

export function anillo(radio, grosor, material, lados = 64) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radio, grosor, 12, lados), material);
  m.rotation.x = Math.PI / 2;
  return m;
}

// Contorno 2D extruido hacia arriba. `puntos` va en el plano XZ.
export function placa(puntos, alto, material, { agujeros = [], bisel = 0.03 } = {}) {
  const forma = new THREE.Shape(puntos.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const a of agujeros) forma.holes.push(a);
  const geo = new THREE.ExtrudeGeometry(forma, {
    depth: alto - bisel * 2, bevelEnabled: bisel > 0, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 2, curveSegments: 40,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bisel, 0);
  return new THREE.Mesh(geo, material);
}

export function agujeroRedondo(x, z, radio) {
  const p = new THREE.Path();
  p.absarc(x, -z, radio, 0, Math.PI * 2, true);
  return p;
}

// Muchas copias de la misma forma (aletas, pines, contactos).
export function copias(geometria, material, posiciones, girosY) {
  const malla = new THREE.InstancedMesh(geometria, material, posiciones.length);
  const o = new THREE.Object3D();
  posiciones.forEach(([x, y, z], i) => {
    o.position.set(x, y, z);
    o.rotation.set(0, girosY ? girosY[i] : 0, 0);
    o.updateMatrix();
    malla.setMatrixAt(i, o.matrix);
  });
  malla.instanceMatrix.needsUpdate = true;
  malla.computeBoundingBox();
  malla.computeBoundingSphere();
  return malla;
}

// Tubo que sigue una curva; con `aplastado` sale un cable plano.
export function tubo(puntos, radio, material, { aplastado = 1, tramos = 80 } = {}) {
  const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curva, tramos, radio, 12);
  const m = new THREE.Mesh(geo, material);
  m.scale.y = aplastado;
  return m;
}

// ---------------------------------------------------------------- Dibujos

function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function textura(ancho, alto, pintar) {
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  pintar(lienzo.getContext("2d"), ancho, alto);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Lámina plana mirando hacia arriba con un dibujo (pegatinas, serigrafía).
export function lamina(ancho, fondo, pintar, { px = 640, metal = 0, rug = 0.5, transparente = false } = {}) {
  const t = textura(px, Math.max(32, Math.round((px * fondo) / ancho)), pintar);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, fondo),
    new THREE.MeshStandardMaterial({ map: t, metalness: metal, roughness: rug, transparent: transparente, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function texto(c, t, x, y, { tam = 40, color = "#fff", peso = 700, alinear = "left", fuente = "Outfit, Arial, sans-serif" } = {}) {
  c.font = `${peso} ${tam}px ${fuente}`;
  c.fillStyle = color;
  c.textAlign = alinear;
  c.textBaseline = "middle";
  c.fillText(t, x, y);
}

// Circuito impreso: tablero con pistas dibujadas por encima.
export function circuito(ancho, fondo, { color = "#0f6b46", pista = "#3fae7c", grosor = 0.16, semilla = 7, densidad = 1 } = {}) {
  const r = azar(semilla);
  const px = 1024;
  const py = Math.max(64, Math.round((px * fondo) / ancho));
  const dibujo = textura(px, py, (c) => {
    c.fillStyle = color;
    c.fillRect(0, 0, px, py);
    c.strokeStyle = pista;
    c.fillStyle = pista;
    c.lineCap = "round";
    c.lineJoin = "round";
    const n = Math.round(46 * densidad * (py / px + 0.5));
    for (let i = 0; i < n; i++) {
      c.lineWidth = 2 + r() * 3;
      c.globalAlpha = 0.5 + r() * 0.4;
      let x = r() * px;
      let y = r() * py;
      c.beginPath();
      c.moveTo(x, y);
      const pasos = 2 + Math.floor(r() * 4);
      for (let k = 0; k < pasos; k++) {
        const largo = 30 + r() * 150;
        const dir = Math.floor(r() * 8);
        const dx = [1, 1, 0, -1, -1, -1, 0, 1][dir];
        const dy = [0, 1, 1, 1, 0, -1, -1, -1][dir];
        x += dx * largo;
        y += dy * largo;
        c.lineTo(x, y);
      }
      c.stroke();
      c.beginPath();
      c.arc(x, y, c.lineWidth * 1.6, 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;
    c.fillStyle = "#d9c26a";
    for (let i = 0; i < 60 * densidad; i++) c.fillRect(r() * px, r() * py, 5, 5);
  });
  const lados = mat(new THREE.Color(color).multiplyScalar(0.7).getHex(), { rug: 0.6 });
  const cara = new THREE.MeshStandardMaterial({ map: dibujo, roughness: 0.42, metalness: 0.15 });
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z
  const m = new THREE.Mesh(new THREE.BoxGeometry(ancho, grosor, fondo), [lados, lados, cara, cara, lados, lados]);
  return m;
}

// Chip negro con su rótulo.
export function chip(ancho, fondo, rotulo = "", { alto = 0.14, color = "#17181c", tinta = "#9aa3b5" } = {}) {
  const g = grupo(caja(ancho, alto, fondo, mat(new THREE.Color(color).getHex(), { rug: 0.4 }), alto * 0.2));
  const cara = lamina(ancho * 0.94, fondo * 0.94, (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#ffffff18";
    c.lineWidth = 3;
    c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = tinta;
    c.beginPath();
    c.arc(h * 0.14, h * 0.86, h * 0.05, 0, 7);
    c.fill();
    const lineas = rotulo.split("\n");
    lineas.forEach((l, i) =>
      texto(c, l, w / 2, h / 2 + (i - (lineas.length - 1) / 2) * h * 0.24, { tam: Math.min(h * 0.2, (w / Math.max(l.length, 4)) * 1.5), color: tinta, alinear: "center" }),
    );
  }, { px: 256, rug: 0.35 });
  g.add(en(cara, 0, alto / 2 + 0.002, 0));
  return g;
}

// Fila de contactos dorados a lo largo del eje X.
export function contactos(n, paso, ancho, largo, { alto = 0.03, material = M.oro } = {}) {
  const pos = [];
  for (let i = 0; i < n; i++) pos.push([(i - (n - 1) / 2) * paso, 0, 0]);
  return copias(new THREE.BoxGeometry(ancho, alto, largo), material, pos);
}

// Ventilador: buje y aspas curvas. Gira solo (userData.gira, en vueltas por segundo).
export function ventilador(radio, { aspas = 9, alto = 1, material = M.negro, buje = M.negroMate, pegatina = "#c6f432" } = {}) {
  const g = new THREE.Group();
  const rb = radio * 0.3;
  g.add(cilindro(rb, alto, buje));
  g.add(en(lamina(rb * 1.5, rb * 1.5, (c, w) => {
    c.clearRect(0, 0, w, w);
    c.fillStyle = pegatina;
    c.beginPath();
    c.arc(w / 2, w / 2, w * 0.46, 0, 7);
    c.fill();
    c.fillStyle = "#15171c";
    c.beginPath();
    c.arc(w / 2, w / 2, w * 0.16, 0, 7);
    c.fill();
  }, { px: 128, transparente: true }), 0, alto / 2 + 0.004, 0));

  const forma = new THREE.Shape();
  const r0 = rb * 0.92, r1 = radio * 0.97;
  forma.moveTo(r0, -0.12 * radio);
  forma.quadraticCurveTo((r0 + r1) / 2, -0.42 * radio, r1, -0.26 * radio);
  forma.quadraticCurveTo(r1 * 1.02, 0.02 * radio, r1 * 0.9, 0.2 * radio);
  forma.quadraticCurveTo((r0 + r1) / 2, 0.02 * radio, r0, 0.14 * radio);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: alto * 0.07, bevelEnabled: false, curveSegments: 10 });
  geo.rotateX(-Math.PI / 2);
  geo.rotateX(0.42); // inclinación del aspa
  const giros = [];
  const pos = [];
  for (let i = 0; i < aspas; i++) {
    giros.push((i / aspas) * Math.PI * 2);
    pos.push([0, 0, 0]);
  }
  g.add(copias(geo, material, pos, giros));
  g.userData.gira = 0.6;
  return g;
}

export function tornillo(radio = 0.22, material = M.acero) {
  const g = grupo(cilindro(radio, radio * 0.5, material, { lados: 20 }));
  g.add(en(caja(radio * 1.3, radio * 0.2, radio * 0.25, M.aceroOscuro, 0), 0, radio * 0.26, 0));
  return g;
}

// Bandeja: suelo y cuatro paredes. El origen queda en el centro del suelo.
export function bandeja(ancho, alto, fondo, grosor, material) {
  const r = grosor * 0.3;
  return grupo(
    en(caja(ancho, grosor, fondo, material, r), 0, grosor / 2, 0),
    en(caja(ancho, alto, grosor, material, r), 0, alto / 2, fondo / 2 - grosor / 2),
    en(caja(ancho, alto, grosor, material, r), 0, alto / 2, -fondo / 2 + grosor / 2),
    en(caja(grosor, alto, fondo, material, r), ancho / 2 - grosor / 2, alto / 2, 0),
    en(caja(grosor, alto, fondo, material, r), -ancho / 2 + grosor / 2, alto / 2, 0),
  );
}

// Conector SATA (datos + corriente) mirando hacia +Z.
export function conectorSata() {
  const g = new THREE.Group();
  for (const [x, ancho, n] of [[-1.5, 1.5, 7], [0.9, 2.6, 15]]) {
    g.add(en(caja(ancho, 0.5, 0.7, M.negro, 0.04), x, 0, 0));
    g.add(en(caja(ancho * 0.82, 0.12, 0.5, M.negroMate, 0.02), x, 0, 0.3));
    g.add(en(contactos(n, (ancho * 0.74) / n, (ancho * 0.4) / n, 0.42), x, 0.075, 0.33));
  }
  return g;
}
