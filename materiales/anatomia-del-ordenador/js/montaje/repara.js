// Actividad «Repara»: llega un ordenador con una avería y hay que encontrarla.
//
//   Nivel 1  A la vista: algo está suelto, desenchufado o apagado.
//   Nivel 2  Pieza rota: por fuera parece bien; hay que cambiarla por otra.
//
// Encender para ver el síntoma no cuesta nada. Revisar algo que estaba bien,
// o cambiar una pieza sana, sí: son «pasos de más» y restan estrellas.
// Los casos están en sistema.js (AVERIAS).

import { anotarIntento } from "../progreso.js";
import { Puesto, listaElementos, pantallaPuesto, sin3d } from "./puesto.js";
import { porque } from "./enciende.js";
import { ELEMENTOS, SINTOMAS, AVERIAS, elemento } from "./sistema.js";

export const repara = {
  id: "repara",
  titulo: "Taller: repara",
  descripcion: "Te traen un ordenador que falla. Enciéndelo, piensa y arréglalo.",
  necesita3d: true,
  niveles: [
    { id: "1", etiqueta: "Nivel 1", nombre: "A la vista", texto: "Algo está suelto, desenchufado o apagado. Si miras bien, se ve." },
    { id: "2", etiqueta: "Nivel 2", nombre: "Pieza rota", texto: "Todo parece en su sitio. Hay que deducir qué pieza falla y cambiarla." },
  ],
  montar,
};

const ARREGLO = { falta: "Estaba desenchufado.", suelta: "Estaba mal pinchada: no llegaba al fondo de la ranura.", rota: "Estaba rota." };

