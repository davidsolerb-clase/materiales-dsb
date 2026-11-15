import { Modelo, M, THREE, caja, chip, cilindro, circuito, copias, en, grupo, lamina, placa, rotulo, texto, textura, mat } from "./kit.js";

// Contorno de un rectángulo con las esquinas redondeadas, en el plano XZ.
function redondeado(ancho, fondo, r, n = 8) {
  const p = [];
  for (const [cx, cz, a0] of [[ancho / 2 - r, fondo / 2 - r, 0], [-ancho / 2 + r, fondo / 2 - r, 90], [-ancho / 2 + r, -fondo / 2 + r, 180], [ancho / 2 - r, -fondo / 2 + r, 270]]) {
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + (i / n) * 90) * Math.PI) / 180;
      p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  }
  return p;
}

// Lámina de pie, mirando hacia +Z (o hacia -Z con `detras`).
function cartel(ancho, alto, pintar, { px = 512, detras = false } = {}) {
  const l = lamina(ancho, alto, pintar, { px, transparente: true });
  l.rotation.set(0, detras ? Math.PI : 0, 0);
  return l;
}

// ---------------------------------------------------------------- Monitor

export function monitor() {
  const m = new Modelo();
  const acento = mat(0x5cc8ff, { rug: 0.4 });
  const carcasa = mat(0x1c1f26, { rug: 0.5 });
  const trasera = mat(0x23272f, { rug: 0.65 });
  const W = 54, H = 32, F = 1.8, y0 = 12, zc = -1.5; // zc: centro de la carcasa

  // Pie plano.
  m.pon(placa(redondeado(24, 18, 4), 0.9, trasera, { bisel: 0.25 }), { id: "pie" });

  // Cuello con bisagra y pinza para cables.
  const cuello = grupo(
    en(caja(6, 22, 1.8, trasera, 0.5), 0, 11.6, -4.6),
    en(caja(3.4, 1.8, 0.5, M.negroMate, 0.2), 0, 7, -5.6),
    en(caja(3.4, 0.14, 0.52, acento, 0.05), 0, 6.1, -5.62),
  );
  const bisagra = cilindro(1, 6.6, M.negro, { lados: 24 });
  bisagra.rotation.z = Math.PI / 2;
  cuello.add(en(bisagra, 0, 22.6, -4.6));
  cuello.add(en(caja(9, 8, 0.6, M.negro, 0.2), 0, 24.5, -3.9));
  const aro = cilindro(1.02, 0.25, acento, { lados: 24 });
  aro.rotation.z = Math.PI / 2;
  cuello.add(en(aro, 3.2, 22.6, -4.6), en(aro.clone(), -3.2, 22.6, -4.6));
  m.pon(cuello, { id: "pie" });

  // Carcasa de la pantalla: marco fino y abajo un poco más grueso.
  const marco = grupo(en(caja(W, H, F, carcasa, 0.4), 0, y0 + H / 2, zc));
  marco.add(en(caja(38, 22, 1.6, trasera, 0.6), 0, 25, zc - 1.4)); // joroba trasera

  // Rejilla de ventilación arriba, por detrás.
  const ranuras = [];
  for (let i = 0; i < 40; i++) ranuras.push([(i - 19.5) * 0.7, 32, zc - 2.21]);
  marco.add(copias(new THREE.BoxGeometry(0.28, 3, 0.04), M.negroMate, ranuras));

  // Zona de conectores, hundida.
  const conectores = grupo(en(caja(12, 4.4, 0.3, M.negroMate, 0.1), 0, 0, 0));
  conectores.add(en(caja(2, 0.85, 0.3, M.aceroOscuro, 0.05), -3, 0.3, -0.1));
  conectores.add(en(caja(1.6, 0.5, 0.3, M.negro, 0.04), -3, 0.3, -0.14));
  conectores.add(en(caja(2.6, 1.6, 0.3, M.negro, 0.2), 3, 0.3, -0.1));
  for (const x of [2.5, 3.5]) {
    const hueco = cilindro(0.32, 0.3, M.negroMate, { lados: 16 });
    hueco.rotation.x = Math.PI / 2;
    conectores.add(en(hueco, x, 0.3, -0.16));
  }
  conectores.add(en(cartel(10, 1, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    texto(c, rotulo("VÍDEO", "HDMI"), w * 0.2, h / 2, { tam: h * 0.7, color: "#5cc8ff", alinear: "center" });
    texto(c, rotulo("CORRIENTE", "AC IN"), w * 0.8, h / 2, { tam: h * 0.7, color: "#aab3c5", alinear: "center" });
  }, { px: 512, detras: true }), 0, -1.45, -0.17));
  m.pon(en(conectores, 9.5, 18.5, zc - 2.08), { id: "conectores", abre: [0, 0, -5] });

  // Rótulo trasero.
  marco.add(en(cartel(14, 2.2, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    texto(c, rotulo("MONITOR 24\"", "VISTA 24"), w / 2, h * 0.35, { tam: h * 0.42, color: "#8a93a5", alinear: "center", peso: 800 });
    texto(c, "1920 × 1080 · 60 Hz", w / 2, h * 0.8, { tam: h * 0.24, color: "#5cc8ff", alinear: "center", peso: 600 });
  }, { px: 640, detras: true }), -9.5, 19, zc - 2.22));

  // Logotipo y piloto en el marco inferior.
  marco.add(en(cartel(6, 0.9, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    texto(c, "VISTA", w / 2, h / 2, { tam: h * 0.7, color: "#8a93a5", alinear: "center", peso: 800 });
  }, { px: 384 }), 0, y0 + 1.05, zc + F / 2 + 0.01));
  const piloto = cilindro(0.14, 0.1, new THREE.MeshStandardMaterial({ color: 0x1a2a33, roughness: 0.4 }), { lados: 16 });
  piloto.rotation.x = Math.PI / 2;
  piloto.name = "piloto";
  marco.add(en(piloto, W / 2 - 2.2, y0 + 1.05, zc + F / 2 + 0.03));
  marco.add(en(caja(0.9, 0.12, 0.2, acento, 0.04), W / 2 - 3.4, y0 + 1.05, zc + F / 2));

  // Pantalla: la aplicación le pondrá su textura.
  // De fábrica enseña un escritorio sencillo.
  const escritorio = textura(512, 288, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#27358f");
    g.addColorStop(1, "#0f8f8a");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffffff22";
    c.fillRect(w * 0.08, h * 0.14, w * 0.42, h * 0.5);
    c.fillStyle = "#ffffff38";
    c.fillRect(w * 0.08, h * 0.14, w * 0.42, h * 0.07);
    c.fillRect(w * 0.58, h * 0.3, w * 0.3, h * 0.42);
    c.fillStyle = "#0a0e1acc";
    c.fillRect(0, h * 0.91, w, h * 0.09);
  });
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(51.6, 29), new THREE.MeshBasicMaterial({ map: escritorio }));
  pantalla.name = "pantalla";
  m.pon(marco);
  m.pon(en(pantalla, 0, y0 + 2.1 + 14.5, zc + F / 2 + 0.02), { id: "pantalla", abre: [0, 0, 10] });

  // Por dentro: la luz que ilumina la pantalla por detrás y la placa que la controla.
  const luz = new THREE.Mesh(new THREE.PlaneGeometry(51, 28.4), new THREE.MeshStandardMaterial({ color: 0xf4f7ff, emissive: 0xdfe8ff, emissiveIntensity: 0.55, roughness: 0.6 }));
  m.pon(en(luz, 0, y0 + 2.1 + 14.5, zc + F / 2 + 0.008), { id: "luz", abre: [0, 0, 6.2] });
  const control = grupo(circuito(16, 11, { semilla: 17, grosor: 0.16 }), en(chip(2.6, 2.6, "VÍDEO"), -3, 0.16, 0.5), en(chip(1.6, 1.2, "LUZ"), 3.6, 0.16, -2));
  control.rotation.x = Math.PI / 2;
  m.pon(en(control, 5, 27, zc), { id: "placa", abre: [0, 0, 3.4] });

  m.raiz.userData.cable = [6.5, 18.8, zc - 2.4];
  return m;
}

