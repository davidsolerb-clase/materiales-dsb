// Actividad «Enciéndelo»: qué pasa si al ordenador le falta algo.
//
//   Nivel 1  Experimenta: quitas lo que quieras, enciendes y miras. El reto
//            es descubrir todas las averías distintas.
//   Nivel 2  Predice: el taller quita algo y hay que acertar qué pasará.
//   Nivel 3  El viaje de un dato: por qué piezas pasa la información, en orden.

import { barajar } from "../datos.js";
import { anotarIntento } from "../progreso.js";
import { botonOpcion, elegir, marcarOpciones } from "../partida.js";
import { THREE } from "../modelos/kit.js";
import { Puesto, listaElementos, pantallaPuesto, sin3d } from "./puesto.js";
import { ELEMENTOS, SINTOMAS, AVERIAS_POSIBLES, elemento, diagnostico } from "./sistema.js";

const CLAVE = "anatomia-enciende-v1";
const QUITABLES = ELEMENTOS.filter((x) => !x.fija);
// Lo que quita el taller en el nivel 2. Salen ocho, al azar.
const RONDAS = [["c8"], ["ram1", "ram2"], ["monitor"], ["cpufan"], ["ssd-datos"], ["teclado"], ["interruptor"], ["disco"], ["grafica"], ["ram1"], ["panel"], ["red"], ["cpcie"], ["ssd-corriente"], ["corriente"], ["c24"], ["orden"]];