function montar(app, ctx, nivel) {
  const partes = pantallaPuesto(app, `Repara · ${nivel.nombre}`);
  let puesto;
  try {
    puesto = new Puesto(partes.zona);
  } catch {
    return sin3d(app, repara.titulo);
  }
  const { lista, ficha } = partes;
  const sonido = app.querySelector("[data-sonido]");
  sonido.onclick = () => {
    puesto.sonido = !puesto.sonido;
    sonido.textContent = `Sonido: ${puesto.sonido ? "sí" : "no"}`;
  };

  const casos = AVERIAS.filter((a) => String(a.nivel) === nivel.id);
  let n = 0;
  let total = 0;
  let c; // el caso en curso

  function empieza() {
    c = { ...casos[n], deMas: 0, vistos: {}, sel: null, nota: null, resultado: null, ocupado: false, resuelto: false };
    puesto.reinicia(c.fallo);
    puesto.marca(null);
    pinta();
  }

  function pinta() {
    lista.innerHTML = listaElementos(ELEMENTOS, {
      pulsado: (x) => c.sel === x.id,
      clase: (x) => c.vistos[x.id] || "",
      boton: (x) => `<span>${x.nombre}</span><small>${{ bien: "Revisado", arreglado: "Arreglado", cambiado: "Cambiada" }[c.vistos[x.id]] || ""}</small>`,
    });
    const s = c.resultado && SINTOMAS[c.resultado.sintoma];
    const el = c.sel && elemento(c.sel);
    const estrellas = c.deMas <= 1 ? 3 : c.deMas <= 3 ? 2 : 1;
    if (c.resuelto) {
      ficha.innerHTML = `
        <p class="cuenta">Caso ${n + 1} <span>de ${casos.length}</span></p>
        <h1 tabindex="-1">¡Arreglado!</h1>
        <p class="grandes">${ctx.pintaEstrellas(estrellas)}</p>
        <div class="veredicto bien"><p class="titular">Qué le pasaba</p>
          ${Object.entries(c.fallo).map(([id, que]) => `<p><b>${elemento(id).nombre}.</b> ${id === "interruptor" ? "Estaba apagado." : ARREGLO[que]} ${elemento(id).sin}</p>`).join("")}</div>
        <p class="paso-ayuda">${c.deMas ? `Has dado ${c.deMas} ${c.deMas === 1 ? "paso" : "pasos"} de más.` : "Sin un solo paso de más."}</p>
        <button class="boton principal" data-seguir>${n === casos.length - 1 ? "Ver resultado" : "Siguiente caso"} →</button>`;
      return ficha.querySelector("[data-seguir]").focus({ preventScroll: true });
    }
    ficha.innerHTML = `
      <p class="cuenta">Caso ${n + 1} <span>de ${casos.length}</span></p>
      <h1 tabindex="-1">¿Qué le pasa?</h1>
      <blockquote class="queja">«${c.queja}»</blockquote>
      <button class="boton principal" data-boton ${c.ocupado ? "disabled" : ""}>${puesto.encendido ? "Apagar" : "Encender para probar"}</button>
      ${s && !c.ocupado ? `<div class="veredicto ${c.resultado.sintoma === "bien" ? "bien" : "mal"}"><p class="titular">${s.titulo}</p><p>${s.texto}</p></div>` : ""}
      ${el && !puesto.encendido ? `
        <div class="revisa">
          <p class="titular">${el.nombre}</p>
          ${c.nota ? `<p>${c.nota}</p>` : ""}
          <div class="fila">
            ${c.vistos[el.id] || c.hallado === el.id ? "" : `<button class="boton" data-revisar>Revisar</button>`}
            ${c.hallado === el.id ? `<button class="boton principal" data-arreglar>${el.id === "interruptor" ? "Encenderlo" : el.grupo === "Piezas" ? "Pincharla bien" : "Enchufarlo"}</button>` : ""}
            ${el.repuesto && c.vistos[el.id] !== "cambiado" ? `<button class="boton" data-cambiar>Cambiar por una nueva</button>` : ""}
          </div>
        </div>` : `<p class="paso-ayuda">${puesto.encendido ? "Apágalo antes de tocar nada por dentro." : "Elige una pieza o un cable, en la lista o en el modelo, para revisarlo."}</p>`}
      <p class="porque"><b>Pasos de más:</b> ${c.deMas}. Revisar algo que estaba bien, o cambiar una pieza sana, cuenta. Encender, no.</p>`;
  }

  function elige(id) {
    if (c.resuelto) return;
    c.sel = c.sel === id ? null : id;
    c.nota = null;
    puesto.marca(c.sel);
    pinta();
  }
  puesto.alElegir = elige;

  const pulsa = async (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.el) return elige(d.el);
    if ("seguir" in d) {
      total += c.deMas <= 1 ? 3 : c.deMas <= 3 ? 2 : 1;
      n++;
      return n < casos.length ? empieza() : final();
    }
    if ("otra" in d) return ctx.ir(`/jugar/${repara.id}/${nivel.id}`);
    if ("boton" in d && !c.ocupado) {
      if (puesto.encendido) {
        puesto.apaga();
        return pinta();
      }
      c.ocupado = true;
      c.resultado = null;
      pinta();
      c.resultado = await puesto.enciende();
      c.ocupado = false;
      c.resuelto = c.resultado.sintoma === "bien";
      if (c.resuelto) puesto.marca(null);
      return pinta();
    }
    const id = c.sel;
    if (!id || puesto.encendido) return;
    const como = puesto.estado[id];
    if ("revisar" in d) {
      if (como === "falta" || como === "suelta") {
        c.hallado = id;
        c.nota = `<b>¡Aquí hay algo!</b> ${id === "interruptor" ? "Está apagado." : como === "suelta" ? "No está pinchada hasta el fondo." : "Está desenchufado."}`;
      } else {
        c.vistos[id] = "bien";
        if (como === "bien") c.deMas++;
        c.nota = elemento(id).repuesto ? "Está bien colocada. A simple vista no se le ve nada raro." : "Está bien conectado.";
      }
    } else if ("arreglar" in d) {
      puesto.pon(id, "bien");
      c.vistos[id] = "arreglado";
      c.hallado = null;
      c.nota = "Hecho. Enciende para comprobar si era eso.";
    } else if ("cambiar" in d) {
      if (como !== "rota") c.deMas++;
      puesto.pon(id, "bien");
      c.vistos[id] = "cambiado";
      c.nota = "Cambiada por una nueva. Enciende para comprobar si era eso.";
    }
    pinta();
  };
  app.addEventListener("click", pulsa);

  function final() {
    puesto.reinicia();
    puesto.marca(null);
    const maximo = casos.length * 3;
    const e = total >= maximo - 1 ? 3 : total >= maximo * 0.66 ? 2 : 1;
    anotarIntento(`${repara.id}-${nivel.id}`, total, maximo, e);
    const otro = repara.niveles.find((x) => x !== nivel);
    lista.innerHTML = "";
    ficha.innerHTML = `
      <div class="resultado">
        <p class="cuenta">${nivel.etiqueta} · ${nivel.nombre}</p>
        <h1 tabindex="-1">${casos.length} de ${casos.length} arreglados</h1>
        <p class="grandes">${ctx.pintaEstrellas(e)}</p>
        <p class="entrada">${e === 3 ? "Has ido directo al fallo casi siempre. Así trabaja un buen técnico." : "Todos funcionan. Para subir, enciende primero y piensa qué piezas pueden causar ese síntoma antes de revisar."}</p>
        <div class="fila">
          <button class="boton" data-otra>Repetir</button>
          <a class="boton principal" href="#/jugar/${repara.id}/${otro.id}">Probar ${otro.nombre.toLowerCase()}</a>
          <a class="boton" href="#/">Inicio</a>
        </div>
      </div>`;
  }

  empieza();
  return () => {
    app.removeEventListener("click", pulsa);
    puesto.destruir();
  };
}
