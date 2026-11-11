import { Modelo, M, THREE, agujeroRedondo, anillo, bandeja, caja, cilindro, circuito, copias, en, grupo, lamina, placa, rotulo, texto, tubo, ventilador, mat } from "./kit.js";

export function fuente() {
  const m = new Modelo();
  const chapa = mat(0x2b3039, { metal: 0.75, rug: 0.5 });
  const W = 15, H = 8.6, D = 14;

  // Caja con su pegatina lateral.
  const cuerpo = bandeja(W, H - 0.2, D, 0.2, chapa);
  const pegatina = lamina(11, 5, (c, w, h) => {
    c.fillStyle = "#11141b";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#ff6b4a";
    c.fillRect(0, 0, w * 0.035, h);
    texto(c, rotulo("FUENTE DE ALIMENTACIÓN", "VOLTIA · SERIE ORO"), w * 0.08, h * 0.16, { tam: h * 0.085, color: "#aab3c5", peso: 700 });
    texto(c, "550 W", w * 0.08, h * 0.45, { tam: h * 0.3, peso: 800 });
    texto(c, rotulo("Entra: 230 V del enchufe", "Modelo 550-A"), w * 0.08, h * 0.72, { tam: h * 0.08, color: "#aab3c5", peso: 500 });
    texto(c, rotulo("Sale: 12 V · 5 V · 3,3 V", "Hecho para durar"), w * 0.08, h * 0.86, { tam: h * 0.08, color: "#ff6b4a", peso: 700 });
  }, { px: 768, rug: 0.45 });
  pegatina.rotation.set(0, Math.PI / 2, 0);
  cuerpo.add(en(pegatina, W / 2 + 0.01, H / 2 - 0.2, 0));
  m.pon(cuerpo);

  // Tapa con rejilla.
  const tapa = grupo(placa([[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]], 0.2, chapa, { agujeros: [agujeroRedondo(0, 0, 6.1)], bisel: 0.04 }));
  for (const r of [1.2, 2.4, 3.6, 4.8, 6]) tapa.add(en(anillo(r, 0.085, M.acero), 0, 0.14, 0));
  for (let i = 0; i < 4; i++) {
    const b = caja(12.3, 0.12, 0.16, M.acero, 0.02);
    b.rotation.y = (i * Math.PI) / 4;
    tapa.add(en(b, 0, 0.1, 0));
  }
  tapa.add(en(cilindro(1.1, 0.12, M.negro), 0, 0.2, 0));
  m.pon(en(tapa, 0, H - 0.2, 0), { abre: [0, 9, 0] });

  m.pon(en(ventilador(5.8, { aspas: 9, alto: 1.5, pegatina: "#ff6b4a" }), 0, H - 1.15, 0), { id: "ventilador", abre: [0, 5.2, 0] });

  // Dentro.
  m.pon(en(circuito(14.2, 13.2, { color: "#a8823a", pista: "#d6b56c", semilla: 31, grosor: 0.16 }), 0, 0.5, 0));

  const ferrita = mat(0x33363d, { rug: 0.7 });
  const trafo = (a, h, f) => grupo(caja(a, h, f, M.amarillo, 0.12), en(caja(a * 1.12, h * 0.16, f * 0.7, ferrita, 0.04), 0, h * 0.5, 0), en(caja(a * 1.12, h * 0.16, f * 0.7, ferrita, 0.04), 0, -h * 0.46, 0));
  m.pon(en(grupo(en(trafo(3.3, 3.4, 3), -0.6, 0, -0.4), en(trafo(1.8, 2, 1.7), -0.9, -0.7, 3.4)), 0, 2.4, 0), { id: "transformador" });

  const funda = mat(0x1e2128, { rug: 0.35 });
  const cond = (r, h, material) => grupo(cilindro(r, h, material), en(cilindro(r * 0.92, 0.05, M.aluminio), 0, h / 2 + 0.02, 0), en(cilindro(r * 1.01, h * 0.12, M.grisClaro), 0, h * 0.2, 0));
  const conds = grupo(en(cond(1.3, 4.4, funda), -5.2, 0, 3.8), en(cond(1.3, 4.4, funda), -5.2, 0, 0.8));
  for (const [x, z] of [[-3, -4.6], [-1.6, -4.9], [3.6, 4.9], [5, 4.6], [3.7, -5.2]]) conds.add(en(cond(0.5, 2, M.azul), x, -1.2, z));
  m.pon(en(conds, 0, 2.8, 0), { id: "condensadores" });

  const peine = (largo) => {
    const pos = [];
    for (let i = 0; i < 9; i++) pos.push([0.5, 0, (i - 4) * (largo / 9)]);
    return grupo(caja(0.3, 4.6, largo, M.aluminio, 0.04), copias(new THREE.BoxGeometry(1, 4.4, 0.12), M.aluminio, pos));
  };
  m.pon(en(grupo(en(peine(8), 2.3, 0, -0.6), en(peine(6), 5.3, 0, 0.4)), 0, 2.9, 0), { id: "disipadores" });

  for (const [x, z] of [[-4.6, -3.4], [0.6, 4.6]]) {
    const b = anillo(0.85, 0.36, M.cobre, 32);
    b.rotation.set(0, 0.6, 0);
    m.pon(en(b, x, 1.75, z));
  }

  // Detrás: toma de corriente e interruptor.
  const toma = grupo(
    en(caja(3.2, 2.5, 0.35, M.negro, 0.1), -1.2, 0, 0),
    en(caja(2.5, 1.8, 0.2, M.negroMate, 0.08), -1.2, 0, 0.12),
    en(caja(1.9, 2.5, 0.35, M.negro, 0.1), 2.3, 0, 0),
    en(caja(1.3, 1.8, 0.4, M.rojo, 0.1), 2.3, 0, 0.15),
  );
  for (const [x, y] of [[-1.9, -0.25], [-1.2, 0.35], [-0.5, -0.25]]) toma.add(en(caja(0.14, 0.5, 0.5, M.acero, 0.02), x, y, 0.2));
  toma.children[3].rotation.x = -0.2;
  m.pon(en(toma, -3.4, 2.4, D / 2 + 0.1), { id: "toma", abre: [0, 0, 2.6] });
  const rejilla = lamina(6, 6.4, (c, w, h) => {
    c.fillStyle = "#2b3039";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#0c0e13";
    for (let j = 0; j < 16; j++) for (let i = 0; i < 15; i++) {
      c.beginPath();
      c.arc(w * 0.05 + i * (w * 0.064) + (j % 2) * w * 0.032, h * 0.05 + j * h * 0.06, w * 0.024, 0, 7);
      c.fill();
    }
  }, { px: 384, metal: 0.6, rug: 0.5 });
  rejilla.rotation.set(0, 0, 0);
  m.pon(en(rejilla, 3.9, 4.3, D / 2 + 0.01));

  // Delante: los cables que van a las piezas.
  const cables = grupo();
  const malla = mat(0x17191e, { rug: 0.8 });
  for (const [x, ancho, y] of [[-4, 5.2, 0.9], [0.6, 2.2, 0.9], [4, 2.6, 0.5]]) {
    cables.add(tubo([[x * 0.6, 3, 0.3], [x * 0.8, 3, -1.6], [x, 1.6, -3.6], [x * 1.05, 0.7, -5.6]], 0.42, malla));
    const clavija = grupo(caja(ancho, y * 2, 1.3, M.negro, 0.08));
    clavija.add(en(lamina(ancho * 0.9, y * 1.7, (c, w, h) => {
      c.fillStyle = "#15171c";
      c.fillRect(0, 0, w, h);
      const n = Math.round(ancho / 0.43);
      c.fillStyle = "#f2c14e";
      for (let i = 0; i < n; i++) for (let j = 0; j < (y > 0.6 ? 2 : 1); j++) c.fillRect((i + 0.25) * (w / n), (j + 0.25) * (h / (y > 0.6 ? 2 : 1)), w / n / 2, h / (y > 0.6 ? 2 : 1) / 2);
    }, { px: 256, metal: 0.4 }), 0, 0, -0.66));
    clavija.children[1].rotation.set(0, Math.PI, 0);
    cables.add(en(clavija, x * 1.05, 0.7 + (y - 0.5) * 0.4, -6.2));
  }
  m.pon(en(cables, 0, 0, -D / 2), { id: "cables", abre: [0, 0, -2.4] });

  return m;
}
