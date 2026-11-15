import { Modelo, M, THREE, caja, chip, cilindro, circuito, contactos, copias, en, grupo, lamina, rotulo, texto, tornillo, mat } from "./kit.js";

// SSD M.2: una tarjeta estrecha que se pincha directamente en la placa base.
export function m2() {
  const m = new Modelo();
  const L = 8, W = 2.2;

  m.pon(circuito(L, W, { color: "#10233f", pista: "#2f5f9f", semilla: 12, grosor: 0.1, densidad: 0.8 }), { id: "circuito" });

  // Contactos dorados en un extremo, con su muesca.
  for (const lado of [1, -1]) {
    const fila = grupo(en(contactos(4, 0.14, 0.09, 0.5), -0.72, 0, 0), en(contactos(8, 0.14, 0.09, 0.5), 0.36, 0, 0));
    fila.rotation.y = Math.PI / 2;
    m.pon(en(fila, -L / 2 + 0.27, lado * 0.055, 0), { id: "contactos", abre: [-1.2, 0, 0] });
  }

  m.pon(en(chip(1.5, 1.5, "CONTROL", { alto: 0.12 }), -2.2, 0.11, 0), { id: "controlador", abre: [0, 0.9, 0] });
  const memoria = grupo();
  for (const x of [-0.1, 1.9]) memoria.add(en(chip(1.7, 1.5, "FLASH\n500 GB", { alto: 0.12 }), x, 0, 0));
  m.pon(en(memoria, 0, 0.11, 0), { id: "memoria", abre: [0, 0.9, 0] });

  // Tornillo que lo sujeta a la placa, en el extremo contrario a los contactos.
  m.pon(en(tornillo(0.26), L / 2 - 0.2, 0.12, 0), { id: "tornillo", abre: [0.6, 1.6, 0] });

  // Pegatina que tapa los chips.
  const pegatina = lamina(6.3, 1.9, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#151a26");
    g.addColorStop(1, "#0d111a");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#7ad7c0";
    c.fillRect(0, 0, w * 0.02, h);
    texto(c, rotulo("SSD M.2", "RAYO M"), w * 0.05, h * 0.36, { tam: h * 0.42, peso: 800 });
    texto(c, rotulo("Se pincha en la placa, sin cables", "Serie 1000 · PCIe"), w * 0.05, h * 0.76, { tam: h * 0.2, color: "#aab3c5", peso: 500 });
    texto(c, "1 TB", w * 0.96, h * 0.5, { tam: h * 0.5, color: "#7ad7c0", peso: 800, alinear: "right" });
  }, { px: 1024, rug: 0.4 });
  m.pon(en(pegatina, -0.3, 0.24, 0), { id: "pegatina", abre: [0, 2.2, 0] });

  return m;
}