export const enciende = {
  id: "enciende",
  titulo: "Enciéndelo",
  tipo: "Taller",
  descripcion: "¿Qué pasa si falta una pieza o un cable? Quítalo, enciende y mira.",
  foto: "miniaturas/taller-enciende.webp",
  necesita3d: true,
  niveles: [
    { id: "1", etiqueta: "Nivel 1", nombre: "Experimenta", texto: "Quita lo que quieras y enciende. Hay ocho averías distintas: descúbrelas todas." },
    { id: "2", etiqueta: "Nivel 2", nombre: "Predice", texto: "El taller quita algo y tú dices qué va a pasar antes de encender." },
    { id: "3", etiqueta: "Nivel 3", nombre: "El viaje de un dato", texto: "Pulsas una tecla, abres un juego, guardas una foto. ¿Por qué piezas pasa?" },
  ],
  montar: (app, ctx, nivel) => ({ 1: experimenta, 2: predice, 3: viaje })[nivel.id](app, ctx, nivel),
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
      boton: (x) => `<span>${x.nombre}</span><small>${e[x.id] !== "bien" ? (x.id === "interruptor" ? "Apagado" : x.id === "orden" ? "Cambiado" : x.grupo === "Piezas" ? "Quitada" : "Desenchufado") : ""}</small>`,
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

// ---------------------------------------------------------------- Nivel 3

// Cada viaje es una lista de paradas con lo que pasa en cada una.
const PARADAS = { teclado: "Teclado", raton: "Ratón", placa: "Placa base", cpu: "Procesador", ram: "Memoria RAM", grafica: "Tarjeta gráfica", monitor: "Monitor", ssd: "Disco SSD", disco: "Disco duro" };
const VIAJES = [
  {
    titulo: "Pulsas una tecla",
    texto: "Estás escribiendo un trabajo y pulsas la «A». ¿Por dónde pasa hasta que la ves en la pantalla?",
    camino: [
      ["teclado", "El teclado avisa de qué tecla has pulsado."],
      ["placa", "El aviso entra por el puerto USB y la placa base lo lleva hasta el procesador."],
      ["cpu", "El procesador decide qué significa: hay que escribir una «A»."],
      ["ram", "El trabajo que tienes abierto está en la memoria RAM. Ahí se añade la letra."],
      ["grafica", "La tarjeta gráfica dibuja la letra."],
      ["monitor", "Y el monitor te la enseña. Todo, en menos de lo que tardas en parpadear."],
    ],
  },
  {
    titulo: "Abres un juego",
    texto: "Haces doble clic en tu juego favorito. ¿Qué camino sigue hasta que aparece en la pantalla?",
    camino: [
      ["ssd", "El juego está guardado en el SSD."],
      ["placa", "Sale por el cable de datos y la placa base lo reparte."],
      ["ram", "Se copia a la memoria RAM, que es mucho más rápida que cualquier disco."],
      ["cpu", "El procesador hace los cálculos: dónde está cada personaje, qué pasa si saltas…"],
      ["grafica", "La tarjeta gráfica convierte esos cálculos en imágenes."],
      ["monitor", "El monitor las enseña, muchas veces cada segundo."],
    ],
  },
  {
    titulo: "Guardas una foto",
    texto: "Has retocado una foto y pulsas «Guardar» con el ratón. ¿A dónde va?",
    camino: [
      ["raton", "Haces clic en «Guardar»."],
      ["placa", "La placa base lleva el clic hasta el procesador."],
      ["cpu", "El procesador da la orden: hay que guardar la foto."],
      ["ram", "La foto retocada está en la memoria RAM. Si se fuera la luz ahora, se perdería."],
      ["disco", "Se copia al disco duro. Ahí se queda aunque apagues el ordenador."],
    ],
  },
];

function viaje(app, ctx, nivel) {
  const partes = conPuesto(app, `Enciéndelo · ${nivel.nombre}`);
  if (!partes) return sin3d(app, enciende.titulo);
  const { puesto, lista, ficha } = partes;
  const { b, m } = puesto;

  // Cada parada se ilumina en el modelo.
  const z = m.piezas, per = m.perifericos;
  const cosas = { teclado: [per.teclado], raton: [per.raton], monitor: [per.monitor], placa: [m.placa.children[0]], cpu: [z.disipador], ram: [z.ram1, z.ram2], grafica: [z.grafica], ssd: [z.ssd], disco: [z.disco] };
  b.escena.updateMatrixWorld(true);
  for (const [id, objetos] of Object.entries(cosas)) {
    const caja = new THREE.Box3();
    for (const o of objetos) caja.expandByObject(o);
    b.diana(`parada-${id}`, { en: b.escena, pos: caja.getCenter(new THREE.Vector3()).toArray(), tam: caja.getSize(new THREE.Vector3()).toArray(), holgura: 0 });
  }
  b.alTocar = () => {};
  puesto.enciende();

  const total = VIAJES.reduce((n, v) => n + v.camino.length - 1, 0);
  let n = 0; // viaje
  let k = 1; // parada que se pregunta
  let aciertos = 0;
  let ultimo = null; // { bien, texto }

  function pinta() {
    const v = VIAJES[n];
    const hechas = v.camino.slice(0, k).map(([id]) => id);
    const marcas = Object.fromEntries(hechas.map((id, i) => [`parada-${id}`, i === k - 1 ? "guia" : "neutra"]));
    b.activa(Object.keys(marcas), marcas);
    lista.innerHTML = `<h2>Viajes</h2><div class="elementos">${VIAJES.map((x, i) => `<p class="elemento ${i < n ? "arreglado" : ""}" aria-current="${i === n}"><span>${x.titulo}</span><small>${i < n ? "Hecho" : ""}</small></p>`).join("")}</div>
      <h2>Aciertos</h2><p class="paso-cuenta">${aciertos} de ${total}</p>`;
    const fin = k >= v.camino.length;
    const opciones = fin ? [] : barajar([v.camino[k][0], ...barajar(Object.keys(PARADAS).filter((id) => id !== v.camino[k][0] && id !== v.camino[k - 1][0])).slice(0, 3)]);
    ficha.innerHTML = `
      <p class="cuenta">Viaje ${n + 1} <span>de ${VIAJES.length}</span></p>
      <h1 tabindex="-1">${v.titulo}</h1>
      <p class="paso-texto">${v.texto}</p>
      <ol class="camino">${hechas.map((id) => `<li>${PARADAS[id]}</li>`).join("")}${fin ? "" : "<li class='pendiente'>?</li>"}</ol>
      ${ultimo
        ? `<div class="veredicto ${ultimo.bien ? "bien" : "mal"}"><p class="titular">${ultimo.bien ? "¡Eso es!" : "No. Va por aquí:"} ${PARADAS[hechas[hechas.length - 1]]}</p><p>${ultimo.texto}</p></div>`
        : `<div class="veredicto consejo"><p class="titular">Sale de aquí: ${PARADAS[hechas[0]]}</p><p>${v.camino[0][1]}</p></div>`}
      ${fin
        ? `<button class="boton principal" data-seguir>${n === VIAJES.length - 1 ? "Ver resultado" : "Siguiente viaje"} →</button>`
        : `<p class="paso-ayuda">¿A dónde va ahora?</p><div class="opciones dos">${opciones.map((id, i) => botonOpcion(id, `<span>${PARADAS[id]}</span>`, i)).join("")}</div>`}`;
    if (!fin) {
      elegir(ficha, (id) => {
        const bien = id === v.camino[k][0];
        if (bien) aciertos++;
        ultimo = { bien, texto: v.camino[k][1] };
        k++;
        pinta();
      });
    }
  }

  function final() {
    b.activa([]);
    anotarIntento(`${enciende.id}-3`, aciertos, total);
    const e = aciertos === total ? 3 : aciertos >= total * 0.75 ? 2 : aciertos >= total * 0.5 ? 1 : 0;
    lista.innerHTML = "";
    ficha.innerHTML = `
      <div class="resultado">
        <p class="cuenta">${nivel.etiqueta} · ${nivel.nombre}</p>
        <h1 tabindex="-1"><span class="nota">${aciertos}<small>/${total}</small></span></h1>
        <p class="grandes">${ctx.pintaEstrellas(e)}</p>
        <p class="entrada">Casi todo pasa por el mismo sitio: llega a la placa base, el procesador decide con ayuda de la memoria RAM y el resultado sale hacia la pantalla o hacia un disco.</p>
        <div class="fila">
          <button class="boton" data-otra>Repetir</button>
          <a class="boton principal" href="#/jugar/repara/1">Ir a reparar</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>`;
  }

  const pulsa = (ev) => {
    if (ev.target.closest("[data-seguir]")) {
      n++;
      k = 1;
      ultimo = null;
      if (n < VIAJES.length) pinta();
      else final();
    }
    if (ev.target.closest("[data-otra]")) ctx.ir(`/jugar/${enciende.id}/3`);
  };
  app.addEventListener("click", pulsa);
  pinta();
  return () => {
    app.removeEventListener("click", pulsa);
    puesto.destruir();
  };
}
