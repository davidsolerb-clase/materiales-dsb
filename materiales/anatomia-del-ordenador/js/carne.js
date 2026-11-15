// Carné de técnico y código de resultado.
//
// El carné resume el progreso: piezas vistas y estrellas de cada nivel.
// El código es ese mismo resumen en diez letras, para que el alumno lo
// entregue (en un papel o en el aula virtual) y el docente lo lea en #/profe.
// No lleva nombres ni datos personales: solo cuenta estrellas.

import { PIEZAS } from "./datos.js";
import { progreso, estrellasDe } from "./progreso.js";

// Niveles que cuentan, en un orden que no debe cambiar: el código depende de él.
// Para añadir niveles, ponlos al final y sube VERSION.
const VERSION = 1;
const NIVELES = ["reto-1", "reto-2", "reto-3", "dentro-1", "dentro-2", "montaje-1", "montaje-2", "enciende-1", "enciende-2", "repara-1", "repara-2", "montaje-0", "montaje-3", "enciende-3", "repara-3", "montaje-4"];
const LARGO = 10; // letras del código: 5 bits cada una
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0 ni 1, que se confunden
const RANGOS = [
  [0, "Aprendiz"],
  [8, "Ayudante de taller"],
  [18, "Montador"],
  [32, "Técnico"],
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

// 3 bits de versión, 5 de piezas vistas, 2 por nivel y 9 de comprobación.
function escribe(vistas, estrellas) {
  let n = BigInt(VERSION);
  n = (n << 5n) | BigInt(vistas);
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
  const vistas = Number(n & 31n);
  if (Number(n >> 5n) !== VERSION || vistas > PIEZAS.length) return null;
  return { vistas, niveles: NIVELES.map((id, i) => ({ id, estrellas: estrellas[i] })) };
}
