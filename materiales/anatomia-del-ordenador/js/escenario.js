// El escenario es la caja donde se ve una pieza en 3D. Debajo lleva una imagen
// fija, que es lo que queda si el navegador no tiene WebGL.

export function escenario({ pista = true, abrible = false } = {}) {
  const el = document.createElement("div");
  el.className = "escenario";
  el.innerHTML = `
    <div class="escena" role="img"><img class="foto" alt="" draggable="false"></div>
    ${pista ? `<p class="gesto">Arrastra para girarla</p>` : ""}
    ${abrible ? `<label class="abridor"><span>Cerrada</span><input type="range" min="0" max="100" value="0" aria-label="Abrir la pieza"><span>Abierta</span></label>` : ""}`;
  el.addEventListener("tocado", () => el.classList.add("tocado"));
  return el;
}

// `anonima` evita decir el nombre de la pieza (para las preguntas).
export function ponerPieza(el, visor, p, { anonima = false, girar = true, abierta = 0 } = {}) {
  const escena = el.querySelector(".escena");
  const foto = el.querySelector(".foto");
  const regla = el.querySelector(".abridor input");
  el.style.setProperty("--tono", p.color);
  escena.setAttribute("aria-label", anonima ? "Pieza de ordenador en 3D" : `${p.nombre} en 3D`);
  el.classList.remove("listo", "tocado");
  foto.src = abierta > 0.5 ? p.fotoAbierta : p.foto;

  const abrir = (cuanto, ya) => {
    if (regla) regla.value = Math.round(cuanto * 100);
    foto.src = cuanto > 0.5 ? p.fotoAbierta : p.foto;
    visor.abrir?.(cuanto, { ya });
  };
  el.abrir = (cuanto) => abrir(cuanto, false);
  if (regla) {
    regla.value = Math.round(abierta * 100);
    regla.oninput = () => {
      abrir(regla.value / 100, true);
      el.dispatchEvent(new CustomEvent("apertura", { detail: regla.value / 100 }));
    };
  }

  if (!visor.ok) return false;
  visor.montar(escena);
  const bien = visor.mostrar(p, { girar, abierta, anonima });
  if (bien) el.classList.add("listo");
  return bien;
}
