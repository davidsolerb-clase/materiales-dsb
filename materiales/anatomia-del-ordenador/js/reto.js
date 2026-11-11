// Actividad «¿Qué pieza es?», en dos niveles.
//
//   Nivel 1: se ve la pieza y se elige su nombre.
//   Nivel 2: no aparece ningún nombre. Se alternan dos preguntas:
//            pieza → para qué sirve, y definición → qué pieza es.

import { PIEZAS, pieza, barajar } from "./datos.js";
import { escenario, ponerPieza } from "./escenario.js";
import { anotarIntento, estrellas } from "./progreso.js";

const LETRAS = ["A", "B", "C", "D"];

export const reto = {
  id: "reto",
  titulo: "Reto: ¿qué pieza es?",
  descripcion: "Una pregunta por cada pieza. Elige nivel.",
  niveles: [
    { id: "1", etiqueta: "Nivel 1", nombre: "Ponle nombre", texto: "Ves la pieza en 3D y eliges cómo se llama." },
    { id: "2", etiqueta: "Nivel 2", nombre: "Sin nombres", texto: "Solo piezas y definiciones. Tienes que saber para qué sirve cada una." },
  ],
  montar,
};

function crearPreguntas(nivel) {
  return barajar(PIEZAS).map((p, i) => {
    const tipo = nivel.id === "1" ? "nombre" : i % 2 ? "busca" : "funcion";
    // En el nivel 2 las trampas son las piezas que más se le parecen.
    const resto = barajar(PIEZAS.filter((x) => x !== p));
    const trampas = nivel.id === "1" ? resto : [...p.parecidas.map(pieza), ...resto.filter((x) => !p.parecidas.includes(x.id))];
    return { pieza: p, tipo, opciones: barajar([p, ...trampas.slice(0, 3)]) };
  });
}

const ENUNCIADO = {
  nombre: "¿Qué pieza es?",
  funcion: "¿Para qué sirve esta pieza?",
  busca: "¿Qué pieza hace esto?",
};

