// El mundo del taller: la mesa, la caja y todo lo que se monta en ella.
// Aquí vive la geometría (dónde encaja cada cosa y cómo se mueve).
// Lo que se le pide al alumno, y en qué orden, está en pasos.js.
//
// La caja se monta tumbada (ver caja.js). `pc` es el grupo que contiene el
// ordenador entero: al final se pone de pie girándolo.

import { THREE, M, mat, caja, cilindro, en, grupo, lamina, texto, textura, tubo } from "../modelos/kit.js";
import { construir } from "../modelos/index.js";
import { monitor, teclado, raton } from "../modelos/perifericos.js";
import { altavoces } from "../modelos/tarjetas.js";
import { torre, tornilloHacia, C, B, AGUJEROS, VENTANA, VENTILADOR, BOTON } from "./caja.js";
import { suave } from "./banco.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const MESA = -C.G; // altura del tablero
const ALFOMBRILLA = V(48, MESA + 0.4, 2); // donde se prepara la placa
const NARANJA = mat(0xf07a18, { rug: 0.6 }); // cables de corriente
const AZUL = mat(0x1f9bf0, { rug: 0.6 }); // cables de datos
const NEGRO = mat(0x1a1d24, { rug: 0.7 });

// Sitio de cada pieza dentro de la caja.
const SITIO = {
  fuente: V(-13.8, 7.9, 19.7),
  grafica: V(-7.8, 7.99, B.z + 2.95),
  disco: V(15, 0.3, 5.5),
  ssd: V(15, 0.3, -12),
};
// Ranuras de memoria y conectores de la placa, en medidas de la placa.
const RANURAS = [3.7, 5, 6.3, 7.6];
const EN_PLACA = {
  zocalo: [-2, -4.5],
  cpufan: [2.3, -10.4], sysfan1: [-9.3, -6], sysfan2: [-7.6, 11.2],
  atx24: [11, -3.4], cpu8: [-8.2, -11.3], pines: [7.4, 11.55],
  sata1: [11.96, 8], sata2: [11.96, 9.7],
};
// Tomas de los discos (dentro de la caja): centro del conector.
const TOMA = {
  "disco-corriente": V(14.2, 0.8, 13.1), "disco-datos": V(11.8, 0.8, 13.1),
  "ssd-corriente": V(14.3, 0.75, -8.15), "ssd-datos": V(11.9, 0.75, -8.15),
};
// Puertos traseros (medidas de la caja).
const X_PUERTOS = C.XR - 0.3;
const PUERTO = {
  "video-grafica": V(X_PUERTOS - 0.2, 9.29, -2.45), "video-placa": V(X_PUERTOS, 1.8, B.z - 7.5),
  "usb-a": V(X_PUERTOS, 1.86, B.z - 10.2), "usb-b": V(X_PUERTOS, 1.86, B.z - 4.6), "usb-c": V(X_PUERTOS, 1.86, B.z - 1.9),
  red: V(X_PUERTOS, 3.44, B.z - 1.9),
  "audio-azul": V(X_PUERTOS, 1.59, B.z + 1), "audio-verde": V(X_PUERTOS, 2.64, B.z + 1), "audio-rosa": V(X_PUERTOS, 3.69, B.z + 1),
  toma: V(X_PUERTOS, 3.3, 17.3), interruptor: V(X_PUERTOS, 6.8, 17.3),
};

export class Mundo {
  constructor(banco) {
    this.b = banco;
    this.piezas = {};
    this.cables = {};
    this.tornillos = {};
    this.dePie = false;
    this.mesa = new THREE.Group();
    this.pc = new THREE.Group();
    banco.escena.add(this.mesa, this.pc);
    this.hazMesa();
    this.hazCaja();
    this.hazPlaca();
    this.hazDianas();
    this.sombrea(banco.escena);
    this.personaliza();
  }

  sombrea(objeto) {
    objeto.traverse((o) => {
      if (!o.isMesh || o.material.transparent || o.material.visible === false) return;
      o.castShadow = o.receiveShadow = true;
    });
  }

  // Pieza del atlas, lista para colocar. Cada id se construye una sola vez.
  pieza(id, clave = id) {
    if (!this.piezas[clave]) {
      const m = construir(id);
      const g = new THREE.Group();
      g.add(m.raiz);
      g.visible = false;
      g.userData.partes = m.partes;
      m.raiz.traverse((o) => o.userData.gira && this.b.giratorios.push(o));
      this.sombrea(g);
      this.piezas[clave] = g;
    }
    return this.piezas[clave];
  }

  // ---------------------------------------------------------------- Mesa

