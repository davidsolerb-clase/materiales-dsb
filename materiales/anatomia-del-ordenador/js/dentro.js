// Actividad «Por dentro»: las partes que se ven al abrir cada pieza.
//
//   Nivel 1: una parte se ilumina y hay que elegir su nombre.
//   Nivel 2: se lee lo que hace una parte y hay que tocarla en el modelo.
//
// Necesita 3D: sin WebGL no se puede jugar.

import { PIEZAS, barajar } from "./datos.js";
import { escenario, ponerPieza } from "./escenario.js";
import { partida, botonOpcion, elegir, marcarOpciones } from "./partida.js";

export const dentro = {
  id: "dentro",
  titulo: "Reto: por dentro",
  descripcion: "Las piezas, abiertas. ¿Sabes qué es cada parte?",
  necesita3d: true,
  niveles: [
    { id: "1", etiqueta: "Nivel 1", nombre: "¿Qué parte es?", texto: "Se ilumina una parte de la pieza y eliges cómo se llama." },
    { id: "2", etiqueta: "Nivel 2", nombre: "Tócala", texto: "Lees lo que hace una parte y la buscas tú en el modelo." },
  ],
  montar(app, ctx, nivel) {
    const esc = escenario();
    const preguntas = barajar(PIEZAS).map((p) => {
      const parte = barajar(p.partes)[0];
      return {
        tono: p.color,
        repaso: { foto: p.fotoAbierta, titulo: `${parte.nombre} (${p.enFrase.slice(p.el.length + 1)})`, texto: parte.def, enlace: `#/atlas/${p.id}/dentro` },
        plantea: (zona, corrige) => (nivel.id === "1" ? nombra : toca)(p, parte, zona, corrige, { esc, ctx }),
      };
    });
    return partida(app, ctx, { actividad: dentro, nivel, preguntas });
  },
};

function pinta(p, zona, { esc, ctx }, titulo, cuerpo) {
  zona.classList.add("con-vista");
  zona.innerHTML = `
    <div class="reto-vista"></div>
    <div class="reto-panel">
      <p class="cuenta">${zona.dataset.numero} · ${p.nombre}</p>
      <h1 tabindex="-1">${titulo}</h1>
      ${cuerpo}
      <div class="respuesta" aria-live="polite"></div>
    </div>`;
  zona.querySelector(".reto-vista").append(esc);
  ponerPieza(esc, ctx.visor, p, { abierta: 1 });
}

function nombra(p, parte, zona, corrige, contexto) {
  const ops = barajar([parte, ...barajar(p.partes.filter((x) => x !== parte)).slice(0, 3)]);
  pinta(p, zona, contexto, "¿Qué parte está iluminada?", `<div class="opciones dos">${ops.map((o, i) => botonOpcion(o.id, `<span>${o.nombre}</span>`, i)).join("")}</div>`);
  contexto.ctx.visor.resaltar(parte.id);
  contexto.ctx.visor.marcar([[parte.id, "?"]]);
  elegir(zona, (id) => {
    marcarOpciones(zona, parte.id, id);
    corrige(id === parte.id, { titular: `${id === parte.id ? "¡Correcto!" : "No es esa."} Es: <b>${parte.nombre.toLowerCase()}</b>.`, texto: parte.def });
  });
}

function toca(p, parte, zona, corrige, contexto) {
  const { visor } = contexto.ctx;
  pinta(p, zona, contexto, "Toca la parte que hace esto", `
    <p class="definicion grande">${parte.def}</p>
    <p class="ayuda">Gira la pieza si no la ves. Vale un solo toque.</p>
    <button class="enlace" data-rendirse>No la encuentro</button>`);
  const vista = zona.querySelector(".reto-vista");
  const cerrar = (id) => {
    vista.removeEventListener("parte", alTocar);
    zona.querySelector("[data-rendirse]").remove();
    zona.querySelector(".ayuda").remove();
    const bien = id === parte.id;
    visor.resaltar(parte.id, bien ? 0x4ade80 : 0xc6f432);
    visor.marcar([[parte.id, bien ? "✓" : "!"]]);
    const tocada = p.partes.find((x) => x.id === id);
    corrige(bien, {
      titular: bien ? `¡Correcto! Es: <b>${parte.nombre.toLowerCase()}</b>.` : `${tocada ? `Has tocado: ${tocada.nombre.toLowerCase()}. ` : ""}Era: <b>${parte.nombre.toLowerCase()}</b>.`,
      texto: bien ? "Ahí está, iluminada." : "Es la que está iluminada ahora.",
    });
  };
  const alTocar = (ev) => cerrar(ev.detail);
  vista.addEventListener("parte", alTocar);
  zona.querySelector("[data-rendirse]").onclick = () => cerrar(null);
}
