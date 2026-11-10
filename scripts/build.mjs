// Genera la web en _site/ a partir de materiales/.
// Sin dependencias: solo Node 20+.
//
//   node scripts/build.mjs           construye _site/
//   node scripts/build.mjs --check   solo valida las fichas

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const RAIZ = path.resolve(import.meta.dirname, "..");
const MATERIALES = path.join(RAIZ, "materiales");
const WEB = path.join(RAIZ, "web");
const SALIDA = path.join(RAIZ, "_site");
const SOLO_COMPROBAR = process.argv.includes("--check");

const PORTADAS = ["portada.png", "portada.jpg", "portada.webp", "portada.svg"];
const ESTADOS = ["listo", "borrador"];

const errores = [];
const avisos = [];

const categorias = leerJson(path.join(MATERIALES, "categorias.json"));
if (!categorias) salir();
const materiales = leerMateriales();

salir();

console.log(`Fichas correctas (${materiales.length} materiales).`);
if (SOLO_COMPROBAR) process.exit(0);

construirWeb(materiales);
console.log(`Web generada en _site/`);

// ---------------------------------------------------------------------------

function salir() {
  for (const a of avisos) console.warn(`aviso  ${a}`);
  for (const e of errores) console.error(`error  ${e}`);
  avisos.length = 0;
  if (errores.length) process.exit(1);
}

function leerMateriales() {
  const lista = [];
  for (const nombre of fs.readdirSync(MATERIALES).sort()) {
    if (nombre.startsWith("_") || nombre.startsWith(".")) continue;
    const ruta = path.join(MATERIALES, nombre);
    const esCarpeta = fs.statSync(ruta).isDirectory();

    // Un HTML suelto también vale: se trata como material de un solo archivo.
    if (!esCarpeta && !nombre.endsWith(".html")) continue;

    const slug = esCarpeta ? nombre : nombre.replace(/\.html$/, "");
    const m = leerMaterial(slug, ruta, esCarpeta);
    if (m) lista.push(m);
  }
  return lista.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function leerMaterial(slug, ruta, esCarpeta) {
  const donde = `materiales/${path.basename(ruta)}`;
  const rutaFicha = path.join(ruta, "ficha.json");
  const ficha = esCarpeta && fs.existsSync(rutaFicha) ? leerJson(rutaFicha) : {};
  if (!ficha) return null;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    avisos.push(`${donde}: usa un nombre en minúsculas y con guiones (ej. clasifica-componentes)`);
  }

  const html = esCarpeta ? path.join(ruta, "index.html") : ruta;
  const tieneHtml = fs.existsSync(html);
  if (!ficha.enlace && !ficha.construir && !tieneHtml) {
    errores.push(`${donde}: falta index.html (o "enlace" / "construir" en la ficha)`);
    return null;
  }
  if (esCarpeta && !fs.existsSync(rutaFicha)) {
    avisos.push(`${donde}: sin ficha.json, se usan datos mínimos`);
  }

  const delHtml = tieneHtml ? datosDelHtml(fs.readFileSync(html, "utf8")) : {};
  const m = {
    slug,
    titulo: ficha.titulo || delHtml.titulo || slug,
    descripcion: ficha.descripcion || delHtml.descripcion || "",
    asignaturas: ficha.asignaturas || [],
    cursos: ficha.cursos?.length ? ficha.cursos : Object.keys(categorias.cursos).filter((c) => c.endsWith("eso")),
    etiquetas: ficha.etiquetas || [],
    hecho_con: ficha.hecho_con || "",
    estado: ficha.estado || "listo",
    fecha: ficha.fecha || fechaDeAlta(ruta),
    enlace: ficha.enlace || (esCarpeta ? `materiales/${slug}/` : `materiales/${slug}.html`),
    externo: Boolean(ficha.enlace),
    portada: esCarpeta ? PORTADAS.find((p) => fs.existsSync(path.join(ruta, p))) : undefined,
    construir: ficha.construir,
    _ruta: ruta,
    _esCarpeta: esCarpeta,
  };
  if (m.portada) m.portada = `materiales/${slug}/${m.portada}`;

  for (const a of m.asignaturas) {
    if (!categorias.asignaturas[a]) errores.push(`${donde}: asignatura "${a}" no está en categorias.json`);
  }
  for (const c of m.cursos) {
    if (!categorias.cursos[c]) errores.push(`${donde}: curso "${c}" no está en categorias.json`);
  }
  if (!ESTADOS.includes(m.estado)) errores.push(`${donde}: estado debe ser ${ESTADOS.join(" o ")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.fecha)) errores.push(`${donde}: fecha debe ser AAAA-MM-DD`);
  if (m.construir && !(m.construir.comando && m.construir.salida)) {
    errores.push(`${donde}: "construir" necesita "comando" y "salida"`);
  }
  return m;
}

function construirWeb(lista) {
  fs.rmSync(SALIDA, { recursive: true, force: true });
  fs.mkdirSync(SALIDA, { recursive: true });

  for (const m of lista) {
    if (m.externo) continue;
    const destino = path.join(SALIDA, "materiales", m._esCarpeta ? m.slug : `${m.slug}.html`);
    if (m.construir) {
      console.log(`Compilando ${m.slug}: ${m.construir.comando}`);
      execSync(m.construir.comando, { cwd: m._ruta, stdio: "inherit" });
      copiar(path.join(m._ruta, m.construir.salida), destino);
    } else {
      copiar(m._ruta, destino);
    }
  }

  const publicos = lista
    .filter((m) => m.estado === "listo")
    .map(({ _ruta, _esCarpeta, construir, estado, ...m }) => m);
  const catalogo = { categorias, materiales: publicos };

  fs.writeFileSync(path.join(SALIDA, "catalogo.json"), JSON.stringify(catalogo, null, 2));
  for (const f of fs.readdirSync(WEB)) {
    if (f !== "index.html") copiar(path.join(WEB, f), path.join(SALIDA, f));
  }
  const portada = fs
    .readFileSync(path.join(WEB, "index.html"), "utf8")
    .replace("/*CATALOGO*/", JSON.stringify(catalogo).replace(/</g, "\\u003c"));
  fs.writeFileSync(path.join(SALIDA, "index.html"), portada);
  fs.writeFileSync(path.join(SALIDA, ".nojekyll"), "");
}

// ---------------------------------------------------------------------------

function leerJson(ruta) {
  try {
    return JSON.parse(fs.readFileSync(ruta, "utf8"));
  } catch (e) {
    errores.push(`${path.relative(RAIZ, ruta)}: JSON no válido (${e.message})`);
    return null;
  }
}

function datosDelHtml(html) {
  const titulo = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  const descripcion = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1]?.trim();
  return { titulo, descripcion };
}

// Fecha del primer commit que añadió el material; si no hay git, hoy.
function fechaDeAlta(ruta) {
  try {
    const salida = execSync(`git log --diff-filter=A --format=%as -- "${ruta}"`, {
      cwd: RAIZ,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim().split("\n").filter(Boolean);
    if (salida.length) return salida.at(-1);
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

function copiar(origen, destino) {
  fs.cpSync(origen, destino, {
    recursive: true,
    filter: (f) => !/(^|[\\/])(node_modules|\.git)([\\/]|$)/.test(f),
  });
}
