// Carné de técnico y código de resultado.
//
// El carné resume el progreso: piezas vistas y estrellas de cada nivel.
// El código es ese mismo resumen en diez letras, para que el alumno lo
// entregue (en un papel o en el aula virtual) y el docente lo lea en #/profe.
// No lleva nombres ni datos personales: solo cuenta estrellas.
//
// Si un alumno trabaja en varios dispositivos, tiene un código en cada uno.
// `suma` los junta y `nota` propone una calificación de 0 a 12.

import { PIEZAS } from "./datos.js";
import { progreso, estrellasDe } from "./progreso.js";

// Niveles que cuentan, en un orden que no debe cambiar: el código depende de él.
// Para añadir niveles, ponlos al final y sube VERSION.
const VERSION = 1;
const NIVELES = ["reto-1", "reto-2", "reto-3", "dentro-1", "dentro-2", "montaje-1", "montaje-2", "enciende-1", "enciende-2", "repara-1", "repara-2", "montaje-0", "montaje-3", "enciende-3", "repara-3"];
const LARGO = 10; // letras del código: 5 bits cada una
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0 ni 1, que se confunden
const RANGOS = [
  [0, "Aprendiz"],
  [8, "Ayudante de taller"],
  [18, "Montador"],
  [30, "Técnico"],
  [NIVELES.length * 3, "Maestro técnico"],
];

export function carne() {
  const estrellas = NIVELES.map((n) => (progreso.retos[n] ? estrellasDe(progreso.retos[n]) : 0));
  const total = estrellas.reduce((a, b) => a + b, 0);
  const vistas = PIEZAS.filter((p) => progreso.vistas.includes(p.id)).length;
  const i = RANGOS.findLastIndex(([minimo]) => total >= minimo);
  return {
    estrellas, total, vistas,
    maximo: NIVELES.length * 3,
    rango: RANGOS[i][1],
    siguiente: RANGOS[i + 1] ? { nombre: RANGOS[i + 1][1], faltan: RANGOS[i + 1][0] - total } : null,
    codigo: escribe(vistas, estrellas),
  };
}

// 3 bits de versión, 4 de piezas vistas, 2 por nivel y 9 de comprobación.
function escribe(vistas, estrellas) {
  let n = BigInt(VERSION);
  n = (n << 4n) | BigInt(vistas);
  for (const e of estrellas) n = (n << 2n) | BigInt(e);
  n = (n << 9n) | BigInt(resumen(n));
  let t = "";
  for (let i = 0; i < LARGO; i++) {
    t = LETRAS[Number(n & 31n)] + t;
    n >>= 5n;
  }
  return `${t.slice(0, LARGO / 2)}-${t.slice(LARGO / 2)}`;
}

function resumen(n) {
  let h = 317n;
  for (let x = n; x > 0n; x >>= 5n) h = (h * 31n + (x & 31n) + 7n) % 509n;
  return Number(h);
}

// Devuelve { vistas, niveles: [{ id, estrellas }] } o null si el código no vale.
export function leeCodigo(texto) {
  const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (limpio.length !== LARGO) return null;
  let n = 0n;
  for (const c of limpio) {
    const v = LETRAS.indexOf(c);
    if (v < 0) return null;
    n = (n << 5n) | BigInt(v);
  }
  const control = Number(n & 511n);
  n >>= 9n;
  if (resumen(n) !== control) return null;
  const estrellas = [];
  for (let i = 0; i < NIVELES.length; i++) {
    estrellas.unshift(Number(n & 3n));
    n >>= 2n;
  }
  const vistas = Number(n & 15n);
  if (Number(n >> 4n) !== VERSION || vistas > PIEZAS.length) return null;
  return { vistas, niveles: NIVELES.map((id, i) => ({ id, estrellas: estrellas[i] })) };
}

// ---------------------------------------------------------------- Nota

// Lo básico: lo que hay que dominar para llegar al 10.
// Dominar un nivel es sacar 2 estrellas (3 de cada 4 respuestas bien o más).
// Las piezas del atlas cuentan como un punto más; basta con ver VISTAS_BASICO.
export const BASICOS = ["reto-1", "reto-2", "dentro-1", "montaje-0", "montaje-1", "enciende-1", "repara-1"];
export const VISTAS_BASICO = 10;
// Del 10 al 12 no sube en línea recta: el primer escalón es fácil y el último,
// solo para quien lo ha hecho todo con tres estrellas.
const CURVA_EXTRA = 1.5;

// Junta varias lecturas de `leeCodigo` (un código por dispositivo).
// En cada nivel cuenta la mejor puntuación, así que repetir un nivel no suma dos veces.
export function suma(lecturas) {
  const niveles = NIVELES.map((id, i) => ({ id, estrellas: Math.max(0, ...lecturas.map((l) => l.niveles[i].estrellas)) }));
  return { vistas: Math.max(0, ...lecturas.map((l) => l.vistas)), niveles };
}

// De 0 a 10 mide lo básico. Por encima de 10 solo se llega con lo básico completo:
// las terceras estrellas de los niveles básicos y todos los niveles difíciles.
export function nota({ vistas, niveles }) {
  const est = Object.fromEntries(niveles.map((n) => [n.id, n.estrellas]));
  const basicos = [Math.min(1, vistas / VISTAS_BASICO), ...BASICOS.map((id) => Math.min(est[id], 2) / 2)];
  const basico = basicos.reduce((a, b) => a + b, 0) / basicos.length;
  const dificiles = NIVELES.filter((id) => !BASICOS.includes(id));
  const extras = [...dificiles.map((id) => est[id] / 3), ...BASICOS.map((id) => (est[id] === 3 ? 1 : 0))];
  const extra = extras.reduce((a, b) => a + b, 0) / extras.length;
  const completo = basico > 0.999;
  const valor = completo ? 10 + 2 * extra ** CURVA_EXTRA : 10 * basico;
  const redondo = Math.round(valor * 10) / 10;
  const faltan = BASICOS.filter((id) => est[id] < 2);
  const etiqueta = redondo >= 11.5 ? "Excelencia" : redondo > 10 ? "Va más allá de lo básico" : redondo === 10 ? "Domina lo básico" : redondo >= 8 ? "Casi domina lo básico" : redondo >= 5 ? "Lo básico, a medias" : "Lo básico, por empezar";
  return { nota: redondo, basico, extra, completo, faltan, faltanVistas: Math.max(0, VISTAS_BASICO - vistas), etiqueta };
}

export const esBasico = (id) => BASICOS.includes(id);
