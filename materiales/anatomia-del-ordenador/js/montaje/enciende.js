// Actividad «Enciéndelo»: qué pasa si al ordenador le falta algo.
//
//   Nivel 1  Experimenta: quitas lo que quieras, enciendes y miras. El reto
//            es descubrir todas las averías distintas.
//   Nivel 2  Predice: el taller quita algo y hay que acertar qué pasará.

import { barajar } from "../datos.js";
import { anotarIntento } from "../progreso.js";
import { botonOpcion, elegir, marcarOpciones } from "../partida.js";
import { Puesto, listaElementos, pantallaPuesto, sin3d } from "./puesto.js";
import { ELEMENTOS, SINTOMAS, AVERIAS_POSIBLES, elemento, diagnostico } from "./sistema.js";

const CLAVE = "anatomia-enciende-v1";
const QUITABLES = ELEMENTOS.filter((x) => !x.fija);
// Lo que quita el taller en el nivel 2. Salen ocho, al azar.
const RONDAS = [["c8"], ["ram1", "ram2"], ["monitor"], ["cpufan"], ["ssd-datos"], ["teclado"], ["interruptor"], ["disco"], ["grafica"], ["ram1"], ["panel"], ["red"], ["cpcie"], ["ssd-corriente"], ["corriente"], ["c24"]];

export const enciende = {
  id: "enciende",
  titulo: "Taller: enciéndelo",
  descripcion: "¿Qué pasa si falta una pieza o un cable? Quítalo, enciende y mira.",
  necesita3d: true,
  niveles: [
    { id: "1", etiqueta: "Nivel 1", nombre: "Experimenta", texto: "Quita lo que quieras y enciende. Hay ocho averías distintas: descúbrelas todas." },
    { id: "2", etiqueta: "Nivel 2", nombre: "Predice", texto: "El taller quita algo y tú dices qué va a pasar antes de encender." },
  ],
  montar: (app, ctx, nivel) => (nivel.id === "1" ? experimenta : predice)(app, ctx, nivel),
};

// Por qué ha pasado: una frase por cada culpable.
export const porque = (r) => [...new Set(r.causas.map((id) => elemento(id).sin))].map((t) => `<p>${t}</p>`).join("");
const nombres = (ids) => ids.map((id) => elemento(id).nombre.toLowerCase()).join(" y ");
const estrellasDe = (n) => (n >= AVERIAS_POSIBLES.length ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

function conPuesto(app, rotulo) {
  const partes = pantallaPuesto(app, rotulo);
  try {
    partes.puesto = new Puesto(partes.zona);
  } catch {
    return null;
  }
  const sonido = app.querySelector("[data-sonido]");
  sonido.onclick = () => {
    partes.puesto.sonido = !partes.puesto.sonido;
    sonido.textContent = `Sonido: ${partes.puesto.sonido ? "sí" : "no"}`;
  };
  return partes;
}

// ---------------------------------------------------------------- Nivel 1

function experimenta(app, ctx, nivel) {
  const partes = conPuesto(app, `Enciéndelo · ${nivel.nombre}`);
  if (!partes) return sin3d(app, enciende.titulo);
  const { puesto, lista, ficha } = partes;
  let descubiertas = [];
  try {
    descubiertas = JSON.parse(localStorage.getItem(CLAVE)) || [];
  } catch {}
  let resultado = null;
  let aviso = "";
  let ocupado = false;

  function pinta() {
    const e = puesto.estado;
    lista.innerHTML = listaElementos(QUITABLES, {
      pulsado: (x) => e[x.id] !== "bien",
      boton: (x) => `<span>${x.nombre}</span><small>${e[x.id] !== "bien" ? (x.id === "interruptor" ? "Apagado" : x.grupo === "Piezas" ? "Quitada" : "Desenchufado") : ""}</small>`,
    });
    const quitados = QUITABLES.filter((x) => e[x.id] !== "bien");
    const s = resultado && SINTOMAS[resultado.sintoma];
    ficha.innerHTML = `
      <p class="cuenta">${descubiertas.length} <span>de ${AVERIAS_POSIBLES.length} averías descubiertas</span></p>
      <h1 tabindex="-1">¿Y si quito…?</h1>
      <p class="paso-texto">${puesto.encendido ? "Mira el ordenador y el monitor." : "Toca una pieza o un cable, en la lista o en el modelo, para quitarlo. Piensa qué va a pasar y enciende."}</p>
      ${puesto.encendido ? "" : `<p class="paso-ayuda">${quitados.length ? `Has quitado: <b>${nombres(quitados.map((x) => x.id))}</b>.` : "No has quitado nada todavía."}</p>`}
      <button class="boton principal" data-boton ${ocupado ? "disabled" : ""}>${puesto.encendido ? "Apagar" : "Encender"}</button>
      ${aviso ? `<div class="veredicto consejo"><p class="titular">Primero apágalo</p><p>${aviso}</p></div>` : ""}
      ${s && !ocupado ? `<div class="veredicto ${resultado.sintoma === "bien" ? "bien" : "mal"}"><p class="titular">${s.titulo}</p><p>${s.texto}</p>${porque(resultado)}</div>` : ""}
      <ul class="descubiertas">${AVERIAS_POSIBLES.map((id) => `<li class="${descubiertas.includes(id) ? "si" : ""}">${descubiertas.includes(id) ? SINTOMAS[id].titulo : "Sin descubrir"}</li>`).join("")}</ul>
      ${quitados.length && !puesto.encendido ? `<button class="enlace" data-todo>Volver a ponerlo todo</button>` : ""}`;
  }

  function cambia(id) {
    if (!QUITABLES.some((x) => x.id === id)) return;
    if (puesto.encendido) {
      aviso = "Nunca se toca un ordenador por dentro mientras está encendido.";
      return pinta();
    }
    resultado = null;
    puesto.pon(id, puesto.estado[id] === "bien" ? "falta" : "bien");
    puesto.marca(id);
    pinta();
  }
  puesto.alElegir = cambia;

  const pulsa = async (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.el) return cambia(b.dataset.el);
    aviso = "";
    if ("todo" in b.dataset) {
      puesto.reinicia();
      resultado = null;
      puesto.marca(null);
      return pinta();
    }
    if (!("boton" in b.dataset) || ocupado) return;
    if (puesto.encendido) {
      puesto.apaga();
      return pinta();
    }
    ocupado = true;
    resultado = null;
    puesto.marca(null);
    pinta();
    resultado = await puesto.enciende();
    ocupado = false;
    if (resultado.sintoma !== "bien" && !descubiertas.includes(resultado.sintoma)) {
      descubiertas.push(resultado.sintoma);
      try {
        localStorage.setItem(CLAVE, JSON.stringify(descubiertas));
      } catch {}
      anotarIntento(`${enciende.id}-1`, descubiertas.length, AVERIAS_POSIBLES.length, estrellasDe(descubiertas.length));
    }
    pinta();
  };
  app.addEventListener("click", pulsa);
  pinta();
  return () => {
    app.removeEventListener("click", pulsa);
    puesto.destruir();
  };
}

