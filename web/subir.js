// Sube un material al repositorio con la API de GitHub, sin servidor.
// Hace un único commit con todos los archivos y la ficha; eso dispara la
// publicación de la web.
const REPO = "davidsolerb-clase/materiales-dsb";
const RAMA = "main";
const API = `https://api.github.com/repos/${REPO}`;
const CLAVE_TOKEN = "materiales-dsb:token";

const $ = (id) => document.getElementById(id);
let archivos = [];
let slugTocado = false;

iniciar();

async function iniciar() {
  $("token").value = leerToken();
  $("recordar").checked = Boolean(leerToken());

  try {
    const { categorias } = await (await fetch("catalogo.json")).json();
    casillas($("asignaturas"), "asignatura", categorias.asignaturas);
    casillas($("cursos"), "curso", categorias.cursos);
  } catch {
    estado("No se han podido cargar las asignaturas. Recarga la página.", "error");
  }

  $("archivos").addEventListener("change", elegirArchivos);
  $("titulo").addEventListener("input", () => {
    if (!slugTocado) $("slug").value = aSlug($("titulo").value);
  });
  $("slug").addEventListener("input", () => (slugTocado = true));
  $("form").addEventListener("submit", enviar);
}

async function elegirArchivos() {
  archivos = [...$("archivos").files];
  const htmls = archivos.filter((f) => f.name.endsWith(".html"));
  const principal = htmls.find((f) => f.name === "index.html") || (htmls.length === 1 ? htmls[0] : null);

  $("lista-archivos").replaceChildren(...archivos.map((f) => {
    const li = document.createElement("li");
    li.textContent = f === principal && f.name !== "index.html" ? `${f.name} → index.html` : f.name;
    return li;
  }));

  if (!principal) {
    estado(htmls.length ? "Hay varios HTML: uno debe llamarse index.html." : "Falta el archivo HTML.", "error");
    return;
  }
  estado("");
  const html = await principal.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!$("titulo").value) $("titulo").value = doc.title.trim();
  if (!$("descripcion").value) $("descripcion").value = doc.querySelector('meta[name="description"]')?.content || "";
  if (!slugTocado) $("slug").value = aSlug($("titulo").value || principal.name.replace(/\.html$/, ""));
}

