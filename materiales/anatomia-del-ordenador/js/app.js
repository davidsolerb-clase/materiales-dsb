// Anatomía del ordenador.
//
//   datos.js       las piezas (nombres, textos, modelos)
//   visor.js       el visor 3D
//   escenario.js   la caja donde se ve una pieza
//   progreso.js    lo que se guarda en el navegador
//   reto.js        actividad «¿Qué pieza es?»
//
// Para añadir una actividad: crea un módulo como reto.js y añádelo a ACTIVIDADES.
// Aparece sola en el inicio y en la dirección #/jugar/<id>/<nivel>.

import { PIEZAS, pieza } from "./datos.js";
import { Visor } from "./visor.js";
import { escenario, ponerPieza } from "./escenario.js";
import { progreso, marcarVista, borrarProgreso, estrellas } from "./progreso.js";
import { reto } from "./reto.js";

const ACTIVIDADES = [reto];

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
  if (seccion === "atlas") alSalir = atlas(pieza(a) || PIEZAS[0]);
  else if (seccion === "jugar" && ACTIVIDADES.some((x) => x.id === a)) {
    const act = ACTIVIDADES.find((x) => x.id === a);
    const nivel = act.niveles.find((n) => n.id === b) || act.niveles[0];
    alSalir = act.montar(app, ctx, nivel);
  } else alSalir = inicio();
  window.scrollTo(0, 0);
  app.querySelector("h1")?.focus({ preventScroll: true });
}

export function pintaEstrellas(n) {
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
        <p class="entrada">Gira cada pieza en 3D, descubre para qué sirve y después ponte a prueba.</p>
        <div class="fila">
          <a class="boton principal" href="#/atlas/${PIEZAS[0].id}">Explorar las piezas</a>
          <a class="boton" href="#actividades">Ir al reto</a>
        </div>
      </div>
      <div class="portada-3d">
        <p class="rotulo" aria-live="off"></p>
      </div>
    </section>

    <section class="bloque">
      <div class="bloque-cabeza">
        <h2><span class="paso">1</span>Explora</h2>
        <p>${vistas ? `Has visto <b>${vistas} de ${PIEZAS.length}</b> piezas.` : `${PIEZAS.length} piezas. Toca una para verla de cerca.`}</p>
      </div>
      <ul class="piezas">
        ${PIEZAS.map(
          (p) => `<li><a class="ficha ${progreso.vistas.includes(p.id) ? "vista" : ""}" href="#/atlas/${p.id}" style="--tono:${p.color}">
            <img src="${p.foto}" alt="" loading="lazy"><span>${p.nombre}</span></a></li>`,
        ).join("")}
      </ul>
    </section>

    <section class="bloque" id="actividades">
      ${ACTIVIDADES.map(
        (act, i) => `
        <div class="bloque-cabeza">
          <h2><span class="paso">${i + 2}</span>${act.titulo}</h2>
          <p>${act.descripcion}</p>
        </div>
        <div class="niveles">
          ${act.niveles
            .map((n) => {
              const r = progreso.retos[`${act.id}-${n.id}`];
              return `<article class="nivel nivel-${n.id}">
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
        </div>`,
      ).join("")}
    </section>

    <footer class="pie">
      <span>Tu progreso se guarda solo en este navegador.</span>
      <span class="pie-botones">
        <button class="enlace" data-borrar>Borrar mi progreso</button>
        <button class="enlace" data-creditos>Créditos</button>
      </span>
    </footer>`;

  // Carrusel de piezas en la portada.
  const caja = app.querySelector(".portada-3d");
  const rotulo = caja.querySelector(".rotulo");
  const esc = escenario({ pista: false });
  caja.prepend(esc);
  let turno = 0;
  let reloj;
  let vivo = true;
  const siguiente = async () => {
    const p = PIEZAS[turno % PIEZAS.length];
    turno++;
    rotulo.textContent = p.nombre;
    rotulo.style.setProperty("--tono", p.color);
    await ponerPieza(esc, visor, { ...p, zoom: (p.zoom || 1) * 1.2 });
    if (!vivo) return;
    visor.precargar(PIEZAS[turno % PIEZAS.length]);
    reloj = setTimeout(siguiente, 5200);
  };
  siguiente();

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
    vivo = false;
    clearTimeout(reloj);
    visor.vaciar();
  };
}

// ---------------------------------------------------------------- Atlas

function atlas(p) {
  app.className = "p-atlas";
  const i = PIEZAS.indexOf(p);
  const antes = PIEZAS[(i + PIEZAS.length - 1) % PIEZAS.length];
  const despues = PIEZAS[(i + 1) % PIEZAS.length];
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
        <h2>¿Para qué sirve?</h2>
        <p class="definicion">${p.def}</p>
        <h2>Para recordarlo</h2>
        <p>${p.pista}</p>
        <h2>¿Dónde va?</h2>
        <p>${p.sitio}</p>
        <div class="fila atlas-nav">
          <a class="boton" href="#/atlas/${antes.id}" aria-label="Pieza anterior: ${antes.nombre}">← Anterior</a>
          <a class="boton principal" href="#/atlas/${despues.id}" aria-label="Pieza siguiente: ${despues.nombre}">Siguiente →</a>
        </div>
      </article>
    </div>
    <nav class="tira" aria-label="Todas las piezas">
      ${PIEZAS.map(
        (x) => `<a class="ficha ${x === p ? "actual" : ""}" href="#/atlas/${x.id}" style="--tono:${x.color}" ${x === p ? 'aria-current="true"' : ""}>
          <img src="${x.foto}" alt=""><span>${x.nombre}</span></a>`,
      ).join("")}
    </nav>`;

  const esc = escenario();
  app.querySelector(".atlas-3d").append(esc);
  ponerPieza(esc, visor, p).then(() => visor.precargar(despues));
  app.querySelector(".tira .actual").scrollIntoView({ block: "nearest", inline: "center" });

  const teclas = (e) => {
    if (e.key === "ArrowRight") ir(`/atlas/${despues.id}`);
    if (e.key === "ArrowLeft") ir(`/atlas/${antes.id}`);
  };
  document.addEventListener("keydown", teclas);
  return () => {
    document.removeEventListener("keydown", teclas);
    visor.vaciar();
  };
}

// ---------------------------------------------------------------- Créditos

function creditos() {
  const d = document.getElementById("creditos");
  d.innerHTML = `
    <h2 id="creditos-titulo">Créditos</h2>
    <p>Modelos 3D de Sketchfab, reunidos por el proyecto
      <a href="https://github.com/brickshow/pc-anatomy" target="_blank" rel="noopener">PC Anatomy</a>.</p>
    <ul>
      ${PIEZAS.map(
        (p) => `<li><b>${p.nombre}:</b> «<a href="${p.credito.url}" target="_blank" rel="noopener">${p.credito.obra}</a>», de ${p.credito.autor}.
          <a href="${p.credito.licencia.url}" target="_blank" rel="noopener">${p.credito.licencia.nombre}</a>.
          ${p.credito.cambios ? "Comprimido para la web." : "Sin cambios."}</li>`,
      ).join("")}
    </ul>
    <p>Visor: <a href="https://threejs.org" target="_blank" rel="noopener">Three.js</a> (MIT).
      Tipografías: Bricolage Grotesque y Outfit (SIL OFL).</p>
    <form method="dialog"><button class="boton principal">Cerrar</button></form>`;
  d.showModal();
}

addEventListener("hashchange", navegar);
navegar();
