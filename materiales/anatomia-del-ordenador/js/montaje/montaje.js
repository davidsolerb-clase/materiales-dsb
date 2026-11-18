// Actividad «Taller de montaje»: se monta un ordenador paso a paso.
//
//   Lo esencial    solo las piezas principales; lo demás lo hace el taller
//   Con guía       todos los pasos; el sitio de cada pieza se ilumina
//   Sin guía       se marcan todos los huecos posibles y hay que elegir
//   Por tu cuenta  sin pasos: el alumno decide el orden
//
// banco.js    el lienzo 3D, la cámara y los sitios que se pueden tocar
// caja.js     el modelo de la caja
// mundo.js    dónde va cada cosa y cómo se mueve
// pasos.js    el guion: piezas, pasos, textos y qué va antes de qué
//
// La partida se guarda en el navegador: si se cierra la pestaña, sigue donde estaba.

import { Banco } from "./banco.js";
import { Mundo, muestra, ACABADOS } from "./mundo.js";
import { BLOQUES, PIEZAS, PASOS, ZONAS, BLOQUE_DE_ZONA, FIGURAS, ESENCIALES, TRAS } from "./pasos.js";
import { anotarIntento } from "../progreso.js";

const CLAVE = "anatomia-montaje-v1-";
const NO_VA = "Ahí no va. Fíjate en la forma y en el tamaño del hueco.";
const APRENDIDO = [
  "El procesador solo encaja en una posición y necesita pasta térmica y disipador para no calentarse.",
  "La fuente da corriente a todo: a la placa, al procesador, a la gráfica y a los discos.",
  "Cada disco lleva dos cables: uno de corriente y otro de datos.",
  "Si hay tarjeta gráfica, el monitor se conecta a ella.",
  "Lo último que se enchufa es la corriente.",
  "Al encender, la BIOS comprueba las piezas y después busca el sistema operativo.",
];
const NOMBRES = {
  caja: { grafito: "Grafito", blanco: "Blanco", azul: "Azul", rojo: "Rojo" },
  luz: { lima: "Lima", azul: "Azul", rosa: "Rosa", naranja: "Naranja", apagadas: "Apagadas" },
  pegatina: { ninguna: "Ninguna", estrella: "Estrella", rayo: "Rayo", corazon: "Corazón", planeta: "Planeta" },
};

export const montaje = {
  id: "montaje",
  titulo: "Taller: monta el ordenador",
  descripcion: "Coge las piezas, ponlas en su sitio, conecta los cables y enciéndelo.",
  foto: "miniaturas/taller-montaje.webp",
  necesita3d: true,
  niveles: [
    { id: "0", etiqueta: "Nivel 1", nombre: "Lo esencial", texto: "Solo las piezas principales. Los tornillos y casi todos los cables los pone el taller." },
    { id: "1", etiqueta: "Nivel 2", nombre: "Con guía", texto: "Todos los pasos. El sitio de cada pieza se ilumina y se explica el porqué." },
    { id: "2", etiqueta: "Nivel 3", nombre: "Sin guía", texto: "Se marcan todos los huecos y eliges tú. Cada fallo y cada pista cuentan." },
    { id: "3", etiqueta: "Nivel 4", nombre: "Por tu cuenta", texto: "Sin pasos. Decides tú el orden y el taller te avisa si te adelantas." },
  ],
  montar,
};

