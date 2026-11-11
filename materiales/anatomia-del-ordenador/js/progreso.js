// Progreso del alumno. Se guarda solo en su navegador (localStorage).

const CLAVE = "anatomia-ordenador-v1";

function leer() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE));
    if (p && Array.isArray(p.vistas) && p.retos) return p;
  } catch {}
  return { vistas: [], retos: {} };
}

export let progreso = leer();

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(progreso));
  } catch {}
}

export function marcarVista(id) {
  if (progreso.vistas.includes(id)) return;
  progreso.vistas.push(id);
  guardar();
}

// `clave` identifica actividad y nivel, por ejemplo "reto-1".
export function anotarIntento(clave, aciertos, total) {
  const r = progreso.retos[clave] || { mejor: 0, total, intentos: 0 };
  r.mejor = Math.max(r.mejor, aciertos);
  r.total = total;
  r.intentos++;
  progreso.retos[clave] = r;
  guardar();
}

export function borrarProgreso() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {}
  progreso = leer();
}

export function estrellas(aciertos, total) {
  const parte = total ? aciertos / total : 0;
  return parte === 1 ? 3 : parte >= 0.75 ? 2 : parte >= 0.5 ? 1 : 0;
}