// Tarjeta wifi: tumbada, con la chapa y las antenas a un lado.
export function wifi() {
  const m = new Modelo();
  const L = 7.4, F = 5.4;
  const tablero = grupo(circuito(L, F, { color: "#2f1a4f", pista: "#7c4fd0", semilla: 23, grosor: 0.14, densidad: 1.2 }));
  for (const [x, z] of [[2.6, 1.7], [2.9, -1.9], [-2.4, 1.9], [1.2, 2]]) tablero.add(en(cilindro(0.24, 0.6, M.negro, { lados: 14 }), x, 0.36, z));
  tablero.add(en(chip(1.1, 1.1, "USB", { alto: 0.12 }), 2.5, 0.13, 0));
  m.pon(tablero);

  // Módulo de radio, debajo de una tapa metálica.
  m.pon(en(chip(2.4, 2.4, "RADIO\nWIFI"), -0.4, 0.14, -0.3), { id: "radio" });
  const tapa = grupo(caja(3.4, 0.5, 3.2, M.acero, 0.06));
  tapa.add(en(lamina(3, 2.6, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    texto(c, rotulo("WIFI", "ONDA 6"), w / 2, h * 0.4, { tam: h * 0.3, color: "#4b5466", peso: 800, alinear: "center" });
    texto(c, "2,4 y 5 GHz", w / 2, h * 0.7, { tam: h * 0.15, color: "#4b5466", peso: 600, alinear: "center" });
  }, { px: 256, metal: 0.8, rug: 0.35, transparente: true }), 0, 0.255, 0));
  m.pon(en(tapa, -0.4, 0.42, -0.3), { id: "blindaje", abre: [0, 2.6, 0] });

  // Lengüeta corta de contactos: va a una ranura pequeña de la placa base.
  const lengua = grupo(caja(2.6, 0.14, 1, mat(0x2f1a4f), 0.02), en(contactos(11, 0.2, 0.13, 0.8), 0, 0.08, 0.04), en(contactos(11, 0.2, 0.13, 0.8), 0, -0.08, 0.04));
  m.pon(en(lengua, -1.6, 0, F / 2 + 0.45), { id: "conector", abre: [0, 0, 1.6] });

  // Chapa trasera, con las tomas de antena.
  const chapa = grupo(caja(0.12, 2.2, F + 1.6, M.acero, 0.03));
  for (const z of [-1.5, 1.5]) {
    const toma = cilindro(0.34, 0.7, M.oro, { lados: 16 });
    toma.rotation.z = Math.PI / 2;
    chapa.add(en(toma, -0.3, 0.2, z));
  }
  m.pon(en(chapa, -L / 2 - 0.2, 0.9, 0), { id: "chapa", abre: [-1.6, 0, 0] });

  // Dos antenas articuladas.
  const antenas = grupo();
  for (const z of [-1.5, 1.5]) {
    const a = grupo(
      en(cilindro(0.42, 1.1, M.negro, { lados: 16 }), 0, 0, 0),
      en(cilindro(0.36, 8.2, M.negroMate, { lados: 16, radioAbajo: 0.42 }), 0, 4.6, 0),
      en(cilindro(0.38, 0.2, mat(0xe6a5ff, { rug: 0.4 }), { lados: 16 }), 0, 1.2, 0),
    );
    a.rotation.x = z > 0 ? 0.22 : -0.22;
    antenas.add(en(a, 0, 0, z));
  }
  m.pon(en(antenas, -L / 2 - 1.1, 1.3, 0), { id: "antenas", abre: [-3.4, 0.8, 0] });

  return m;
}

