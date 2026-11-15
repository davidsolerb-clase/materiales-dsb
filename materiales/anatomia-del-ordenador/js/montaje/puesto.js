// El puesto de pruebas: el ordenador ya montado, de pie y abierto, junto a su
// monitor. Se le pueden quitar piezas y cables, encenderlo y ver qué pasa.
// Lo usan los talleres «Enciende» y «Repara». Qué ocurre lo decide sistema.js;
// aquí solo se enseña.

import { THREE, texto } from "../modelos/kit.js";
import { Banco } from "./banco.js";
import { Mundo } from "./mundo.js";
import { PASOS, ZONAS } from "./pasos.js";
import { ELEMENTOS, diagnostico, estadoSano } from "./sistema.js";

// Al montarlo solo, dónde va cada cable de los discos.
const ELIGE = {
  "corriente-disco1": "ssd-corriente", "corriente-disco2": "disco-corriente",
  "datos1-placa": "sata1", "datos1-disco": "ssd-datos", "datos2-placa": "sata2", "datos2-disco": "disco-datos",
};
const SALTA = new Set(["pon-panel", "cierra-panel", "enciende"]); // se queda abierto y apagado
// Al quitar una pieza, sus cables se van con ella.
const ARRASTRA = { grafica: ["cpcie", "monitor"], ssd: ["ssd-corriente", "ssd-datos"], disco: ["disco-corriente", "disco-datos"] };

export class Puesto {
  constructor(contenedor) {
    this.b = new Banco(); // lanza un error si no hay 3D
    this.b.montar(contenedor);
    this.m = new Mundo(this.b);
    this.monta();
    this.estado = estadoSano();
    this.encendido = false;
    this.sonido = true;
    this.alElegir = () => {};
    this.hazDianas();
    this.b.alTocar = (id) => id && this.alElegir(id.slice(3));
    this.m.mira("puesto", 0);
    this.marca(null);
    window.__puesto = this; // para las pruebas automáticas
  }

  // Hace solo, de golpe, todos los pasos del taller de montaje.
  monta() {
    const m = this.m;
    const e = { ocupadas: {}, giro: { cpu: 0, ram: 0 }, ram: [] };
    this.b.rapido = true;
    for (const p of PASOS) {
      if (SALTA.has(p.id)) continue;
      if (p.tipo === "pon") {
        e.giro.ram = 0;
        const libres = (p.guia ? p.guia(e) : p.zonas).filter((z) => (e.ocupadas[z] || 0) < (ZONAS[z]?.cap ?? 1));
        const zona = ELIGE[p.id] || libres[0];
        p.hecho(m, e, zona);
        e.ocupadas[zona] = (e.ocupadas[zona] || 0) + 1;
      } else if (p.tipo === "tornillos") m.puntosTornillo[p.grupo].forEach((_, k) => (p.quitar ? m.quitaTornillo(p.grupo, k) : m.atornilla(p.grupo, k)));
      else if (p.tipo === "toca") p.objetivos.forEach((o) => p.hecho(m, e, o));
      else p.hecho(m, e);
    }
    this.b.rapido = false;
    m.caja.panel.visible = false;

    const c = m.cables, z = m.piezas;
    this.objetos = {
      ram1: [z.ram1], ram2: [z.ram2], grafica: [z.grafica], ssd: [z.ssd], disco: [z.disco], fuente: [z.fuente],
      c24: [c.atx24], c8: [c.cpu8], cpcie: [c.pcie], cpufan: [c.cpufan], "ssd-corriente": [c["ssd-corriente"]], "disco-corriente": [c["disco-corriente"]],
      "ssd-datos": [c["datos1-disco"], c["datos1-placa"]], "disco-datos": [c["datos2-disco"], c["datos2-placa"]], panel: [c.panel],
      corriente: [c.corriente], monitor: [c.monitor], teclado: [c.teclado], raton: [c.raton], red: [c.red], altavoces: [c.altavoces],
      interruptor: [z.fuente.userData.partes.toma[0].children[3]],
      orden: [], // un ajuste: no se ve en el modelo, sino en la pantalla
    };
    this.alturaRam = z.ram1.position.y;
  }

  // Cada elemento se puede tocar en el modelo: los cables, por su clavija.
  hazDianas() {
    this.b.escena.updateMatrixWorld(true);
    for (const el of ELEMENTOS) {
      const o = this.objetos[el.id][0];
      if (!o) continue;
      const caja = new THREE.Box3().setFromObject(o.userData.curva ? o.children[1] : o);
      const tam = caja.getSize(new THREE.Vector3());
      this.b.diana(`el-${el.id}`, { en: this.b.escena, pos: caja.getCenter(new THREE.Vector3()).toArray(), tam: tam.toArray(), holgura: o.userData.curva || el.id === "interruptor" ? 0.9 : 0.2 });
    }
  }

