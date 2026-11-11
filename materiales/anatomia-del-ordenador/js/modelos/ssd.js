import { Modelo, M, bandeja, caja, chip, circuito, conectorSata, en, grupo, lamina, rotulo, texto, mat } from "./kit.js";

export function ssd() {
  const m = new Modelo();
  const metal = mat(0x3b4049, { metal: 0.9, rug: 0.42 });

  m.pon(bandeja(10, 0.62, 7, 0.14, metal));

  const tapa = grupo(caja(10, 0.12, 7, metal, 0.05));
  tapa.add(en(lamina(9.2, 6.2, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#1b1f2b");
    g.addColorStop(1, "#0f1219");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#b79cff";
    c.fillRect(0, h * 0.86, w, h * 0.14);
    texto(c, rotulo("SSD", "NOVA"), w * 0.07, h * 0.33, { tam: h * 0.34, peso: 800 });
    texto(c, rotulo("Disco de estado sólido", "Serie 500 · sin piezas móviles"), w * 0.07, h * 0.6, { tam: h * 0.085, color: "#aab3c5", peso: 500 });
    texto(c, "500 GB", w * 0.93, h * 0.93, { tam: h * 0.09, color: "#14101f", peso: 800, alinear: "right" });
    texto(c, "SATA · 6 Gb/s", w * 0.07, h * 0.93, { tam: h * 0.07, color: "#14101f", peso: 700 });
  }, { px: 1024, rug: 0.38 }), 0, 0.062, 0));
  m.pon(en(tapa, 0, 0.68, 0), { id: "carcasa", abre: [0, 3.2, 0] });

  // Dentro: una placa pequeña con sus chips.
  const sube = [0, 1.3, 0];
  m.pon(en(circuito(9.2, 4.4, { semilla: 21, grosor: 0.1, color: "#123f6b", pista: "#3d86c9" }), 0, 0.26, 1.1), { abre: sube });
  m.pon(en(chip(1.7, 1.7, "CONTROL", { alto: 0.13 }), 2.6, 0.37, 1.6), { id: "controlador", abre: sube });
  const flash = grupo();
  for (const [x, z] of [[-3.3, 0.2], [-1.2, 0.2], [-3.3, 2.1], [-1.2, 2.1]]) flash.add(en(chip(1.8, 1.4, "FLASH\n128 GB", { alto: 0.13 }), x, 0, z));
  m.pon(en(flash, 0, 0.37, 0), { id: "memoria", abre: sube });
  m.pon(en(chip(1.1, 0.8, "RAM", { alto: 0.1 }), 2.7, 0.36, -0.2), { abre: sube });
  m.pon(en(conectorSata(), -1.6, 0.45, 3.35), { id: "conector", abre: sube });

  return m;
}