// Pareja de altavoces. `separacion` es la distancia entre los dos, de centro a centro.
export function altavoces(separacion = 15) {
  const m = new Modelo();
  const A = 8.5, H = 14, F = 9.5;
  const cuerpo = mat(0x1c1f26, { rug: 0.6 });
  const tela = mat(0x2a2e37, { rug: 0.85 });
  const acento = mat(0xffb86b, { rug: 0.4 });
  const membrana = new THREE.MeshStandardMaterial({ color: 0x4a5060, roughness: 0.75, side: THREE.DoubleSide });
  const xs = [-separacion / 2, separacion / 2];
  const deFrente = (o) => ((o.rotation.x = Math.PI / 2), o); // gira algo dibujado hacia arriba para que mire al frente

  const cajas = grupo();
  const conos = grupo(), agudos = grupo(), imanes = grupo();
  for (const x of xs) {
    cajas.add(en(caja(A, H, F, cuerpo, 0.7), x, H / 2, 0), en(caja(A - 1.2, H - 1.2, 0.2, tela, 0.4), x, H / 2, F / 2 - 0.02));
    for (const sx of [-1, 1]) cajas.add(en(caja(1.6, 0.4, 1.6, M.negroMate, 0.15), x + sx * 2.6, 0.1, 2.4), en(caja(1.6, 0.4, 1.6, M.negroMate, 0.15), x + sx * 2.6, 0.1, -2.4));

    // Altavoz grande: cono, borde de goma y tapa central.
    const cono = grupo(
      deFrente(new THREE.Mesh(new THREE.CylinderGeometry(3.1, 1, 1.3, 40, 1, true), membrana)), // hueco: es un embudo
      en(new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.28, 10, 40), M.negroMate), 0, 0, 0.65),
      en(deFrente(cilindro(1.05, 0.35, acento, { lados: 28 })), 0, 0, -0.5),
    );
    conos.add(en(cono, x, 5.4, F / 2 - 0.45));
    // Altavoz pequeño, para los sonidos agudos.
    const agudo = grupo(deFrente(cilindro(1.25, 0.5, M.negro, { lados: 28 })), en(deFrente(cilindro(0.75, 0.4, acento, { lados: 24, radioAbajo: 0.7 })), 0, 0, 0.2));
    agudos.add(en(agudo, x, 10.8, F / 2 - 0.05));
    // Detrás del cono: imán y bobina.
    const iman = grupo(deFrente(cilindro(2.1, 1.3, M.aceroOscuro, { lados: 32 })), en(deFrente(cilindro(1.1, 1.2, M.cobre, { lados: 24 })), 0, 0, 1.1));
    imanes.add(en(iman, x, 5.4, F / 2 - 2.6));
  }
  m.pon(cajas, { id: "caja" });
  m.pon(conos, { id: "cono", abre: [0, 0, 6] });
  m.pon(agudos, { id: "agudos", abre: [0, 0, 3.6] });
  m.pon(imanes, { id: "iman", abre: [0, 0, 4] });

  // Rueda de volumen, en el de la derecha.
  const rueda = grupo(deFrente(cilindro(0.9, 0.7, M.negro, { lados: 28 })), en(caja(0.14, 0.5, 0.1, acento, 0.02), 0, 0.45, 0.36));
  m.pon(en(rueda, xs[1] + 2.4, 1.6, F / 2 + 0.3), { id: "volumen", abre: [0, 0, 2.4] });
  m.pon(en(lamina(3.4, 0.9, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    texto(c, rotulo("ALTAVOZ", "ECO 20"), w / 2, h / 2, { tam: h * 0.6, color: "#8a93a5", peso: 800, alinear: "center" });
  }, { px: 256, transparente: true }), xs[1] - 1.2, 1.6, F / 2 + 0.12), {});
  m.raiz.children[m.raiz.children.length - 1].rotation.set(0, 0, 0);

  // Cable que une los dos por detrás y clavija verde que va al ordenador.
  const hilo = mat(0x15171c, { rug: 0.7 });
  const puntos = [];
  for (let i = 0; i <= 12; i++) {
    const k = i / 12;
    puntos.push(new THREE.Vector3(xs[0] + k * separacion, 0.25 + Math.sin(Math.PI * k) * 0.1, -F / 2 - 0.6 - Math.sin(Math.PI * k) * 2.2));
  }
  m.pon(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 40, 0.13, 8), hilo));
  const verde = mat(0x7ddc5f, { rug: 0.4 });
  const clavija = grupo(
    deFrente(cilindro(0.34, 1.4, verde, { lados: 16 })),
    en(deFrente(cilindro(0.14, 1.3, M.acero, { lados: 12 })), 0, 0, -1.3),
    en(copias(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12), M.negro, [[0, 0, 0], [0, 0.3, 0]]), 0, 0, 0),
  );
  clavija.children[2].rotation.x = Math.PI / 2;
  clavija.children[2].position.z = -1.5;
  m.pon(en(clavija, xs[1] + 1.5, 2, -F / 2 - 2.4), { id: "clavija", abre: [0, 0, -3] });
  m.pon(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(xs[1], 2, -F / 2), new THREE.Vector3(xs[1] + 0.8, 2, -F / 2 - 1), new THREE.Vector3(xs[1] + 1.5, 2, -F / 2 - 1.7)]), 16, 0.13, 8), hilo));

  m.raiz.userData.cable = [xs[1] + 1.5, 2, -F / 2 - 3.6];
  return m;
}