// ---------------------------------------------------------------- Teclado

export function teclado() {
  const m = new Modelo();
  const acento = mat(0xc6f432, { rug: 0.4 });
  const cuerpo = mat(0x1c1f26, { rug: 0.6 });
  const tecla = mat(0x2a2e37, { rug: 0.7 });
  const W = 44, D = 14, b = 0.3; // b: bisel del cuerpo

  // Cuerpo en cuña: 1,7 detrás y 0,9 delante. Perfil en el plano ZY, extruido a lo largo de X.
  const perfil = new THREE.Shape();
  const pz = (z) => -z; // tras girar, la x del perfil acaba en -z
  perfil.moveTo(pz(-D / 2 + b), b);
  perfil.lineTo(pz(D / 2 - b), b);
  perfil.lineTo(pz(D / 2 - b), 0.9 - b);
  perfil.lineTo(pz(-D / 2 + b), 1.7 - b);
  perfil.closePath();
  const geo = new THREE.ExtrudeGeometry(perfil, { depth: W - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 3 });
  geo.rotateY(Math.PI / 2);
  geo.translate(-W / 2 + b, 0, 0);
  m.pon(new THREE.Mesh(geo, cuerpo));

  // Teclas. Cada fila: [x en unidades, ancho, alto, acento].
  const u = 1.85;
  const filas = [];
  const fila = (r, lista) => { let x = 0; for (const t of lista) { if (typeof t === "number" && t < 0) { x -= t; continue; } const [w, h = 1, ac = false] = [].concat(t); filas.push({ x, r, w, h, ac }); x += w; } };
  fila(0, [[1, 1, true], -1, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.25, 1, 1, 1]);
  fila(1.5, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, -0.25, 1, 1, 1, -0.25, 1, 1, 1, 1]);
  fila(2.5, [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, -0.25, 1, 1, 1, -0.25, 1, 1, 1, [1, 2]]);
  fila(3.5, [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, [2.25, 1, true], -3.5, 1, 1, 1]);
  fila(4.5, [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75, -1.25, 1, -1.25, 1, 1, 1, [1, 2, true]]);
  fila(5.5, [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25, -0.25, 1, 1, 1, -0.25, 2, 1]);

  const total = 15 + 0.25 + 3 + 0.25 + 4, x0 = -total / 2, z0 = -3.25;
  const tipos = new Map();
  for (const t of filas) {
    const clave = `${t.w}|${t.h}|${t.ac}`;
    if (!tipos.has(clave)) tipos.set(clave, { ...t, pos: [] });
    tipos.get(clave).pos.push([(x0 + t.x + t.w / 2) * u, 0, (z0 + t.r + (t.h - 1) / 2) * u]);
  }
  const teclas = grupo();
  for (const t of tipos.values()) {
    const g = caja(t.w * u - 0.28, 0.75, t.h * u - 0.28, tecla, 0.14).geometry;
    teclas.add(copias(g, t.ac ? acento : tecla, t.pos));
  }

  // Pilotos de bloqueo y marca encima del teclado numérico.
  const panel = lamina(4 * u - 0.3, 0.9 * u, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i === 0 ? "#c6f432" : "#3a3f4a";
      c.beginPath();
      c.arc(w * (0.16 + i * 0.13), h * 0.5, h * 0.09, 0, 7);
      c.fill();
    }
    texto(c, rotulo("TECLADO", "TECLA"), w * 0.96, h * 0.5, { tam: h * 0.3, color: "#8a93a5", alinear: "right", peso: 800 });
  }, { px: 384, transparente: true });
  teclas.add(en(panel, (x0 + 18.5 + 2) * u, -0.17, (z0 + 0) * u));
  const pendiente = Math.atan(0.8 / D);
  teclas.rotation.x = pendiente;
  m.pon(en(teclas, 0, 1.78, 0), { id: "teclas", abre: [0, 4.4, 0] });

  // Debajo de las teclas: una lámina con un contacto para cada una, y el chip que las lee.
  const membrana = circuito(W - 2.4, D - 2.2, { color: "#123d35", pista: "#2f8f76", semilla: 8, grosor: 0.06, densidad: 1.3 });
  membrana.rotation.x = pendiente;
  m.pon(en(membrana, 0, 1.36, 0), { id: "membrana", abre: [0, 2, 0] });
  const lector = chip(2.6, 1.5, "CONTROL", { alto: 0.07 });
  lector.rotation.x = pendiente;
  m.pon(en(lector, 17.4, 1.71, -5), { id: "controlador", abre: [0, 2.8, 0] });

  // Patas traseras y salida del cable.
  for (const x of [-18, 18]) m.pon(en(caja(4, 0.5, 1.2, M.negroMate, 0.15), x, 0.05, -D / 2 + 1));
  const salida = cilindro(0.35, 1.2, M.negroMate, { lados: 16, radioAbajo: 0.45 });
  salida.rotation.x = -Math.PI / 2;
  m.pon(en(salida, 0, 1, -D / 2 - 0.4), { id: "cable", abre: [0, 0, -2.6] });
  m.pon(en(caja(5, 0.06, 0.5, acento, 0.02), 0, 1.75, -D / 2 + 0.1));

  m.raiz.userData.cable = [0, 1, -D / 2 - 1];
  return m;
}

