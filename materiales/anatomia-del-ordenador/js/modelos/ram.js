import { Modelo, M, caja, chip, circuito, contactos, en, grupo, lamina, placa, rotulo, texto, mat } from "./kit.js";

// Se construye tumbada (el frente mira hacia +Y) y al final se pone de pie.
export function ram() {
  const m = new Modelo();
  const L = 13.3;

  m.pon(circuito(L, 3.1, { color: "#15181e", pista: "#303847", grosor: 0.12, semilla: 11 }), { id: "circuito" });

  // Ocho chips por cada cara.
  for (const lado of [1, -1]) {
    const fila = grupo();
    for (let i = 0; i < 8; i++) {
      const c = chip(1.05, 1.25, "RAM\n2 GB", { alto: 0.12 });
      c.position.set((i - 3.5) * 1.5 + (i > 3 ? 0.35 : -0.35), 0, -0.35);
      fila.add(c);
    }
    fila.rotation.z = lado === 1 ? 0 : Math.PI;
    m.pon(en(fila, 0, lado * 0.12, 0), { id: "chips" });
  }

  // Contactos dorados, con el hueco de la muesca.
  for (const lado of [1, -1]) {
    const g = grupo(en(contactos(34, 0.2, 0.13, 0.5), -3.05, 0, 0), en(contactos(26, 0.2, 0.13, 0.5), 3.85, 0, 0));
    m.pon(en(g, 0, lado * 0.065, 1.28), { id: "contactos" });
  }

  // Carcasa: dos chapas, una por cara.
  const metal = mat(0x2a2e37, { metal: 0.85, rug: 0.4 });
  const borde = [
    [-L / 2, 0.75], [-L / 2, -1.6], [-L / 2 + 0.7, -2.15], [-2.2, -2.15], [-1.6, -1.75], [1.6, -1.75], [2.2, -2.15], [L / 2 - 0.7, -2.15], [L / 2, -1.6], [L / 2, 0.75],
  ];
  for (const lado of [1, -1]) {
    const chapa = grupo(placa(borde, 0.14, metal, { bisel: 0.03 }));
    chapa.add(en(lamina(L - 0.6, 2.2, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#c6f432";
      c.fillRect(0, h * 0.84, w, h * 0.07);
      c.beginPath();
      c.moveTo(w * 0.62, h * 0.84); c.lineTo(w * 0.7, h * 0.1); c.lineTo(w * 0.76, h * 0.1); c.lineTo(w * 0.68, h * 0.84);
      c.fill();
      texto(c, rotulo("MEMORIA RAM", "VELOX NEO"), w * 0.04, h * 0.36, { tam: h * 0.3, color: "#eef2f8", peso: 800 });
      texto(c, "16 GB · DDR4", w * 0.04, h * 0.64, { tam: h * 0.17, color: "#aab3c5", peso: 600 });
      texto(c, "16", w * 0.96, h * 0.45, { tam: h * 0.5, color: "#c6f432", peso: 800, alinear: "right" });
    }, { px: 1024, metal: 0.5, rug: 0.4, transparente: true }), 0, 0.145, -0.6));
    if (lado === -1) chapa.rotation.z = Math.PI;
    m.pon(en(chapa, 0, lado * 0.2, 0), { id: "carcasa", abre: lado === 1 ? [0, 1.1, -3.7] : [0, -1.8, 0] });
  }

  m.raiz.rotation.x = Math.PI / 2;
  return m;
}
