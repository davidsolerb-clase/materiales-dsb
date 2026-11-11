import { Modelo, M, THREE, agujeroRedondo, caja, cilindro, copias, en, grupo, placa, tornillo, tubo, ventilador, mat } from "./kit.js";

export function disipador() {
  const m = new Modelo();

  // Base de cobre: la parte que toca el procesador.
  m.pon(grupo(en(cilindro(1.9, 0.5, M.cobre), 0, 0.25, 0), en(caja(4.4, 0.25, 4.4, M.cobre, 0.08), 0, 0.42, 0)), { id: "base", abre: [0, -1.6, 0] });

  // Aletas de aluminio alrededor de un núcleo.
  const pos = [];
  const giros = [];
  const n = 46;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pos.push([Math.cos(a) * 2.75, 0, -Math.sin(a) * 2.75]);
    giros.push(a);
  }
  const aletas = grupo(cilindro(1.55, 3, M.aluminio), copias(new THREE.BoxGeometry(2.7, 3, 0.07), M.aluminio, pos, giros));
  m.pon(en(aletas, 0, 2.05, 0), { id: "aletas" });

  // Ventilador con su marco.
  const circ = (r) => Array.from({ length: 64 }, (_, i) => [Math.cos(i / 64 * 6.2832) * r, Math.sin(i / 64 * 6.2832) * r]);
  const marco = placa(circ(4.75), 1.3, M.negro, { agujeros: [agujeroRedondo(0, 0, 4.4)], bisel: 0.04 });
  const helice = ventilador(4.25, { aspas: 7, alto: 1.05, pegatina: "#5cc8ff" });
  const radios = grupo();
  for (let i = 0; i < 4; i++) {
    const r = caja(4.5, 0.12, 0.3, M.negroMate, 0.03);
    r.rotation.y = i * (Math.PI / 2) + 0.5;
    r.position.set(Math.cos(i * (Math.PI / 2) + 0.5) * 2.3, 0.1, -Math.sin(i * (Math.PI / 2) + 0.5) * 2.3);
    radios.add(r);
  }
  const cable = tubo([[4.6, 0.5, 0.5], [5.6, 0.2, 1.2], [6.2, -1.2, 2.4], [6.4, -2.6, 3.6]], 0.14, M.negroMate);
  const clavija = en(caja(0.9, 0.5, 0.5, M.negro, 0.05), 6.4, -2.8, 3.7);
  m.pon(en(grupo(marco, en(helice, 0, 0.65, 0), radios, cable, clavija), 0, 3.6, 0), { id: "ventilador", abre: [0, 3.6, 0] });

  // Cuatro anclajes con tornillo y muelle.
  const muelle = mat(0x2b2f38, { metal: 0.8, rug: 0.4 });
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const pata = grupo(
      en(caja(2.6, 0.3, 0.9, M.negro, 0.08), -sx * 0.9, 0, -sz * 0.9),
      en(cilindro(0.2, 3.4, M.acero, { lados: 16 }), 0, -0.9, 0),
      en(cilindro(0.38, 1.3, muelle, { lados: 16 }), 0, -0.8, 0),
      en(tornillo(0.42), 0, 0.85, 0),
    );
    pata.children[0].rotation.y = Math.atan2(sz, sx) * -1 + Math.PI;
    m.pon(en(pata, sx * 3.9, 3.3, sz * 3.9), { id: "anclajes", abre: [sx * 1.6, 0, sz * 1.6] });
  }
  return m;
}
