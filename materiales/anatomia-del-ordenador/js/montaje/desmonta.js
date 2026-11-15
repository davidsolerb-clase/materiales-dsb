// Nivel «Desmonta» del taller de montaje: el ordenador está montado y hay que
// vaciar la caja. No hay pasos: se toca lo que se quiere quitar. Si otra cosa
// tiene que salir antes, el taller lo dice y la ilumina.

import { THREE } from "../modelos/kit.js";
import { anotarIntento } from "../progreso.js";
import { Puesto, listaElementos, pantallaPuesto, sin3d } from "./puesto.js";
import { ELEMENTOS } from "./sistema.js";

// Lo que se puede quitar: lo de siempre más tres piezas que en «Repara» no se tocan.
const COSAS = [
  ...ELEMENTOS.filter((x) => x.grupo === "Piezas"),
  { id: "disipador", nombre: "Disipador", grupo: "Piezas" },
  { id: "cpu", nombre: "Procesador", grupo: "Piezas" },
  { id: "placa", nombre: "Placa base", grupo: "Piezas" },
  ...ELEMENTOS.filter((x) => x.grupo !== "Piezas" && x.grupo !== "Ajustes"),
];
const cosa = (id) => COSAS.find((x) => x.id === id);

// Qué tiene que estar quitado antes de cada cosa, y por qué.
const ANTES = {
  corriente: ["interruptor"],
  grafica: ["cpcie", "monitor"],
  ssd: ["ssd-corriente", "ssd-datos"],
  disco: ["disco-corriente", "disco-datos"],
  disipador: ["cpufan"],
  cpu: ["disipador"],
  fuente: ["c24", "c8", "cpcie", "ssd-corriente", "disco-corriente"],
  placa: ["grafica", "c24", "c8", "ssd-datos", "disco-datos", "panel", "teclado", "raton", "red", "altavoces"],
};
const PORQUE = {
  corriente: "Con el interruptor apagado no salta ninguna chispa al tirar del cable.",
  cpu: "El procesador está debajo del disipador.",
  placa: "La placa no sale mientras algo la una a la caja o a lo de fuera.",
  fuente: "Sus cables siguen enchufados a otras piezas.",
};
const TIRON = "Si tiras de la pieza con un cable puesto, puedes romper el conector.";
const ENCHUFADO = "Nunca se toca un ordenador por dentro mientras está enchufado. Primero apaga el interruptor de la fuente y quita el cable del enchufe.";
// Al salir la placa, se lleva lo que todavía tenga encima.
const SOBRE_LA_PLACA = ["ram1", "ram2", "disipador", "cpu", "cpufan"];

