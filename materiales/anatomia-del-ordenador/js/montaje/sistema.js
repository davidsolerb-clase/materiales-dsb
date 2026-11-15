// Qué le pasa a este ordenador.
//
// El estado es una lista de elementos (piezas y cables) y cómo está cada uno:
// "bien", "falta" (quitado o desenchufado), "suelta" (mal pinchada) o "rota".
// `diagnostico` dice qué ocurre al pulsar el botón de encendido. Lo usan los
// talleres «Enciende» y «Repara»; el 3D solo enseña lo que esta función decide.

//   grupo     bajo qué título sale en la lista
//   verbo     cómo se llama quitarlo y volver a ponerlo
//   repuesto  si se puede cambiar por una pieza nueva (taller «Repara»)
//   fija      no se quita en «Enciende» (habría que desmontar medio ordenador)
//   sin       qué pasa sin él y por qué
export const ELEMENTOS = [
  { id: "ram1", nombre: "Memoria RAM, módulo 1", grupo: "Piezas", repuesto: true, sin: "El procesador necesita la memoria RAM para trabajar: sin ninguna, ni siquiera puede empezar." },
  { id: "ram2", nombre: "Memoria RAM, módulo 2", grupo: "Piezas", repuesto: true, sin: "El procesador necesita la memoria RAM para trabajar: sin ninguna, ni siquiera puede empezar." },
  { id: "grafica", nombre: "Tarjeta gráfica", grupo: "Piezas", repuesto: true, sin: "La tarjeta gráfica crea la imagen. Sin ella, al monitor no le llega nada que enseñar." },
  { id: "ssd", nombre: "Disco SSD", grupo: "Piezas", repuesto: true, sin: "El sistema operativo está guardado en el SSD. Si no lo encuentra, el ordenador no sabe por dónde seguir." },
  { id: "disco", nombre: "Disco duro", grupo: "Piezas", repuesto: true, sin: "En el disco duro están los archivos: fotos, vídeos y juegos. El ordenador arranca, pero no los encuentra." },
  { id: "fuente", nombre: "Fuente de alimentación", grupo: "Piezas", repuesto: true, fija: true, sin: "La fuente reparte la electricidad. Si falla, no le llega a ninguna pieza." },

  { id: "c24", nombre: "Corriente de la placa base", grupo: "Cables de corriente", sin: "Por este cable llega la electricidad a la placa base. Sin él, nada se enciende." },
  { id: "c8", nombre: "Corriente del procesador", grupo: "Cables de corriente", sin: "El procesador necesita su propio cable de corriente. Sin él, la placa se enciende pero el procesador no trabaja." },
  { id: "cpcie", nombre: "Corriente de la gráfica", grupo: "Cables de corriente", sin: "A la gráfica no le basta la electricidad de la ranura. Sin su cable, no puede crear la imagen." },
  { id: "cpufan", nombre: "Ventilador del disipador", grupo: "Cables de corriente", sin: "Sin ventilador, el calor del procesador no se va. Cuando se calienta demasiado, el ordenador se apaga solo para no quemarse." },
  { id: "ssd-corriente", nombre: "Corriente del SSD", grupo: "Cables de corriente", sin: "Sin corriente, el SSD no funciona, y en él está el sistema operativo." },
  { id: "disco-corriente", nombre: "Corriente del disco duro", grupo: "Cables de corriente", sin: "Sin corriente, el disco duro no gira y sus archivos no aparecen." },

  { id: "ssd-datos", nombre: "Datos del SSD", grupo: "Cables de datos", sin: "El SSD está encendido, pero sin cable de datos la placa no puede leer el sistema operativo." },
  { id: "disco-datos", nombre: "Datos del disco duro", grupo: "Cables de datos", sin: "El disco duro gira, pero sin cable de datos la placa no puede leer sus archivos." },
  { id: "panel", nombre: "Cable del botón de encendido", grupo: "Cables de datos", sin: "El botón de la caja solo avisa a la placa base. Sin su cable, la placa no se entera de que lo has pulsado." },

  { id: "corriente", nombre: "Cable del enchufe", grupo: "Por fuera", sin: "Sin este cable no llega la electricidad del enchufe a la fuente." },
  { id: "interruptor", nombre: "Interruptor de la fuente", grupo: "Por fuera", verbo: ["Apagar", "Encender"], sin: "Con el interruptor apagado, la fuente no deja pasar la corriente." },
  { id: "monitor", nombre: "Cable del monitor", grupo: "Por fuera", sin: "La gráfica crea la imagen, pero sin cable no llega al monitor." },
  { id: "teclado", nombre: "Teclado", grupo: "Por fuera", sin: "Al arrancar, el ordenador comprueba que hay un teclado. Si no lo encuentra, se queja." },
  { id: "raton", nombre: "Ratón", grupo: "Por fuera", sin: "El ordenador arranca sin ratón, pero no podrás mover el puntero." },
  { id: "red", nombre: "Cable de red", grupo: "Por fuera", sin: "El cable de red no hace falta para arrancar. Sin él, no hay internet." },
];
for (const x of ELEMENTOS) x.verbo ||= x.grupo === "Piezas" ? ["Quitar", "Poner"] : ["Desenchufar", "Enchufar"];
export const elemento = (id) => ELEMENTOS.find((x) => x.id === id);

