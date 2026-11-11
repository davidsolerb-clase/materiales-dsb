// Anatomía del ordenador.
//
//   datos.js       las piezas y sus partes (nombres y textos)
//   modelos/       los modelos 3D, hechos con código
//   visor.js       el visor 3D
//   escenario.js   la caja donde se ve una pieza
//   progreso.js    lo que se guarda en el navegador
//   partida.js     lo común a las actividades de preguntas
//   reto.js        actividad «¿Qué pieza es?»
//   dentro.js      actividad «Por dentro»
//
// Para añadir una actividad: crea un módulo como reto.js y añádelo a ACTIVIDADES.
// Aparece sola en el inicio y en la dirección #/jugar/<id>/<nivel>.

import { PIEZAS, pieza } from "./datos.js";
import { Visor } from "./visor.js";
import { escenario, ponerPieza } from "./escenario.js";
import { progreso, marcarVista, borrarProgreso, estrellas } from "./progreso.js";
import { reto } from "./reto.js";
import { dentro } from "./dentro.js";

const ACTIVIDADES = [reto, dentro];

const app = document.getElementById("app");
const visor = new Visor();
const ctx = { visor, ir, pintaEstrellas };
let alSalir = null;

function ir(ruta) {
  if (location.hash === `#${ruta}`) navegar();
  else location.hash = ruta;
}

