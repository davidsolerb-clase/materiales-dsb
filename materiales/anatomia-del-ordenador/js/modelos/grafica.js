import { Modelo, M, THREE, agujeroRedondo, caja, chip, cilindro, circuito, contactos, copias, en, grupo, lamina, placa, ventilador, mat } from "./kit.js";

// Tumbada, con los ventiladores hacia arriba.
export function grafica() {
  const m = new Modelo();
  const L = 26, F = 10.6;
  const metal = mat(0x23272f, { metal: 0.8, rug: 0.45 });

  m.pon(en(caja(L + 0.4, 0.2, F + 0.3, metal, 0.06), 0, 0.1, 0), { abre: [0, -2.4, 0] });

  // Placa con sus chips.
  const tablero = grupo(circuito(L, F, { color: "#15181e", pista: "#2f3847", semilla: 9, grosor: 0.16, densidad: 1.4 }));
  for (let i = 0; i < 9; i++) tablero.add(en(caja(0.95, 0.8, 0.95, M.gris, 0.1), 5.2 + (i % 5) * 1.25, 0.48, i < 5 ? -3.6 : 3.4));
  for (let i = 0; i < 12; i++) tablero.add(en(cilindro(0.3, 0.9, M.negro, { lados: 16 }), 5 + (i % 6) * 1.1, 0.5, i < 6 ? -2.2 : 2));
  tablero.add(en(caja(2.1, 1.1, 0.9, M.negro, 0.08), 10.4, 0.6, -4.7));
  m.pon(en(tablero, 0, 0.55, 0));

  m.pon(en(grupo(caja(3.8, 0.12, 3.8, M.pcbVerde, 0.03), en(caja(2.2, 0.12, 2.2, M.silicio, 0.02), 0, 0.12, 0)), -1.6, 0.7, 0), { id: "chip" });

  const vram = grupo();
  for (const [x, z] of [[-4.6, -1.5], [-4.6, 0.2], [-4.6, 1.9], [-2.6, -3.1], [-0.9, -3.1], [0.8, -3.1], [1.5, -1.2], [1.5, 0.9]]) vram.add(en(chip(1.3, 1.1, "VRAM", { alto: 0.12 }), x, 0, z));
  m.pon(en(vram, 0, 0.7, 0), { id: "memoria" });

  // Lengüeta con contactos dorados: entra en la ranura de la placa base.
  const lengua = grupo(caja(9.4, 0.16, 1.2, mat(0x15181e), 0.02), en(contactos(44, 0.2, 0.13, 0.95), 0, 0.09, 0.05), en(contactos(44, 0.2, 0.13, 0.95), 0, -0.09, 0.05));
  m.pon(en(lengua, -4.6, 0.55, F / 2 + 0.55), { id: "conector" });

  // Chapa trasera con las salidas de vídeo.
  const chapa = grupo(caja(0.12, 4.4, F + 1.4, M.acero, 0.03));
  for (const [z, alto] of [[-3.6, 0.55], [-1.3, 0.55], [1, 0.55], [3.4, 0.7]]) {
    chapa.add(en(caja(1.5, alto, 1.7, M.aceroOscuro, 0.06), 0.55, -0.9, z));
    chapa.add(en(caja(0.1, alto * 0.5, 1.3, M.negro, 0.02), -0.2, -0.9, z));
  }
  for (let i = 0; i < 9; i++) chapa.add(en(caja(0.14, 0.9, 0.3, M.negro, 0.02), -0.02, 0.9, -4 + i));
  m.pon(en(chapa, -L / 2 - 0.25, 2.1, 0), { id: "salidas", abre: [-3, 0, 0] });

  // Disipador: aletas y tubos de cobre.
  const pos = [];
  for (let x = -11.4; x <= 11.8; x += 0.3) pos.push([x, 0, 0]);
  const radiador = grupo(copias(new THREE.BoxGeometry(0.07, 1.9, F - 0.8), M.aluminio, pos));
  for (const z of [-3, -1, 1, 3]) {
    const t = cilindro(0.26, 23.4, M.cobre, { lados: 16 });
    t.rotation.z = Math.PI / 2;
    radiador.add(en(t, 0.2, -0.65, z));
  }
  radiador.add(en(caja(4.2, 0.3, 4.2, M.cobre, 0.05), -1.6, -1.05, 0));
  m.pon(en(radiador, 0, 2.05, 0), { id: "disipador", abre: [0, 3.6, 0] });

  // Carcasa con tres ventiladores.
  const borde = [[-13.2, -4.6], [-12.4, -5.6], [12.4, -5.6], [13.2, -4.6], [13.2, 4.6], [12.4, 5.6], [-12.4, 5.6], [-13.2, 4.6]];
  const xs = [-8.6, 0, 8.6];
  const carcasa = grupo(placa(borde, 0.5, M.negro, { agujeros: xs.map((x) => agujeroRedondo(x, 0, 4.1)), bisel: 0.08 }));
  for (const z of [-5.45, 5.45]) carcasa.add(en(caja(25, 2.1, 0.22, M.negro, 0.06), 0, -1, z));
  for (const x of [-4.3, 4.3]) {
    carcasa.add(en(lamina(0.5, 5.4, (c, w, h) => { c.fillStyle = "#ff5c8a"; c.fillRect(0, 0, w, h); }, { px: 32, rug: 0.4 }), x, 0.51, 0));
  }
  m.pon(en(carcasa, 0, 3.2, 0), { abre: [0, 8, 0] });
  const helices = grupo();
  for (const x of xs) helices.add(en(ventilador(3.95, { aspas: 9, alto: 0.85, pegatina: "#ff5c8a" }), x, 0, 0));
  m.pon(en(helices, 0, 3.35, 0), { id: "ventiladores", abre: [0, 6.2, 0] });

  return m;
}
