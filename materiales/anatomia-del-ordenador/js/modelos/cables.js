import { Modelo, M, THREE, caja, cilindro, copias, en, grupo, lamina, tubo, mat } from "./kit.js";

export function cables() {
  const m = new Modelo();

  // Cable de datos: plano, con un conector en cada punta.
  const datos = grupo(tubo([[-7.6, 0, -3.6], [-4.5, 0, -3.9], [-1.5, 0, -6.3], [2, 0, -6.6], [5.2, 0, -4.4], [7.4, 0, -4.6]], 0.5, M.rojo, { aplastado: 0.2 }));
  datos.children[0].position.y = 0.3;
  for (const [x, z, giro] of [[-8.3, -3.55, 0.05], [8.1, -4.62, -0.08]]) {
    const c = grupo(caja(1.7, 0.6, 1.5, M.negro, 0.08), en(caja(0.5, 0.12, 1.1, M.acero, 0.02), 0, 0.34, 0), en(caja(0.3, 0.2, 1.1, M.azul, 0.02), Math.sign(x) * 0.8, 0, 0));
    c.rotation.y = giro;
    datos.add(en(c, x, 0.3, z));
  }
  m.pon(datos, { id: "datos" });

  // Cable de corriente: muchos hilos de colores hasta un conector ancho.
  const colores = [M.amarillo, M.amarillo, M.rojo, M.rojo, M.naranja, M.naranja, M.negro, M.negro, M.negro, M.negro, mat(0x9c5cff, { rug: 0.45 }), M.azul];
  const corriente = grupo();
  colores.forEach((color, i) => {
    const z0 = (i - 5.5) * 0.42;
    const y0 = 0.5 + (i % 2) * 0.55;
    corriente.add(tubo([[-7, y0, z0], [-4.5, y0, z0], [-1, 0.4 + (i % 2) * 0.3, z0 * 0.55 + 0.8], [2.5, 0.4 + (i % 3) * 0.2, z0 * 0.3 - 0.3], [5.4, 0.45, z0 * 0.16]], 0.17, color));
  });
  const clavija = grupo(caja(1.4, 1.9, 5.5, M.negro, 0.1), en(caja(0.5, 0.5, 1.2, M.negro, 0.06), 0, 1.1, 0));
  clavija.add(en(lamina(5.1, 1.6, (c, w, h) => {
    c.fillStyle = "#15171c";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#f2c14e";
    for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) c.fillRect((i + 0.22) * (w / 12), (j + 0.22) * (h / 2), (w / 12) * 0.56, (h / 2) * 0.56);
  }, { px: 384, metal: 0.4 }), -0.71, 0, 0));
  clavija.children[2].rotation.set(0, -Math.PI / 2, 0);
  corriente.add(en(clavija, -7.6, 0.95, 0));
  corriente.add(en(caja(1.6, 1, 1.3, mat(0x17191e, { rug: 0.85 }), 0.3), 5.8, 0.5, 0));
  m.pon(en(corriente, 0, 0, 0.4), { id: "corriente" });

  // Un cable cortado para ver qué lleva dentro.
  const hilos = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 6) * Math.PI * 2;
    hilos.push(i === 6 ? [0, 0, 0] : [0, Math.cos(a) * 0.36, Math.sin(a) * 0.36]);
  }
  const geo = new THREE.CylinderGeometry(0.18, 0.18, 12.4, 12);
  geo.rotateZ(Math.PI / 2);
  m.pon(en(copias(geo, M.cobre, hilos), 0, 0.75, 6.2), { id: "cobre" });
  for (const lado of [-1, 1]) {
    const f = cilindro(0.75, 4.6, M.lima, { lados: 32 });
    f.rotation.z = Math.PI / 2;
    m.pon(en(f, lado * 2.3, 0.75, 6.2), { id: "funda", abre: [lado * 2.9, 0, 0] });
  }
  return m;
}