// ---------------------------------------------------------------- Ratón

export function raton() {
  const m = new Modelo();
  const acento = mat(0xff5c8a, { rug: 0.4 });
  const cuerpo = mat(0x1c1f26, { rug: 0.55 });
  const botones = mat(0x262a33, { rug: 0.45 });
  const A = 3.2, L = 5.75, Hc = 3.45, y0 = 0.32; // semiancho, semilargo, alto de la cúpula, altura de la base

  // Cúpula deformada: más alta y ancha detrás, más estrecha delante.
  const forma = (geo, crece = 1) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ancho = 0.86 + 0.14 * (z + 1) / 2;
      p.setXYZ(i, x * A * ancho * crece, y * Hc * crece + y0, (z + y * 0.28) * L * crece);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const cupula = new THREE.Mesh(forma(new THREE.SphereGeometry(1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2)), cuerpo);
  m.pon(cupula, { id: "carcasa", abre: [0, 5, 0] });

  // Base con una línea de color.
  const contorno = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2, z = Math.sin(a);
    contorno.push([Math.cos(a) * A * (0.86 + 0.14 * (z + 1) / 2) * 1.01, z * L * 1.01]);
  }
  m.pon(placa(contorno, y0, M.negroMate, { bisel: 0.08 }));
  const linea = placa(contorno, 0.08, acento, { bisel: 0 });
  linea.scale.set(1.012, 1, 1.006);
  m.pon(en(linea, 0, y0 - 0.1, 0));

  // Dos botones delante, separados por una ranura.
  for (const [lado, phi0] of [[-1, Math.PI * 1.5], [1, Math.PI]]) {
    const b = new THREE.Mesh(forma(new THREE.SphereGeometry(1, 16, 10, phi0, Math.PI / 2, 0, 1.25), 1.012), botones);
    m.pon(en(b, lado * 0.07, 0, 0), { id: "botones", abre: [0, 7.4, -1.2] });
  }

  // Rueda en la ranura: buscamos la altura de la superficie.
  const zr = -2.1;
  cupula.updateMatrixWorld();
  const rayo = new THREE.Raycaster(new THREE.Vector3(0, 10, zr), new THREE.Vector3(0, -1, 0));
  const yr = rayo.intersectObject(cupula)[0]?.point.y ?? Hc;
  const rueda = grupo(cilindro(0.55, 0.42, M.negroMate, { lados: 24 }), cilindro(0.57, 0.12, acento, { lados: 24 }));
  rueda.rotation.z = Math.PI / 2;
  m.pon(en(rueda, 0, yr - 0.15, zr), { id: "rueda", abre: [0, 3, 0] });
  m.pon(en(caja(0.7, 0.5, 1.6, M.negro, 0.15), 0, yr - 0.15, zr), { id: "carcasa", abre: [0, 5, 0] });

  // Por dentro: la placa y el sensor que mira la mesa.
  m.pon(en(circuito(4.4, 8, { semilla: 4, grosor: 0.1 }), 0, y0 + 0.08, 0.3), { id: "placa", abre: [0, 0.9, 0] });
  const ojo = cilindro(0.3, 0.2, new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2020, emissiveIntensity: 1.4 }), { lados: 20 });
  m.pon(en(grupo(caja(1.4, 0.5, 1.4, M.negro, 0.1), en(ojo, 0, 0.28, 0)), 0, y0 + 0.4, 0.9), { id: "sensor", abre: [0, 2.4, 0] });

  // Salida del cable, delante.
  const salida = cilindro(0.22, 0.9, M.negroMate, { lados: 16, radioAbajo: 0.3 });
  salida.rotation.x = Math.PI / 2;
  m.pon(en(salida, 0, 1.1, -L - 0.2), { id: "cable", abre: [0, 0, -2] });

  m.raiz.userData.cable = [0, 1.1, -L - 0.65];
  return m;
}
