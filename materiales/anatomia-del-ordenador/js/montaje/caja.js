// La caja del ordenador (la torre), dibujada con código como las piezas.
// Se construye tumbada sobre su lado derecho, que es como se monta de verdad:
//
//   X  de la parte trasera (−) al frontal (+)
//   Y  desde la bandeja donde va la placa (0) hacia el panel lateral (+)
//   Z  del techo de la torre (−) a su base (+)
//
// Las medidas van en centímetros, las mismas que usan las piezas.

import { THREE, M, mat, caja, cilindro, en, grupo, lamina, placa, tornillo, ventilador, agujeroRedondo } from "../modelos/kit.js";

// Interior de la caja. G es el grosor de la chapa.
export const C = { XR: -20.8, XF: 21, ZT: -20, ZB: 20, YP: 19, G: 0.5, PATAS: 0.8 };
// Centro de la placa base cuando está dentro de la caja.
export const B = { x: -8.95, y: 0.9, z: -6.6 };
// Agujeros de la placa base para sus tornillos (en medidas de la placa).
export const AGUJEROS = [[-11.5, -11.6], [11.5, -11.6], [-11.5, 11.6], [11.5, 11.6], [-11.5, 3.2], [11.6, 3.6]];
// Ventanas de la pared trasera: [z0, y0, z1, y1].
export const VENTANA = {
  puertos: [B.z - 11.5, 0.75, B.z + 2.3, 4.9],
  ranuras: [B.z + 2.75, 1.4, B.z + 11.55, 14.6],
  fuente: [11.9, 1.3, 19, 14.9],
};
export const VENTILADOR = { z: -11.5, y: 12.2 };
export const BOTON = { x: 16, y: 9.5 };

const chapa = mat(0x2a3142, { metal: 0.6, rug: 0.5 });
const dentro = mat(0x39425a, { metal: 0.45, rug: 0.7 });
const plastico = mat(0x11141b, { rug: 0.42 });