function navegar() {
  // Un ancla normal (#actividades) no cambia de pantalla.
  if (alSalir && location.hash && !location.hash.startsWith("#/")) return;
  alSalir?.();
  alSalir = null;
  const [, seccion, a, b] = location.hash.replace(/^#/, "").split("/");
  app.className = "";
  const act = seccion === "jugar" && ACTIVIDADES.find((x) => x.id === a);
  if (seccion === "atlas") alSalir = atlas(pieza(a) || PIEZAS[0], b === "dentro");
  else if (act && act.necesita3d && !visor.ok) alSalir = sin3d(act);
  else if (act) alSalir = act.montar(app, ctx, act.niveles.find((n) => n.id === b) || act.niveles[0]);
  else alSalir = inicio();
  window.scrollTo(0, 0);
  app.querySelector("h1")?.focus({ preventScroll: true });
}

function pintaEstrellas(n) {
  return `<span class="estrellas" role="img" aria-label="${n} de 3 estrellas">${"★".repeat(n)}<i>${"★".repeat(3 - n)}</i></span>`;
}

// ---------------------------------------------------------------- Inicio

function inicio() {
  app.className = "p-inicio";
  const vistas = PIEZAS.filter((p) => progreso.vistas.includes(p.id)).length;

  app.innerHTML = `
    <header class="cabecera">
      <span class="marca"><i></i>Anatomía del ordenador</span>
      <span class="curso">1.º ESO</span>
    </header>

    <section class="portada">
      <div class="portada-texto">
        <h1 tabindex="-1">Mira un ordenador <em>por dentro</em></h1>
        <p class="entrada">Gira cada pieza en 3D, ábrela para ver qué lleva dentro y después ponte a prueba.</p>
        <div class="fila">
          <a class="boton principal" href="#/atlas/${PIEZAS[0].id}">Explorar las piezas</a>
          <a class="boton" href="#actividades">Ir a los retos</a>
        </div>
      </div>
      <div class="portada-3d">
        <p class="rotulo" aria-live="off"></p>
      </div>
    </section>

    <section class="bloque">
      <div class="bloque-cabeza">
        <h2><span class="paso">1</span>Explora</h2>
        <p>${vistas ? `Has visto <b>${vistas} de ${PIEZAS.length}</b> piezas.` : `${PIEZAS.length} piezas. Toca una para verla de cerca y abrirla.`}</p>
      </div>
      <ul class="piezas">
        ${PIEZAS.map(
          (p) => `<li><a class="ficha ${progreso.vistas.includes(p.id) ? "vista" : ""}" href="#/atlas/${p.id}" style="--tono:${p.color}">
            <img src="${p.foto}" alt="" loading="lazy"><span>${p.nombre}</span></a></li>`,
        ).join("")}
      </ul>
    </section>

    <div id="actividades">
    ${ACTIVIDADES.map(
      (act, i) => `
      <section class="bloque">
        <div class="bloque-cabeza">
          <h2><span class="paso">${i + 2}</span>${act.titulo}</h2>
          <p>${act.descripcion}</p>
        </div>
        <div class="niveles">
          ${act.niveles
            .map((n, k) => {
              const r = progreso.retos[`${act.id}-${n.id}`];
              return `<article class="nivel dificultad-${k + 1}">
                <p class="nivel-etiqueta">${n.etiqueta}</p>
                <h3>${n.nombre}</h3>
                <p>${n.texto}</p>
                <div class="nivel-pie">
                  <a class="boton ${r ? "" : "principal"}" href="#/jugar/${act.id}/${n.id}">${r ? "Jugar otra vez" : "Jugar"}</a>
                  ${r ? `<span class="marca-nivel">${pintaEstrellas(estrellas(r.mejor, r.total))} Mejor: ${r.mejor}/${r.total}</span>` : ""}
                </div>
              </article>`;
            })
            .join("")}
        </div>
      </section>`,
    ).join("")}
    </div>

    <footer class="pie">
      <span>Tu progreso se guarda solo en este navegador.</span>
      <span class="pie-botones">
        <button class="enlace" data-borrar>Borrar mi progreso</button>
        <button class="enlace" data-creditos>Créditos</button>
      </span>
    </footer>`;

  // Carrusel de piezas en la portada. Se para un rato si alguien gira la pieza.
  const caja = app.querySelector(".portada-3d");
  const rotulo = caja.querySelector(".rotulo");
  const esc = escenario({ pista: false });
  caja.prepend(esc);
  let turno = 0;
  let reloj;
  const siguiente = () => {
    const p = PIEZAS[turno % PIEZAS.length];
    turno++;
    rotulo.textContent = p.nombre;
    rotulo.style.setProperty("--tono", p.color);
    ponerPieza(esc, visor, { ...p, zoom: 1.15 });
    reloj = setTimeout(siguiente, 5200);
  };
  siguiente();
  esc.addEventListener("tocado", () => {
    clearTimeout(reloj);
    reloj = setTimeout(siguiente, 14000);
  });

  app.querySelector("[data-creditos]").onclick = creditos;
  const borrar = app.querySelector("[data-borrar]");
  borrar.onclick = () => {
    if (borrar.dataset.seguro) {
      borrarProgreso();
      navegar();
    } else {
      borrar.dataset.seguro = "1";
      borrar.textContent = "¿Seguro? Pulsa otra vez para borrar";
    }
  };

  return () => {
    clearTimeout(reloj);
    visor.vaciar();
  };
}

// ---------------------------------------------------------------- Atlas

function atlas(p, porDentro) {
  app.className = "p-atlas";
  const i = PIEZAS.indexOf(p);
  const antes = PIEZAS[(i + PIEZAS.length - 1) % PIEZAS.length];
  const despues = PIEZAS[(i + 1) % PIEZAS.length];
  const cola = porDentro ? "/dentro" : "";
  marcarVista(p.id);

  app.innerHTML = `
    <header class="cabecera">
      <a class="volver" href="#/">← Inicio</a>
      <span class="marca"><i></i>Atlas de piezas</span>
    </header>
    <div class="atlas" style="--tono:${p.color}">
      <div class="atlas-3d"></div>
      <article class="atlas-ficha">
        <p class="cuenta">${String(i + 1).padStart(2, "0")} <span>/ ${String(PIEZAS.length).padStart(2, "0")}</span></p>
        <h1 tabindex="-1">${p.nombre}</h1>
        <div class="pestanas" role="tablist">
          <a role="tab" aria-selected="${!porDentro}" href="#/atlas/${p.id}">Qué es</a>
          <a role="tab" aria-selected="${porDentro}" href="#/atlas/${p.id}/dentro">Por dentro</a>
        </div>
        ${
          porDentro
            ? `<p class="ayuda">${visor.ok ? "Toca una parte, aquí o en el modelo." : "Toca una parte para leer qué hace."}</p>
               <ol class="partes">${p.partes
                 .map((x, k) => `<li><button data-parte="${x.id}" aria-expanded="false"><i>${k + 1}</i><b>${x.nombre}</b></button><p hidden>${x.def}</p></li>`)
                 .join("")}</ol>`
            : `<h2>¿Para qué sirve?</h2>
               <p class="definicion">${p.def}</p>
               <h2>Para recordarlo</h2>
               <p>${p.pista}</p>
               <h2>¿Dónde va?</h2>
               <p>${p.sitio}</p>
               <a class="boton abrir-pieza" href="#/atlas/${p.id}/dentro">Ábrela: mira qué lleva dentro →</a>`
        }
        <div class="fila atlas-nav">
          <a class="boton" href="#/atlas/${antes.id}${cola}" aria-label="Pieza anterior: ${antes.nombre}">← Anterior</a>
          <a class="boton principal" href="#/atlas/${despues.id}${cola}" aria-label="Pieza siguiente: ${despues.nombre}">Siguiente →</a>
        </div>
      </article>
    </div>
    <nav class="tira" aria-label="Todas las piezas">
      ${PIEZAS.map(
        (x) => `<a class="ficha ${x === p ? "actual" : ""}" href="#/atlas/${x.id}${cola}" style="--tono:${x.color}" ${x === p ? 'aria-current="true"' : ""}>
          <img src="${x.foto}" alt=""><span>${x.nombre}</span></a>`,
      ).join("")}
    </nav>`;

  const esc = escenario({ abrible: true });
  app.querySelector(".atlas-3d").append(esc);
  ponerPieza(esc, visor, p, { abierta: porDentro ? 1 : 0 });
  app.querySelector(".tira .actual").scrollIntoView({ block: "nearest", inline: "center" });

  if (porDentro) {
    const chapas = p.partes.map((x, k) => [x.id, String(k + 1)]);
    visor.marcar?.(chapas);
    const elegir = (id) => {
      for (const b of app.querySelectorAll("[data-parte]")) {
        const esta = b.dataset.parte === id && b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", esta);
        b.nextElementSibling.hidden = !esta;
        if (esta) {
          visor.resaltar?.(id);
          b.scrollIntoView({ block: "nearest" });
        }
      }
      if (!app.querySelector('[aria-expanded="true"]')) visor.resaltar?.(null);
    };
    app.querySelector(".partes").onclick = (ev) => {
      const b = ev.target.closest("[data-parte]");
      if (!b) return;
      if (b.getAttribute("aria-expanded") !== "true") esc.abrir(1);
      elegir(b.dataset.parte);
    };
    esc.addEventListener("parte", (ev) => {
      if (app.querySelector(`[data-parte="${ev.detail}"]`)?.getAttribute("aria-expanded") !== "true") elegir(ev.detail);
    });
  }

  const teclas = (e) => {
    if (e.target.matches("input")) return;
    if (e.key === "ArrowRight") ir(`/atlas/${despues.id}${cola}`);
    if (e.key === "ArrowLeft") ir(`/atlas/${antes.id}${cola}`);
  };
  document.addEventListener("keydown", teclas);
  return () => {
    document.removeEventListener("keydown", teclas);
    visor.vaciar();
  };
}

// ---------------------------------------------------------------- Avisos

function sin3d(act) {
  app.innerHTML = `
    <header class="cabecera"><a class="volver" href="#/">← Inicio</a></header>
    <div class="resultado">
      <h1 tabindex="-1">${act.titulo}</h1>
      <p class="entrada">Este reto necesita 3D y este navegador no lo puede mostrar. Prueba con otro navegador o con otro dispositivo.</p>
      <a class="boton principal" href="#/">Volver al inicio</a>
    </div>`;
  return () => {};
}

function creditos() {
  const d = document.getElementById("creditos");
  d.innerHTML = `
    <h2 id="creditos-titulo">Créditos</h2>
    <p>Material de David Soler, hecho con ayuda de IA. Los modelos 3D son propios: están dibujados con código para este material.</p>
    <p>La idea de un atlas 3D de piezas viene de
      <a href="https://github.com/brickshow/pc-anatomy" target="_blank" rel="noopener">PC Anatomy</a>.</p>
    <p>Visor: <a href="https://threejs.org" target="_blank" rel="noopener">Three.js</a> (MIT).
      Tipografías: Bricolage Grotesque y Outfit (SIL OFL).</p>
    <form method="dialog"><button class="boton principal">Cerrar</button></form>`;
  d.showModal();
}

addEventListener("hashchange", navegar);
document.fonts.load('700 20px "Outfit"').catch(() => {}).finally(navegar); // los rótulos de los modelos usan esta letra
