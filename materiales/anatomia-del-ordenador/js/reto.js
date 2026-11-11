// Actividad «¿Qué pieza es?», en tres niveles.
//
//   Nivel 1: se ve la pieza y se elige su nombre.
//   Nivel 2: no aparece ningún nombre. Se alternan dos preguntas:
//            pieza → para qué sirve, y definición → qué pieza es.
//   Nivel 3: se ve la pieza y hay que escribir su nombre, sin opciones.
//
// En todos, los modelos van sin rótulos que digan qué pieza es.

import { PIEZAS, pieza, barajar } from "./datos.js";
import { escenario, ponerPieza } from "./escenario.js";
import { partida, botonOpcion, elegir, marcarOpciones } from "./partida.js";

export const reto = {
  id: "reto",
  titulo: "Reto: ¿qué pieza es?",
  descripcion: "Una pregunta por cada pieza. Cada nivel es más difícil.",
  niveles: [
    { id: "1", etiqueta: "Nivel 1", nombre: "Ponle nombre", texto: "Ves la pieza en 3D y eliges cómo se llama." },
    { id: "2", etiqueta: "Nivel 2", nombre: "Sin nombres", texto: "Solo piezas y definiciones. Tienes que saber para qué sirve cada una." },
    { id: "3", etiqueta: "Nivel 3", nombre: "De memoria", texto: "Sin opciones: ves la pieza y escribes su nombre." },
  ],
  montar(app, ctx, nivel) {
    const esc = escenario();
    const preguntas = barajar(PIEZAS).map((p, i) => {
      const tipo = nivel.id === "1" ? "nombre" : nivel.id === "3" ? "escribe" : i % 2 ? "busca" : "funcion";
      return {
        tono: p.color,
        repaso: { foto: p.foto, titulo: p.nombre, texto: p.def, enlace: `#/atlas/${p.id}` },
        plantea: (zona, corrige) => PLANTEA[tipo](p, zona, corrige, { esc, ctx, facil: nivel.id === "1" }),
      };
    });
    return partida(app, ctx, { actividad: reto, nivel, preguntas });
  },
};

// Tres trampas: en los niveles difíciles, las piezas que más se le parecen.
function opcionesPara(p, facil) {
  const resto = barajar(PIEZAS.filter((x) => x !== p));
  const trampas = facil ? resto : [...p.parecidas.map(pieza), ...resto.filter((x) => !p.parecidas.includes(x.id))];
  return barajar([p, ...trampas.slice(0, 3)]);
}

const es = (p) => `${p.el === "los" ? "Son" : "Es"} ${p.el} <b>${p.enFrase.slice(p.el.length + 1)}</b>.`;

function conPieza(p, zona, { esc, ctx }, titulo, cuerpo) {
  zona.classList.add("con-vista");
  zona.innerHTML = `
    <div class="reto-vista"></div>
    <div class="reto-panel">
      <p class="cuenta">${zona.dataset.numero}</p>
      <h1 tabindex="-1">${titulo}</h1>
      ${cuerpo}
      <div class="respuesta" aria-live="polite"></div>
    </div>`;
  zona.querySelector(".reto-vista").append(esc);
  ponerPieza(esc, ctx.visor, p, { anonima: true });
}