async function enviar(e) {
  e.preventDefault();
  const token = $("token").value.trim();
  const slug = $("slug").value.trim();
  const titulo = $("titulo").value.trim();

  if (!token) return estado("Falta el token de GitHub.", "error");
  if (!archivos.length) return estado("Elige al menos el archivo HTML.", "error");
  if (!titulo) return estado("Falta el título.", "error");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return estado("El nombre de la carpeta solo admite minúsculas, números y guiones.", "error");
  const htmls = archivos.filter((f) => f.name.endsWith(".html"));
  const principal = htmls.find((f) => f.name === "index.html") || (htmls.length === 1 ? htmls[0] : null);
  if (!principal) return estado("Uno de los HTML debe llamarse index.html.", "error");

  guardarToken(token, $("recordar").checked);
  $("enviar").disabled = true;

  try {
    const gh = cliente(token);
    estado("Comprobando…");
    if (await gh("GET", `/contents/materiales/${slug}?ref=${RAMA}`, null, true)) {
      throw new Error(`Ya existe un material llamado "${slug}". Elige otro nombre de carpeta.`);
    }

    const ficha = {
      titulo,
      descripcion: $("descripcion").value.trim(),
      asignaturas: marcadas("asignatura"),
      cursos: marcadas("curso"),
      etiquetas: $("etiquetas").value.split(",").map((t) => t.trim()).filter(Boolean),
      hecho_con: $("hecho_con").value.trim(),
      fecha: new Date().toISOString().slice(0, 10),
      estado: $("borrador").checked ? "borrador" : "listo",
    };
    for (const k of Object.keys(ficha)) if (ficha[k] === "" || ficha[k]?.length === 0) delete ficha[k];

    const entradas = [
      ...archivos.map((f) => ({ ruta: f === principal ? "index.html" : f.name, archivo: f })),
      { ruta: "ficha.json", texto: JSON.stringify(ficha, null, 2) + "\n" },
    ];

    const ref = await gh("GET", `/git/ref/heads/${RAMA}`);
    const base = await gh("GET", `/git/commits/${ref.object.sha}`);

    const arbol = [];
    for (const [i, en] of entradas.entries()) {
      estado(`Subiendo ${en.ruta} (${i + 1} de ${entradas.length})…`);
      const contenido = en.archivo ? await aBase64(en.archivo) : btoa(unescape(encodeURIComponent(en.texto)));
      const blob = await gh("POST", "/git/blobs", { content: contenido, encoding: "base64" });
      arbol.push({ path: `materiales/${slug}/${en.ruta}`, mode: "100644", type: "blob", sha: blob.sha });
    }

    estado("Guardando…");
    const tree = await gh("POST", "/git/trees", { base_tree: base.tree.sha, tree: arbol });
    const commit = await gh("POST", "/git/commits", {
      message: `Añade material: ${titulo}`,
      tree: tree.sha,
      parents: [ref.object.sha],
    });
    await gh("PATCH", `/git/refs/heads/${RAMA}`, { sha: commit.sha });

    const url = new URL(`materiales/${slug}/`, location.href).href;
    estado(`Hecho. Estará en ${url} en un par de minutos.`, "ok", url);
    $("form").reset();
    $("token").value = leerToken();
    $("recordar").checked = Boolean(leerToken());
    $("lista-archivos").replaceChildren();
    archivos = [];
    slugTocado = false;
  } catch (err) {
    estado(err.message, "error");
  } finally {
    $("enviar").disabled = false;
  }
}

function cliente(token) {
  return async (metodo, ruta, cuerpo, permitir404 = false) => {
    const res = await fetch(API + ruta, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    if (permitir404 && res.status === 404) return null;
    if (res.status === 401) throw new Error("GitHub no acepta el token. Revisa que esté bien copiado y no haya caducado.");
    if (res.status === 403 || res.status === 404) throw new Error("El token no tiene permiso para escribir en este repositorio. Dale Contents: Read and write.");
    if (res.status === 409 || res.status === 422) throw new Error("El repositorio ha cambiado mientras subías. Vuelve a pulsar Publicar.");
    if (!res.ok) throw new Error(`GitHub ha respondido con un error (${res.status}). Prueba otra vez en un momento.`);
    return res.json();
  };
}

// ---------------------------------------------------------------------------

function casillas(contenedor, nombre, opciones) {
  for (const [valor, texto] of Object.entries(opciones)) {
    const label = document.createElement("label");
    label.className = "casilla";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = nombre;
    input.value = valor;
    input.id = `${nombre}-${valor}`;
    label.append(input, " ", texto);
    contenedor.append(label);
  }
}

function marcadas(nombre) {
  return [...document.querySelectorAll(`input[name="${nombre}"]:checked`)].map((i) => i.value);
}

function estado(texto, tipo = "", enlace) {
  const p = $("estado");
  p.className = `estado ${tipo}`;
  p.textContent = texto;
  if (enlace) {
    p.textContent = "Hecho. Estará publicado en un par de minutos: ";
    const a = document.createElement("a");
    a.href = enlace;
    a.textContent = enlace;
    p.append(a);
  }
}

function aSlug(t) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function aBase64(archivo) {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(lector.result.split(",")[1]);
    lector.onerror = mal;
    lector.readAsDataURL(archivo);
  });
}

function leerToken() {
  try { return localStorage.getItem(CLAVE_TOKEN) || ""; } catch { return ""; }
}

function guardarToken(token, recordar) {
  try {
    if (recordar) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {}
}
