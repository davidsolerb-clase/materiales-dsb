// El guion del taller de montaje: qué piezas hay en la bandeja y qué se pide
// en cada paso. Los textos viven aquí; la geometría, en mundo.js.
//
// Un paso lleva:
//   bloque     a cuál de los BLOQUES pertenece (1…5)
//   tipo       "pon" (llevar una pieza a un hueco), "toca" (tocar algo del
//              modelo), "tornillos" (con el destornillador) o "boton"
//   pieza      qué pieza de la bandeja se usa (solo en "pon")
//   zonas      huecos donde vale ponerla; puede ser una función del estado
//   guia       huecos que se iluminan en el nivel guiado, si no son todos
//   trampas    huecos que no valen, con la explicación de por qué
//   objetivos  qué hay que tocar (en "toca")
//   grupo      qué tornillos (en "tornillos"); con `quitar`, se desatornillan
//   comprueba  devuelve un mensaje si algo está mal (o nada)
//   hecho      lo que pasa en el modelo cuando sale bien
//   vista      desde dónde mira la cámara (ver Mundo.vista)
//   porque     para qué sirve el paso; se enseña debajo de la instrucción

export const BLOQUES = [
  "Abre la caja",
  "Prepara la placa base",
  "Monta las piezas en la caja",
  "Conecta los cables",
  "Cierra, conecta y enciende",
];

// Piezas de la bandeja. `foto` es una miniatura del atlas; si no hay, se
// hace una foto del modelo `muestra` (ver mundo.js).
export const PIEZAS = [
  { id: "placa", nombre: "Placa base", foto: "placa", bloque: 2 },
  { id: "cpu", nombre: "Procesador", foto: "cpu", bloque: 2 },
  { id: "pasta", nombre: "Pasta térmica", muestra: "pasta", bloque: 2 },
  { id: "disipador", nombre: "Disipador", foto: "disipador", bloque: 2 },
  { id: "cvent-cpu", nombre: "Cable del ventilador del disipador", muestra: "cvent", bloque: 2 },
  { id: "ram", nombre: "Memoria RAM", foto: "ram", bloque: 2, cantidad: 2 },
  { id: "fuente", nombre: "Fuente de alimentación", foto: "fuente", bloque: 3 },
  { id: "placa-montada", nombre: "Placa base, ya preparada", foto: "placa", bloque: 3 },
  { id: "ssd", nombre: "Disco SSD", foto: "ssd", bloque: 3 },
  { id: "disco", nombre: "Disco duro", foto: "disco", bloque: 3 },
  { id: "grafica", nombre: "Tarjeta gráfica", foto: "grafica", bloque: 3 },
  { id: "c24", nombre: "Cable de corriente de la placa (24 contactos)", muestra: "c24", bloque: 4, clase: "corriente" },
  { id: "c8", nombre: "Cable de corriente del procesador", muestra: "c8", bloque: 4, clase: "corriente" },
  { id: "cpcie", nombre: "Cable de corriente de la gráfica", muestra: "cpcie", bloque: 4, clase: "corriente" },
  { id: "csata", nombre: "Cable de corriente de los discos", muestra: "csata", bloque: 4, cantidad: 2, clase: "corriente" },
  { id: "cdatos", nombre: "Cable de datos SATA", muestra: "cdatos", bloque: 4, cantidad: 2, clase: "datos" },
  { id: "cdatos-fin", nombre: "El otro extremo del cable de datos", muestra: "cdatos", bloque: 4, cantidad: 2, clase: "datos", soloSiToca: true },
  { id: "cvent-caja", nombre: "Cable del ventilador de la caja", muestra: "cvent", bloque: 4 },
  { id: "cpanel", nombre: "Cable del botón de encendido", muestra: "cpanel", bloque: 4 },
  { id: "cmonitor", nombre: "Cable del monitor", muestra: "cmonitor", bloque: 5, clase: "datos" },
  { id: "teclado", nombre: "Teclado", muestra: "teclado", bloque: 5 },
  { id: "raton", nombre: "Ratón", muestra: "raton", bloque: 5 },
  { id: "cred", nombre: "Cable de red", muestra: "cred", bloque: 5, clase: "datos" },
  { id: "ccorriente", nombre: "Cable de corriente (al enchufe)", muestra: "ccorriente", bloque: 5, clase: "corriente" },
];