// ---------------------------------------------------------------- Nivel 2

function predice(app, ctx, nivel) {
  const partes = conPuesto(app, `Enciéndelo · ${nivel.nombre}`);
  if (!partes) return sin3d(app, enciende.titulo);
  const { puesto, lista, ficha } = partes;
  const rondas = barajar(RONDAS).slice(0, 8);
  let n = 0;
  let aciertos = 0;

  function ronda() {
    const quita = rondas[n];
    puesto.reinicia(Object.fromEntries(quita.map((id) => [id, "falta"])));
    puesto.marca(quita[0]);
    const bueno = diagnostico(puesto.estado);
    const opciones = barajar([bueno.sintoma, ...barajar(Object.keys(SINTOMAS).filter((s) => s !== bueno.sintoma)).slice(0, 3)]);
    lista.innerHTML = `<h2>Ronda ${n + 1} de ${rondas.length}</h2><ol class="puntos-ronda">${rondas.map((_, i) => `<li class="${i < n ? "hecha" : i === n ? "ahora" : ""}"></li>`).join("")}</ol>
      <h2>Aciertos</h2><p class="paso-cuenta">${aciertos}</p>`;
    ficha.innerHTML = `
      <p class="cuenta">Ronda ${n + 1} <span>de ${rondas.length}</span></p>
      <h1 tabindex="-1">¿Qué pasará al encender?</h1>
      <p class="paso-ayuda">Hemos quitado: <b>${nombres(quita)}</b>.</p>
      <div class="opciones largas">${opciones.map((s, i) => botonOpcion(s, `<span>${SINTOMAS[s].titulo}</span>`, i)).join("")}</div>
      <div class="respuesta" aria-live="polite"></div>`;
    elegir(ficha, async (id) => {
      marcarOpciones(ficha, bueno.sintoma, id);
      const bien = id === bueno.sintoma;
      if (bien) aciertos++;
      const r = await puesto.enciende();
      if (!ficha.isConnected) return;
      ficha.querySelector(".respuesta").innerHTML = `
        <div class="veredicto ${bien ? "bien" : "mal"}">
          <p class="titular">${bien ? "¡Correcto!" : "No era eso."} ${SINTOMAS[r.sintoma].titulo}.</p>
          ${porque(r)}
          <button class="boton principal" data-seguir>${n === rondas.length - 1 ? "Ver resultado" : "Siguiente"} →</button>
        </div>`;
      ficha.querySelector("[data-seguir]").focus({ preventScroll: true });
    });
  }

  function final() {
    puesto.reinicia();
    puesto.marca(null);
    anotarIntento(`${enciende.id}-2`, aciertos, rondas.length);
    const e = aciertos === rondas.length ? 3 : aciertos >= 6 ? 2 : aciertos >= 4 ? 1 : 0;
    lista.innerHTML = "";
    ficha.innerHTML = `
      <div class="resultado">
        <p class="cuenta">${nivel.etiqueta} · ${nivel.nombre}</p>
        <h1 tabindex="-1"><span class="nota">${aciertos}<small>/${rondas.length}</small></span></h1>
        <p class="grandes">${ctx.pintaEstrellas(e)}</p>
        <p class="entrada">${e === 3 ? "¡Pleno! Sabes qué hace cada pieza." : e ? "Bien. Vuelve a experimentar con las que has fallado." : "Toca experimentar un poco más antes de predecir."}</p>
        <div class="fila">
          <button class="boton" data-otra>Repetir</button>
          <a class="boton principal" href="#/jugar/${enciende.id}/1">Experimentar</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>`;
  }

  const pulsa = (ev) => {
    if (ev.target.closest("[data-seguir]")) {
      n++;
      if (n < rondas.length) ronda();
      else final();
    }
    if (ev.target.closest("[data-otra]")) ctx.ir(`/jugar/${enciende.id}/2`);
  };
  app.addEventListener("click", pulsa);
  ronda();
  return () => {
    app.removeEventListener("click", pulsa);
    puesto.destruir();
  };
}