function montar(app, ctx, nivel) {
  const facil = nivel.id === "0";
  const guiado = facil || nivel.id === "1";
  const libreM = nivel.id === "3"; // sin pasos
  let banco;
  try {
    banco = new Banco();
  } catch {
    app.innerHTML = `<header class="cabecera"><a class="volver" href="#/">← Inicio</a></header>
      <div class="resultado"><h1 tabindex="-1">${montaje.titulo}</h1><p class="entrada">Este navegador no puede mostrar el taller en 3D. Prueba con otro.</p></div>`;
    return () => {};
  }

  app.className = "p-taller";
  app.innerHTML = `
    <header class="cabecera">
      <button class="volver" data-salir>✕ Salir</button>
      <span class="marca"><i></i>Taller de montaje · ${nivel.nombre}</span>
      <span class="taller-marcador"><span data-fallos></span><button class="enlace" data-reiniciar>Empezar de cero</button></span>
    </header>
    <div class="taller ${libreM ? "libre" : ""}">
      <aside class="taller-bandeja" aria-label="Herramientas y piezas"></aside>
      <div class="taller-3d">
        <p class="gesto">Arrastra para girar · rueda o pellizco para acercar</p>
        <button class="boton taller-vista" data-vista>${libreM ? "Vista general" : "Vista del paso"}</button>
      </div>
      <aside class="taller-guia">
        <ol class="bloques"></ol>
        <article class="ficha-paso" aria-live="polite"></article>
      </aside>
    </div>`;
  const $ = (s) => app.querySelector(s);
  const bandeja = $(".taller-bandeja");
  const zona3d = $(".taller-3d");
  const tarjeta = $(".ficha-paso");
  banco.montar(zona3d);
  const m = new Mundo(banco);

  // Fotos de la bandeja.
  const fotos = { destornillador: banco.miniatura(muestra("destornillador"), [20, 25]) };
  for (const p of PIEZAS) fotos[p.id] = p.foto ? `miniaturas/${p.foto}.webp` : (fotos[`m-${p.muestra}`] ||= banco.miniatura(muestra(p.muestra)));

  let e;
  let aviso = null; // { tipo, titular, texto }
  let terminado = false;

  const nuevo = () => ({
    i: 0, parcial: {}, ocupadas: {}, usadas: {}, ram: [], mano: null, dest: false, fallos: 0, pistas: 0, pista: false, hist: [], pasosHechos: new Set(), t0: Date.now(),
    giro: facil ? { cpu: 0, ram: 0 } : { cpu: 1 + Math.floor(Math.random() * 3), ram: 1 },
  });
  const paso = () => (libreM ? null : PASOS[e.i]); // el paso en curso, cuando los hay
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE + nivel.id, JSON.stringify({ hist: e.hist, fallos: e.fallos, pistas: e.pistas, giro: e.giro, ms: Date.now() - e.t0 }));
    } catch {}
  };
  const borrar = () => {
    try {
      localStorage.removeItem(CLAVE + nivel.id);
    } catch {}
  };

  // ---------------------------------------------------------------- Reglas

  const hecho = (p) => e.pasosHechos.has(p.id);
  const zonasDe = (p) => (typeof p.zonas === "function" ? p.zonas(e) : p.zonas) || [];
  const libre = (id) => (e.ocupadas[id] || 0) < (ZONAS[id]?.cap ?? 1);
  const existe = (id) => !ZONAS[id]?.tras || e.pasosHechos.has(ZONAS[id].tras);
  const objetivos = (p) => (p.tipo === "tornillos" ? m.puntosTornillo[p.grupo].map((_, k) => `tornillo-${p.grupo}-${k}`) : p.objetivos || []);
  const pendientes = (p) => objetivos(p).filter((id) => !(e.parcial[p.id] || []).includes(id));
  const quedan = (pieza) => (pieza.cantidad || 1) - (e.usadas[pieza.id] || 0);
  const disponible = (p) => !hecho(p) && (TRAS[p.id] || []).every((id) => e.pasosHechos.has(id));
  const guiaDe = (p) => {
    const validas = zonasDe(p).filter(libre);
    const guia = (p.guia ? p.guia(e) : validas).filter((z) => validas.includes(z));
    return guia.length ? guia : validas;
  };
  // Lo que falta por hacer antes de un paso, explicado.
  const falta = (p) => {
    const antes = PASOS.find((x) => (TRAS[p.id] || []).includes(x.id) && !hecho(x));
    return `Todavía no. Antes hay que hacer esto: <b>${antes.titulo.toLowerCase()}</b>. ${antes.porque}`;
  };

  // Qué se puede tocar ahora y cómo se marca: [ids, marca] o [ids, { id: marca }].
  function dianas() {
    if (terminado) return [[], null];
    if (libreM) return dianasLibre();
    const p = paso();
    if (!p) return [[], null];
    const pista = guiado || e.pista;
    if (p.tipo === "pon") {
      if (e.mano !== p.pieza) return [[], null];
      if (pista) return [guiaDe(p), "guia"];
      const otras = Object.keys(ZONAS).filter((id) => BLOQUE_DE_ZONA(id, p.bloque) && existe(id) && libre(id));
      return [[...new Set([...zonasDe(p).filter(libre), ...Object.keys(p.trampas || {}), ...otras])], "neutra"];
    }
    if (p.tipo === "tornillos") return [pendientes(p), pista ? "guia" : e.dest ? "neutra" : null];
    if (p.tipo === "toca") return [pendientes(p), pista || p.marca ? "guia" : null];
    return [[], null];
  }

  // Sin pasos: con una pieza en la mano se marcan todos los huecos que existen.
  // Además se puede tocar cualquier cosa pendiente (palancas, tornillos, botones).
  function dianasLibre() {
    const marca = {};
    if (e.mano) for (const id of Object.keys(ZONAS)) if (existe(id) && libre(id)) marca[id] = "neutra";
    for (const p of PASOS) {
      if (hecho(p) || p.tipo === "pon" || p.tipo === "boton") continue;
      for (const o of pendientes(p)) {
        if (o in marca) continue;
        const punto = banco.dianas.get(o)?.tipo === "punto";
        marca[o] = p.tipo === "tornillos" ? (e.dest ? "neutra" : null) : (punto || p.marca) && disponible(p) ? "neutra" : null;
      }
    }
    const p = e.pista && PASOS.find((x) => x.id === e.pista);
    if (p && !hecho(p)) for (const id of p.tipo === "pon" ? guiaDe(p) : pendientes(p)) marca[id] = "guia";
    return [Object.keys(marca), marca];
  }

  // Hace el paso (o una parte, si tiene varios objetivos). Devuelve si ha quedado completo.
  function aplica(p, arg) {
    let espera;
    if (p.tipo === "pon") {
      espera = p.hecho(m, e, arg);
      e.ocupadas[arg] = (e.ocupadas[arg] || 0) + 1;
      e.usadas[p.pieza] = (e.usadas[p.pieza] || 0) + 1;
    } else if (p.tipo === "tornillos") {
      const k = +arg.split("-").pop();
      if (p.quitar) m.quitaTornillo(p.grupo, k);
      else m.atornilla(p.grupo, k);
      (e.parcial[p.id] ||= []).push(arg);
    } else if (p.tipo === "toca") {
      espera = p.hecho(m, e, arg);
      (e.parcial[p.id] ||= []).push(arg);
    } else espera = p.hecho(m, e);
    e.hist.push([PASOS.indexOf(p), arg ?? null]);
    const completo = p.tipo === "pon" || p.tipo === "boton" || !pendientes(p).length;
    if (completo) {
      e.pasosHechos.add(p.id);
      if (!libreM) e.i = PASOS.indexOf(p) + 1;
      e.mano = null;
      e.pista = false;
    }
    return { completo, espera };
  }

  // Hace un paso entero sin preguntar, con la opción recomendada.
  function solo(p) {
    if (p.tipo === "pon") {
      e.giro.cpu = e.giro.ram = 0;
      aplica(p, guiaDe(p)[0]);
    } else if (p.tipo === "boton") aplica(p, null);
    else for (const o of pendientes(p)) aplica(p, o);
  }

  // En «Lo esencial», el taller hace los pasos que no se le piden al alumno.
  function hazLoDemas() {
    const hechos = [];
    if (!facil) return hechos;
    banco.rapido = true;
    while (paso() && !ESENCIALES.has(paso().id)) {
      hechos.push(paso().titulo.toLowerCase());
      solo(paso());
    }
    banco.rapido = false;
    return hechos;
  }

  function fallo(texto) {
    e.fallos++;
    aviso = { tipo: "mal", titular: "Así no", texto };
    zona3d.classList.remove("tiembla");
    void zona3d.offsetWidth;
    zona3d.classList.add("tiembla");
    guardar();
    pinta();
  }

  function logrado(p, arg) {
    zona3d.classList.remove("tiembla");
    const { completo, espera } = aplica(p, arg);
    aviso = e.consejo ? { tipo: "consejo", titular: "Un consejo", texto: e.consejo } : null;
    e.consejo = null;
    if (!completo) return guardar(), pinta();
    const sigue = () => {
      const delTaller = hazLoDemas();
      guardar();
      if (e.pasosHechos.size >= PASOS.length) return final();
      if (delTaller.length) aviso = { tipo: "consejo", titular: "El taller ha hecho por ti", texto: `${delTaller.join(", ")}.` };
      else if (!libreM && paso().bloque !== p.bloque && !aviso) aviso = { tipo: "bien", titular: `Hecho: ${BLOQUES[p.bloque - 1].toLowerCase()}`, texto: `Ahora toca: ${BLOQUES[p.bloque].toLowerCase()}.` };
      pinta();
      if (!libreM) m.mira(paso().vista, p.vistaTras ? 1500 : 900);
    };
    guardar();
    if (p.vistaTras) m.mira(p.vistaTras, 1200);
    if (espera?.then) {
      pinta();
      banco.activa([]);
      espera.then(sigue);
    } else sigue();
  }

  const sinHerramienta = () => {
    aviso = { tipo: "consejo", titular: "Te falta la herramienta", texto: "Coge primero el destornillador: está arriba, en la bandeja." };
    pinta();
  };

  banco.alTocar = (id) => {
    if (!id || terminado) return;
    if (libreM) return tocaLibre(id);
    const p = paso();
    if (!p) return;
    if (p.tipo === "pon") {
      if (!zonasDe(p).filter(libre).includes(id)) return fallo(p.trampas?.[id] || NO_VA);
      const pega = !facil && p.comprueba?.(e, id);
      if (pega) return fallo(pega);
      return logrado(p, id);
    }
    if (p.tipo === "tornillos" && !e.dest) return sinHerramienta();
    logrado(p, id);
  };

  // Las dianas son cajas invisibles y a veces se tapan unas a otras (el panel
  // lateral, por ejemplo, cubre toda la caja). Si el toque atraviesa varias,
  // gana la que sirve ahora; después, un hueco para la pieza que hay en la mano.
  const sirve = (id) => {
    if (libreM) {
      if (e.mano && ZONAS[id]) return PASOS.some((p) => p.tipo === "pon" && p.pieza === e.mano && !hecho(p) && disponible(p) && zonasDe(p).filter(libre).includes(id));
      return PASOS.some((p) => !hecho(p) && (p.tipo === "toca" || p.tipo === "tornillos") && disponible(p) && pendientes(p).includes(id));
    }
    const p = paso();
    if (!p) return false;
    return p.tipo === "pon" ? zonasDe(p).filter(libre).includes(id) : pendientes(p).includes(id);
  };
  banco.prefiere = (ids) => {
    const orden = (id) => (sirve(id) ? 0 : e.mano && ZONAS[id] ? 1 : 2);
    return ids.reduce((a, b) => (orden(b) < orden(a) ? b : a));
  };

  function tocaLibre(id) {
    if (e.mano && ZONAS[id]) {
      const mios = PASOS.filter((p) => p.tipo === "pon" && p.pieza === e.mano && !hecho(p));
      const p = mios.find((x) => zonasDe(x).includes(id));
      if (!p) return fallo(mios[0] && !disponible(mios[0]) ? falta(mios[0]) : mios.map((x) => x.trampas?.[id]).find(Boolean) || NO_VA);
      if (!disponible(p)) return fallo(falta(p));
      const pega = p.comprueba?.(e, id);
      if (pega) return fallo(pega);
      return logrado(p, id);
    }
    const p = PASOS.find((x) => !hecho(x) && (x.tipo === "toca" || x.tipo === "tornillos") && pendientes(x).includes(id));
    if (!p) return;
    if (p.tipo === "tornillos" && !e.dest) return sinHerramienta();
    if (!disponible(p)) return fallo(falta(p));
    logrado(p, id);
  }

  function elige(id) {
    if (terminado) return;
    const p = paso();
    if (id === "destornillador") e.dest = !e.dest;
    else if (e.mano === id) e.mano = null;
    else if (libreM) {
      e.mano = id;
      if (aviso?.tipo !== "mal") aviso = null;
      const suyo = PASOS.find((x) => x.pieza === id && !hecho(x));
      if (suyo) m.mira(suyo.vista);
    } else if (p.tipo !== "pon" || p.pieza !== id) {
      aviso = { tipo: "consejo", titular: "Esa pieza va después", texto: `Ahora toca: ${p.titulo.toLowerCase()}.` };
      e.mano = null;
    } else {
      e.mano = id;
      if (aviso?.tipo !== "mal") aviso = null;
    }
    pinta();
  }

  // ---------------------------------------------------------------- Pantalla

  const pintaAviso = () => (aviso ? `<div class="veredicto ${aviso.tipo}"><p class="titular">${aviso.titular}</p><p>${aviso.texto}</p></div>` : "");
  const botonPieza = (x) => `<button class="pieza ${x.clase || ""}" data-pieza="${x.id}" aria-pressed="${e.mano === x.id}">
    <img src="${fotos[x.id]}" alt="" draggable="false"><span>${x.nombre}${quedan(x) > 1 ? `<small>× ${quedan(x)}</small>` : ""}</span></button>`;

  function pinta() {
    if (terminado) return;
    $("[data-fallos]").textContent = e.fallos ? `${e.fallos} ${e.fallos === 1 ? "fallo" : "fallos"}` : "";
    const herramientas = `
      <h2>Herramientas</h2>
      <button class="pieza herramienta" data-pieza="destornillador" aria-pressed="${e.dest}">
        <img src="${fotos.destornillador}" alt=""><span>Destornillador${e.dest ? "<small>En la mano</small>" : ""}</span></button>`;
    if (libreM) pintaLibre(herramientas);
    else pintaPaso(herramientas);
    banco.activa(...dianas());
  }

  function pintaPaso(herramientas) {
    const p = paso();
    if (!p) return;
    const delBloque = PASOS.filter((x) => x.bloque === p.bloque && (!facil || ESENCIALES.has(x.id)));
    const n = delBloque.indexOf(p);
    $(".bloques").innerHTML = BLOQUES.map((b, i) => {
      const estado = i + 1 < p.bloque ? "hecho" : i + 1 === p.bloque ? "ahora" : "";
      return `<li class="${estado}"><i>${estado === "hecho" ? "✓" : i + 1}</i><span>${b}</span>${estado === "ahora" ? `<small>${n}/${delBloque.length}</small>` : ""}</li>`;
    }).join("");

    const varios = objetivos(p).length > 1;
    const enMano = p.tipo === "pon" && e.mano === p.pieza;
    const pieza = PIEZAS.find((x) => x.id === p.pieza);
    const ayuda =
      p.tipo === "pon" ? (enMano ? (guiado ? "Toca el sitio iluminado." : "Toca el hueco donde va.") : `Elige en la bandeja: <b>${pieza.nombre.toLowerCase()}</b>.`)
      : p.tipo === "tornillos" && !e.dest ? "Coge el destornillador de la bandeja."
      : "";
    tarjeta.innerHTML = `
      <p class="cuenta">Paso ${n + 1} <span>de ${delBloque.length}</span></p>
      <h1 tabindex="-1">${p.titulo}</h1>
      <p class="paso-texto">${p.texto}</p>
      ${p.figura && !facil ? `<div class="figura">${FIGURAS[p.figura](e)}<button class="boton" data-girar="${p.figura}">${p.figura === "cpu" ? "Girar el procesador ↻" : "Dar la vuelta al módulo ⇄"}</button></div>` : ""}
      ${varios ? `<p class="paso-cuenta">${(e.parcial[p.id] || []).length} de ${objetivos(p).length}</p>` : ""}
      ${p.tipo === "boton" ? `<button class="boton principal" data-hacer="${p.id}">${p.rotulo}</button>` : ""}
      ${ayuda ? `<p class="paso-ayuda">${ayuda}</p>` : ""}
      ${pintaAviso()}
      <p class="porque"><b>¿Por qué?</b> ${p.porque}</p>
      ${guiado || e.pista || p.tipo === "boton" ? "" : `<button class="enlace" data-pista>Dame una pista</button>`}`;

    const pendiente = (x) => PASOS.some((s, k) => k >= e.i && s.pieza === x.id && (!facil || ESENCIALES.has(s.id)));
    const piezas = PIEZAS.filter((x) => x.bloque === p.bloque && quedan(x) > 0 && pendiente(x) && (!x.soloSiToca || x.id === p.pieza));
    bandeja.innerHTML = `${herramientas}
      <h2>Piezas</h2>
      <div class="bandeja-piezas">${piezas.length ? piezas.map(botonPieza).join("") : `<p class="bandeja-vacia">No quedan piezas de este bloque.</p>`}</div>`;
  }

  function pintaLibre(herramientas) {
    $(".bloques").innerHTML = "";
    const enMano = PIEZAS.find((x) => x.id === e.mano);
    const girable = e.mano === "cpu" ? "cpu" : e.mano === "ram" ? "ram" : null;
    const levanta = PASOS.find((x) => x.tipo === "boton" && disponible(x));
    tarjeta.innerHTML = `
      <p class="cuenta">${e.pasosHechos.size} <span>de ${PASOS.length} tareas</span></p>
      <h1 tabindex="-1">Móntalo a tu manera</h1>
      <p class="paso-texto">No hay pasos. Elige una pieza y toca su sitio, o toca en el modelo lo que quieras mover. Si te adelantas, el taller te avisa.</p>
      ${enMano ? `<p class="paso-ayuda">En la mano: <b>${enMano.nombre.toLowerCase()}</b>. Toca el hueco donde va.</p>` : ""}
      ${girable ? `<div class="figura">${FIGURAS[girable](e)}<button class="boton" data-girar="${girable}">${girable === "cpu" ? "Girar el procesador ↻" : "Dar la vuelta al módulo ⇄"}</button></div>` : ""}
      ${levanta ? `<button class="boton principal" data-hacer="${levanta.id}">${levanta.rotulo}</button>` : ""}
      ${pintaAviso()}
      <button class="enlace" data-pista>Dame una pista</button>
      ${BLOQUES.map((b, i) => `<h2 class="tareas-titulo">${b}</h2><ul class="tareas">${PASOS.filter((x) => x.bloque === i + 1)
        .map((x) => `<li class="${hecho(x) ? "hecha" : ""}">${x.titulo}</li>`)
        .join("")}</ul>`).join("")}`;

    const visible = (x) => quedan(x) > 0 && (!x.soloSiToca || PASOS.some((s) => s.pieza === x.id && disponible(s)));
    bandeja.innerHTML = `${herramientas}${BLOQUES.map((b, i) => {
      const piezas = PIEZAS.filter((x) => x.bloque === i + 1 && visible(x));
      return piezas.length ? `<h2>${b}</h2><div class="bandeja-piezas">${piezas.map(botonPieza).join("")}</div>` : "";
    }).join("")}`;
  }

  const muestrario = (que) => `<div class="muestrario" role="group" aria-label="${que}">${Object.keys(NOMBRES[que])
    .map((v) => `<button class="muestra" data-acabado="${que}:${v}" aria-pressed="${acabado[que] === v}" style="--color:${que === "pegatina" ? "transparent" : colorDe(que, v)}">${NOMBRES[que][v]}</button>`)
    .join("")}</div>`;
  const colorDe = (que, v) => {
    const c = que === "caja" ? ACABADOS.caja[v][0] : ACABADOS.luz[v];
    return c == null ? "#2a3558" : `#${c.toString(16).padStart(6, "0")}`;
  };
  let acabado = {};

  function final() {
    terminado = true;
    banco.activa([]);
    borrar();
    const errores = e.fallos + e.pistas;
    const [tres, dos] = facil ? [1, 4] : libreM ? [3, 9] : [2, 7];
    const estrellas = errores <= tres ? 3 : errores <= dos ? 2 : 1;
    const pasos = facil ? ESENCIALES.size : PASOS.length;
    anotarIntento(`${montaje.id}-${nivel.id}`, Math.max(0, pasos - errores), pasos, estrellas);
    acabado = m.personaliza();
    $(".taller").classList.add("acabado");
    bandeja.innerHTML = "";
    pintaFinal(estrellas, pasos);
    $(".taller-guia h1").focus({ preventScroll: true });
  }

  function pintaFinal(estrellas, pasos) {
    const minutos = Math.max(1, Math.round((Date.now() - e.t0) / 60000));
    const k = montaje.niveles.indexOf(nivel);
    const otro = montaje.niveles[k + 1] || montaje.niveles[k - 1];
    $(".taller-guia").innerHTML = `
      <div class="resultado" data-estrellas="${estrellas}" data-pasos="${pasos}">
        <p class="cuenta">${nivel.etiqueta} · ${nivel.nombre}</p>
        <h1 tabindex="-1">¡Funciona!</h1>
        <p class="grandes">${ctx.pintaEstrellas(estrellas)}</p>
        <p class="entrada">${pasos} pasos en ${minutos} min, con ${e.fallos} ${e.fallos === 1 ? "fallo" : "fallos"}${e.pistas ? ` y ${e.pistas} ${e.pistas === 1 ? "pista" : "pistas"}` : ""}.</p>
        <h2>Hazlo tuyo</h2>
        <p class="acabado-rotulo">Color de la caja</p>${muestrario("caja")}
        <p class="acabado-rotulo">Luces</p>${muestrario("luz")}
        <p class="acabado-rotulo">Pegatina</p>${muestrario("pegatina")}
        <h2>Lo que has aprendido</h2>
        <ul class="aprendido">${APRENDIDO.map((t) => `<li>${t}</li>`).join("")}</ul>
        <div class="fila">
          <button class="boton" data-otra>Montarlo otra vez</button>
          <a class="boton principal" href="#/jugar/${montaje.id}/${otro.id}">Probar ${otro.nombre.toLowerCase()}</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------- Empezar o seguir

  function empieza(guardada) {
    e = nuevo();
    if (guardada) {
      // Se repite a toda velocidad lo que ya estaba hecho.
      Object.assign(e, { fallos: guardada.fallos || 0, pistas: guardada.pistas || 0, giro: guardada.giro || e.giro, t0: Date.now() - (guardada.ms || 0) });
      banco.rapido = true;
      try {
        for (const [i, arg] of guardada.hist) {
          if (!libreM && i !== e.i) break;
          aplica(PASOS[i], arg);
          if (e.pasosHechos.size >= PASOS.length) break;
        }
      } catch (error) {
        console.error(error);
        borrar();
        return ctx.ir(`/jugar/${montaje.id}/${nivel.id}`);
      }
      banco.rapido = false;
      if (e.pasosHechos.size >= PASOS.length) {
        // Estaba ya terminado: se empieza otro.
        borrar();
        return ctx.ir(`/jugar/${montaje.id}/${nivel.id}`);
      }
      aviso = e.hist.length ? { tipo: "consejo", titular: "Sigues donde lo dejaste", texto: "Tu montaje estaba guardado en este navegador." } : null;
    }
    const delTaller = hazLoDemas();
    if (delTaller.length && !guardada) aviso = { tipo: "consejo", titular: "El taller ha hecho por ti", texto: `${delTaller.join(", ")}.` };
    pinta();
    m.mira(libreM ? (m.dePie ? "dePie" : "general") : paso().vista, 0);
  }

  let guardada = null;
  try {
    guardada = JSON.parse(localStorage.getItem(CLAVE + nivel.id));
  } catch {}
  // Para probar: ?paso=12 salta hasta ese paso haciendo los anteriores solos.
  const salto = +new URLSearchParams(location.search).get("paso");
  if (salto) {
    e = nuevo();
    banco.rapido = true;
    for (const p of PASOS.slice(0, Math.min(salto, PASOS.length) - 1)) solo(p);
    banco.rapido = false;
    hazLoDemas();
    pinta();
    m.mira(libreM ? (m.dePie ? "dePie" : "general") : paso().vista, 0);
  } else empieza(guardada?.hist?.length ? guardada : null);

  // Para las pruebas automáticas.
  window.__taller = {
    banco,
    estado: () => ({ ...e, hechos: e.pasosHechos.size }),
    validas: () => (paso() ? zonasDe(paso()).filter(libre) : []),
    disponibles: () => PASOS.filter(disponible).map((p) => ({ id: p.id, tipo: p.tipo, pieza: p.pieza, zona: p.tipo === "pon" ? guiaDe(p)[0] : null, objetivos: pendientes(p) })),
  };

  // ---------------------------------------------------------------- Controles

  const pulsa = (ev) => {
    const b = ev.target.closest("button, a");
    if (!b) return;
    const d = b.dataset;
    if (d.pieza) elige(d.pieza);
    else if (d.girar) {
      e.giro[d.girar] = (e.giro[d.girar] + 1) % (d.girar === "cpu" ? 4 : 2);
      if (aviso?.tipo === "mal") aviso = null;
      pinta();
    } else if (d.hacer) logrado(PASOS.find((x) => x.id === d.hacer), null);
    else if (d.acabado) {
      const [que, valor] = d.acabado.split(":");
      acabado = m.personaliza({ [que]: valor });
      const r = $(".resultado");
      pintaFinal(+r.dataset.estrellas, +r.dataset.pasos);
    } else if ("pista" in d) {
      const p = libreM ? PASOS.find(disponible) : paso();
      e.pista = libreM ? p.id : true;
      e.pistas++;
      if (p.tipo === "pon") e.mano = p.pieza;
      if (p.tipo === "tornillos") e.dest = true;
      aviso = libreM ? { tipo: "consejo", titular: "Pista", texto: `${p.titulo}. ${p.texto}` } : null;
      if (libreM) m.mira(p.vista);
      guardar();
      pinta();
    } else if ("vista" in d) m.mira(paso()?.vista || (m.dePie ? "dePie" : "general"));
    else if ("otra" in d) {
      borrar();
      ctx.ir(`/jugar/${montaje.id}/${nivel.id}`);
    } else if ("reiniciar" in d || "salir" in d) {
      const salir = "salir" in d;
      if (d.seguro || (salir && (terminado || !e.hist.length))) {
        if (!salir) borrar();
        return ctx.ir(salir ? "/" : `/jugar/${montaje.id}/${nivel.id}`);
      }
      const antes = b.textContent;
      d.seguro = "1";
      b.textContent = salir ? "¿Salir? Se guarda. Pulsa otra vez" : "¿Seguro? Pulsa otra vez";
      setTimeout(() => {
        delete d.seguro;
        b.textContent = antes;
      }, 3000);
    }
  };
  app.addEventListener("click", pulsa);

  // Con ratón también se puede arrastrar la pieza desde la bandeja hasta su sitio.
  let arrastre = null;
  const baja = (ev) => {
    const b = ev.target.closest("[data-pieza]");
    if (!b || ev.pointerType === "touch" || b.dataset.pieza === "destornillador") return;
    arrastre = { id: b.dataset.pieza, x: ev.clientX, y: ev.clientY, sombra: null };
  };
  const mueve = (ev) => {
    if (!arrastre) return;
    if (!arrastre.sombra) {
      if (Math.hypot(ev.clientX - arrastre.x, ev.clientY - arrastre.y) < 10) return;
      if (e.mano !== arrastre.id) elige(arrastre.id);
      if (e.mano !== arrastre.id) return (arrastre = null);
      arrastre.sombra = Object.assign(document.createElement("img"), { src: fotos[arrastre.id], className: "arrastrada", alt: "" });
      document.body.append(arrastre.sombra);
    }
    arrastre.sombra.style.transform = `translate(${ev.clientX - 60}px, ${ev.clientY - 45}px)`;
  };
  const sube = (ev) => {
    if (!arrastre) return;
    const { sombra } = arrastre;
    arrastre = null;
    if (!sombra) return;
    sombra.remove();
    const r = zona3d.getBoundingClientRect();
    if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) return;
    const id = banco.dianaEn(ev.clientX, ev.clientY);
    if (id) banco.alTocar(id);
  };
  bandeja.addEventListener("pointerdown", baja);
  addEventListener("pointermove", mueve);
  addEventListener("pointerup", sube);

  const teclas = (ev) => {
    if (ev.key !== "Escape" || terminado) return;
    e.mano = null;
    e.dest = false;
    pinta();
  };
  document.addEventListener("keydown", teclas);
  zona3d.addEventListener("tocado", () => zona3d.classList.add("tocado"), { once: true });

  return () => {
    app.removeEventListener("click", pulsa);
    removeEventListener("pointermove", mueve);
    removeEventListener("pointerup", sube);
    document.removeEventListener("keydown", teclas);
    clearTimeout(m.reloj);
    arrastre?.sombra?.remove();
    banco.destruir();
    delete window.__taller;
  };
}
