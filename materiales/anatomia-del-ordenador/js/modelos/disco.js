import { Modelo, M, bandeja, caja, chip, cilindro, circuito, conectorSata, en, grupo, lamina, placa, rotulo, texto, tornillo, mat } from "./kit.js";

export function disco() {
  const m = new Modelo();
  const fundicion = mat(0x8d939d, { metal: 0.9, rug: 0.55 });
  const cz = -1.9; // centro de los platos

  m.pon(en(bandeja(10.2, 2.1, 14.7, 0.4, fundicion), 0, 0.3, 0));

  // Platos: discos brillantes donde se graban los datos.
  const platos = grupo();
  for (const y of [1.15, 1.75]) {
    const d = placa(circulo(4.75), 0.07, M.espejo, { agujeros: [], bisel: 0.015 });
    platos.add(en(d, 0, y, 0));
  }
  m.pon(en(platos, 0, 0, cz), { id: "platos", abre: [0, 1.5, 0] });

  // Motor: el eje del centro, que gira.
  const eje = grupo(cilindro(1.25, 1.35, M.acero), en(cilindro(1.45, 0.08, M.aceroOscuro), 0, 0.68, 0));
  for (let i = 0; i < 6; i++) eje.add(en(tornillo(0.13), Math.cos(i * 1.047) * 0.95, 0.74, Math.sin(i * 1.047) * 0.95));
  eje.userData.gira = 0.5;
  m.pon(en(eje, 0, 1.38, cz), { id: "motor", abre: [0, 1.5, 0] });

  // Brazo con el cabezal en la punta.
  const brazo = grupo(
    cilindro(0.75, 1.2, M.acero),
    en(placa([[-0.55, 0], [-0.16, -6.3], [0.16, -6.3], [0.55, 0]], 0.14, M.aluminio), 0, 0.25, 0),
    en(placa([[-0.5, 0], [-0.14, -6.1], [0.14, -6.1], [0.5, 0]], 0.1, M.aluminio), 0, -0.3, 0),
    en(caja(0.34, 0.14, 0.4, M.negro, 0.03), 0, 0.2, -6.25),
    en(caja(2.6, 0.9, 1.9, M.aceroOscuro, 0.2), 0, -0.05, 1.2),
    en(caja(1.9, 0.2, 1.2, M.cobre, 0.05), 0, 0.45, 1.2),
  );
  brazo.rotation.y = 0.5;
  m.pon(en(brazo, 2.9, 1.45, 4.3), { id: "cabezal", abre: [0, 1.5, 0] });

  // Tapa con su pegatina.
  const tapa = grupo(caja(10.2, 0.14, 14.7, M.acero, 0.06));
  tapa.add(en(lamina(8, 9, (c, w, h) => {
    c.fillStyle = "#f4f6f9";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffd23f";
    c.fillRect(0, 0, w, h * 0.2);
    texto(c, rotulo("DISCO DURO", "ALMA 1000"), w * 0.06, h * 0.1, { tam: h * 0.085, color: "#1a1d24", peso: 800 });
    texto(c, "1 TB", w * 0.06, h * 0.36, { tam: h * 0.2, color: "#1a1d24", peso: 800 });
    texto(c, "7200 vueltas por minuto", w * 0.06, h * 0.52, { tam: h * 0.05, color: "#4a5160", peso: 600 });
    texto(c, "SATA · 3,5 pulgadas", w * 0.06, h * 0.6, { tam: h * 0.05, color: "#4a5160", peso: 600 });
    c.fillStyle = "#1a1d24";
    let x = w * 0.06;
    for (let i = 0; i < 46; i++) {
      const a = 3 + ((i * 7) % 5) * 2.2;
      c.fillRect(x, h * 0.72, a, h * 0.16);
      x += a + 4 + ((i * 3) % 4);
    }
    texto(c, "No abrir: el polvo lo estropea", w * 0.06, h * 0.94, { tam: h * 0.04, color: "#8a91a0", peso: 500 });
  }, { px: 768, rug: 0.5 }), 0, 0.075, 1.2));
  for (const [x, z] of [[-4.6, -6.8], [4.6, -6.8], [-4.6, 6.8], [4.6, 6.8], [-4.6, 0], [4.6, 0]]) tapa.add(en(tornillo(0.2), x, 0.09, z));
  m.pon(en(tapa, 0, 2.47, 0), { id: "tapa", abre: [0, 7.5, 0] });

  // Por debajo: la placa que lo controla y los conectores.
  const baja = [0, -2.2, 0];
  const controladora = grupo(circuito(9.4, 8.2, { semilla: 5, grosor: 0.12 }));
  const debajo = chip(1.8, 1.8, "CONTROL");
  debajo.rotation.z = Math.PI;
  controladora.add(en(debajo, -1.5, -0.13, 0.4));
  m.pon(en(controladora, 0, 0.18, 2.9), { id: "placa", abre: baja });
  m.pon(en(conectorSata(), -1.7, 0.5, 7.15), { id: "conector", abre: baja });

  return m;
}

function circulo(r, n = 72) {
  const p = [];
  for (let i = 0; i < n; i++) p.push([Math.cos((i / n) * 6.2832) * r, Math.sin((i / n) * 6.2832) * r]);
  return p;
}