export const SINTOMAS = {
  nada: { titulo: "No pasa nada", texto: "Ni luces ni ventiladores. Como si no hubieras pulsado el botón." },
  negro: { titulo: "Se enciende, pero la pantalla sigue en negro", texto: "Hay luces y giran los ventiladores, pero no aparece nada." },
  pitidos: { titulo: "Pita y no arranca", texto: "La placa base da tres pitidos. Es su forma de avisar de que algo falla." },
  "sin-senal": { titulo: "El monitor dice «Sin señal»", texto: "El ordenador parece encendido, pero al monitor no le llega imagen." },
  calor: { titulo: "Arranca y se apaga solo", texto: "Funciona unos segundos, avisa de que está muy caliente y se apaga." },
  "sin-sistema": { titulo: "No encuentra el sistema operativo", texto: "Comprueba las piezas y se queda parado con un mensaje de error." },
  "sin-teclado": { titulo: "Se queja de que no hay teclado", texto: "Se para con un mensaje: no detecta el teclado." },
  "a-medias": { titulo: "Arranca, pero le falta algo", texto: "Llega al escritorio, aunque no todo funciona." },
  bien: { titulo: "Arranca bien", texto: "Todas las piezas responden y aparece el escritorio." },
};
// Los que cuentan como avería para la lista de «descubiertas».
export const AVERIAS_POSIBLES = Object.keys(SINTOMAS).filter((s) => s !== "bien");

export const estadoSano = () => Object.fromEntries(ELEMENTOS.map((x) => [x.id, "bien"]));

// Qué pasa al encender. Devuelve { sintoma, causas, avisos, memoria }.
export function diagnostico(e) {
  const mal = (...ids) => ids.filter((id) => e[id] !== "bien");
  const hay = (causas, sintoma) => causas.length && { sintoma, causas, avisos: [], memoria: 0 };
  const sinMemoria = mal("ram1", "ram2").length === 2 ? ["ram1", "ram2"] : ["ram1", "ram2"].filter((id) => e[id] === "rota");
  const fallo =
    hay(mal("corriente", "interruptor", "fuente", "c24", "panel"), "nada") ||
    hay(mal("c8"), "negro") ||
    hay(sinMemoria, "pitidos") ||
    hay(mal("grafica", "cpcie", "monitor"), "sin-senal") ||
    hay(mal("cpufan"), "calor") ||
    hay(mal("ssd", "ssd-corriente", "ssd-datos"), "sin-sistema") ||
    hay(mal("teclado"), "sin-teclado");
  if (fallo) return fallo;
  const causas = mal("ram1", "ram2", "disco", "disco-corriente", "disco-datos", "raton", "red");
  const avisos = [];
  const memoria = 32 - mal("ram1", "ram2").length * 16;
  if (memoria < 32) avisos.push("Solo hay 16 GB de memoria");
  if (mal("disco", "disco-corriente", "disco-datos").length) avisos.push("No aparece el disco de datos");
  if (mal("raton").length) avisos.push("No hay ratón");
  if (mal("red").length) avisos.push("Sin internet");
  return { sintoma: causas.length ? "a-medias" : "bien", causas, avisos, memoria };
}

// Casos del taller «Repara». Para añadir uno, copia una línea y cambia la
// queja del cliente y el fallo. `nivel` 1: algo suelto o desenchufado, que se
// ve al revisarlo. `nivel` 2: una pieza rota, que solo se arregla cambiándola.
export const AVERIAS = [
  { nivel: 1, queja: "Le doy al botón y no hace nada de nada. Ayer lo limpié por detrás.", fallo: { interruptor: "falta" } },
  { nivel: 1, queja: "Se encienden las luces y giran los ventiladores, pero la pantalla se queda en negro.", fallo: { c8: "falta" } },
  { nivel: 1, queja: "Desde que lo cambié de mesa, pita al encender y no arranca.", fallo: { ram1: "suelta", ram2: "suelta" } },
  { nivel: 1, queja: "El ordenador parece que funciona, pero el monitor dice «Sin señal».", fallo: { monitor: "falta" } },
  { nivel: 1, queja: "Arranca, pero al poco rato se apaga solo.", fallo: { cpufan: "falta" } },
  { nivel: 1, queja: "Sale un mensaje en inglés y no entra en el sistema.", fallo: { "ssd-datos": "falta" } },
  { nivel: 2, queja: "No hace nada. He mirado los cables y están todos puestos.", fallo: { fuente: "rota" } },
  { nivel: 2, queja: "Pita tres veces al encender. La memoria está bien pinchada, la he mirado.", fallo: { ram2: "rota" } },
  { nivel: 2, queja: "«Sin señal» en el monitor. He probado con otro cable y sigue igual.", fallo: { grafica: "rota" } },
  { nivel: 2, queja: "Dice que no encuentra el sistema operativo. Se me cayó al suelo la semana pasada.", fallo: { ssd: "rota" } },
  { nivel: 2, queja: "Arranca bien, pero han desaparecido mis fotos y mis juegos. Y hacía un ruido raro.", fallo: { disco: "rota" } },
  { nivel: 2, queja: "La pantalla dice «Sin señal». La gráfica es nueva, me la pusieron ayer.", fallo: { cpcie: "falta" } },
];