// Huecos que aparecen como candidatos en el nivel sin guía.
//   cap   cuántas cosas caben (1 si no se dice)
//   tras  paso que tiene que estar hecho para que el hueco exista
export const ZONAS = {
  alfombrilla: { bloque: 2 }, bandeja: { bloque: 2 },
  zocalo: { bloque: 2, tras: "abre-zocalo" }, cpu: { bloque: 2, cap: 2, tras: "cpu" },
  cpufan: { bloque: 2, tras: "placa-mesa" }, sysfan1: { bloque: 2, tras: "placa-mesa" }, sysfan2: { bloque: 2, tras: "placa-mesa" },
  ranura0: { bloque: 2, tras: "placa-mesa" }, ranura1: { bloque: 2, tras: "placa-mesa" }, ranura2: { bloque: 2, tras: "placa-mesa" }, ranura3: { bloque: 2, tras: "placa-mesa" },
  "hueco-fuente": { bloque: 3 }, "bahia-ssd": { bloque: 3 }, "bahia-disco": { bloque: 3 }, pcie: { bloque: 3, tras: "placa-caja" },
  atx24: { bloque: 4, tras: "placa-mesa" }, cpu8: { bloque: 4, tras: "placa-mesa" }, "toma-grafica": { bloque: 4 }, pines: { bloque: 4, tras: "placa-mesa" },
  "disco-corriente": { bloque: 4 }, "disco-datos": { bloque: 4 }, "ssd-corriente": { bloque: 4 }, "ssd-datos": { bloque: 4 },
  sata1: { bloque: 4, tras: "placa-mesa" }, sata2: { bloque: 4, tras: "placa-mesa" },
  "video-grafica": { bloque: 5, tras: "levanta" }, "video-placa": { bloque: 5, tras: "levanta" },
  "usb-a": { bloque: 5, cap: 2, tras: "levanta" }, "usb-b": { bloque: 5, cap: 2, tras: "levanta" }, "usb-c": { bloque: 5, cap: 2, tras: "levanta" },
  red: { bloque: 5, tras: "levanta" }, toma: { bloque: 5, tras: "levanta" },
};
export const BLOQUE_DE_ZONA = (id, bloque) => ZONAS[id] && (ZONAS[id].bloque === bloque || (bloque === 3 && id === "bandeja") || (bloque === 4 && id.startsWith("sysfan")));

const RANURAS = ["ranura0", "ranura1", "ranura2", "ranura3"];
const USB = ["usb-a", "usb-b", "usb-c"];
const ESTRECHO = "Ese es el conector estrecho, el de datos. El de corriente es el ancho.";
const ANCHO = "Ese es el conector ancho, el de corriente. El de datos es el estrecho.";
const cual = (zona) => zona.split("-")[0];

function ram(n) {
  return {
    id: `ram${n}`, bloque: 2, tipo: "pon", pieza: "ram", vista: "memoria", figura: "ram",
    zonas: RANURAS,
    guia: (e) => (n === 1 ? ["ranura1", "ranura3"] : [e.ram[0] === 1 ? "ranura3" : e.ram[0] === 3 ? "ranura1" : e.ram[0] === 0 ? "ranura2" : "ranura0"]),
    titulo: n === 1 ? "Pincha la memoria RAM" : "Pincha el segundo módulo de memoria",
    texto: n === 1
      ? "La muesca del módulo tiene que coincidir con el resalte de la ranura. Dale la vuelta si hace falta y pínchalo."
      : "Igual que el primero. Ponlo en una ranura del <b>mismo color</b> que la otra.",
    porque: n === 1
      ? "La muesca no está en el centro: así el módulo solo entra en una posición."
      : "Dos módulos en ranuras del mismo color trabajan en pareja y la memoria va más rápida.",
    comprueba: (e) => e.giro.ram !== 0 && "La muesca no coincide con el resalte de la ranura. Dale la vuelta al módulo. Nunca lo fuerces: se rompería la ranura.",
    hecho(m, e, zona) {
      const i = RANURAS.indexOf(zona);
      m.ponRam(n, i);
      if (n === 2 && i % 2 !== e.ram[0] % 2) e.consejo = "Funciona, pero es mejor que los dos módulos estén en ranuras del mismo color: así trabajan en pareja.";
      e.ram.push(i);
      e.giro.ram = 1;
    },
  };
}

