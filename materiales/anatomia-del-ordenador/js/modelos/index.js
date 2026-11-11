// Una función por pieza. Cada una devuelve un Modelo (ver kit.js).
import { placa } from "./placa.js";
import { cpu } from "./cpu.js";
import { disipador } from "./disipador.js";
import { ram } from "./ram.js";
import { grafica } from "./grafica.js";
import { disco } from "./disco.js";
import { ssd } from "./ssd.js";
import { fuente } from "./fuente.js";
import { lector } from "./lector.js";
import { cables } from "./cables.js";
import { ajustes } from "./kit.js";

const MODELOS = { placa, cpu, disipador, ram, grafica, disco, ssd, fuente, lector, cables };

// Con `anonima`, los rótulos del modelo no dicen qué pieza es (para las preguntas).
export function construir(id, anonima = false) {
  ajustes.anonima = anonima;
  return MODELOS[id]();
}
