// Lo que comparten todas las actividades de preguntas: cabecera, marcador,
// corrección, pantalla final y guardado del resultado.
//
// Cada pregunta es un objeto con:
//   plantea(zona, corrige)  pinta la pregunta. `zona` debe incluir un
//                           <div class="respuesta" aria-live="polite"></div>.
//                           Al responder, llama a corrige(bien, { titular, texto }).
//   repaso                  { foto, titulo, texto, enlace } para la lista final
//   tono                    color de la pregunta

import { anotarIntento, estrellas } from "./progreso.js";

export function partida(app, ctx, { actividad, nivel, preguntas }) {
  const fallos = [];
  let n = 0;

  app.className = "p-reto";
  app.innerHTML = `
    <header class="cabecera">
      <button class="volver" data-salir>✕ Salir</button>
      <span class="marca"><i></i>${nivel.etiqueta} · ${nivel.nombre}</span>
      <ol class="puntos" aria-label="Preguntas">${preguntas.map(() => "<li></li>").join("")}</ol>
    </header>
    <div class="reto"></div>`;
  const zona = app.querySelector(".reto");
  const puntos = [...app.querySelectorAll(".puntos li")];

  const salir = app.querySelector("[data-salir]");
  salir.onclick = () => {
    if (salir.dataset.seguro) return ctx.ir("/");
    salir.dataset.seguro = "1";
    salir.textContent = "¿Salir? Pulsa otra vez";
    setTimeout(() => {
      delete salir.dataset.seguro;
      salir.textContent = "✕ Salir";
    }, 3000);
  };

  function pregunta() {
    const q = preguntas[n];
    let corregida = false;
    puntos.forEach((li, i) => li.classList.toggle("ahora", i === n));
    zona.className = "reto";
    zona.style.setProperty("--tono", q.tono);
    zona.dataset.numero = `Pregunta ${n + 1} <span>de ${preguntas.length}</span>`;
    q.plantea(zona, (bien, { titular, texto }) => {
      if (corregida) return;
      corregida = true;
      if (!bien) fallos.push(q.repaso);
      puntos[n].classList.add(bien ? "bien" : "mal");
      const ultima = n === preguntas.length - 1;
      zona.querySelector(".respuesta").innerHTML = `
        <div class="veredicto ${bien ? "bien" : "mal"}">
          <p class="titular">${titular}</p>
          <p>${texto}</p>
          <button class="boton principal" data-seguir>${ultima ? "Ver resultado" : "Siguiente"} →</button>
        </div>`;
      const seguir = zona.querySelector("[data-seguir]");
      seguir.focus({ preventScroll: true });
      seguir.closest(".veredicto").scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    window.scrollTo(0, 0);
  }

  function final() {
    const total = preguntas.length;
    const aciertos = total - fallos.length;
    const e = estrellas(aciertos, total);
    anotarIntento(`${actividad.id}-${nivel.id}`, aciertos, total);
    ctx.visor.vaciar();
    puntos.forEach((li) => li.classList.remove("ahora"));
    const i = actividad.niveles.indexOf(nivel);
    const otro = actividad.niveles[i + 1] || actividad.niveles[i - 1];
    const frase =
      e === 3 ? "¡Pleno! Te las sabes todas."
      : e === 2 ? "Muy bien. Te falta muy poco para el pleno."
      : e === 1 ? "Vas por buen camino. Repasa las que has fallado y vuelve a intentarlo."
      : "Toca repasar. Mira las piezas en el atlas y vuelve a intentarlo.";

    zona.className = "reto final";
    zona.innerHTML = `
      <div class="resultado">
        <p class="cuenta">${nivel.etiqueta} · ${nivel.nombre}</p>
        <h1 tabindex="-1"><span class="nota">${aciertos}<small>/${total}</small></span></h1>
        <p class="grandes">${ctx.pintaEstrellas(e)}</p>
        <p class="entrada">${frase}</p>
        <div class="fila">
          <button class="boton ${e === 3 ? "" : "principal"}" data-otra>Repetir</button>
          <a class="boton ${e === 3 ? "principal" : ""}" href="#/jugar/${actividad.id}/${otro.id}">Probar el ${otro.etiqueta.toLowerCase()}</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>
      ${
        fallos.length
          ? `<section class="repaso">
              <h2>Para repasar</h2>
              <ul>${fallos
                .map((r) => `<li><img src="${r.foto}" alt=""><div><b>${r.titulo}</b><p>${r.texto}</p><a href="${r.enlace}">Verla en el atlas →</a></div></li>`)
                .join("")}</ul>
            </section>`
          : ""
      }`;
    zona.querySelector("h1").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  const pulsar = (ev) => {
    if (ev.target.closest("[data-seguir]")) {
      n++;
      if (n < preguntas.length) pregunta();
      else final();
    }
    if (ev.target.closest("[data-otra]")) ctx.ir(`/jugar/${actividad.id}/${nivel.id}`);
  };
  zona.addEventListener("click", pulsar);

  pregunta();
  return () => ctx.visor.vaciar();
}

// Botones A, B, C, D. Devuelve el HTML; `elegir` engancha clics y teclado.
const LETRAS = ["A", "B", "C", "D"];
export const botonOpcion = (id, dentro, i) => `<button class="opcion" data-id="${id}"><kbd>${LETRAS[i]}</kbd>${dentro}</button>`;

export function elegir(zona, alElegir) {
  let hecho = false;
  const responde = (id) => {
    if (hecho) return;
    hecho = true;
    document.removeEventListener("keydown", teclas);
    alElegir(id);
  };
  const teclas = (ev) => {
    if (!zona.isConnected) return document.removeEventListener("keydown", teclas);
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.target.matches?.("input")) return;
    const i = LETRAS.indexOf(ev.key.toUpperCase());
    const b = zona.querySelectorAll(".opcion")[i >= 0 ? i : ["1", "2", "3", "4"].indexOf(ev.key)];
    if (b) responde(b.dataset.id);
  };
  document.addEventListener("keydown", teclas);
  zona.querySelector(".opciones").addEventListener("click", (ev) => {
    const b = ev.target.closest(".opcion");
    if (b) responde(b.dataset.id);
  });
}

// Marca la opción buena y, si hace falta, la fallada.
export function marcarOpciones(zona, buena, elegida) {
  for (const b of zona.querySelectorAll(".opcion")) {
    b.disabled = true;
    if (b.dataset.id === buena) b.classList.add("correcta");
    else if (b.dataset.id === elegida) b.classList.add("fallada");
  }
}