  hazMesa() {
    const tablero = caja(210, 4, 150, mat(0x1e2540, { rug: 0.85 }), 1.2);
    this.mesa.add(en(tablero, -14, MESA - 2, -6));
    const alfombrilla = grupo(caja(38, 0.3, 32, mat(0x2a5fae, { rug: 0.9 }), 0.14));
    alfombrilla.add(en(lamina(37, 31, (c, w, h) => {
      c.fillStyle = "#2a5fae";
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "#ffffff22";
      c.lineWidth = 2;
      for (let x = 0; x <= w; x += w / 18) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
      for (let y = 0; y <= h; y += w / 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      texto(c, "ALFOMBRILLA ANTIESTÁTICA", w * 0.03, h * 0.95, { tam: h * 0.035, color: "#ffffff88", peso: 700 });
    }, { px: 1024, rug: 0.9 }), 0, 0.155, 0));
    this.alfombrilla = en(alfombrilla, ALFOMBRILLA.x, MESA + 0.15, ALFOMBRILLA.z);
    this.mesa.add(this.alfombrilla);

    // Destornillador, pasta térmica: solo aparecen cuando se usan.
    this.destornillador = grupo(
      en(cilindro(0.2, 9, M.acero, { lados: 12 }), 0, 4.5, 0),
      en(cilindro(0.95, 9, M.rojo, { lados: 20 }), 0, 13.5, 0),
      en(cilindro(1.05, 1.2, M.negro, { lados: 20 }), 0, 9.4, 0),
    );
    this.destornillador.visible = false;
    this.b.escena.add(this.destornillador);
  }

  // ---------------------------------------------------------------- Caja

  hazCaja() {
    const t = torre();
    this.caja = t.partes;
    this.pc.add(t.raiz);
    const { XR, G, YP } = C;

    // Tornillos del panel lateral, de los que se quitan con la mano o con destornillador.
    this.puntosTornillo = {
      panel: [-15, 15].map((z) => ({ en: this.pc, pos: V(XR - G, YP - 1, z), n: [-1, 0, 0], radio: 0.6 })),
      fuente: [[0.85, 11.5], [0.85, 19.4], [15, 11.5], [15, 19.4]].map(([y, z]) => ({ en: this.pc, pos: V(XR - G, y, z), n: [-1, 0, 0] })),
      placa: AGUJEROS.map(([x, z]) => ({ en: this.pc, pos: V(B.x + x, B.y + 0.1, B.z + z), n: [0, 1, 0], radio: 0.38 })),
      grafica: [{ en: this.pc, pos: V(XR - G, 15.1, B.z + 4.95), n: [-1, 0, 0] }],
    };
    for (const p of this.puntosTornillo.panel) this.ponTornillo("panel", p, true);
  }

  ponTornillo(grupoId, p, ya = false) {
    const t = tornilloHacia(p.n, p.radio);
    t.position.copy(p.pos);
    p.en.add(t);
    this.sombrea(t);
    p.objeto = t;
    if (!ya) this.gira(t, p, 1);
    return t;
  }

  // Animación de atornillar (sentido 1) o desatornillar (−1), con el destornillador.
  gira(t, p, sentido, fin) {
    const n = V(...p.n);
    const casa = p.pos.clone();
    const fuera = casa.clone().addScaledVector(n, 2.2);
    const d = this.destornillador;
    const mundoN = n.clone().transformDirection(p.en.matrixWorld);
    d.quaternion.setFromUnitVectors(V(0, 1, 0), mundoN);
    d.visible = !this.b.rapido;
    this.b.anima(520, (k) => {
      const e = sentido > 0 ? suave(k) : 1 - suave(k);
      t.position.lerpVectors(fuera, casa, e);
      t.rotateOnAxis(V(0, 1, 0), 0.5 * sentido);
      d.position.copy(p.en.localToWorld(t.position.clone().addScaledVector(n, 0.25)));
      d.rotateOnAxis(V(0, 1, 0), 0.5 * sentido);
    }, () => {
      d.visible = false;
      if (sentido < 0) t.visible = false;
      fin?.();
    });
  }

  // ---------------------------------------------------------------- Placa base

  hazPlaca() {
    const placa = this.pieza("placa");
    this.placa = placa; // grupo que lleva la placa y lo que se monta sobre ella
    placa.position.copy(ALFOMBRILLA);
    this.mesa.add(placa);

    // Zócalo: la tapa y la palanca se abren.
    const z = placa.userData.partes.zocalo[0];
    const [, , marco, palanca] = z.children;
    this.bisagra = en(new THREE.Group(), -3, 0.42, 0);
    this.eje = en(new THREE.Group(), 3.25, 0.5, -3);
    z.add(this.bisagra, this.eje);
    this.bisagra.attach(marco);
    this.eje.attach(palanca);
    // Triángulo dorado: marca la esquina que debe coincidir con la del procesador.
    const triangulo = lamina(1, 1, (c, w) => {
      c.clearRect(0, 0, w, w);
      c.fillStyle = "#f2c14e";
      c.beginPath();
      c.moveTo(0, w); c.lineTo(w, w); c.lineTo(0, 0);
      c.fill();
    }, { px: 64, metal: 0.8, rug: 0.3, transparente: true });
    z.add(en(triangulo, -3.3, 0.5, 3.3));

    // Conectores pequeños de ventilador y rótulos impresos en la placa.
    const crema = mat(0xe8e2d0, { rug: 0.5 });
    const rotulos = { cpufan: "CPU_FAN", sysfan1: "SYS_FAN1", sysfan2: "SYS_FAN2", atx24: "ATX 24", cpu8: "CPU 12V", pines: "PANEL", sata1: "SATA" };
    const dz = { atx24: 3.6, cpu8: 1.4, pines: -1.3, sata1: -1.7 };
    for (const [id, rotulo] of Object.entries(rotulos)) {
      const [x, zz] = EN_PLACA[id];
      if (id.includes("fan")) {
        const c = grupo(en(caja(1.3, 0.55, 0.5, crema, 0.05), 0, 0.36, 0));
        for (let i = 0; i < 4; i++) c.add(en(caja(0.08, 0.5, 0.08, M.oro, 0), -0.42 + i * 0.28, 0.6, 0.05));
        placa.add(en(c, x, 0.09, zz));
      }
      placa.add(en(serigrafia(rotulo), id === "sata1" ? x - 0.9 : x, 0.2, zz + (dz[id] ?? 0.9)));
    }
  }

  palanca(abierta) {
    const a0 = this.bisagra.rotation.z, b0 = this.eje.rotation.x;
    const a1 = abierta ? 1.9 : 0, b1 = abierta ? -1.2 : 0;
    this.b.anima(500, (k) => {
      this.bisagra.rotation.z = a0 + (a1 - a0) * suave(k);
      this.eje.rotation.x = b0 + (b1 - b0) * suave(k);
    });
  }

  // Coloca una pieza sobre la placa (medidas de la placa).
  sobrePlaca(objeto, x, y, z, desde = V(0, 9, 0)) {
    objeto.position.set(x, y, z);
    this.placa.add(objeto);
    this.b.encaja(objeto, desde);
    return objeto;
  }

  ponPlacaEnMesa() {
    this.b.encaja(this.placa, V(0, 14, 0), 650);
  }

  ponCpu() {
    const [x, z] = EN_PLACA.zocalo;
    this.sobrePlaca(this.pieza("cpu"), x, 0.81, z, V(0, 6, 0));
  }

  ponPasta() {
    const [x, z] = EN_PLACA.zocalo;
    const gota = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), mat(0xc9ced6, { rug: 0.35 }));
    gota.scale.y = 0.3;
    this.sombrea(gota);
    this.pasta = this.sobrePlaca(gota, x, 1.2, z, V(0, 3, 0));
  }

  ponDisipador() {
    const [x, z] = EN_PLACA.zocalo;
    const d = this.pieza("disipador");
    const v = d.userData.partes.ventilador[0];
    v.children[3].visible = v.children[4].visible = false; // su cable lo ponemos nosotros
    this.sobrePlaca(d, x, 1.25, z);
    if (this.pasta) this.pasta.scale.set(2.6, 0.06, 2.6); // la pasta se aplasta y se extiende
    d.userData.partes.anclajes.forEach((pata, i) => this.b.diana(`anclaje${i}`, { en: pata, pos: [0, 0.9, 0], tam: [1, 1, 1], tipo: "punto" }));
  }

  aprietaAnclaje(i) {
    const pata = this.pieza("disipador").userData.partes.anclajes[i];
    this.b.mueve(pata, { a: pata.position.clone().add(V(0, -0.4, 0)), ms: 220 });
    pata.children[3].rotation.y += Math.PI / 2;
  }

  ponRam(n, ranura) {
    const g = this.pieza("ram", `ram${n}`);
    g.rotation.y = Math.PI / 2;
    this.sobrePlaca(g, RANURAS[ranura], 2.6, -4.5, V(0, 7, 0));
  }

  // ---------------------------------------------------------------- Dentro de la caja

  quitaPanel() {
    const p = this.caja.panel;
    this.b.mueve(p, { a: V(p.position.x, MESA + 0.6 - this.pc.position.y, -52), ms: 900, arco: 16 });
  }

  ponPanel() {
    const p = this.caja.panel;
    this.b.mueve(p, { a: V(p.position.x, C.YP + 0.2, 0), ms: 900, arco: 14 });
  }

  quitaTornillo(grupoId, i) {
    const p = this.puntosTornillo[grupoId][i];
    this.gira(p.objeto, p, -1);
  }

  atornilla(grupoId, i) {
    const p = this.puntosTornillo[grupoId][i];
    if (p.objeto) {
      p.objeto.visible = true;
      this.gira(p.objeto, p, 1);
    } else this.ponTornillo(grupoId, p);
  }

  enCaja(objeto, pos, desde = V(0, 14, 0), ms = 650) {
    objeto.position.copy(pos);
    this.pc.add(objeto);
    this.b.encaja(objeto, desde, ms);
    return objeto;
  }

  ponFuente() {
    const f = this.pieza("fuente");
    // Tumbada: la pegatina mira hacia arriba, la toma de corriente hacia atrás.
    f.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, -1), V(-1, 0, 0)));
    f.userData.partes.cables[0].visible = false;
    this.enCaja(f, SITIO.fuente);
  }

  ponPlacaEnCaja() {
    const destino = V(B.x, B.y, B.z);
    this.placaEnCaja = true;
    this.pc.attach(this.placa);
    this.b.mueve(this.placa, { a: destino, ms: 1300, arco: 18 });
  }

  ponDisco() { this.enCaja(this.pieza("disco"), SITIO.disco, V(0, 10, 0)); }
  ponSsd() { this.enCaja(this.pieza("ssd"), SITIO.ssd, V(0, 10, 0)); }

  quitaTapa(i) {
    const t = this.caja.tapas[i];
    this.b.mueve(t, { a: t.position.clone().add(V(-4, 0, 0)), ms: 350, fin: () => (t.visible = false) });
  }

  ponGrafica() {
    const g = this.pieza("grafica");
    g.rotation.x = Math.PI / 2; // de canto, con los contactos hacia la placa
    this.enCaja(g, SITIO.grafica, V(0, 9, 0));
  }

  // ---------------------------------------------------------------- Cables

  // Tubo por unos puntos más su clavija. `padre` es this.pc salvo indicación.
  cable(id, puntos, { material = NARANJA, radio = 0.4, clavija, padre = this.pc, clase, invertido = false } = {}) {
    const g = grupo(tubo(puntos.map((p) => (p.isVector3 ? p.toArray() : p)), radio, material, { tramos: 90 }));
    if (clavija) {
      const [w, h, d] = clavija.tam;
      const c = caja(w, h, d, clavija.material || M.negro, Math.min(w, h, d) * 0.12);
      c.position.copy(clavija.pos);
      g.add(c);
    }
    this.sombrea(g);
    g.visible = false;
    padre.add(g);
    // El cable «crece» desde su origen hasta el conector.
    const geo = g.children[0].geometry;
    const total = geo.index.count;
    this.b.anima(600, (k) => {
      g.visible = true;
      geo.setDrawRange(0, Math.ceil((total * suave(k)) / 6) * 6);
      if (g.children[1]) g.children[1].visible = k > 0.85;
    });
    // Por dónde va y qué lleva, para dibujar las flechas cuando el ordenador está encendido.
    g.userData.curva = new THREE.CatmullRomCurve3(puntos.map((p) => (p.isVector3 ? p.clone() : V(...p))));
    g.userData.radio = radio;
    g.userData.clase = clase ?? (material === AZUL ? "datos" : material === NARANJA ? "corriente" : null);
    g.userData.invertido = invertido;
    this.cables[id] = g;
    return g;
  }

  // Ráfagas de luz que recorren los cables: corriente (amarillas) y datos (azules).
  // `cuales` es true (todos), false (ninguno) o una función (id, clase) => sí o no.
  flujo(cuales) {
    const activos = [];
    for (const [id, g] of Object.entries(this.cables)) {
      const u = g.userData;
      const si = !!cuales && g.visible && !!u.clase && (cuales === true || cuales(id, u.clase));
      if (si && !u.luz) {
        const largo = u.curva.getLength();
        const mapa = rafaga().clone();
        mapa.needsUpdate = true;
        mapa.repeat.set((u.invertido ? -1 : 1) * Math.max(1, Math.round(largo / 7)), 1);
        u.luz = new THREE.Mesh(
          new THREE.TubeGeometry(u.curva, 90, u.radio * 1.3 + 0.07, 8),
          new THREE.MeshBasicMaterial({ map: mapa, color: u.clase === "corriente" ? 0xffe27a : 0x8fe3ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
        );
        u.luz.userData.paso = 10 / largo; // la luz avanza a 10 cm por segundo
        g.add(u.luz);
      }
      if (u.luz) u.luz.visible = si;
      if (si) activos.push(u.luz);
    }
    let antes = 0;
    this.b.alPintar = activos.length
      ? (t) => {
          const dt = antes ? Math.min(0.1, t - antes) : 0;
          antes = t;
          for (const l of activos) l.material.map.offset.x -= dt * l.userData.paso * Math.abs(l.material.map.repeat.x);
        }
      : null;
    this.b.sucio = true;
  }

  // ---------------------------------------------------------------- Personalizar

  // Acabado elegido por el alumno: { caja, luz, pegatina }. Se guarda en su navegador.
  personaliza(cambio) {
    const mio = { ...ACABADO_DE_FABRICA, ...leeAcabado(), ...cambio };
    if (cambio) {
      try {
        localStorage.setItem(CLAVE_ACABADO, JSON.stringify(mio));
      } catch {}
    }
    const c = this.caja;
    const [chapa, dentro] = ACABADOS.caja[mio.caja] || ACABADOS.caja.grafito;
    c.materiales.chapa.color.set(chapa);
    c.materiales.dentro.color.set(dentro);
    const luz = mio.luz in ACABADOS.luz ? ACABADOS.luz[mio.luz] : ACABADOS.luz.lima; // null: apagadas
    this.colorLuz = luz;
    for (const o of [c.franja, c.tira]) {
      o.material.color.set(luz ?? 0x2a3142);
      o.material.emissive.set(luz ?? 0x000000);
    }
    this.luces(this.b.encendido);
    c.pegatina.visible = mio.pegatina !== "ninguna" && !!PEGATINAS[mio.pegatina];
    if (c.pegatina.visible) {
      c.pegatina.material.map?.dispose();
      c.pegatina.material.map = textura(256, 256, PEGATINAS[mio.pegatina]);
      c.pegatina.material.needsUpdate = true;
    }
    this.b.sucio = true;
    return mio;
  }

  // Luces de la caja: tenues con el ordenador apagado, fuertes al encenderlo.
  luces(encendido) {
    const c = this.caja;
    const luz = this.colorLuz;
    c.piloto.material.emissive.set(encendido ? luz ?? 0xc6f432 : 0x000000);
    c.piloto.material.emissiveIntensity = 2.2;
    c.franja.material.emissiveIntensity = encendido ? 1.6 : 0.25;
    c.tira.material.emissiveIntensity = encendido ? 2.4 : 0.15;
    this.b.sucio = true;
  }

  enPlacaMundo(id, y) {
    const [x, z] = EN_PLACA[id];
    return V(B.x + x, B.y + y, B.z + z);
  }

  cableVentiladorCpu() {
    const [zx, zz] = EN_PLACA.zocalo;
    const [x, z] = EN_PLACA.cpufan;
    this.cable("cpufan", [[zx + 3.2, 4.3, zz - 3.4], [zx + 4.6, 3.8, zz - 4.6], [x + 0.3, 2.6, z + 0.4], [x, 1, z]], {
      material: NEGRO, radio: 0.13, padre: this.placa, clase: "corriente", clavija: { pos: V(x, 0.95, z), tam: [1.2, 0.6, 0.5] },
    });
  }

  cable24() {
    const s = this.enPlacaMundo("atx24", 1.4);
    this.cable("atx24", [[-6.8, 5, 14.5], [-3, 4, 13], [4.6, 2.3, 9], [6.3, 2.4, -2], [5, 4.6, -9], [s.x + 0.2, s.y + 2.2, s.z], [s.x, s.y + 1.3, s.z]], {
      radio: 0.55, clavija: { pos: s.clone().add(V(0, 0.65, 0)), tam: [1.5, 1.5, 5.6] },
    });
  }

  cableCpu() {
    const s = this.enPlacaMundo("cpu8", 1.4);
    this.cable("cpu8", [[-6.8, 9, 13], [-1, 5, 11.5], [5.8, 1.6, 8.5], [7.4, 1.4, -4], [7, 1.4, -16.6], [3.2, 1.2, -19.3], [-13, 1.3, -19.3], [s.x + 0.4, s.y + 1.6, s.z - 0.9], [s.x, s.y + 1.2, s.z]], {
      radio: 0.38, clavija: { pos: s.clone().add(V(0, 0.6, 0)), tam: [2.4, 1.4, 1.4] },
    });
  }

  cableGrafica() {
    const s = V(2.6, 13.5, -2.5);
    this.cable("pcie", [[-6.8, 12, 14], [-3.5, 14.6, 10], [0.6, 16.4, 3.6], [2.4, 16.6, -1.4], [s.x, s.y + 1.3, s.z]], {
      radio: 0.38, clavija: { pos: s.clone().add(V(0, 0.6, 0)), tam: [2.2, 1.4, 1.2] },
    });
  }

  // Corriente a los discos. El primero sale de la fuente; el segundo, del primero (van en cadena).
  cableCorrienteDisco(cual, primero) {
    const s = TOMA[`${cual}-corriente`];
    const canal = [[8.5, 0.9, 12], [8.4, 0.9, -4], [9.6, 0.9, -6.2], [12.6, 0.9, -6.5]];
    let puntos;
    if (cual === "disco") {
      puntos = primero ? [[-6.8, 3.5, 16.5], [0, 1, 17], [9, 0.9, 17], [13, 0.9, 15.8]] : [TOMA["ssd-corriente"].clone().add(V(0, 0.15, 1.4)).toArray(), ...canal.reverse(), [10, 0.9, 15.2]];
      puntos.push([s.x, 0.85, s.z + 1.5], [s.x, s.y, s.z + 0.9]);
    } else {
      puntos = primero ? [[-6.8, 3.5, 16.5], [0, 1, 17], [7, 0.9, 15], ...canal] : [TOMA["disco-corriente"].clone().add(V(0, 0.15, 1.5)).toArray(), [10, 0.9, 15.2], ...canal];
      puntos.push([s.x, 0.85, s.z + 1.5], [s.x, s.y, s.z + 0.9]);
    }
    this.cable(`${cual}-corriente`, puntos, { radio: 0.3, clavija: { pos: s.clone().add(V(0, 0, 0.55)), tam: [2.8, 0.7, 1.1] } });
  }

  // Datos: primero un extremo en la placa…
  cableDatosPlaca(n, puerto) {
    const s = this.enPlacaMundo(puerto, 1.17);
    this.cable(`datos${n}-placa`, [[s.x + 0.6, s.y, s.z], [s.x + 1.6, s.y + 0.2, s.z + 0.2], [s.x + 2.4, s.y + 0.6, s.z + 0.6]], {
      material: AZUL, radio: 0.22, clavija: { pos: s.clone().add(V(0.65, 0, 0)), tam: [1.3, 0.5, 1.2], material: AZUL },
    });
    this.cables[`datos${n}-placa`].userData.sale = V(s.x + 2.4, s.y + 0.6, s.z + 0.6);
  }

  // …y después el otro extremo, en un disco.
  cableDatosDisco(n, cual) {
    const o = this.cables[`datos${n}-placa`].userData.sale;
    const s = TOMA[`${cual}-datos`];
    const medio = cual === "disco" ? [[7.3, 3.2, 6], [8.7, 2.2, 11.5], [10.4, 1, 14.9]] : [[7.3, 3.2, -1], [8.8, 2.2, -5], [10.6, 1, -6.4]];
    this.cable(`datos${n}-disco`, [o.toArray(), ...medio, [s.x, 0.85, s.z + 1.5], [s.x, s.y, s.z + 0.9]], {
      material: AZUL, radio: 0.22, clavija: { pos: s.clone().add(V(0, 0, 0.55)), tam: [1.5, 0.7, 1.1], material: AZUL },
    });
  }

  cableVentiladorCaja(conector = "sysfan1") {
    const s = this.enPlacaMundo(conector, 0.4);
    this.cable("sysfan", [[C.XR + 2.4, VENTILADOR.y - 5.6, VENTILADOR.z - 4], [C.XR + 2.6, 4.5, VENTILADOR.z - 2.5], [s.x - 0.4, 2.6, s.z - 0.6], [s.x, s.y + 0.7, s.z]], {
      material: NEGRO, radio: 0.13, clase: "corriente", invertido: true, clavija: { pos: s.clone().add(V(0, 0.55, 0)), tam: [1.2, 0.6, 0.5] },
    });
  }

  cablePanel() {
    const s = this.enPlacaMundo("pines", 0.7);
    this.cable("panel", [[BOTON.x, BOTON.y, C.ZT + 0.3], [17.6, 2, -19.5], [20.55, 0.4, -17], [20.6, 0.4, 16], [10, 0.4, 17.6], [1, 0.5, 14], [s.x, 0.9, s.z + 3], [s.x, s.y + 1, s.z + 0.2], [s.x, s.y + 0.5, s.z]], {
      material: NEGRO, radio: 0.16, clase: "datos", clavija: { pos: s.clone().add(V(0, 0.2, 0)), tam: [2.6, 0.8, 0.7] },
    });
  }

  // ---------------------------------------------------------------- De pie y periféricos

  // Pone la torre de pie girándola sobre el canto de su base.
  levanta() {
    const eje = V(0, MESA, C.ZB + C.G + C.PATAS);
    this.dePie = true;
    this.b.mandos.maxPolarAngle = 1.52;
    this.b.anima(1500, (k) => {
      const a = (Math.PI / 2) * suave(k);
      this.pc.rotation.x = a;
      this.pc.position.copy(eje).sub(eje.clone().applyAxisAngle(V(1, 0, 0), a));
    }, () => this.pc.updateMatrixWorld(true));
    this.b.mueve(this.alfombrilla, { a: this.alfombrilla.position.clone().add(V(0, 0, -140)), ms: 900, fin: () => (this.alfombrilla.visible = false) });

    this.perifericos = {};
    const sitios = { monitor: [monitor, V(-66, MESA, 2), 0.1], teclado: [teclado, V(-66, MESA, 38), 0], raton: [raton, V(-33, MESA, 50), 0], altavoces: [() => altavoces(70), V(-66, MESA, -4), 0] };
    for (const [id, [hacer, pos, giro]] of Object.entries(sitios)) {
      const m = hacer();
      const g = grupo(m.raiz);
      g.userData.cable = m.raiz.userData.cable;
      g.rotation.y = giro;
      g.position.copy(pos);
      this.sombrea(g);
      this.mesa.add(g);
      this.b.encaja(g, V(0, 30, 0), 900);
      this.perifericos[id] = g;
    }
    this.pantalla = this.perifericos.monitor.getObjectByName("pantalla");
    this.lienzoPantalla = document.createElement("canvas");
    this.lienzoPantalla.width = 1024;
    this.lienzoPantalla.height = 576;
    this.pantalla.material.map = new THREE.CanvasTexture(this.lienzoPantalla);
    this.pantalla.material.map.colorSpace = THREE.SRGBColorSpace;
    this.pantalla.material.color.set(0xffffff);
    this.pintaPantalla((c, w, h) => {
      c.fillStyle = "#05070c";
      c.fillRect(0, 0, w, h);
    });
  }

  pintaPantalla(pintar) {
    pintar(this.lienzoPantalla.getContext("2d"), 1024, 576);
    this.pantalla.material.map.needsUpdate = true;
    this.b.sucio = true;
  }

  // Dónde queda un punto de la caja visto desde la mesa (una vez acabado el giro, si está de pie).
  enMesa(p) {
    if (!this.dePie) return p.clone();
    const zb = C.ZB + C.G + C.PATAS;
    return V(p.x, MESA + zb - p.z, zb + p.y - MESA);
  }

  // Cable de fuera: del puerto trasero hasta un aparato (o hasta el borde de la mesa).
  cableFuera(id, puerto, { ranura = 0, hasta, material = NEGRO, radio = 0.28, tam = [1.8, 0.7, 1.5], clase = "datos", invertido = false } = {}) {
    const p = PUERTO[puerto].clone();
    if (puerto.startsWith("usb")) p.y += ranura ? 0.38 : -0.37;
    const a = this.enMesa(p);
    const fuera = this.enMesa(p.clone().add(V(-2.2, 0, 0)));
    const fin = hasta || V(-108, MESA + 0.4, a.z - 30);
    const suelo = MESA + radio + 0.05;
    const puntos = [fuera, fuera.clone().add(V(-4, -1.5, 0)), V(fuera.x - 9, suelo, fuera.z + (fin.z - fuera.z) * 0.25), V((fuera.x + fin.x) / 2 - 4, suelo, (fuera.z + fin.z) / 2), fin.clone().add(V(4, 0, 0)).setY(Math.max(suelo, fin.y - 1)), fin];
    const g = this.cable(id, puntos, { material, radio, padre: this.mesa, clase, invertido });
    const c = caja(2.2, tam[1], tam[2], material === NEGRO ? M.negro : material, 0.1);
    c.position.copy(a).add(V(-1.1, 0, 0));
    if (puerto === "video-grafica") c.rotation.x = Math.PI / 2;
    this.sombrea(c);
    g.add(c);
    return g;
  }

  conecta(que, puerto, ranura) {
    const per = this.perifericos;
    const punta = (g) => g.localToWorld(V(...g.userData.cable));
    if (que === "monitor") this.cableFuera("monitor", puerto, { hasta: punta(per.monitor), radio: 0.32, tam: [0, 0.6, 1.6] });
    if (que === "teclado") this.cableFuera("teclado", puerto, { ranura, hasta: punta(per.teclado), radio: 0.2, tam: [0, 0.55, 1.3], invertido: true });
    if (que === "raton") this.cableFuera("raton", puerto, { ranura, hasta: punta(per.raton), radio: 0.16, tam: [0, 0.55, 1.3], invertido: true });
    if (que === "altavoces") this.cableFuera("altavoces", puerto, { hasta: punta(per.altavoces), material: mat(0x7ddc5f, { rug: 0.45 }), radio: 0.14, tam: [0, 0.5, 0.5] });
    if (que === "red") this.cableFuera("red", puerto, { material: mat(0xf2c14e, { rug: 0.5 }), radio: 0.26, tam: [0, 1.2, 1.4] });
    if (que === "corriente") this.cableFuera("corriente", puerto, { radio: 0.42, tam: [0, 2.2, 2.9], clase: "corriente", invertido: true });
  }

  interruptor(encendido = true) {
    const tecla = this.pieza("fuente").userData.partes.toma[0].children[3];
    tecla.rotation.x = encendido ? 0.2 : -0.2;
    this.b.sucio = true;
  }

  // Arranque: se encienden las luces, giran los ventiladores y la pantalla va contando qué comprueba.
  enciende(fin) {
    const b = this.b;
    this.luces(true);
    const piloto = this.perifericos.monitor.getObjectByName("piloto");
    if (piloto) piloto.material.emissive?.set(0x5cc8ff);
    b.encendido = true;
    this.flujo(true);
    const lineas = ["Procesador: 6 núcleos", "Memoria RAM: 32 GB", "Tarjeta gráfica", "Disco SSD: 500 GB", "Disco duro: 1 TB", "Teclado y ratón"];
    const cuadro = (n) => this.pintaPantalla((c, w, h) => {
      c.fillStyle = "#070b18";
      c.fillRect(0, 0, w, h);
      texto(c, "La BIOS comprueba las piezas…", 70, 80, { tam: 44, color: "#c6f432", peso: 800 });
      lineas.slice(0, n).forEach((l, i) => {
        texto(c, "✓", 76, 170 + i * 58, { tam: 40, color: "#4ade80", peso: 800 });
        texto(c, l, 130, 170 + i * 58, { tam: 36, color: "#e8edff", peso: 500 });
      });
    });
    const escritorio = () => this.pintaPantalla((c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#27358f");
      g.addColorStop(1, "#0f8f8a");
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      texto(c, "¡Funciona!", w / 2, h * 0.42, { tam: 120, peso: 800, alinear: "center" });
      texto(c, "Has montado un ordenador", w / 2, h * 0.62, { tam: 40, color: "#e8edff", peso: 500, alinear: "center" });
      c.fillStyle = "#0a0e1acc";
      c.fillRect(0, h - 54, w, 54);
    });
    if (b.rapido) return escritorio(), fin?.();
    let n = 0;
    const sigue = () => {
      if (n > lineas.length) return escritorio(), fin?.();
      cuadro(n++);
      this.reloj = setTimeout(sigue, 520);
    };
    sigue();
  }

  // ---------------------------------------------------------------- Dianas

  hazDianas() {
    const b = this.b;
    const { XR, G, YP, XF, ZT, ZB } = C;
    const enPlaca = (id, y, tam, extra = {}) => b.diana(id, { en: this.placa, pos: [EN_PLACA[id][0], y, EN_PLACA[id][1]], tam, ...extra });
    b.diana("alfombrilla", { en: this.mesa, pos: [ALFOMBRILLA.x, MESA + 1, ALFOMBRILLA.z], tam: [24.4, 1, 24.4] });
    b.diana("palanca", { en: this.eje, pos: [0, 0.1, 3], tam: [0.5, 0.5, 6], tipo: "punto", holgura: 0.5 });
    b.dianas.get("palanca").marca.scale.setScalar(3.4);
    enPlaca("zocalo", 1.1, [5.4, 1, 5.4]);
    b.diana("cpu", { en: this.placa, pos: [EN_PLACA.zocalo[0], 1.7, EN_PLACA.zocalo[1]], tam: [4.6, 1.2, 4.6] });
    for (const id of ["cpufan", "sysfan1", "sysfan2"]) enPlaca(id, 0.6, [1.5, 0.9, 0.8], { holgura: 0.7 });
    RANURAS.forEach((x, i) => b.diana(`ranura${i}`, { en: this.placa, pos: [x, 2.3, -4.5], tam: [0.74, 3.2, 13.6], holgura: 0.25 }));
    b.diana("pcie", { en: this.placa, pos: [-3.45, 1.7, 3.5], tam: [9.2, 1.4, 0.9], holgura: 0.8 });
    enPlaca("atx24", 1.9, [1.5, 1.2, 5.6]);
    enPlaca("cpu8", 1.9, [2.4, 1.2, 1.4]);
    enPlaca("pines", 1, [2.8, 0.9, 0.9], { holgura: 0.7 });
    enPlaca("sata1", 1.17, [1.4, 0.8, 1.4], { holgura: 0.3 });
    enPlaca("sata2", 1.17, [1.4, 0.8, 1.4], { holgura: 0.3 });

    const enPc = (id, pos, tam, extra = {}) => b.diana(id, { en: this.pc, pos: pos.toArray ? pos.toArray() : pos, tam, ...extra });
    enPc("panel", [(XR + XF) / 2, YP + 0.2, 0], [XF - XR, 0.6, ZB - ZT], { holgura: 0.2 });
    enPc("hueco-fuente", [-13.8, 7.9, 15.4], [14, 15, 8.6], { holgura: 0.2 });
    enPc("bandeja", [B.x, 1.2, B.z], [24.4, 1, 24.4]);
    enPc("bahia-ssd", [15, 0.9, -12], [10, 1, 7]);
    enPc("bahia-disco", [15, 1.6, 5.5], [10.2, 2.6, 14.7]);
    this.caja.tapas.slice(0, 2).forEach((t, i) => b.diana(`tapa${i}`, { en: t, pos: [0, 0, 0], tam: [0.4, 6, 2], tipo: "punto", holgura: 0.4 }));
    enPc("toma-grafica", [2.6, 13.9, -2.5], [2.4, 1.6, 1.4]);
    for (const [id, p] of Object.entries(TOMA)) enPc(id, [p.x, p.y, p.z + 0.5], [id.endsWith("datos") ? 1.6 : 2.8, 0.9, 1.3], { holgura: 0.3 });
    for (const [id, p] of Object.entries(PUERTO)) {
      const punto = id === "interruptor";
      const audio = id.startsWith("audio");
      enPc(id, [p.x - 0.4, p.y, p.z], id === "video-grafica" ? [0.8, 2, 1] : id === "toma" ? [0.8, 2.4, 3] : audio ? [0.8, 0.9, 1.1] : [0.8, 1.8, 1.7], { tipo: punto ? "punto" : "zona", holgura: audio ? 0.06 : 0.5 });
    }
    enPc("boton", [BOTON.x, BOTON.y, ZT - G - 0.3], [2, 2, 0.6], { tipo: "punto" });
    for (const [g, puntos] of Object.entries(this.puntosTornillo)) {
      puntos.forEach((p, i) => b.diana(`tornillo-${g}-${i}`, { en: p.en, pos: p.pos.toArray(), tam: [0.9, 0.9, 0.9], tipo: "punto", holgura: 0.5 }));
    }
  }

  // ---------------------------------------------------------------- Vistas de cámara

  vista(nombre) {
    const p = this.placaEnCaja ? V(B.x, B.y, B.z) : ALFOMBRILLA.clone();
    const z = p.clone().add(V(-2, 1, -4.5));
    const en = (q) => this.enMesa(V(...q));
    const vistas = {
      general: [V(14, 96, 92), V(12, 2, 2)],
      caja: [V(2, 98, 46), V(1, 4, -1)],
      trasera: [V(-88, 36, 36), V(-21, 8, 5)],
      alfombrilla: [V(46, 78, 62), V(44, 1, 4)],
      zocalo: [z.clone().add(V(2, 31, 22)), z],
      disipador: [z.clone().add(V(8, 34, 26)), z.clone().add(V(1, 2, -2))],
      memoria: [p.clone().add(V(10, 38, 27)), p.clone().add(V(4, 2, -4))],
      placa: [p.clone().add(V(0, 66, 40)), p.clone().add(V(0, 0, 1))],
      discos: [V(24, 46, 44), V(14, 1, 2)],
      tomas: [V(15, 30, 44), V(12, 1, 6)],
      ranuras: [V(6, 36, 32), V(-14, 6, 0)],
      grafica: [V(2, 50, 40), V(-6, 5, -2)],
      cables: [V(8, 62, 50), V(2, 3, 2)],
      datos: [V(14, 34, 30), V(7, 1.5, 4)],
      dePie: [V(-42, 56, 178), V(-40, 16, 22)],
      puesto: [V(-42, 50, 170), V(-40, 15, 22)],
      detras: [V(-96, 46, 92), en([C.XR - 12, 6, -6])],
      sonido: [en([C.XR, 2.6, B.z + 1]).add(V(-30, 7, 24)), en([C.XR, 2.6, B.z + 1])],
      enchufe: [V(-78, 24, 74), en([C.XR, 6, 14])],
      arriba: [V(34, 66, 84), en([BOTON.x, BOTON.y, C.ZT])],
    };
    return vistas[nombre] || vistas.general;
  }

  mira(nombre, ms) {
    const [pos, objetivo] = this.vista(nombre);
    // En pantallas estrechas la cámara se aleja para que quepa lo mismo.
    const lejos = Math.max(1, 1.3 / this.b.camara.aspect);
    this.b.ver(objetivo.clone().add(pos.sub(objetivo).multiplyScalar(lejos)), objetivo, ms);
  }
}

// Acabados entre los que se puede elegir.
const CLAVE_ACABADO = "anatomia-mi-pc-v1";
const ACABADO_DE_FABRICA = { caja: "grafito", luz: "lima", pegatina: "ninguna" };
export const ACABADOS = {
  caja: { grafito: [0x2a3142, 0x39425a], blanco: [0xdfe4ee, 0xc3cad8], azul: [0x1f3f8f, 0x2c4f9f], rojo: [0x9c2130, 0x4a2a36] }, // [por fuera, por dentro]
  luz: { lima: 0xc6f432, azul: 0x3fb6ff, rosa: 0xff5c8a, naranja: 0xff8a3d, apagadas: null },
};
function leeAcabado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ACABADO)) || {};
  } catch {
    return {};
  }
}