function datos(n) {
  return [
    {
      id: `datos${n}-placa`, bloque: 4, tipo: "pon", pieza: "cdatos", vista: "datos", zonas: ["sata1", "sata2"],
      titulo: n === 1 ? "Enchufa un cable de datos en la placa" : "Enchufa el segundo cable de datos",
      texto: "Los cables de datos son los <b>azules</b>. Enchufa un extremo en un puerto <b>SATA</b> de la placa base.",
      porque: n === 1 ? "Por este cable viajan los archivos entre el disco y la placa base." : "Cada disco necesita su propio cable de datos.",
      hecho: (m, e, zona) => m.cableDatosPlaca(n, zona),
    },
    {
      id: `datos${n}-disco`, bloque: 4, tipo: "pon", pieza: "cdatos-fin", vista: "tomas", zonas: ["disco-datos", "ssd-datos"],
      trampas: { "disco-corriente": ANCHO, "ssd-corriente": ANCHO },
      titulo: "Lleva el otro extremo a un disco",
      texto: n === 1 ? "Enchúfalo en el conector <b>estrecho</b> de uno de los discos." : "Enchúfalo en el conector estrecho del disco que queda.",
      porque: "Cada disco lleva dos cables: el de corriente, que le da electricidad, y el de datos, por donde pasa la información.",
      hecho: (m, e, zona) => m.cableDatosDisco(n, cual(zona)),
    },
  ];
}

function corrienteDisco(n) {
  return {
    id: `corriente-disco${n}`, bloque: 4, tipo: "pon", pieza: "csata", vista: "tomas", zonas: ["disco-corriente", "ssd-corriente"],
    trampas: { "disco-datos": ESTRECHO, "ssd-datos": ESTRECHO },
    titulo: n === 1 ? "Da corriente a un disco" : "Da corriente al otro disco",
    texto: n === 1 ? "Enchufa el cable en el conector <b>ancho</b> de uno de los discos." : "El mismo cable tiene otro conector más adelante. Enchúfalo en el disco que queda.",
    porque: n === 1 ? "Sin corriente, el disco ni gira ni guarda nada." : "Un solo cable de la fuente puede dar corriente a varios discos, uno detrás de otro.",
    hecho(m, e, zona) {
      m.cableCorrienteDisco(cual(zona), !e.conCorriente);
      e.conCorriente = true;
    },
  };
}

function usb(pieza, nombre) {
  return {
    id: pieza, bloque: 5, tipo: "pon", pieza, vista: "detras", zonas: USB,
    titulo: `Conecta el ${nombre}`,
    texto: `Enchufa el ${nombre} en un puerto <b>USB</b> libre de la parte de atrás.`,
    porque: "El USB sirve para casi todo: teclado, ratón, memorias, impresoras… Por eso hay varios.",
    hecho: (m, e, zona) => m.conecta(pieza, zona, e.ocupadas[zona] || 0),
  };
}