  // Ilumina un elemento (o ninguno). Todos siguen siendo tocables.
  marca(id) {
    this.b.activa(ELEMENTOS.map((el) => `el-${el.id}`), null);
    if (!id) return;
    const d = this.b.dianas.get(`el-${id}`);
    if (!d) return;
    d.marca.visible = true;
    d.marca.material.color.set(0xc6f432);
    d.marca.children[0]?.material.color.set(0xc6f432);
    this.b.sucio = true;
  }

  pon(id, valor) {
    this.estado[id] = valor;
    this.refresca();
  }

  reinicia(fallo = {}) {
    this.apaga();
    this.estado = { ...estadoSano(), ...fallo };
    this.refresca();
  }

  refresca() {
    const e = this.estado;
    const fuera = (id) => e[id] === "falta";
    for (const el of ELEMENTOS) {
      if (el.id === "interruptor") continue;
      const sinPieza = Object.entries(ARRASTRA).some(([pieza, cables]) => cables.includes(el.id) && fuera(pieza));
      for (const o of this.objetos[el.id]) o.visible = !fuera(el.id) && !sinPieza;
    }
    for (const id of ["ram1", "ram2"]) {
      // Mal pinchada: se queda levantada y torcida.
      const o = this.objetos[id][0];
      o.position.y = this.alturaRam + (e[id] === "suelta" ? 0.9 : 0);
      o.rotation.x = e[id] === "suelta" ? 0.1 : 0;
    }
    this.m.interruptor(e.interruptor === "bien");
    this.b.sucio = this.b.sombras = true;
  }

  // ---------------------------------------------------------------- Encender

  espera(ms) {
    return new Promise((ok) => (this.reloj = setTimeout(ok, ms)));
  }

  luces(si) {
    const m = this.m;
    m.luces(si);
    m.perifericos.monitor.getObjectByName("piloto")?.material.emissive?.set(si ? 0x5cc8ff : 0x000000);
    this.b.encendido = si;
    this.b.sucio = true;
  }

  // Pulsa el botón. Va enseñando lo que pasa y devuelve el diagnóstico.
  async enciende() {
    const r = diagnostico(this.estado);
    const m = this.m;
    this.encendido = true;
    this.pantalla("negra");
    if (r.sintoma === "nada") return await this.espera(900), r;

    this.luces(true);
    m.flujo((id, clase) => clase === "corriente");
    if (r.sintoma === "negro") return await this.espera(2200), r;
    if (r.sintoma === "pitidos") {
      for (let i = 0; i < 3; i++) {
        this.pita();
        await this.espera(480);
      }
      return await this.espera(600), r;
    }
    if (r.sintoma === "sin-senal") {
      this.pantalla("mensaje", { titulo: "Sin señal", texto: "Comprueba el cable" });
      return await this.espera(1800), r;
    }

    m.flujo(true);
    const lineas = ["Procesador: 6 núcleos", `Memoria RAM: ${r.memoria || 32} GB`, "Tarjeta gráfica"];
    for (let n = 0; n <= lineas.length; n++) {
      this.pantalla("comprobando", { lineas: lineas.slice(0, n) });
      await this.espera(430);
    }
    if (r.sintoma === "sin-sistema") return this.pantalla("error", { titulo: "No se encuentra el sistema operativo", texto: "Conecta un disco que lo tenga y reinicia" }), r;
    if (r.sintoma === "sin-teclado") return this.pantalla("error", { titulo: "No se detecta el teclado", texto: "Conecta un teclado y reinicia" }), r;
    this.pantalla("escritorio", r);
    if (r.sintoma === "calor") {
      await this.espera(1700);
      this.pantalla("alerta", { titulo: "¡Temperatura demasiado alta!", texto: "El ordenador se apaga para protegerse" });
      await this.espera(1700);
      this.luces(false);
      m.flujo(false);
      this.pantalla("negra");
    }
    return r;
  }

  apaga() {
    clearTimeout(this.reloj);
    this.encendido = false;
    if (!this.m.perifericos) return;
    this.luces(false);
    this.m.flujo(false);
    this.pantalla("negra");
  }

  pita() {
    if (!this.sonido) return;
    try {
      this.audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = this.audio.createOscillator();
      const g = this.audio.createGain();
      o.frequency.value = 880;
      g.gain.value = 0.06;
      o.connect(g).connect(this.audio.destination);
      o.start();
      o.stop(this.audio.currentTime + 0.22);
    } catch {}
  }