// Pegatinas: dibujos sencillos con borde blanco.
const figura = (color, trazar) => (c, w) => {
  c.clearRect(0, 0, w, w);
  c.lineJoin = "round";
  c.beginPath();
  trazar(c, w);
  c.closePath();
  c.strokeStyle = "#fff";
  c.lineWidth = w * 0.11;
  c.stroke();
  c.fillStyle = color;
  c.fill();
};
export const PEGATINAS = {
  estrella: figura("#ffd23f", (c, w) => {
    for (let i = 0; i < 10; i++) {
      const r = w * (i % 2 ? 0.17 : 0.4), a = (i * Math.PI) / 5 - Math.PI / 2;
      c.lineTo(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r);
    }
  }),
  rayo: figura("#c6f432", (c, w) => {
    for (const [x, y] of [[0.58, 0.1], [0.24, 0.56], [0.46, 0.56], [0.38, 0.9], [0.76, 0.42], [0.54, 0.42]]) c.lineTo(x * w, y * w);
  }),
  corazon: figura("#ff5c8a", (c, w) => {
    c.moveTo(w * 0.5, w * 0.86);
    c.bezierCurveTo(w * 0.02, w * 0.52, w * 0.16, w * 0.12, w * 0.5, w * 0.34);
    c.bezierCurveTo(w * 0.84, w * 0.12, w * 0.98, w * 0.52, w * 0.5, w * 0.86);
  }),
  planeta: figura("#5cc8ff", (c, w) => {
    c.arc(w / 2, w / 2, w * 0.3, 0, Math.PI * 2);
    c.moveTo(w * 0.94, w * 0.4);
    c.ellipse(w / 2, w / 2, w * 0.44, w * 0.1, -0.35, 0, Math.PI * 2);
  }),
};