export const PASOS = [
  // ---------------------------------------------------------------- 1. Abre la caja
  {
    id: "tornillos-panel", bloque: 1, tipo: "tornillos", grupo: "panel", quitar: true, vista: "trasera",
    titulo: "Quita los tornillos del panel",
    texto: "Coge el <b>destornillador</b> y toca los dos tornillos del borde, en la parte de atrás de la caja.",
    porque: "El panel lateral va sujeto con tornillos para que la caja no se abra sola.",
  },
  {
    id: "quita-panel", bloque: 1, tipo: "toca", objetivos: ["panel"], vista: "caja",
    titulo: "Retira el panel lateral",
    texto: "Toca el panel de cristal para quitarlo.",
    porque: "La caja está tumbada: así las piezas entran desde arriba y no se caen mientras las colocas.",
    hecho: (m) => m.quitaPanel(),
  },

  // ---------------------------------------------------------------- 2. Prepara la placa base
  {
    id: "placa-mesa", bloque: 2, tipo: "pon", pieza: "placa", zonas: ["alfombrilla"], vista: "alfombrilla",
    trampas: { bandeja: "Todavía no. Es más fácil ponerle el procesador, el disipador y la memoria con la placa fuera de la caja." },
    titulo: "Pon la placa base sobre la alfombrilla",
    texto: "Elige la placa base en la bandeja de piezas y toca la alfombrilla azul.",
    porque: "La alfombrilla evita que la electricidad estática, la de los calambres, estropee los chips.",
    hecho: (m) => m.ponPlacaEnMesa(),
  },
  {
    id: "abre-zocalo", bloque: 2, tipo: "toca", objetivos: ["palanca"], vista: "zocalo",
    titulo: "Abre el zócalo",
    texto: "Toca la palanca que hay junto al zócalo para levantar su tapa.",
    porque: "El zócalo es el hueco del procesador. La tapa lo sujeta para que no se mueva.",
    hecho: (m) => m.palanca(true),
  },
  {
    id: "cpu", bloque: 2, tipo: "pon", pieza: "cpu", zonas: ["zocalo"], vista: "zocalo", figura: "cpu",
    titulo: "Coloca el procesador",
    texto: "Busca el <b>triángulo dorado</b> de una esquina del procesador. Tiene que quedar sobre el triángulo del zócalo. Gíralo hasta que coincidan y déjalo caer, sin apretar.",
    porque: "El procesador tiene cientos de contactos diminutos. Solo encaja en una posición.",
    comprueba: (e) => e.giro.cpu !== 0 && "El triángulo no coincide. Si lo fuerzas, doblas los contactos y el procesador ya no sirve. Gíralo antes de colocarlo.",
    hecho: (m) => m.ponCpu(),
  },
  {
    id: "cierra-zocalo", bloque: 2, tipo: "toca", objetivos: ["palanca"], vista: "zocalo",
    titulo: "Cierra el zócalo",
    texto: "Toca otra vez la palanca para bajar la tapa.",
    porque: "La tapa aprieta el procesador contra sus contactos.",
    hecho: (m) => m.palanca(false),
  },
  {
    id: "pasta", bloque: 2, tipo: "pon", pieza: "pasta", zonas: ["cpu"], vista: "zocalo",
    titulo: "Pon la pasta térmica",
    texto: "Pon una gota de pasta térmica, del tamaño de un guisante, en el centro del procesador.",
    porque: "La pasta rellena los huecos diminutos entre el procesador y el disipador. Sin ella, el calor no pasa bien y el procesador se calienta demasiado.",
    hecho: (m) => m.ponPasta(),
  },
  {
    id: "disipador", bloque: 2, tipo: "pon", pieza: "disipador", zonas: ["cpu"], vista: "disipador",
    titulo: "Coloca el disipador",
    texto: "Pon el disipador justo encima del procesador.",
    porque: "El procesador se calienta mucho al trabajar. El disipador recoge ese calor y el ventilador se lo lleva.",
    hecho: (m) => m.ponDisipador(),
  },
  {
    id: "anclajes", bloque: 2, tipo: "toca", objetivos: ["anclaje0", "anclaje1", "anclaje2", "anclaje3"], vista: "disipador",
    titulo: "Aprieta los cuatro anclajes",
    texto: "Toca los cuatro anclajes para apretarlos. Mejor en cruz: uno y luego el de la esquina contraria.",
    porque: "Apretando en cruz, el disipador queda plano y toca todo el procesador.",
    hecho: (m, e, id) => m.aprietaAnclaje(+id.slice(-1)),
  },
  {
    id: "vent-cpu", bloque: 2, tipo: "pon", pieza: "cvent-cpu", zonas: ["cpufan"], vista: "disipador",
    trampas: {
      sysfan1: "Ese conector es SYS_FAN: es para los ventiladores de la caja. El del disipador va en CPU_FAN.",
      sysfan2: "Ese conector es SYS_FAN: es para los ventiladores de la caja. El del disipador va en CPU_FAN.",
    },
    titulo: "Enchufa el ventilador del disipador",
    texto: "Lee los rótulos impresos en la placa y enchufa el cable en el conector <b>CPU_FAN</b>.",
    porque: "Por ese conector la placa da corriente al ventilador y decide a qué velocidad gira.",
    hecho: (m) => m.cableVentiladorCpu(),
  },
  ram(1),
  ram(2),

  // ---------------------------------------------------------------- 3. Monta las piezas en la caja
  {
    id: "fuente", bloque: 3, tipo: "pon", pieza: "fuente", zonas: ["hueco-fuente"], vista: "caja",
    titulo: "Coloca la fuente de alimentación",
    texto: "La fuente va en la esquina de abajo, con el enchufe asomando por detrás de la caja.",
    porque: "La fuente convierte la electricidad del enchufe en la que necesitan las piezas.",
    hecho: (m) => m.ponFuente(),
  },
  {
    id: "tornillos-fuente", bloque: 3, tipo: "tornillos", grupo: "fuente", vista: "trasera",
    titulo: "Atornilla la fuente",
    texto: "Pon los cuatro tornillos por la parte de atrás de la caja.",
    porque: "La fuente pesa. Los tornillos evitan que se mueva al transportar el ordenador.",
  },
  {
    id: "placa-caja", bloque: 3, tipo: "pon", pieza: "placa-montada", zonas: ["bandeja"], vista: "general",
    titulo: "Mete la placa base en la caja",
    texto: "Lleva la placa, con todo lo que le has montado, al fondo de la caja. Sus puertos tienen que asomar por la ventana de atrás.",
    porque: "La placa se apoya sobre unos separadores dorados. Así no toca la chapa y no hay cortocircuitos.",
    hecho: (m) => m.ponPlacaEnCaja(),
  },
  {
    id: "tornillos-placa", bloque: 3, tipo: "tornillos", grupo: "placa", vista: "placa",
    titulo: "Atornilla la placa base",
    texto: "Pon un tornillo en cada uno de los seis agujeros de la placa.",
    porque: "Cada tornillo entra en un separador y deja la placa bien sujeta.",
  },
  {
    id: "ssd", bloque: 3, tipo: "pon", pieza: "ssd", zonas: ["bahia-ssd"], vista: "discos",
    trampas: { "bahia-disco": "Esa bandeja es la grande, la del disco duro. El SSD es más pequeño y va en la otra." },
    titulo: "Coloca el disco SSD",
    texto: "El SSD va en la bandeja pequeña.",
    porque: "En el SSD se instala el sistema operativo: como es muy rápido, el ordenador arranca en segundos.",
    hecho: (m) => m.ponSsd(),
  },
  {
    id: "disco", bloque: 3, tipo: "pon", pieza: "disco", zonas: ["bahia-disco"], vista: "discos",
    trampas: { "bahia-ssd": "Ahí no cabe: esa bandeja es para el SSD. El disco duro va en la grande." },
    titulo: "Coloca el disco duro",
    texto: "El disco duro va en la bandeja grande.",
    porque: "El disco duro es más lento que el SSD, pero guarda mucho más: fotos, vídeos y juegos.",
    hecho: (m) => m.ponDisco(),
  },
  {
    id: "tapas", bloque: 3, tipo: "toca", objetivos: ["tapa0", "tapa1"], vista: "ranuras",
    titulo: "Quita dos tapas de la parte trasera",
    texto: "Toca las dos tapas metálicas que quedan a la altura de la ranura larga de la placa.",
    porque: "Por ese hueco asomarán las salidas de vídeo de la tarjeta gráfica.",
    hecho: (m, e, id) => m.quitaTapa(+id.slice(-1)),
  },
  {
    id: "grafica", bloque: 3, tipo: "pon", pieza: "grafica", zonas: ["pcie"], vista: "grafica",
    titulo: "Pincha la tarjeta gráfica",
    texto: "La gráfica va de canto en la <b>ranura larga</b> de la placa, con sus contactos dorados hacia abajo.",
    porque: "Por la ranura la gráfica recibe los datos del procesador y los convierte en imágenes.",
    hecho: (m) => m.ponGrafica(),
  },
  {
    id: "tornillo-grafica", bloque: 3, tipo: "tornillos", grupo: "grafica", vista: "trasera",
    titulo: "Atornilla la gráfica",
    texto: "Pon el tornillo que sujeta la chapa de la gráfica a la caja.",
    porque: "La gráfica es larga y pesada. Sin tornillo, podría soltarse de la ranura.",
  },

  // ---------------------------------------------------------------- 4. Conecta los cables
  {
    id: "c24", bloque: 4, tipo: "pon", pieza: "c24", zonas: ["atx24"], vista: "cables",
    trampas: { cpu8: "Ahí no cabe: ese conector pequeño es el de la corriente del procesador. El cable grande va en el conector largo, a la derecha de la memoria." },
    titulo: "Da corriente a la placa base",
    texto: "Los cables de corriente son los <b>naranjas</b> y salen todos de la fuente. Enchufa el más grande en el conector largo de la placa.",
    porque: "Es el cable principal: por él llega la electricidad a la placa y, desde ella, a la memoria y a casi todo lo demás.",
    hecho: (m) => m.cable24(),
  },
  {
    id: "c8", bloque: 4, tipo: "pon", pieza: "c8", zonas: ["cpu8"], vista: "cables",
    trampas: { atx24: "Ese es el conector grande de la placa. El del procesador es el pequeño de la esquina, rotulado CPU 12V." },
    titulo: "Da corriente al procesador",
    texto: "Enchufa este cable en el conector <b>CPU 12V</b>, en la esquina de la placa, cerca del procesador.",
    porque: "El procesador gasta tanta electricidad que necesita un cable solo para él. Es el que más se olvida: sin él, el ordenador no arranca.",
    hecho: (m) => m.cableCpu(),
  },
  {
    id: "cpcie", bloque: 4, tipo: "pon", pieza: "cpcie", zonas: ["toma-grafica"], vista: "grafica",
    titulo: "Da corriente a la tarjeta gráfica",
    texto: "Enchufa el cable en el conector que tiene la gráfica en su borde de arriba.",
    porque: "La ranura de la placa da poca electricidad. Una gráfica potente necesita más y la coge directamente de la fuente.",
    hecho: (m) => m.cableGrafica(),
  },
  corrienteDisco(1),
  corrienteDisco(2),
  ...datos(1),
  ...datos(2),
  {
    id: "vent-caja", bloque: 4, tipo: "pon", pieza: "cvent-caja", zonas: ["sysfan1", "sysfan2"], vista: "placa",
    trampas: { cpufan: "Ese conector ya está ocupado por el ventilador del disipador. El de la caja va en un SYS_FAN." },
    titulo: "Enchufa el ventilador de la caja",
    texto: "El ventilador trasero de la caja va en un conector <b>SYS_FAN</b> de la placa.",
    porque: "Ese ventilador saca de la caja el aire caliente que sueltan las piezas.",
    hecho: (m, e, zona) => m.cableVentiladorCaja(zona),
  },
  {
    id: "cpanel", bloque: 4, tipo: "pon", pieza: "cpanel", zonas: ["pines"], vista: "datos",
    titulo: "Conecta el botón de encendido",
    texto: "El cable fino que viene del botón de la caja va en los pines rotulados <b>PANEL</b>, en el borde de la placa.",
    porque: "El botón de la caja no enciende nada por sí mismo: solo avisa a la placa base de que lo has pulsado.",
    hecho: (m) => m.cablePanel(),
  },

  // ---------------------------------------------------------------- 5. Cierra, conecta y enciende
  {
    id: "pon-panel", bloque: 5, tipo: "toca", objetivos: ["panel"], marca: true, vista: "caja",
    titulo: "Vuelve a poner el panel lateral",
    texto: "Repasa que no queda ningún cable suelto y toca la caja para cerrarla.",
    porque: "Cerrada, el aire circula como debe y no entra polvo.",
    hecho: (m) => m.ponPanel(),
  },
  {
    id: "cierra-panel", bloque: 5, tipo: "tornillos", grupo: "panel", vista: "trasera",
    titulo: "Atornilla el panel",
    texto: "Pon otra vez los dos tornillos del panel.",
    porque: "Ya está montado por dentro. Falta conectarlo con lo de fuera.",
  },
  {
    id: "levanta", bloque: 5, tipo: "boton", rotulo: "Poner la torre de pie", vista: "general", vistaTras: "dePie",
    titulo: "Pon la torre de pie",
    texto: "El ordenador ya está montado. Ponlo de pie, como va a estar en la mesa.",
    porque: "Ahora toca conectar los periféricos: los aparatos con los que tú hablas con el ordenador y él contigo.",
    hecho: (m) => m.levanta(),
  },
  {
    id: "monitor", bloque: 5, tipo: "pon", pieza: "cmonitor", zonas: ["video-grafica"], vista: "detras",
    trampas: { "video-placa": "Esa salida de vídeo es la de la placa base. Si el ordenador tiene tarjeta gráfica, el monitor se conecta a la gráfica: si no, la estarías desaprovechando." },
    titulo: "Conecta el monitor",
    texto: "Enchufa el cable del monitor en una salida de vídeo de la <b>tarjeta gráfica</b>.",
    porque: "La gráfica crea las imágenes y por este cable se las manda al monitor.",
    hecho: (m, e, zona) => m.conecta("monitor", zona),
  },
  usb("teclado", "teclado"),
  usb("raton", "ratón"),
  {
    id: "red", bloque: 5, tipo: "pon", pieza: "cred", zonas: ["red"], vista: "detras",
    titulo: "Conecta el cable de red",
    texto: "El cable de red va en el puerto cuadrado que hay encima de dos USB.",
    porque: "Por este cable el ordenador se conecta a internet. También podría hacerlo por wifi.",
    hecho: (m, e, zona) => m.conecta("red", zona),
  },
  {
    id: "corriente", bloque: 5, tipo: "pon", pieza: "ccorriente", zonas: ["toma"], vista: "enchufe",
    titulo: "Enchufa el ordenador",
    texto: "Conecta el cable de corriente en la toma de la fuente de alimentación.",
    porque: "Es lo último que se enchufa: nunca se trabaja dentro de un ordenador conectado a la corriente.",
    hecho: (m, e, zona) => m.conecta("corriente", zona),
  },
  {
    id: "interruptor", bloque: 5, tipo: "toca", objetivos: ["interruptor"], vista: "enchufe",
    titulo: "Enciende la fuente",
    texto: "Toca el interruptor rojo de la fuente para dejar pasar la corriente.",
    porque: "Con el interruptor apagado no llega electricidad a ninguna pieza.",
    hecho: (m) => m.interruptor(),
  },
  {
    id: "enciende", bloque: 5, tipo: "toca", objetivos: ["boton"], vista: "arriba", vistaTras: "dePie",
    titulo: "Pulsa el botón de encendido",
    texto: "El botón está en el techo de la torre. Púlsalo y mira el monitor.",
    porque: "Lo primero que arranca es la BIOS, un programa pequeño guardado en un chip de la placa base. Comprueba una a una que todas las piezas responden y después busca el sistema operativo.",
    hecho: (m) => new Promise((listo) => m.enciende(listo)),
  },
];

