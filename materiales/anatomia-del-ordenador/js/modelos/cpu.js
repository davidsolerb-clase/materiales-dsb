import { Modelo, M, THREE, caja, circuito, copias, en, grupo, lamina, rotulo, texto, mat } from "./kit.js";

export function cpu() {
  const m = new Modelo();

  // Placa verde con sus condensadores diminutos.
  const sustrato = grupo(circuito(4, 4, { grosor: 0.14, semilla: 3, densidad: 1.5 }));
  const tostado = mat(0xb89a6a, { rug: 0.5 });
  for (const [x, z] of [[-1.25, -1.2], [-0.9, -1.25], [1.2, -1.15], [1.3, 0.9], [-1.3, 1.1], [0.2, 1.3], [0.6, 1.3], [-1.35, 0.1]]) {
    sustrato.add(en(caja(0.16, 0.08, 0.09, tostado, 0.01), x, 0.11, z));
  }
  m.pon(sustrato, { id: "sustrato" });

  // Patillas doradas por debajo.
  const pos = [];
  for (let i = -11; i <= 11; i++) {
    for (let j = -11; j <= 11; j++) {
      if (Math.abs(i) < 4 && Math.abs(j) < 4) continue;
      pos.push([i * 0.16, 0, j * 0.16]);
    }
  }
  const patillas = copias(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 6), M.oro, pos);
  m.pon(en(patillas, 0, -0.19, 0), { id: "contactos", abre: [0, -1.1, 0] });

  // El chip de silicio.
  const chip = grupo(caja(1.5, 0.1, 1.1, M.silicio, 0.012), en(caja(1.62, 0.03, 1.22, mat(0x1c2233, { rug: 0.5 }), 0), 0, -0.04, 0));
  m.pon(en(chip, 0, 0.13, 0), { id: "chip", abre: [0, 0.95, 0] });

  // Tapa metálica.
  const tapa = grupo(
    en(caja(3.7, 0.07, 3.7, M.acero, 0.03), 0, 0.035, 0),
    en(caja(3.05, 0.26, 3.05, M.acero, 0.1), 0, 0.17, 0),
    en(lamina(2.7, 2.7, (c, w) => {
      c.clearRect(0, 0, w, w);
      texto(c, rotulo("PROCESADOR", "ZX · 3600"), w / 2, w * 0.3, { tam: w * 0.105, color: "#3a4150", alinear: "center", peso: 800 });
      texto(c, "6 núcleos", w / 2, w * 0.5, { tam: w * 0.15, color: "#3a4150", alinear: "center", peso: 800 });
      texto(c, "3,6 GHz", w / 2, w * 0.68, { tam: w * 0.09, color: "#4b5466", alinear: "center", peso: 600 });
      c.fillStyle = "#3a4150";
      c.beginPath();
      c.moveTo(w * 0.04, w * 0.96);
      c.lineTo(w * 0.14, w * 0.96);
      c.lineTo(w * 0.04, w * 0.86);
      c.fill();
    }, { px: 512, metal: 0.9, rug: 0.35, transparente: true }), 0, 0.302, 0),
  );
  m.pon(en(tapa, 0, 0.07, 0), { id: "tapa", abre: [0, 2.3, 0] });

  return m;
}