  pantalla(tipo, d = {}) {
    this.m.pintaPantalla((c, w, h) => {
      c.fillStyle = tipo === "escritorio" ? "#27358f" : tipo === "alerta" ? "#7a1420" : "#05070c";
      c.fillRect(0, 0, w, h);
      if (tipo === "mensaje") {
        c.fillStyle = "#1b2440";
        c.fillRect(w / 2 - 230, h / 2 - 90, 460, 180);
        texto(c, d.titulo, w / 2, h / 2 - 22, { tam: 62, peso: 800, alinear: "center" });
        texto(c, d.texto, w / 2, h / 2 + 44, { tam: 30, color: "#a3aecf", peso: 500, alinear: "center" });
      } else if (tipo === "comprobando") {
        texto(c, "La BIOS comprueba las piezas…", 70, 80, { tam: 44, color: "#c6f432", peso: 800 });
        d.lineas.forEach((l, i) => {
          texto(c, "✓", 76, 170 + i * 58, { tam: 40, color: "#4ade80", peso: 800 });
          texto(c, l, 130, 170 + i * 58, { tam: 36, color: "#e8edff", peso: 500 });
        });
      } else if (tipo === "error" || tipo === "alerta") {
        texto(c, tipo === "error" ? "ERROR" : "AVISO", 70, 110, { tam: 40, color: tipo === "error" ? "#ff6b6b" : "#ffd23f", peso: 800 });
        texto(c, d.titulo, 70, 220, { tam: 50, peso: 800 });
        texto(c, d.texto, 70, 300, { tam: 34, color: "#cdd5f0", peso: 500 });
      } else if (tipo === "bios") {
        c.fillStyle = "#0b2a7a";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#c9d6ff";
        c.fillRect(0, 0, w, 70);
        texto(c, "AJUSTES DE LA PLACA BASE (BIOS)", 40, 36, { tam: 34, color: "#0b2a7a", peso: 800 });
        texto(c, "Orden de arranque", 60, 150, { tam: 44, peso: 800 });
        texto(c, "La placa busca el sistema operativo en este orden:", 60, 210, { tam: 28, color: "#c9d6ff", peso: 500 });
        (d.mal ? ["Disco duro (1 TB): sin sistema", "Disco SSD (500 GB)"] : ["Disco SSD (500 GB)", "Disco duro (1 TB)"]).forEach((l, i) => {
          c.fillStyle = i ? "#12359a" : d.mal ? "#a3283a" : "#1f8a5c";
          c.fillRect(60, 260 + i * 90, 760, 70);
          texto(c, `${i + 1}.  ${l}`, 90, 296 + i * 90, { tam: 36, peso: 700 });
        });
      } else if (tipo === "escritorio") {
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#27358f");
        g.addColorStop(1, "#0f8f8a");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        texto(c, d.avisos.length ? "Arranca, pero…" : "¡Funciona!", w / 2, h * 0.3, { tam: d.avisos.length ? 76 : 96, peso: 800, alinear: "center" });
        d.avisos.forEach((a, i) => {
          c.fillStyle = "#0a0e1acc";
          c.fillRect(w / 2 - 300, h * 0.44 + i * 54, 600, 46);
          texto(c, `⚠ ${a}`, w / 2, h * 0.44 + i * 54 + 25, { tam: 28, color: "#ffd23f", peso: 700, alinear: "center" });
        });
        c.fillStyle = "#0a0e1acc";
        c.fillRect(0, h - 54, w, 54);
        texto(c, `Memoria: ${d.memoria} GB`, 30, h - 26, { tam: 26, color: "#e8edff", peso: 600 });
      }
    });
  }

  destruir() {
    clearTimeout(this.reloj);
    this.audio?.close?.();
    this.b.destruir();
  }
}

// Lista de elementos agrupada, para el panel lateral. `boton(el)` devuelve el
// HTML de dentro del botón y `clase(el)` sus clases de más.
export function listaElementos(elementos, { boton, clase = () => "", pulsado = () => false }) {
  const grupos = [...new Set(elementos.map((x) => x.grupo))];
  return grupos
    .map((g) => `<h2>${g}</h2><div class="elementos">${elementos
      .filter((x) => x.grupo === g)
      .map((x) => `<button class="elemento ${clase(x)}" data-el="${x.id}" aria-pressed="${pulsado(x)}">${boton(x)}</button>`)
      .join("")}</div>`)
    .join("");
}

export function sin3d(app, titulo) {
  app.innerHTML = `<header class="cabecera"><a class="volver" href="#/">← Inicio</a></header>
    <div class="resultado"><h1 tabindex="-1">${titulo}</h1><p class="entrada">Este navegador no puede mostrar el taller en 3D. Prueba con otro.</p></div>`;
  return () => {};
}

// Estructura de pantalla común a los talleres del puesto.
export function pantallaPuesto(app, rotulo) {
  app.className = "p-taller";
  app.innerHTML = `
    <header class="cabecera">
      <a class="volver" href="#/">← Inicio</a>
      <span class="marca"><i></i>${rotulo}</span>
      <span class="taller-marcador"><button class="enlace" data-sonido aria-pressed="true">Sonido: sí</button></span>
    </header>
    <div class="taller puesto">
      <aside class="taller-bandeja" aria-label="Piezas y cables"></aside>
      <div class="taller-3d"><p class="gesto">Arrastra para girar · rueda o pellizco para acercar</p></div>
      <aside class="taller-guia"><article class="ficha-paso" aria-live="polite"></article></aside>
    </div>`;
  const zona = app.querySelector(".taller-3d");
  zona.addEventListener("tocado", () => zona.classList.add("tocado"), { once: true });
  return { lista: app.querySelector(".taller-bandeja"), zona, ficha: app.querySelector(".ficha-paso") };
}