// Nivel «Lo esencial»: solo se piden estos pasos. Los demás los hace el taller.
export const ESENCIALES = new Set(["placa-mesa", "cpu", "pasta", "disipador", "ram1", "ram2", "fuente", "placa-caja", "ssd", "disco", "grafica", "c24", "monitor", "teclado", "raton", "corriente", "enciende"]);

// Nivel «Por tu cuenta»: qué tiene que estar hecho antes de cada paso.
// En los demás niveles el orden es el de la lista PASOS.
const DENTRO = PASOS.filter((p) => p.bloque === 3 || p.bloque === 4).map((p) => p.id);
export const TRAS = {
  "quita-panel": ["tornillos-panel"],
  "abre-zocalo": ["placa-mesa"], cpu: ["abre-zocalo"], "cierra-zocalo": ["cpu"], pasta: ["cierra-zocalo"], disipador: ["pasta"],
  anclajes: ["disipador"], "vent-cpu": ["disipador"], ram1: ["placa-mesa"], ram2: ["ram1"],
  fuente: ["quita-panel"], "tornillos-fuente": ["fuente"],
  "placa-caja": ["quita-panel", "anclajes", "vent-cpu", "ram2"], "tornillos-placa": ["placa-caja"],
  ssd: ["quita-panel"], disco: ["quita-panel"], tapas: ["quita-panel"], grafica: ["tornillos-placa", "tapas"], "tornillo-grafica": ["grafica"],
  c24: ["fuente", "tornillos-placa"], c8: ["fuente", "tornillos-placa"], cpcie: ["fuente", "grafica"],
  "corriente-disco1": ["fuente", "ssd", "disco"], "corriente-disco2": ["corriente-disco1"],
  "datos1-placa": ["tornillos-placa", "ssd", "disco"], "datos1-disco": ["datos1-placa"], "datos2-placa": ["datos1-disco"], "datos2-disco": ["datos2-placa"],
  "vent-caja": ["tornillos-placa"], cpanel: ["tornillos-placa"],
  "pon-panel": DENTRO, "cierra-panel": ["pon-panel"], levanta: ["cierra-panel"],
  monitor: ["levanta"], teclado: ["levanta"], raton: ["levanta"], red: ["levanta"], corriente: ["levanta"],
  interruptor: ["corriente"], enciende: ["interruptor", "monitor", "teclado", "raton", "red"],
};