export function torre() {
  const { XR, XF, ZT, ZB, YP, G } = C;
  const W = XF - XR, D = ZB - ZT, cx = (XR + XF) / 2;
  const g = new THREE.Group();
  const partes = {};

  // Bandeja, techo, base y frontal de chapa.
  g.add(
    en(caja(W + G * 2, G, D + G * 2, dentro, 0.12), cx, -G / 2, 0),
    en(caja(W + G * 2, YP + G, G, chapa, 0.12), cx, (YP - G) / 2, ZT - G / 2),
    en(caja(W + G * 2, YP + G, G, chapa, 0.12), cx, (YP - G) / 2, ZB + G / 2),
    en(caja(G, YP + G, D + G * 2, chapa, 0.12), XF + G / 2, (YP - G) / 2, 0),
  );

  // Pared trasera, con sus ventanas.
  const forma = new THREE.Shape();
  rect(forma, ZT - G, -G, ZB + G, YP);
  for (const v of Object.values(VENTANA)) forma.holes.push(rect(new THREE.Path(), ...v));
  const rejilla = new THREE.Path();
  rejilla.absarc(VENTILADOR.z, VENTILADOR.y, 5.3, 0, Math.PI * 2, true);
  forma.holes.push(rejilla);
  const geo = new THREE.ExtrudeGeometry(forma, { depth: G, bevelEnabled: false, curveSegments: 40 });
  geo.rotateY(-Math.PI / 2);
  g.add(en(new THREE.Mesh(geo, chapa), XR, 0, 0));
  // Barrotes de la rejilla del ventilador.
  const barrotes = grupo();
  for (const r of [1.6, 3.2, 4.8]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(r, 0.11, 8, 40), M.aceroOscuro);
    aro.rotation.y = Math.PI / 2;
    barrotes.add(aro);
  }
  for (const a of [0, Math.PI / 2]) {
    const b = caja(0.16, 10.6, 0.22, M.aceroOscuro, 0);
    b.rotation.x = a + Math.PI / 4;
    barrotes.add(b);
  }
  g.add(en(barrotes, XR - G / 2, VENTILADOR.y, VENTILADOR.z));

  // Ventilador trasero: saca el aire caliente.
  const lado = 6.1;
  const marco = placa([[-lado, -lado], [lado, -lado], [lado, lado], [-lado, lado]], 2.5, plastico, { agujeros: [agujeroRedondo(0, 0, 5.6)], bisel: 0.12 });
  const helice = ventilador(5.4, { aspas: 9, alto: 1.8, pegatina: "#5cc8ff" });
  const trasero = grupo(marco, en(helice, 0, 1.25, 0));
  trasero.rotation.z = -Math.PI / 2;
  g.add(en(trasero, XR, VENTILADOR.y, VENTILADOR.z));

  // Tapas de las ranuras de expansión. Las dos primeras se quitan para la gráfica.
  partes.tapas = [];
  const [z0, y0, , y1] = VENTANA.ranuras;
  for (let i = 0; i < 4; i++) {
    const tapa = grupo(caja(0.14, y1 - y0 - 0.2, 2, M.acero, 0.03));
    for (let k = 0; k < 7; k++) tapa.add(en(caja(0.16, 0.9, 1.2, M.aceroOscuro, 0), 0, -4.2 + k * 1.4, 0));
    g.add(en(tapa, XR - G / 2, (y0 + y1) / 2, z0 + 2.2 * (i + 0.5)));
    partes.tapas.push(tapa);
  }

  // Separadores dorados: levantan la placa base para que no toque la chapa.
  for (const [x, z] of AGUJEROS) g.add(en(cilindro(0.38, B.y - 0.1, M.oro, { lados: 6 }), B.x + x, (B.y - 0.1) / 2, B.z + z));

  // Bandejas de los discos.
  const bandeja = mat(0x232936, { metal: 0.6, rug: 0.6 });
  g.add(en(caja(11, 0.3, 8, bandeja, 0.1), 15, 0.15, -12), en(caja(11.2, 0.3, 15.6, bandeja, 0.1), 15, 0.15, 5.5));

  // Frontal de plástico con una franja de color.
  const frontal = grupo(caja(2.2, YP + G + 0.5, D + G * 2 + 0.5, plastico, 0.5));
  frontal.add(en(caja(0.2, 0.5, D - 6, M.lima, 0.1), 1.1, YP / 2 - 3, 0));
  frontal.add(en(malla(D - 8, YP - 7), 1.11, 1.2, 0));
  g.add(en(frontal, XF + G + 1.1, (YP - G) / 2, 0));

  // Botonera en el techo: botón de encendido, piloto y dos USB.
  const botonera = grupo();
  const aro = cilindro(1.25, 0.25, M.aceroOscuro, { lados: 40 });
  partes.boton = cilindro(0.95, 0.4, mat(0x232936, { metal: 0.7, rug: 0.35 }), { lados: 40 });
  partes.piloto = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.09, 8, 40), new THREE.MeshStandardMaterial({ color: 0x1c2130, emissive: 0x000000, roughness: 0.4 }));
  partes.piloto.rotation.x = Math.PI / 2;
  botonera.add(aro, en(partes.boton, 0, 0.1, 0), en(partes.piloto, 0, 0.16, 0));
  for (const x of [-4.2, -6.4]) botonera.add(en(caja(1.4, 0.2, 0.6, M.azul, 0.05), x, 0.02, 0));
  botonera.rotation.x = -Math.PI / 2; // su «arriba» mira hacia el techo de la torre
  g.add(en(botonera, BOTON.x, BOTON.y, ZT - G));

  // Patas, en la base.
  for (const x of [-15, 17]) for (const y of [2.5, 16]) {
    const pata = cilindro(1.3, C.PATAS, plastico, { lados: 24 });
    pata.rotation.x = Math.PI / 2;
    g.add(en(pata, x, y, ZB + G + C.PATAS / 2));
  }

  // Panel lateral de cristal.
  const cristal = new THREE.MeshStandardMaterial({ color: 0x9fc4ff, metalness: 0.2, roughness: 0.06, transparent: true, opacity: 0.2, depthWrite: false });
  partes.panel = grupo(new THREE.Mesh(new THREE.BoxGeometry(W + G * 2 - 0.4, 0.3, D + G * 2 - 0.4), cristal));
  partes.panel.children[0].renderOrder = 8;
  for (const z of [-1, 1]) partes.panel.add(en(caja(W + G * 2, 0.4, 1, chapa, 0.1), 0, 0, z * (D / 2 + G - 0.5)));
  for (const x of [-1, 1]) partes.panel.add(en(caja(1, 0.4, D + G * 2, chapa, 0.1), x * (W / 2 + G - 0.5), 0, 0));
  g.add(en(partes.panel, cx, YP + 0.2, 0));

  return { raiz: g, partes };
}

function rect(camino, x0, y0, x1, y1) {
  camino.moveTo(x0, y0);
  camino.lineTo(x1, y0);
  camino.lineTo(x1, y1);
  camino.lineTo(x0, y1);
  camino.closePath();
  return camino;
}

// Rejilla de puntos del frontal, mirando hacia +X.
function malla(ancho, alto) {
  const l = lamina(ancho, alto, (c, w, h) => {
    c.fillStyle = "#11141b";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#05070b";
    const paso = w / 46;
    for (let j = 0; j * paso * 0.86 < h; j++) for (let i = 0; i < 47; i++) {
      c.beginPath();
      c.arc(i * paso + (j % 2) * paso * 0.5, j * paso * 0.86, paso * 0.3, 0, 7);
      c.fill();
    }
  }, { px: 512, rug: 0.5 });
  l.rotation.set(0, Math.PI / 2, 0);
  return l;
}

// Tornillo con la cabeza mirando hacia `normal`.
export function tornilloHacia(normal, radio = 0.42) {
  const t = tornillo(radio);
  const g = grupo(t);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...normal).normalize());
  return g;
}