// Dibujo de una ráfaga: una estela que acaba en una punta brillante.
let rafagaHecha;
function rafaga() {
  if (!rafagaHecha) {
    rafagaHecha = textura(128, 4, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.45, "rgba(255,255,255,.35)");
      g.addColorStop(0.62, "rgba(255,255,255,1)");
      g.addColorStop(0.66, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    });
    rafagaHecha.wrapS = THREE.RepeatWrapping;
  }
  return rafagaHecha;
}

// Rótulo blanco impreso sobre la placa.
function serigrafia(t) {
  const ancho = t.length * 0.42 + 0.3;
  return lamina(ancho, 0.7, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    texto(c, t, w / 2, h / 2, { tam: h * 0.78, color: "#e9f2ee", peso: 700, alinear: "center" });
  }, { px: 256, rug: 0.6, transparente: true });
}

// Objetos sueltos para las fotos de la bandeja de piezas.
export function muestra(id) {
  const cabo = (material, radio, puntos) => tubo(puntos, radio, material, { tramos: 30 });
  switch (id) {
    case "destornillador": {
      const g = grupo(en(cilindro(0.2, 9, M.acero, { lados: 12 }), 0, 4.5, 0), en(cilindro(0.95, 9, M.rojo, { lados: 20 }), 0, 13.5, 0), en(cilindro(1.05, 1.2, M.negro, { lados: 20 }), 0, 9.4, 0));
      g.rotation.z = 1.1;
      return grupo(g);
    }
    case "pasta": {
      const g = grupo(
        cilindro(0.8, 6, mat(0xe9edf2, { rug: 0.2, transparent: true, opacity: 0.6 }), { lados: 24 }),
        en(cilindro(0.6, 4, mat(0xaab0ba, { rug: 0.4 }), { lados: 24 }), 0, -0.8, 0),
        en(cilindro(0.25, 1.6, M.grisClaro, { lados: 16, radioAbajo: 0.1 }), 0, -3.8, 0),
        en(cilindro(1.3, 0.3, M.azul, { lados: 24 }), 0, 3.1, 0),
        en(cilindro(0.35, 3, M.azul, { lados: 16 }), 0, 4.6, 0),
        en(cilindro(1, 0.3, M.azul, { lados: 24 }), 0, 6.2, 0),
      );
      g.rotation.z = 1.2;
      return grupo(g);
    }
    case "c24": return grupo(caja(1.5, 1.6, 5.6, M.negro, 0.1), cabo(NARANJA, 0.55, [[0, 0.8, 0], [0, 3, 0.5], [-1, 5, 3], [-4, 6, 6]]));
    case "c8": return grupo(caja(2.4, 1.5, 1.4, M.negro, 0.1), cabo(NARANJA, 0.4, [[0, 0.7, 0], [0, 2.4, 0.3], [-1, 4, 2], [-3, 4.6, 4]]));
    case "cpcie": return grupo(caja(2.2, 1.5, 1.2, M.negro, 0.1), en(caja(0.7, 1.5, 1.2, M.gris, 0.1), 1.5, 0, 0), cabo(NARANJA, 0.4, [[0.3, 0.7, 0], [0.3, 2.4, 0.3], [-1, 4, 2], [-3, 4.6, 4]]));
    case "csata": return grupo(caja(2.8, 0.7, 1.1, M.negro, 0.08), cabo(NARANJA, 0.3, [[0, 0, 0.5], [0, 0.2, 2], [-1, 0.6, 4], [-3, 0.8, 5]]));
    case "cdatos": return grupo(caja(1.5, 0.7, 1.1, AZUL, 0.08), cabo(AZUL, 0.22, [[0, 0, 0.5], [0, 0.2, 2], [-1, 0.6, 4], [-3, 0.8, 5]]));
    case "cvent": return grupo(caja(1.2, 0.6, 0.5, M.negro, 0.05), cabo(NEGRO, 0.13, [[0, 0.3, 0], [0, 1.2, 0.2], [-0.6, 2, 1], [-2, 2.4, 2]]));
    case "cpanel": return grupo(caja(2.6, 0.8, 0.7, M.negro, 0.05), cabo(NEGRO, 0.16, [[0, 0.4, 0], [0, 1.4, 0.2], [-0.6, 2.4, 1], [-2.4, 3, 2]]));
    case "cmonitor": return grupo(caja(2.2, 0.6, 1.6, M.negro, 0.1), en(caja(0.8, 0.4, 1.3, M.acero, 0.05), 1.4, 0, 0), cabo(NEGRO, 0.32, [[-1, 0, 0], [-3, 0, 0.2], [-5, 0.4, 1.5], [-6, 0.6, 4]]));
    case "cred": return grupo(caja(2, 1.1, 1.3, mat(0xfff3c4, { rug: 0.3, transparent: true, opacity: 0.85 }), 0.1), cabo(mat(0xf2c14e, { rug: 0.5 }), 0.26, [[-1, 0, 0], [-3, 0, 0.2], [-5, 0.4, 1.5], [-6, 0.6, 4]]));
    case "ccorriente": return grupo(caja(2.6, 2.2, 2.9, M.negro, 0.3), cabo(NEGRO, 0.42, [[-1.2, 0, 0], [-3.5, 0, 0.2], [-6, 0.4, 2], [-7, 0.6, 5]]));
    case "teclado": return grupo(teclado().raiz);
    case "raton": return grupo(raton().raiz);
    case "altavoces": return grupo(altavoces().raiz);
  }
  return null;
}
