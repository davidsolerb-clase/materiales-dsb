import { Modelo, M, THREE, agujeroRedondo, bandeja, caja, chip, cilindro, circuito, en, grupo, lamina, placa, rotulo as nombre, texto, textura, mat } from "./kit.js";

export function lector() {
  const m = new Modelo();
  const W = 14.6, D = 17, cz = 1.7; // cz: centro del disco con la bandeja dentro
  const chapa = mat(0xb9bec7, { metal: 0.9, rug: 0.45 });
  const circ = (r) => Array.from({ length: 72 }, (_, i) => [Math.cos(i / 72 * 6.2832) * r, Math.sin(i / 72 * 6.2832) * r]);

  m.pon(bandeja(W, 3.9, D, 0.15, chapa));

  const tapa = grupo(caja(W, 0.12, D, chapa, 0.05));
  tapa.add(en(lamina(7, 4.2, (c, w, h) => {
    c.fillStyle = "#f4f6f9";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#4de2e8";
    c.fillRect(0, 0, w, h * 0.22);
    texto(c, nombre("LECTOR DE CD / DVD", "ÓPTIMA 24X"), w * 0.05, h * 0.115, { tam: h * 0.11, color: "#10202a", peso: 800 });
    texto(c, nombre("Lee con un láser.", "Manejar con cuidado."), w * 0.05, h * 0.42, { tam: h * 0.1, color: "#1a1d24", peso: 700 });
    texto(c, "No mires la lente con el lector abierto.", w * 0.05, h * 0.6, { tam: h * 0.065, color: "#4a5160", peso: 500 });
    texto(c, "Láser de clase 1", w * 0.05, h * 0.85, { tam: h * 0.075, color: "#4a5160", peso: 700 });
  }, { px: 640 }), -2.4, 0.065, -3.5));
  m.pon(en(tapa, 0, 3.96, 0), { abre: [0, 6.5, 0] });

  // Frontal de plástico.
  const frontal = grupo(en(caja(W + 0.3, 2.35, 0.5, M.negro, 0.1), 0, 1.18, 0), en(caja(W + 0.3, 0.45, 0.5, M.negro, 0.1), 0, 3.9, 0));
  for (const x of [-7.15, 7.15]) frontal.add(en(caja(0.7, 1.4, 0.5, M.negro, 0.08), x, 3, 0));
  frontal.add(en(cilindro(0.09, 0.1, M.lima, { lados: 12 }), 3.4, 1.75, 0.26));
  frontal.children.at(-1).rotation.x = Math.PI / 2;
  m.pon(en(frontal, 0, 0, D / 2 + 0.2));

  const boton = caja(1.3, 0.42, 0.3, M.grisClaro, 0.1);
  m.pon(en(boton, 5.2, 1.75, D / 2 + 0.42), { id: "boton", abre: [0, 0, 1.6] });

  // Ranuras para tarjetas de memoria.
  const ranuras = grupo(en(caja(3, 0.24, 0.12, M.gris, 0.03), -1.1, 0.18, 0), en(caja(1.5, 0.2, 0.12, M.gris, 0.03), 1.9, 0.18, 0));
  const rotulo = lamina(5, 0.55, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    texto(c, "SD", w * 0.3, h / 2, { tam: h * 0.8, color: "#aab3c5", alinear: "center", peso: 700 });
    texto(c, "microSD", w * 0.8, h / 2, { tam: h * 0.8, color: "#aab3c5", alinear: "center", peso: 700 });
  }, { px: 512, transparente: true });
  rotulo.rotation.set(0, 0, 0);
  ranuras.add(en(rotulo, 0, -0.32, 0.02));
  m.pon(en(ranuras, -3.6, 0.9, D / 2 + 0.46), { id: "tarjetas", abre: [0, 0, 1.6] });

  // Bandeja con el disco encima. Al abrir, sale hacia delante.
  const fuera = [0, 0, 10];
  const ranura = new THREE.Path();
  ranura.moveTo(-1.4, 1.5); ranura.lineTo(1.4, 1.5); ranura.lineTo(1.4, 5.4); ranura.lineTo(-1.4, 5.4); ranura.closePath();
  const bandejaCd = grupo(
    placa([[-6.5, -6.4], [6.5, -6.4], [6.5, 6.6], [-6.5, 6.6]], 0.28, M.negroMate, { agujeros: [agujeroRedondo(0, 0, 2), ranura], bisel: 0.04 }),
    en(placa(circ(6.35), 0.1, M.negro, { agujeros: [agujeroRedondo(0, 0, 6.1)], bisel: 0.02 }), 0, 0.28, 0),
    en(caja(13.3, 1.3, 0.42, M.negro, 0.1), 0, 0.3, 6.95),
  );
  const logo = lamina(3, 0.5, (c, w, h) => { c.clearRect(0, 0, w, h); texto(c, nombre("CD · DVD", "24X"), w / 2, h / 2, { tam: h * 0.75, color: "#aab3c5", alinear: "center", peso: 800 }); }, { px: 256, transparente: true });
  logo.rotation.set(0, 0, 0);
  bandejaCd.add(en(logo, -4.4, 0.3, 7.17));
  m.pon(en(bandejaCd, 0, 2.7, cz), { id: "bandeja", abre: fuera });

  const arcoiris = textura(512, 512, (c, w) => {
    const g = c.createConicGradient(0.6, w / 2, w / 2);
    ["#dfe6f2", "#ff9ecb", "#ffe08a", "#9dffb0", "#8fd3ff", "#c6a8ff", "#dfe6f2", "#ffd0a8", "#a8fff0", "#dfe6f2"].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col));
    c.fillStyle = g;
    c.fillRect(0, 0, w, w);
  });
  const cd = placa(circ(6), 0.06, new THREE.MeshStandardMaterial({ map: arcoiris, metalness: 1, roughness: 0.16 }), { agujeros: [agujeroRedondo(0, 0, 0.75)], bisel: 0.01 });
  cd.geometry.computeBoundingBox();
  const uv = cd.geometry.attributes.uv, pos = cd.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 12 + 0.5, pos.getZ(i) / 12 + 0.5);
  m.pon(en(grupo(cd, en(placa(circ(1.9), 0.02, M.vidrio, { agujeros: [agujeroRedondo(0, 0, 0.75)], bisel: 0 }), 0, 0.065, 0)), 0, 3.1, cz), { abre: [0, 1.4, 10] });

  // Mecanismo.
  m.pon(en(caja(11.5, 0.3, 11.5, M.aceroOscuro, 0.1), 0, 1.5, cz - 1.2));
  const motor = grupo(cilindro(1.6, 0.5, M.acero), en(cilindro(0.72, 0.5, M.negro), 0, 0.45, 0));
  for (let i = 0; i < 3; i++) motor.add(en(cilindro(0.14, 0.1, M.oro, { lados: 10 }), Math.cos(i * 2.094) * 1.1, 0.27, Math.sin(i * 2.094) * 1.1));
  motor.userData.gira = 0.5;
  m.pon(en(motor, 0, 1.95, cz), { id: "motor" });

  const laser = grupo(caja(2.5, 0.7, 2.1, M.negro, 0.12), en(caja(1.1, 0.16, 1.1, M.aceroOscuro, 0.04), 0, 0.4, 0));
  const lente = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 12, 0, 6.2832, 0, 1.5708), M.vidrio);
  laser.add(en(lente, 0, 0.44, 0));
  for (const x of [-1.55, 1.55]) {
    const riel = cilindro(0.09, 6.4, M.acero, { lados: 10 });
    riel.rotation.x = Math.PI / 2;
    laser.add(en(riel, x, 0, -1.2));
  }
  m.pon(en(laser, 0, 2, cz - 3.4), { id: "laser" });

  const placaCtrl = grupo(circuito(13, 4.4, { semilla: 14, grosor: 0.12 }), en(chip(1.8, 1.8, "CONTROL"), -2.5, 0.13, 0), en(chip(1.2, 0.9, "MOTOR"), 1.4, 0.12, 0.6));
  m.pon(en(placaCtrl, 0, 0.5, -5.9), { id: "placa" });

  return m;
}
