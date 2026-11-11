// El escenario es la caja donde se ve una pieza: primero su imagen fija y,
// en cuanto carga, el modelo 3D. Sin WebGL se queda la imagen.

export function escenario({ pista = true } = {}) {
  const el = document.createElement("div");
  el.className = "escenario";
  el.setAttribute("role", "img");
  el.innerHTML = `
    <img class="foto" alt="" draggable="false">
    <p class="cargando" hidden>Cargando 3D <b></b></p>
    ${pista ? `<p class="gesto">Arrastra para girarla</p>` : ""}`;
  el.addEventListener("tocado", () => el.classList.add("tocado"));
  return el;
}

// `anonima` evita decir el nombre de la pieza (para las preguntas).
export async function ponerPieza(el, visor, p, { anonima = false, girar = true } = {}) {
  const foto = el.querySelector(".foto");
  const cargando = el.querySelector(".cargando");
  el.style.setProperty("--tono", p.color);
  el.setAttribute("aria-label", anonima ? "Pieza de ordenador en 3D" : `${p.nombre} en 3D`);
  el.classList.remove("listo");
  el.dataset.pieza = p.id;
  foto.src = p.foto;
  if (!visor.ok) return;

  visor.montar(el);
  const aviso = setTimeout(() => (cargando.hidden = false), 350);
  const bien = await visor.mostrar(p, {
    girar,
    alAvanzar: (parte) => (cargando.querySelector("b").textContent = `${Math.round(parte * 100)} %`),
  });
  clearTimeout(aviso);
  if (el.dataset.pieza !== p.id) return; // ya hay otra pieza
  cargando.hidden = true;
  if (bien) el.classList.add("listo");
}