export function desmonta(app, ctx, nivel, actividad) {
  const partes = pantallaPuesto(app, `Taller de montaje · ${nivel.nombre}`);
  let puesto;
  try {
    puesto = new Puesto(partes.zona);
  } catch {
    return sin3d(app, actividad.titulo);
  }
  const { lista, ficha } = partes;
  app.querySelector("[data-sonido]").remove();
  const { b, m } = puesto;

  const objetos = { ...puesto.objetos, disipador: [m.piezas.disipador, m.pasta].filter(Boolean), cpu: [m.piezas.cpu], placa: [m.placa] };
  b.escena.updateMatrixWorld(true);
  for (const [id, o] of [["disipador", m.piezas.disipador], ["cpu", m.piezas.cpu], ["placa", m.placa.children[0]]]) {
    const caja = new THREE.Box3().setFromObject(o);
    b.diana(`el-${id}`, { en: b.escena, pos: caja.getCenter(new THREE.Vector3()).toArray(), tam: caja.getSize(new THREE.Vector3()).toArray(), holgura: 0.2 });
  }

  const fuera = new Set();
  let fallos = 0;
  let aviso = null;
  let acabado = false;

  const pinta = (iluminar = []) => {
    const marcas = Object.fromEntries(COSAS.filter((x) => !fuera.has(x.id)).map((x) => [`el-${x.id}`, iluminar.includes(x.id) ? "guia" : null]));
    b.activa(Object.keys(marcas), marcas);
    lista.innerHTML = listaElementos(COSAS, {
      clase: (x) => (fuera.has(x.id) ? "quitada" : ""),
      boton: (x) => `<span>${x.nombre}</span><small>${fuera.has(x.id) ? (x.id === "interruptor" ? "Apagado" : "Fuera") : ""}</small>`,
    });
    ficha.innerHTML = `
      <p class="cuenta">${fuera.size} <span>de ${COSAS.length}</span></p>
      <h1 tabindex="-1">Desmóntalo</h1>
      <p class="paso-texto">Este ordenador se va a reciclar. Vacía la caja: toca lo que quieras quitar, en la lista o en el modelo. Si otra cosa tiene que salir antes, se ilumina.</p>
      ${aviso ? `<div class="veredicto ${aviso.tipo}"><p class="titular">${aviso.titular}</p><p>${aviso.texto}</p></div>` : `<p class="paso-ayuda">Piensa primero: ¿qué es lo más peligroso de tocar?</p>`}
      <p class="porque"><b>Fallos:</b> ${fallos}. Cuenta cada vez que intentas quitar algo antes de tiempo.</p>`;
  };

  // Saca una cosa de su sitio con un pequeño movimiento y la hace desaparecer.
  function saca(id) {
    fuera.add(id);
    if (id === "interruptor") return m.interruptor(false);
    const porFuera = cosa(id).grupo === "Por fuera";
    for (const o of objetos[id] || []) {
      if (!o.visible) continue;
      const tiron = new THREE.Vector3(...(porFuera ? [-12, 3, 0] : [0, 5, 16])).applyQuaternion(o.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
      const casa = o.position.clone();
      b.mueve(o, { a: casa.clone().add(tiron), ms: 420, fin: () => ((o.visible = false), o.position.copy(casa)) });
    }
  }

  function quita(id) {
    if (acabado || fuera.has(id) || !cosa(id)) return;
    const enchufado = id !== "interruptor" && id !== "corriente" && !fuera.has("corriente");
    const faltan = enchufado ? ["interruptor", "corriente"].filter((x) => !fuera.has(x)) : (ANTES[id] || []).filter((x) => !fuera.has(x));
    if (faltan.length) {
      fallos++;
      const nombres = faltan.map((x) => cosa(x).nombre.toLowerCase()).join(", ");
      aviso = { tipo: "mal", titular: "Todavía no", texto: enchufado ? ENCHUFADO : `Antes hay que quitar: <b>${nombres}</b>. ${PORQUE[id] || TIRON}` };
      return pinta(faltan);
    }
    saca(id);
    if (id === "placa") for (const x of SOBRE_LA_PLACA) fuera.add(x);
    aviso = { tipo: "bien", titular: `Fuera: ${cosa(id).nombre.toLowerCase()}`, texto: id === "corriente" ? "Ahora sí se puede tocar por dentro." : id === "placa" ? "Ha salido con lo que aún llevaba encima." : "Sigue con lo siguiente." };
    if (fuera.size >= COSAS.length) return final();
    pinta();
  }
  puesto.alElegir = quita;

  function final() {
    acabado = true;
    b.activa([]);
    const e = fallos <= 1 ? 3 : fallos <= 4 ? 2 : 1;
    anotarIntento(`${actividad.id}-${nivel.id}`, Math.max(0, COSAS.length - fallos), COSAS.length, e);
    lista.innerHTML = "";
    ficha.innerHTML = `
      <div class="resultado">
        <p class="cuenta">${nivel.etiqueta} · ${nivel.nombre}</p>
        <h1 tabindex="-1">Caja vacía</h1>
        <p class="grandes">${ctx.pintaEstrellas(e)}</p>
        <p class="entrada">${COSAS.length} cosas fuera, con ${fallos} ${fallos === 1 ? "fallo" : "fallos"}.</p>
        <h2>Para recordar</h2>
        <ul class="aprendido">
          <li>Lo primero, siempre: apagar y desenchufar.</li>
          <li>Los cables salen antes que las piezas a las que van.</li>
          <li>Las piezas viejas no van a la basura: llevan metales valiosos y otros que contaminan. Se llevan a un punto limpio.</li>
        </ul>
        <div class="fila">
          <button class="boton" data-otra>Repetir</button>
          <a class="boton principal" href="#/jugar/${actividad.id}/3">Montarlo por tu cuenta</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>`;
  }

  const pulsa = (ev) => {
    const boton = ev.target.closest("button");
    if (boton?.dataset.el) quita(boton.dataset.el);
    if (boton && "otra" in boton.dataset) ctx.ir(`/jugar/${actividad.id}/${nivel.id}`);
  };
  app.addEventListener("click", pulsa);
  pinta();
  return () => {
    app.removeEventListener("click", pulsa);
    puesto.destruir();
  };
}
