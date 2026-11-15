// Actividad «Taller de montaje»: se monta un ordenador paso a paso.
//
//   Nivel 1  Con guía: el sitio de cada pieza se ilumina.
//   Nivel 2  Sin guía: se marcan todos los huecos posibles y hay que elegir.
//
// banco.js    el lienzo 3D, la cámara y los sitios que se pueden tocar
// caja.js     el modelo de la caja
// mundo.js    dónde va cada cosa y cómo se mueve
// pasos.js    el guion: piezas, pasos y textos
//
// La partida se guarda en el navegador: si se cierra la pestaña, sigue donde estaba.

import { Banco } from "./banco.js";
import { Mundo, muestra } from "./mundo.js";
import { BLOQUES, PIEZAS, PASOS, ZONAS, BLOQUE_DE_ZONA, FIGURAS } from "./pasos.js";
import { anotarIntento } from "../progreso.js";

const CLAVE = "anatomia-montaje-v1-";
const NO_VA = "Ahí no va. Lee otra vez el paso y fíjate en la forma y en el tamaño del hueco.";
const APRENDIDO = [
  "El procesador solo encaja en una posición y necesita pasta térmica y disipador para no calentarse.",
  "La fuente da corriente a todo: a la placa, al procesador, a la gráfica y a los discos.",
  "Cada disco lleva dos cables: uno de corriente y otro de datos.",
  "Si hay tarjeta gráfica, el monitor se conecta a ella.",
  "Lo último que se enchufa es la corriente.",
];

export const montaje = {
  id: "montaje",
  titulo: "Taller: monta el ordenador",
  descripcion: "Coge las piezas, ponlas en su sitio, conecta los cables y enciéndelo.",
  necesita3d: true,
  niveles: [
    { id: "1", etiqueta: "Nivel 1", nombre: "Con guía", texto: "El sitio de cada pieza se ilumina. Para aprender el orden y el porqué de cada paso." },
    { id: "2", etiqueta: "Nivel 2", nombre: "Sin guía", texto: "Se marcan todos los huecos y eliges tú. Cada fallo y cada pista cuentan." },
  ],
  montar,
};

