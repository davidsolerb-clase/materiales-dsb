// Pinta el catálogo y aplica los filtros. Los filtros se guardan en la URL
// para poder compartir, por ejemplo, "todo lo de 1.º ESO".
const { categorias, materiales } = window.CATALOGO;
const $ = (id) => document.getElementById(id);
const form = $("filtros");

// Cada asignatura tiene un color fijo, por su orden en categorias.json.
const COLORES = [
  ["var(--rojo)", "var(--papel)"],
  ["var(--azul)", "var(--papel)"],
  ["var(--amarillo)", "var(--tinta)"],
  ["var(--verde)", "var(--tinta)"],
  ["var(--rosa)", "var(--tinta)"],
];
const colorDe = Object.fromEntries(
  Object.keys(categorias.asignaturas).map((k, i) => [k, COLORES[i % COLORES.length]])
);
const DIAS_NUEVO = 30;

chips($("asignatura"), "asignatura", "Todas", categorias.asignaturas, usados("asignaturas"), true);
chips($("curso"), "curso", "Todos", categorias.cursos, usados("cursos"));

const params = new URLSearchParams(location.search);
$("q").value = params.get("q") || "";
for (const nombre of ["asignatura", "curso"]) {
  const valor = params.get(nombre) || "";
  const input = form.querySelector(`input[name="${nombre}"][value="${CSS.escape(valor)}"]`);
  if (input) input.checked = true;
}

form.addEventListener("input", pintar);
form.addEventListener("submit", (e) => e.preventDefault());
pintar();

function pintar() {
  const q = normalizar($("q").value);
  const asig = form.elements.asignatura?.value || "";
  const curso = form.elements.curso?.value || "";

  const visibles = materiales.filter((m) =>
    (!asig || m.asignaturas.includes(asig)) &&
    (!curso || m.cursos.includes(curso)) &&
    (!q || normalizar([m.titulo, m.descripcion, ...m.etiquetas].join(" ")).includes(q))
  );

  $("rejilla").replaceChildren(...visibles.map(tarjeta));
  $("recuento").textContent = materiales.length
    ? `${visibles.length} de ${materiales.length} materiales`
    : "";
  $("vacio").hidden = visibles.length > 0;
  $("vacio").textContent = materiales.length
    ? "Ningún material coincide con estos filtros"
    : "Todavía no hay materiales publicados";

  const p = new URLSearchParams();
  if ($("q").value) p.set("q", $("q").value);
  if (asig) p.set("asignatura", asig);
  if (curso) p.set("curso", curso);
  history.replaceState(null, "", p.size ? `?${p}` : location.pathname);
}

function tarjeta(m) {
  const li = el("li", "tarjeta");
  const a = el("a", "enlace");
  a.href = m.enlace;
  if (m.externo) a.rel = "noopener";

  const [fondo, texto] = colorDe[m.asignaturas[0]] || [];
  const fig = el("div", "miniatura");
  if (fondo) {
    fig.style.setProperty("--color", fondo);
    fig.style.setProperty("--sobre", texto);
  }
  if (m.portada) {
    const img = el("img");
    img.src = m.portada;
    img.alt = "";
    img.loading = "lazy";
    fig.append(img);
  } else {
    fig.append(el("span", "iniciales", iniciales(m.titulo)));
  }

  const cuerpo = el("div", "cuerpo");
  cuerpo.append(el("h2", "", m.titulo));
  if (m.descripcion) cuerpo.append(el("p", "descripcion", m.descripcion));

  const datos = el("ul", "datos");
  datos.append(el("li", "dato curso", textoCursos(m.cursos)));
  for (const s of m.asignaturas) datos.append(el("li", "dato", categorias.asignaturas[s]));
  cuerpo.append(datos);

  const pie = el("p", "pie-tarjeta");
  pie.append(el("span", "ruta-material", m.externo ? new URL(m.enlace).host : `${m.slug}/`));
  if (m.hecho_con) pie.append(el("span", "", `hecho con ${m.hecho_con}`));
  cuerpo.append(pie);

  a.append(fig, cuerpo);
  if (esNuevo(m.fecha)) a.append(el("span", "nuevo", "Nuevo"));
  li.append(a);
  return li;
}

// "1eso,2eso" -> "1.º–2.º ESO"; las cuatro de la ESO -> "ESO".
function textoCursos(cursos) {
  const eso = ["1eso", "2eso", "3eso", "4eso"];
  if (cursos.length === 4 && eso.every((c) => cursos.includes(c))) return "ESO";
  if (cursos.length > 1 && cursos.every((c) => eso.includes(c))) {
    const n = cursos.map((c) => Number(c[0])).sort();
    if (n.every((x, i) => i === 0 || x === n[i - 1] + 1)) return `${n[0]}.º–${n.at(-1)}.º ESO`;
  }
  return cursos.map((c) => categorias.cursos[c]).join(", ");
}

function chips(fieldset, nombre, todas, opciones, usadas, conColor = false) {
  const lista = Object.entries(opciones).filter(([valor]) => usadas.has(valor));
  if (!lista.length) return fieldset.remove();
  for (const [valor, texto] of [["", todas], ...lista]) {
    const label = el("label");
    const input = el("input");
    input.type = "radio";
    input.name = nombre;
    input.value = valor;
    input.checked = valor === "";
    const span = el("span", "", texto);
    if (conColor && valor) {
      span.classList.add("muestra");
      span.style.setProperty("--color", colorDe[valor][0]);
    }
    label.append(input, span);
    fieldset.append(label);
  }
}

function usados(campo) {
  return new Set(materiales.flatMap((m) => m[campo]));
}

function esNuevo(fecha) {
  return (Date.now() - new Date(fecha).getTime()) / 86400000 < DIAS_NUEVO;
}

function el(tag, clase = "", texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function normalizar(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function iniciales(t) {
  return t.split(/\s+/).filter((w) => w.length > 3).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || t[0];
}
