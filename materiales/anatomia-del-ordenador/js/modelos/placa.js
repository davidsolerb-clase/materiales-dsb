import { Modelo, M, THREE, agujeroRedondo, caja, chip, cilindro, circuito, copias, en, grupo, lamina, placa as plancha, texto, mat } from "./kit.js";

export function placa() {
  const m = new Modelo();
  const T = 24.4;
  const gris = mat(0x3a3f4a, { metal: 0.85, rug: 0.42 });
  const crema = mat(0xe8e2d0, { rug: 0.5 });

  // Tablero con lo que va soldado y no tiene nombre aquí.
  const tablero = grupo(circuito(T, T, { color: "#0e3b2c", pista: "#2f9a6c", semilla: 2, grosor: 0.18, densidad: 1.7 }));
  const aletas = (ancho, fondo, n) => {
    const pos = [];
    const aLoLargo = fondo > ancho;
    for (let i = 0; i < n; i++) pos.push(aLoLargo ? [0, 0.5, (i - (n - 1) / 2) * (fondo / n)] : [(i - (n - 1) / 2) * (ancho / n), 0.5, 0]);
    return grupo(caja(ancho, 1, fondo, gris, 0.1), copias(new THREE.BoxGeometry(aLoLargo ? ancho : 0.16, 1, aLoLargo ? 0.16 : fondo), gris, pos));
  };
  tablero.add(en(aletas(1.7, 6.6, 12), -6.8, 0.6, -4.5), en(aletas(6.6, 1.7, 12), -2, 0.6, -9.4));
  for (const z of [6.6, 9.6]) tablero.add(en(caja(2.8, 0.9, 0.75, M.negro, 0.06), -5, 0.54, z));
  tablero.add(en(chip(2.4, 2.4, "CHIPSET"), 5.4, 0.16, 6.6), en(chip(1.3, 1.3, "AUDIO"), -9.6, 0.16, 9.4), en(chip(1.2, 1.2, "RED"), -8.2, 0.16, 4.2));
  const lata = [];
  for (const [x, z] of [[-8.6, -8.6], [-7.6, -9.6], [-5.6, -0.6], [-4.2, -0.4], [-2.4, -0.4], [0.9, -8.2], [1.3, -6.8], [1.3, -2.2], [-9.6, 6.2], [-8.4, 7.4], [-10.4, 10.8], [2, 10.6], [9.6, 11], [10.6, 1.6]]) lata.push([x, 0.5, z]);
  tablero.add(copias(new THREE.CylinderGeometry(0.33, 0.33, 0.8, 16), mat(0x1b1d23, { rug: 0.35 }), lata));
  tablero.add(copias(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 16), M.aluminio, lata.map(([x, y, z]) => [x, y + 0.41, z])));
  tablero.add(en(caja(7.6, 0.25, 2.3, M.aceroOscuro, 0.05), 1.2, 0.2, 9.4));
  const pines = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) pines.push([6.2 + i * 0.3, 0.4, 11.4 + j * 0.3]);
  tablero.add(copias(new THREE.BoxGeometry(0.08, 0.6, 0.08), M.oro, pines));
  m.pon(tablero);

  // Zócalo del procesador.
  const zocalo = grupo(
    en(caja(5.4, 0.4, 5.4, crema, 0.08), 0, 0.2, 0),
    en(lamina(4.1, 4.1, (c, w) => {
      c.fillStyle = "#2a2418";
      c.fillRect(0, 0, w, w);
      c.fillStyle = "#f2c14e";
      for (let i = 0; i < 30; i++) for (let j = 0; j < 30; j++) {
        if (Math.abs(i - 14.5) < 4 && Math.abs(j - 14.5) < 4) continue;
        c.fillRect(w * 0.03 + i * (w * 0.0315), w * 0.03 + j * (w * 0.0315), w * 0.014, w * 0.014);
      }
    }, { px: 512, metal: 0.7, rug: 0.35 }), 0, 0.41, 0),
    en(plancha([[-3, -3], [3, -3], [3, 3], [-3, 3]], 0.14, M.acero, { agujeros: [cuadro(2.2)], bisel: 0.03 }), 0, 0.42, 0),
    en(cilindro(0.09, 6, M.acero, { lados: 10 }), 3.25, 0.5, 0),
  );
  zocalo.children[3].rotation.x = Math.PI / 2;
  m.pon(en(zocalo, -2, 0.09, -4.5), { id: "zocalo", abre: [0, 6, 0] });

  // Cuatro ranuras para la memoria RAM.
  const ranuras = grupo();
  [3.7, 5, 6.3, 7.6].forEach((x, i) => {
    ranuras.add(en(caja(0.72, 1, 13.6, i % 2 ? M.negro : M.gris, 0.06), x, 0, 0));
    ranuras.add(en(caja(0.2, 0.05, 12.6, M.negroMate, 0), x, 0.5, 0));
    for (const z of [-6.9, 6.9]) ranuras.add(en(caja(0.9, 1.25, 0.5, crema, 0.08), x, 0.1, z));
  });
  m.pon(en(ranuras, 0, 0.59, -4.5), { id: "ram", abre: [0, 7.5, 0] });

  // Ranura larga para la tarjeta gráfica.
  const larga = grupo(caja(9.2, 1, 0.8, M.negro, 0.06), en(caja(8.6, 0.05, 0.22, M.grisClaro, 0), -0.1, 0.5, 0), en(caja(0.7, 1.2, 1, crema, 0.08), 4.7, 0.05, 0));
  m.pon(en(larga, -1.8, 0.59, 3.5), { id: "pcie", abre: [0, 6, 0] });

  // Disipador del chipset.
  const tapaChip = grupo(caja(5.2, 0.9, 5.2, gris, 0.25));
  tapaChip.add(en(lamina(4.4, 4.4, (c, w) => {
    c.clearRect(0, 0, w, w);
    c.strokeStyle = "#36d399";
    c.lineWidth = w * 0.03;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(w * 0.1, w * (0.2 + i * 0.09)); c.lineTo(w * (0.55 - i * 0.08), w * (0.2 + i * 0.09)); c.stroke(); }
    texto(c, "CHIPSET", w * 0.9, w * 0.82, { tam: w * 0.13, color: "#cfd5df", alinear: "right", peso: 800 });
  }, { px: 384, metal: 0.6, rug: 0.4, transparente: true }), 0, 0.455, 0));
  m.pon(en(tapaChip, 5.4, 0.75, 6.6), { id: "chipset", abre: [0, 6.5, 0] });

  // Conectores de corriente: el grande de 24 y el del procesador.
  const clavija = (ancho, fondo, cols, filas) => grupo(
    caja(ancho, 1.3, fondo, crema, 0.08),
    en(lamina(ancho * 0.9, fondo * 0.9, (c, w, h) => {
      c.fillStyle = "#e8e2d0";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#3a3428";
      for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) c.fillRect((i + 0.2) * (w / cols), (j + 0.2) * (h / filas), (w / cols) * 0.6, (h / filas) * 0.6);
    }, { px: 256 }), 0, 0.66, 0),
  );
  m.pon(en(clavija(1.2, 5.4, 2, 12), 11, 0.75, -3.4), { id: "corriente", abre: [0, 6, 0] });
  m.pon(en(clavija(2.2, 1.2, 4, 2), -8.2, 0.75, -11.3), { id: "corriente", abre: [0, 6, 0] });

  // Puertos SATA.
  const sata = grupo();
  for (const z of [0, 1.7]) for (const y of [0, 0.75]) {
    sata.add(en(caja(1.5, 0.65, 1.4, M.negro, 0.06), 0, y, z));
    sata.add(en(caja(0.1, 0.3, 1, M.grisClaro, 0), 0.76, y, z));
  }
  m.pon(en(sata, 11.2, 0.42, 6.2), { id: "sata", abre: [0, 5, 0] });

  // Pila.
  const pila = grupo(cilindro(1.3, 0.3, M.negro), en(cilindro(1.05, 0.34, M.acero), 0, 0.12, 0));
  pila.add(en(lamina(1.8, 1.8, (c, w) => {
    c.clearRect(0, 0, w, w);
    texto(c, "+", w / 2, w * 0.3, { tam: w * 0.34, color: "#4b5466", alinear: "center", peso: 800 });
    texto(c, "3 V", w / 2, w * 0.62, { tam: w * 0.2, color: "#4b5466", alinear: "center", peso: 700 });
  }, { px: 128, metal: 0.9, rug: 0.3, transparente: true }), 0, 0.295, 0));
  m.pon(en(pila, -3.2, 0.24, 8), { id: "pila", abre: [0, 7.5, 0] });

  // Puertos traseros, mirando hacia fuera.
  const puertos = grupo();
  const usb = (z, color = M.azul) => {
    puertos.add(en(caja(1.9, 1.7, 1.5, M.acero, 0.06), 0, 0.85, z));
    for (const y of [0.5, 1.25]) puertos.add(en(caja(0.1, 0.22, 1.1, color, 0), -0.95, y, z));
  };
  usb(-10.2, M.negro);
  usb(-4.6);
  puertos.add(en(caja(1.9, 0.7, 1.7, M.acero, 0.06), 0, 0.35, -7.5), en(caja(0.1, 0.35, 1.4, M.negro, 0), -0.95, 0.35, -7.5));
  puertos.add(en(caja(1.9, 0.75, 1.9, M.acero, 0.06), 0, 1.3, -7.5), en(caja(0.1, 0.4, 1.6, M.negro, 0), -0.95, 1.3, -7.5));
  usb(-1.9);
  puertos.add(en(caja(1.9, 1.5, 1.7, M.acero, 0.06), 0, 2.45, -1.9), en(caja(0.1, 1, 1.3, M.negro, 0), -0.95, 2.45, -1.9));
  puertos.add(en(caja(1.9, 3.3, 1.5, M.negro, 0.08), 0, 1.65, 1));
  [M.azul, M.lima, mat(0xff7eb6, { rug: 0.4 })].forEach((color, i) => {
    const aro = cilindro(0.42, 0.2, color, { lados: 24 });
    aro.rotation.z = Math.PI / 2;
    puertos.add(en(aro, -0.98, 0.6 + i * 1.05, 1));
  });
  m.pon(en(puertos, -11.1, 0.09, 0), { id: "puertos", abre: [-5, 3, 0] });

  return m;
}

function cuadro(lado) {
  const p = new THREE.Path();
  p.moveTo(-lado, -lado);
  p.lineTo(-lado, lado);
  p.lineTo(lado, lado);
  p.lineTo(lado, -lado);
  p.closePath();
  return p;
}