// Dibujos de orientación: cómo está girada la pieza frente a su hueco.
export const FIGURAS = {
  cpu: (e) => `
    <svg viewBox="0 0 220 120" role="img" aria-label="Procesador y zócalo">
      <g transform="translate(60 60)">
        <rect x="-44" y="-44" width="88" height="88" rx="6" fill="#e8e2d0"/>
        <rect x="-32" y="-32" width="64" height="64" fill="#2a2418"/>
        <path d="M-44 44h20l-20-20z" fill="#f2c14e"/>
      </g>
      <g transform="translate(160 60) rotate(${e.giro.cpu * 90})" class="gira">
        <rect x="-40" y="-40" width="80" height="80" rx="4" fill="#1f8a5c"/>
        <rect x="-30" y="-30" width="60" height="60" rx="6" fill="#cfd4dc"/>
        <path d="M-40 40h18l-18-18z" fill="#f2c14e"/>
      </g>
      <text x="60" y="116" text-anchor="middle">Zócalo</text><text x="160" y="116" text-anchor="middle">Procesador</text>
    </svg>`,
  ram: (e) => `
    <svg viewBox="0 0 220 120" role="img" aria-label="Módulo de memoria y ranura">
      <g transform="translate(110 34) scale(${e.giro.ram ? -1 : 1} 1)" class="gira">
        <rect x="-96" y="-22" width="192" height="36" rx="3" fill="#2a2e37"/>
        <rect x="-96" y="14" width="192" height="10" fill="#f2c14e"/>
        <rect x="-26" y="12" width="9" height="13" fill="#131a2e"/>
      </g>
      <g transform="translate(110 88)">
        <rect x="-100" y="-8" width="200" height="16" rx="3" fill="#4a4f5a"/>
        <rect x="-96" y="-3" width="192" height="6" fill="#15171c"/>
        <rect x="-26" y="-4" width="9" height="8" fill="#e8e2d0"/>
      </g>
      <text x="110" y="116" text-anchor="middle">Ranura</text>
    </svg>`,
};