const PLANTEA = {
  nombre(p, zona, corrige, contexto) {
    const ops = opcionesPara(p, contexto.facil);
    conPieza(p, zona, contexto, "¿Qué pieza es?", `<div class="opciones dos">${ops.map((o, i) => botonOpcion(o.id, `<span>${o.nombre}</span>`, i)).join("")}</div>`);
    elegir(zona, (id) => {
      marcarOpciones(zona, p.id, id);
      corrige(id === p.id, { titular: `${id === p.id ? "¡Correcto!" : "No es esa."} ${es(p)}`, texto: `${p.def} ${p.pista}` });
    });
  },

  funcion(p, zona, corrige, contexto) {
    const ops = opcionesPara(p, false);
    conPieza(p, zona, contexto, "¿Para qué sirve esta pieza?", `<div class="opciones largas">${ops.map((o, i) => botonOpcion(o.id, `<span>${o.def}</span>`, i)).join("")}</div>`);
    elegir(zona, (id) => {
      marcarOpciones(zona, p.id, id);
      corrige(id === p.id, { titular: `${id === p.id ? "¡Correcto!" : "No es eso."} ${es(p)}`, texto: id === p.id ? p.pista : `${p.def} ${p.pista}` });
    });
  },

  busca(p, zona, corrige, { ctx }) {
    const ops = opcionesPara(p, false);
    ctx.visor.vaciar();
    zona.classList.add("sin-vista");
    zona.innerHTML = `
      <div class="reto-panel">
        <p class="cuenta">${zona.dataset.numero}</p>
        <h1 tabindex="-1">¿Qué pieza hace esto?</h1>
        <p class="definicion grande">${p.def}</p>
        <div class="opciones fotos">${ops.map((o, i) => botonOpcion(o.id, `<img src="${o.foto}" alt="Pieza ${"ABCD"[i]}">`, i)).join("")}</div>
        <div class="respuesta" aria-live="polite"></div>
      </div>`;
    elegir(zona, (id) => {
      marcarOpciones(zona, p.id, id);
      // Al responder se descubre qué es cada foto.
      for (const b of zona.querySelectorAll(".opcion")) b.insertAdjacentHTML("beforeend", `<span>${pieza(b.dataset.id).nombre}</span>`);
      corrige(id === p.id, { titular: `${id === p.id ? "¡Correcto!" : "No es esa."} ${es(p)}`, texto: p.pista });
    });
  },

  escribe(p, zona, corrige, contexto) {
    conPieza(p, zona, contexto, "¿Cómo se llama esta pieza?", `
      <form class="escribir" autocomplete="off">
        <label for="nombre-pieza">Escribe su nombre</label>
        <div class="fila">
          <input id="nombre-pieza" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40" enterkeyhint="done">
          <button class="boton principal">Comprobar</button>
        </div>
        <button type="button" class="enlace" data-rendirse>No lo sé</button>
      </form>`);
    const formulario = zona.querySelector("form");
    const campo = formulario.querySelector("input");
    const cerrar = (bien, escrito) => {
      campo.disabled = true;
      formulario.querySelectorAll("button").forEach((b) => (b.disabled = true));
      campo.classList.add(bien ? "bien" : "mal");
      corrige(bien, {
        titular: `${bien ? "¡Correcto!" : escrito ? `«${limpio(escrito)}» no es.` : "Esta era difícil."} ${es(p)}`,
        texto: `${p.def} ${p.pista}`,
      });
    };
    formulario.onsubmit = (ev) => {
      ev.preventDefault();
      if (campo.value.trim()) cerrar(acierta(campo.value, p), campo.value);
    };
    formulario.querySelector("[data-rendirse]").onclick = () => cerrar(false, "");
    if (matchMedia("(pointer: fine)").matches) campo.focus({ preventScroll: true });
  },
};

// ---------------------------------------------------------------- Respuestas escritas

const limpio = (t) => t.replace(/[<>&"]/g, "").slice(0, 40);
const normal = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, " ").split(/\s+/).filter(Boolean);

// Vale si alguna palabra escrita coincide con una clave de la pieza (se perdona
// una letra en las palabras largas) y no hay ninguna clave de otra pieza.
export function acierta(escrito, p) {
  const palabras = normal(escrito);
  const toca = (clave) => palabras.some((w) => w === clave || (clave.length >= 6 && distancia(w, clave) <= 1));
  if (!p.claves.some(toca)) return false;
  return !PIEZAS.some((otra) => otra !== p && otra.claves.some((c) => !p.claves.includes(c) && palabras.includes(c)));
}

function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 9;
  let fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const nueva = [i];
    for (let j = 1; j <= b.length; j++) nueva[j] = Math.min(fila[j] + 1, nueva[j - 1] + 1, fila[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    fila = nueva;
  }
  return fila[b.length];
}