function montar(app, ctx, nivel) {
  const preguntas = crearPreguntas(nivel);
  const fallos = [];
  let n = 0;
  let respondida = false;

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
  const esc = escenario();

  const salir = app.querySelector("[data-salir]");
  salir.onclick = () => {
    if (salir.dataset.seguro) ctx.ir("/");
    else {
      salir.dataset.seguro = "1";
      salir.textContent = "¿Salir? Pulsa otra vez";
      setTimeout(() => {
        delete salir.dataset.seguro;
        salir.textContent = "✕ Salir";
      }, 3000);
    }
  };

  function pregunta() {
    const q = preguntas[n];
    respondida = false;
    puntos.forEach((li, i) => li.classList.toggle("ahora", i === n));
    zona.className = `reto tipo-${q.tipo}`;
    zona.style.setProperty("--tono", q.pieza.color);

    const opcion = (o, i) => {
      const dentro =
        q.tipo === "nombre" ? `<span>${o.nombre}</span>`
        : q.tipo === "funcion" ? `<span>${o.def}</span>`
        : `<img src="${o.foto}" alt="Pieza ${LETRAS[i]}">`;
      return `<button class="opcion" data-id="${o.id}"><kbd>${LETRAS[i]}</kbd>${dentro}</button>`;
    };

    zona.innerHTML = `
      <div class="reto-vista"></div>
      <div class="reto-panel">
        <p class="cuenta">Pregunta ${n + 1} <span>de ${preguntas.length}</span></p>
        <h1 tabindex="-1">${ENUNCIADO[q.tipo]}</h1>
        ${q.tipo === "busca" ? `<p class="definicion grande">${q.pieza.def}</p>` : ""}
        <div class="opciones">${q.opciones.map(opcion).join("")}</div>
        <div class="respuesta" aria-live="polite"></div>
      </div>`;

    if (q.tipo === "busca") ctx.visor.vaciar();
    else {
      zona.querySelector(".reto-vista").append(esc);
      ponerPieza(esc, ctx.visor, q.pieza, { anonima: true });
    }
    const sig = preguntas[n + 1];
    if (sig && sig.tipo !== "busca") ctx.visor.precargar(sig.pieza);
    window.scrollTo(0, 0);
  }

  function responder(id) {
    if (respondida) return;
    respondida = true;
    const q = preguntas[n];
    const bien = id === q.pieza.id;
    if (!bien) fallos.push(q.pieza);
    puntos[n].classList.add(bien ? "bien" : "mal");

    for (const b of zona.querySelectorAll(".opcion")) {
      b.disabled = true;
      if (b.dataset.id === q.pieza.id) b.classList.add("correcta");
      else if (b.dataset.id === id) b.classList.add("fallada");
      // En las fotos, al responder se descubre qué es cada una.
      if (q.tipo === "busca") b.insertAdjacentHTML("beforeend", `<span>${pieza(b.dataset.id).nombre}</span>`);
    }
    const ultima = n === preguntas.length - 1;
    zona.querySelector(".respuesta").innerHTML = `
      <div class="veredicto ${bien ? "bien" : "mal"}">
        <p class="titular">${bien ? "¡Correcto!" : "No es esa."} Es ${articulo(q.pieza)} <b>${q.pieza.nombre.toLowerCase().replace("ram", "RAM").replace("ssd", "SSD")}</b>.</p>
        <p>${q.tipo === "nombre" || !bien ? q.pieza.def + " " : ""}${q.pieza.pista}</p>
        <button class="boton principal" data-seguir>${ultima ? "Ver resultado" : "Siguiente"} →</button>
      </div>`;
    const seguir = zona.querySelector("[data-seguir]");
    seguir.focus({ preventScroll: true });
    seguir.closest(".veredicto").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function final() {
    const total = preguntas.length;
    const aciertos = total - fallos.length;
    const e = estrellas(aciertos, total);
    anotarIntento(`${reto.id}-${nivel.id}`, aciertos, total);
    ctx.visor.vaciar();
    puntos.forEach((li) => li.classList.remove("ahora"));
    const otro = reto.niveles.find((x) => x !== nivel);
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
          <a class="boton ${e === 3 ? "principal" : ""}" href="#/jugar/${reto.id}/${otro.id}">Probar el ${otro.etiqueta.toLowerCase()}</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>
      ${
        fallos.length
          ? `<section class="repaso">
              <h2>Para repasar</h2>
              <ul>${fallos
                .map(
                  (p) => `<li style="--tono:${p.color}"><img src="${p.foto}" alt="">
                    <div><b>${p.nombre}</b><p>${p.def}</p><a href="#/atlas/${p.id}">Verla en el atlas →</a></div></li>`,
                )
                .join("")}</ul>
            </section>`
          : ""
      }`;
    zona.querySelector("h1").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  zona.addEventListener("click", (ev) => {
    const op = ev.target.closest(".opcion");
    if (op) return responder(op.dataset.id);
    if (ev.target.closest("[data-seguir]")) {
      n++;
      if (n < preguntas.length) pregunta();
      else final();
    }
    if (ev.target.closest("[data-otra]")) ctx.ir(`/jugar/${reto.id}/${nivel.id}`);
  });

  // Atajos: A-D o 1-4 para elegir.
  const teclas = (ev) => {
    if (respondida || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const i = LETRAS.indexOf(ev.key.toUpperCase());
    const j = i >= 0 ? i : ["1", "2", "3", "4"].indexOf(ev.key);
    const b = zona.querySelectorAll(".opcion")[j];
    if (b) responder(b.dataset.id);
  };
  document.addEventListener("keydown", teclas);

  pregunta();
  return () => {
    document.removeEventListener("keydown", teclas);
    ctx.visor.vaciar();
  };
}

const articulo = (p) => (p.nombre.startsWith("Disco") || p.nombre.startsWith("Procesador") || p.nombre.startsWith("Disipador") ? "el" : "la");