function montar(app, ctx, nivel) {
  const guiado = nivel.id === "1";
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
    <div class="taller">
      <aside class="taller-bandeja" aria-label="Herramientas y piezas"></aside>
      <div class="taller-3d">
        <p class="gesto">Arrastra para girar · rueda o pellizco para acercar</p>
        <button class="boton taller-vista" data-vista>Vista del paso</button>
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
  window.__taller = { banco, estado: () => e }; // para las pruebas
  const m = new Mundo(banco);

  // Fotos de la bandeja.
  const fotos = { destornillador: banco.miniatura(muestra("destornillador"), [20, 25]) };
  for (const p of PIEZAS) fotos[p.id] = p.foto ? `miniaturas/${p.foto}.webp` : (fotos[`m-${p.muestra}`] ||= banco.miniatura(muestra(p.muestra)));

  let e;
  let aviso = null; // { tipo, titular, texto }
  let terminado = false;

  const nuevo = () => ({ i: 0, hechos: [], ocupadas: {}, usadas: {}, giro: { cpu: 1 + Math.floor(Math.random() * 3), ram: 1 }, ram: [], mano: null, dest: false, fallos: 0, pistas: 0, pista: false, hist: [], pasosHechos: new Set(), t0: Date.now() });
  const paso = () => PASOS[e.i];
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

  const zonasDe = (p) => (typeof p.zonas === "function" ? p.zonas(e) : p.zonas) || [];
  const libre = (id) => (e.ocupadas[id] || 0) < (ZONAS[id]?.cap ?? 1);
  const existe = (id) => !ZONAS[id]?.tras || e.pasosHechos.has(ZONAS[id].tras);
  const objetivos = (p) => (p.tipo === "tornillos" ? m.puntosTornillo[p.grupo].map((_, k) => `tornillo-${p.grupo}-${k}`) : p.objetivos || []);
  const pendientes = (p) => objetivos(p).filter((id) => !e.hechos.includes(id));
  const quedan = (pieza) => (pieza.cantidad || 1) - (e.usadas[pieza.id] || 0);

  // Qué se puede tocar ahora y cómo se marca.
  function dianas() {
    const p = paso();
    if (!p || terminado) return [[], null];
    const pista = guiado || e.pista;
    if (p.tipo === "pon") {
      if (e.mano !== p.pieza) return [[], null];
      const validas = zonasDe(p).filter(libre);
      if (pista) {
        const guia = (p.guia ? p.guia(e) : validas).filter((z) => validas.includes(z));
        return [guia.length ? guia : validas, "guia"];
      }
      const otras = Object.keys(ZONAS).filter((id) => BLOQUE_DE_ZONA(id, p.bloque) && existe(id) && libre(id));
      return [[...new Set([...validas, ...Object.keys(p.trampas || {}), ...otras])], "neutra"];
    }
    if (p.tipo === "tornillos") return [pendientes(p), pista ? "guia" : e.dest ? "neutra" : null];
    if (p.tipo === "toca") return [pendientes(p), pista || p.marca ? "guia" : null];
    return [[], null];
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
      e.hechos.push(arg);
    } else if (p.tipo === "toca") {
      espera = p.hecho(m, e, arg);
      e.hechos.push(arg);
    } else espera = p.hecho(m, e);
    e.hist.push([e.i, arg ?? null]);
    return { completo: p.tipo === "pon" || p.tipo === "boton" || !pendientes(p).length, espera };
  }

  function siguiente() {
    const p = paso();
    e.pasosHechos.add(p.id);
    e.i++;
    e.hechos = [];
    e.mano = null;
    e.pista = false;
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
    const { completo, espera } = aplica(p, arg);
    aviso = e.consejo ? { tipo: "consejo", titular: "Un consejo", texto: e.consejo } : null;
    e.consejo = null;
    if (!completo) return guardar(), pinta();
    const bloque = p.bloque;
    siguiente();
    guardar();
    const sigue = () => {
      if (e.i >= PASOS.length) return final();
      if (paso().bloque !== bloque && !aviso) aviso = { tipo: "bien", titular: `Hecho: ${BLOQUES[bloque - 1].toLowerCase()}`, texto: `Ahora toca: ${BLOQUES[bloque].toLowerCase()}.` };
      pinta();
      m.mira(paso().vista, p.vistaTras ? 1500 : 900);
    };
    if (p.vistaTras) m.mira(p.vistaTras, 1200);
    if (espera?.then) {
      pinta();
      espera.then(sigue);
    } else sigue();
  }

  banco.alTocar = (id) => {
    const p = paso();
    if (!id || !p || terminado) return;
    if (p.tipo === "pon") {
      if (!zonasDe(p).filter(libre).includes(id)) return fallo(p.trampas?.[id] || NO_VA);
      const pega = p.comprueba?.(e, id);
      if (pega) return fallo(pega);
      return logrado(p, id);
    }
    if (p.tipo === "tornillos" && !e.dest) {
      aviso = { tipo: "consejo", titular: "Te falta la herramienta", texto: "Coge primero el destornillador: está arriba, en la bandeja." };
      return pinta();
    }
    logrado(p, id);
  };

  function elige(id) {
    const p = paso();
    if (terminado || !p) return;
    if (id === "destornillador") e.dest = !e.dest;
    else if (e.mano === id) e.mano = null;
    else if (p.tipo !== "pon" || p.pieza !== id) {
      aviso = { tipo: "consejo", titular: "Esa pieza va después", texto: `Ahora toca: ${p.titulo.toLowerCase()}.` };
      e.mano = null;
    } else {
      e.mano = id;
      if (aviso?.tipo !== "mal") aviso = null;
    }
    pinta();
  }

  // ---------------------------------------------------------------- Pantalla

  function pinta() {
    const p = paso();
    if (terminado || !p) return;
    $("[data-fallos]").textContent = e.fallos ? `${e.fallos} ${e.fallos === 1 ? "fallo" : "fallos"}` : "";
    const delBloque = PASOS.filter((x) => x.bloque === p.bloque);
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
      ${p.figura ? `<div class="figura">${FIGURAS[p.figura](e)}<button class="boton" data-girar>${p.figura === "cpu" ? "Girar el procesador ↻" : "Dar la vuelta al módulo ⇄"}</button></div>` : ""}
      ${varios ? `<p class="paso-cuenta">${e.hechos.length} de ${objetivos(p).length}</p>` : ""}
      ${p.tipo === "boton" ? `<button class="boton principal" data-hacer>${p.rotulo}</button>` : ""}
      ${ayuda ? `<p class="paso-ayuda">${ayuda}</p>` : ""}
      ${aviso ? `<div class="veredicto ${aviso.tipo}"><p class="titular">${aviso.titular}</p><p>${aviso.texto}</p></div>` : ""}
      <p class="porque"><b>¿Por qué?</b> ${p.porque}</p>
      ${guiado || e.pista || p.tipo === "boton" ? "" : `<button class="enlace" data-pista>Dame una pista</button>`}`;

    const piezas = PIEZAS.filter((x) => x.bloque === p.bloque && quedan(x) > 0 && (!x.soloSiToca || x.id === p.pieza));
    bandeja.innerHTML = `
      <h2>Herramientas</h2>
      <button class="pieza herramienta" data-pieza="destornillador" aria-pressed="${e.dest}">
        <img src="${fotos.destornillador}" alt=""><span>Destornillador${e.dest ? "<small>En la mano</small>" : ""}</span></button>
      <h2>Piezas</h2>
      <div class="bandeja-piezas">${
        piezas.length
          ? piezas.map((x) => `<button class="pieza ${x.clase || ""}" data-pieza="${x.id}" aria-pressed="${e.mano === x.id}">
              <img src="${fotos[x.id]}" alt="" draggable="false"><span>${x.nombre}${quedan(x) > 1 ? `<small>× ${quedan(x)}</small>` : ""}</span></button>`).join("")
          : `<p class="bandeja-vacia">No quedan piezas de este bloque.</p>`
      }</div>`;

    const [ids, marcas] = dianas();
    banco.activa(ids, marcas);
  }

  function final() {
    terminado = true;
    banco.activa([]);
    borrar();
    const errores = e.fallos + e.pistas;
    const estrellas = errores <= 2 ? 3 : errores <= 7 ? 2 : 1;
    anotarIntento(`${montaje.id}-${nivel.id}`, Math.max(0, PASOS.length - errores), PASOS.length, estrellas);
    const minutos = Math.max(1, Math.round((Date.now() - e.t0) / 60000));
    const otro = montaje.niveles.find((x) => x !== nivel);
    $(".taller").classList.add("acabado");
    bandeja.innerHTML = "";
    $(".taller-guia").innerHTML = `
      <div class="resultado">
        <p class="cuenta">${nivel.etiqueta} · ${nivel.nombre}</p>
        <h1 tabindex="-1">¡Funciona!</h1>
        <p class="grandes">${ctx.pintaEstrellas(estrellas)}</p>
        <p class="entrada">${PASOS.length} pasos en ${minutos} min, con ${e.fallos} ${e.fallos === 1 ? "fallo" : "fallos"}${e.pistas ? ` y ${e.pistas} ${e.pistas === 1 ? "pista" : "pistas"}` : ""}.</p>
        <h2>Lo que has aprendido</h2>
        <ul class="aprendido">${APRENDIDO.map((t) => `<li>${t}</li>`).join("")}</ul>
        <div class="fila">
          <button class="boton" data-otra>Montarlo otra vez</button>
          <a class="boton principal" href="#/jugar/${montaje.id}/${otro.id}">Probar ${otro.nombre.toLowerCase()}</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>`;
    $(".taller-guia h1").focus({ preventScroll: true });
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
          if (i !== e.i) break;
          if (aplica(PASOS[i], arg).completo) siguiente();
          if (e.i >= PASOS.length) break;
        }
      } catch (error) {
        console.error(error);
        borrar();
        return ctx.ir(`/jugar/${montaje.id}/${nivel.id}`);
      }
      banco.rapido = false;
      if (e.i >= PASOS.length) e.i = PASOS.length - 1;
      aviso = e.i ? { tipo: "consejo", titular: "Sigues donde lo dejaste", texto: "Tu montaje estaba guardado en este navegador." } : null;
    }
    pinta();
    const [pos, objetivo] = m.vista(paso().vista);
    banco.camara.position.copy(pos);
    banco.mandos.target.copy(objetivo);
    banco.mandos.update();
  }

  let guardada = null;
  try {
    guardada = JSON.parse(localStorage.getItem(CLAVE + nivel.id));
  } catch {}
  // Para probar: ?paso=12 salta hasta ese paso haciendo los anteriores solos.
  const salto = +new URLSearchParams(location.search).get("paso");
  if (salto) {
    e = nuevo();
    e.giro = { cpu: 0, ram: 0 };
    banco.rapido = true;
    while (e.i < Math.min(salto, PASOS.length) - 1) {
      const p = paso();
      if (p.tipo === "pon") e.giro.ram = 0;
      const arg = p.tipo === "pon" ? ((p.guia ? p.guia(e) : zonasDe(p)).filter(libre)[0]) : p.tipo === "boton" ? null : pendientes(p)[0];
      if (aplica(p, arg).completo) siguiente();
    }
    banco.rapido = false;
    guardada = { hist: e.hist, giro: e.giro };
    pinta();
    m.mira(paso().vista, 0);
  } else empieza(guardada?.hist?.length ? guardada : null);

  // ---------------------------------------------------------------- Controles

  const pulsa = (ev) => {
    const b = ev.target.closest("button, a");
    if (!b) return;
    if (b.dataset.pieza) elige(b.dataset.pieza);
    else if ("girar" in b.dataset) {
      const f = paso().figura;
      e.giro[f] = (e.giro[f] + 1) % (f === "cpu" ? 4 : 2);
      if (aviso?.tipo === "mal") aviso = null;
      pinta();
    } else if ("hacer" in b.dataset) logrado(paso(), null);
    else if ("pista" in b.dataset) {
      e.pista = true;
      e.pistas++;
      const p = paso();
      if (p.tipo === "pon") e.mano = p.pieza;
      if (p.tipo === "tornillos") e.dest = true;
      aviso = null;
      guardar();
      pinta();
    } else if ("vista" in b.dataset) m.mira(paso()?.vista || "dePie");
    else if ("otra" in b.dataset) {
      borrar();
      ctx.ir(`/jugar/${montaje.id}/${nivel.id}`);
    } else if ("reiniciar" in b.dataset || "salir" in b.dataset) {
      const salir = "salir" in b.dataset;
      if (b.dataset.seguro || (salir && (terminado || !e.hist.length))) {
        if (!salir) borrar();
        return ctx.ir(salir ? "/" : `/jugar/${montaje.id}/${nivel.id}`);
      }
      const antes = b.textContent;
      b.dataset.seguro = "1";
      b.textContent = salir ? "¿Salir? Se guarda. Pulsa otra vez" : "¿Seguro? Pulsa otra vez";
      setTimeout(() => {
        delete b.dataset.seguro;
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
  };
}
