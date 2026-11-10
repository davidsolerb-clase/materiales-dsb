// Pinta el catálogo y aplica los filtros. Los filtros se guardan en la URL
// para poder compartir, por ejemplo, "todo lo de 1.º ESO".
const { categorias, materiales } = window.CATALOGO;
const $ = (id) => document.getElementById(id);
const campos = { q: $("q"), asignatura: $("asignatura"), curso: $("curso") };

rellenarSelect(campos.asignatura, categorias.asignaturas, usados("asignaturas"));
rellenarSelect(campos.curso, categorias.cursos, usados("cursos"));

const params = new URLSearchParams(location.search);
for (const [k, el] of Object.entries(campos)) el.value = params.get(k) || "";

$("filtros").addEventListener("input", pintar);
$("filtros").addEventListener("submit", (e) => e.preventDefault());
pintar();

function pintar() {
  const q = normalizar(campos.q.value);
  const asig = campos.asignatura.value;
  const curso = campos.curso.value;

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
    ? "Ningún material coincide con estos filtros."
    : "Todavía no hay materiales publicados.";

  const p = new URLSearchParams();
  for (const [k, el] of Object.entries(campos)) if (el.value) p.set(k, el.value);
  history.replaceState(null, "", p.size ? `?${p}` : location.pathname);
}

function tarjeta(m) {
  const li = el("li", "tarjeta");
  const a = el("a", "enlace");
  a.href = m.enlace;
  if (m.externo) a.rel = "noopener";

  const fig = el("div", "miniatura");
  if (m.portada) {
    const img = el("img");
    img.src = m.portada;
    img.alt = "";
    img.loading = "lazy";
    fig.append(img);
  } else {
    fig.append(el("span", "iniciales", iniciales(m.titulo)));
    fig.style.setProperty("--tono", tono(m.slug));
  }

  const cuerpo = el("div", "cuerpo");
  cuerpo.append(el("h2", "", m.titulo));
  if (m.descripcion) cuerpo.append(el("p", "descripcion", m.descripcion));

  const datos = el("ul", "datos");
  datos.append(el("li", "dato curso", textoCursos(m.cursos)));
  for (const s of m.asignaturas) datos.append(el("li", "dato", categorias.asignaturas[s]));
  cuerpo.append(datos);

  const pie = el("p", "pie-tarjeta");
  pie.append(el("span", "ruta", m.externo ? new URL(m.enlace).host : `${m.slug}/`));
  if (m.hecho_con) pie.append(el("span", "", `hecho con ${m.hecho_con}`));
  cuerpo.append(pie);

  a.append(fig, cuerpo);
  li.append(a);
  return li;
}

// "1eso,2eso" -> "1.º–2.º ESO"; las cuatro de la ESO -> "ESO".
function textoCursos(cursos) {
  const eso = ["1eso", "2eso", "3eso", "4eso"];
  if (eso.every((c) => cursos.includes(c)) && cursos.length === 4) return "ESO";
  const soloEso = cursos.every((c) => eso.includes(c));
  if (soloEso && cursos.length > 1) {
    const n = cursos.map((c) => Number(c[0])).sort();
    const seguidos = n.every((x, i) => i === 0 || x === n[i - 1] + 1);
    if (seguidos) return `${n[0]}.º–${n.at(-1)}.º ESO`;
  }
  return cursos.map((c) => categorias.cursos[c]).join(", ");
}

function rellenarSelect(select, opciones, usadas) {
  for (const [valor, texto] of Object.entries(opciones)) {
    if (!usadas.has(valor)) continue;
    select.append(new Option(texto, valor));
  }
}

function usados(campo) {
  return new Set(materiales.flatMap((m) => m[campo]));
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

function tono(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
