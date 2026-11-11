// Las piezas del ordenador. Es el único sitio donde viven sus nombres y textos:
// el atlas y las actividades los leen de aquí.
//
// Para añadir una pieza: crea su modelo en modelos/, añádela a esta lista
// y genera sus dos imágenes en miniaturas/ (cerrada y abierta).
//
//   el         artículo, para escribir «es el disco duro»
//   claves     palabras que valen como respuesta escrita (sin tildes)
//   vista      desde dónde se mira al empezar: [giro, altura], en grados
//   parecidas  piezas con las que se confunde (las actividades las usan como trampa)
//   partes     lo que se ve al abrirla; `id` es el de la parte en su modelo

export const PIEZAS = [
  {
    id: "placa",
    nombre: "Placa base",
    el: "la",
    claves: ["placa", "madre"],
    def: "Circuito principal al que se conectan todos los componentes.",
    pista: "Es como una ciudad: todos los componentes «viven» conectados a ella.",
    sitio: "Va atornillada al fondo de la caja. Todo lo demás se conecta a ella.",
    color: "#36d399",
    vista: [-30, 38],
    parecidas: ["cpu", "grafica", "ram"],
    partes: [
      { id: "zocalo", nombre: "Zócalo del procesador", def: "Hueco con cientos de contactos donde se coloca el procesador." },
      { id: "ram", nombre: "Ranuras de memoria", def: "Carriles largos con pestañas donde se pinchan los módulos de memoria RAM." },
      { id: "pcie", nombre: "Ranura de expansión", def: "Ranura larga donde se pincha la tarjeta gráfica." },
      { id: "chipset", nombre: "Chipset", def: "Chip que organiza el paso de datos entre el procesador y las demás piezas. Lleva un disipador encima." },
      { id: "corriente", nombre: "Conectores de corriente", def: "Aquí se enchufan los cables de la fuente para dar electricidad a la placa." },
      { id: "sata", nombre: "Puertos SATA", def: "Aquí se conectan los cables de datos de los discos." },
      { id: "pila", nombre: "Pila", def: "Mantiene la hora y los ajustes guardados aunque el ordenador esté desenchufado." },
      { id: "puertos", nombre: "Puertos traseros", def: "Asoman por detrás de la caja. Aquí enchufas el teclado, el ratón, la pantalla, la red y los altavoces." },
    ],
  },
  {
    id: "cpu",
    nombre: "Procesador",
    el: "el",
    claves: ["procesador", "microprocesador", "cpu"],
    def: "Recibe, envía y procesa todos los datos del ordenador.",
    pista: "Es el cerebro: hace todos los cálculos.",
    sitio: "Encaja en el zócalo de la placa base, debajo del disipador.",
    color: "#ff8a3d",
    vista: [30, 40],
    parecidas: ["ram", "placa", "grafica"],
    partes: [
      { id: "tapa", nombre: "Tapa metálica", def: "Protege el chip y pasa su calor al disipador." },
      { id: "chip", nombre: "Chip de silicio", def: "El procesador de verdad: una lámina diminuta con miles de millones de transistores." },
      { id: "sustrato", nombre: "Placa de soporte", def: "Sujeta el chip y lleva sus señales hasta las patillas." },
      { id: "contactos", nombre: "Patillas", def: "Puntas doradas por las que entran y salen los datos y la electricidad." },
    ],
  },
  {
    id: "disipador",
    nombre: "Disipador + ventilador",
    el: "el",
    claves: ["disipador", "ventilador"],
    def: "Enfría el procesador para que no se caliente.",
    pista: "Las aletas de metal recogen el calor y el ventilador lo sopla fuera.",
    sitio: "Se coloca justo encima del procesador, tocándolo.",
    color: "#5cc8ff",
    vista: [30, 30],
    parecidas: ["fuente", "grafica", "cpu"],
    partes: [
      { id: "ventilador", nombre: "Ventilador", def: "Mueve el aire para llevarse el calor de las aletas." },
      { id: "aletas", nombre: "Aletas de aluminio", def: "Láminas finas que reparten el calor para que el aire lo enfríe mejor." },
      { id: "base", nombre: "Base de cobre", def: "Toca el procesador y recoge su calor." },
      { id: "anclajes", nombre: "Anclajes", def: "Tornillos con muelle que aprietan el disipador contra el procesador." },
    ],
  },
  {
    id: "ram",
    nombre: "Memoria RAM",
    el: "la",
    claves: ["ram"],
    def: "Guarda información temporalmente para que el procesador trabaje rápido.",
    pista: "Es la mesa de trabajo: al apagar el ordenador, se vacía.",
    sitio: "Se pincha en las ranuras largas de la placa base, cerca del procesador.",
    color: "#c6f432",
    vista: [24, 14],
    parecidas: ["disco", "ssd", "cpu"],
    partes: [
      { id: "carcasa", nombre: "Cubierta metálica", def: "Protege los chips y ayuda a que no se calienten." },
      { id: "chips", nombre: "Chips de memoria", def: "Aquí se guardan los datos mientras el ordenador está encendido." },
      { id: "circuito", nombre: "Circuito impreso", def: "Lámina con pistas de cobre que une los chips con los contactos." },
      { id: "contactos", nombre: "Contactos dorados", def: "Encajan en la ranura de la placa base. Por ellos pasan los datos." },
    ],
  },
  {
    id: "grafica",
    nombre: "Tarjeta gráfica",
    el: "la",
    claves: ["grafica", "gpu"],
    def: "Se encarga de la parte gráfica: crea las imágenes que ves en la pantalla.",
    pista: "Los juegos con buenos gráficos necesitan una potente.",
    sitio: "Se pincha en la ranura más larga de la placa base. A ella se conecta el monitor.",
    color: "#ff5c8a",
    vista: [28, 36],
    parecidas: ["placa", "cpu", "disipador"],
    partes: [
      { id: "ventiladores", nombre: "Ventiladores", def: "Soplan aire sobre el disipador para enfriar la tarjeta." },
      { id: "disipador", nombre: "Disipador", def: "Aletas y tubos de cobre que sacan el calor del chip." },
      { id: "chip", nombre: "Chip gráfico", def: "Calcula las imágenes que se ven en la pantalla." },
      { id: "memoria", nombre: "Memoria de vídeo", def: "Chips donde se guardan las imágenes mientras se preparan." },
      { id: "conector", nombre: "Conector de la placa", def: "Lengüeta con contactos dorados que se pincha en la ranura de la placa base." },
      { id: "salidas", nombre: "Salidas de vídeo", def: "Aquí se enchufa el cable que va al monitor." },
    ],
  },
  {
    id: "disco",
    nombre: "Disco duro",
    el: "el",
    claves: ["duro", "hdd"],
    def: "Guarda los datos de forma permanente.",
    pista: "Es el armario: aunque apagues, tus fotos y juegos siguen ahí.",
    sitio: "Va en una bahía de la caja y se une a la placa base con un cable.",
    color: "#ffd23f",
    vista: [32, 36],
    parecidas: ["ssd", "ram", "lector"],
    partes: [
      { id: "tapa", nombre: "Tapa", def: "Cierra el disco para que no entre polvo." },
      { id: "platos", nombre: "Platos", def: "Discos brillantes que giran muy rápido. En ellos se graban los datos con imanes." },
      { id: "cabezal", nombre: "Brazo con cabezal", def: "Se mueve sobre los platos para leer y escribir, sin llegar a tocarlos." },
      { id: "motor", nombre: "Motor", def: "Hace girar los platos miles de veces por minuto." },
      { id: "placa", nombre: "Placa controladora", def: "El circuito que dirige el motor y el brazo, y habla con el ordenador." },
      { id: "conector", nombre: "Conectores", def: "Aquí se enchufan dos cables: el de datos y el de corriente." },
    ],
  },
  {
    id: "ssd",
    nombre: "Disco SSD",
    el: "el",
    claves: ["ssd", "solido"],
    def: "Guarda los datos de forma permanente usando chips, sin piezas que giren; es mucho más rápido.",
    pista: "No confundir con el disco duro: hacen lo mismo, pero el SSD no tiene discos que giran.",
    sitio: "Va en una bahía de la caja, como el disco duro, pero ocupa menos.",
    color: "#b79cff",
    vista: [30, 38],
    parecidas: ["disco", "ram", "cpu"],
    partes: [
      { id: "carcasa", nombre: "Carcasa", def: "Protege la placa que lleva dentro." },
      { id: "memoria", nombre: "Chips de memoria flash", def: "Guardan los datos aunque no haya corriente." },
      { id: "controlador", nombre: "Controlador", def: "Decide en qué chip se guarda cada dato y lo encuentra después." },
      { id: "conector", nombre: "Conectores", def: "Aquí se enchufan dos cables: el de datos y el de corriente." },
    ],
  },
  {
    id: "fuente",
    nombre: "Fuente de alimentación",
    el: "la",
    claves: ["fuente"],
    def: "Recibe la electricidad del enchufe y la reparte a todos los componentes.",
    pista: "Sin ella no se enciende nada: es la «central eléctrica» del ordenador.",
    sitio: "Va en una esquina de la caja. De ella salen cables hacia todas las piezas.",
    color: "#ff6b4a",
    vista: [35, 28],
    parecidas: ["disipador", "lector", "placa"],
    partes: [
      { id: "ventilador", nombre: "Ventilador", def: "Saca el aire caliente de dentro." },
      { id: "transformador", nombre: "Transformador", def: "Baja la tensión del enchufe a una mucho menor, que no daña las piezas." },
      { id: "condensadores", nombre: "Condensadores", def: "Almacenan un poco de energía y mantienen la corriente estable." },
      { id: "disipadores", nombre: "Disipadores", def: "Placas de aluminio que quitan el calor a los componentes que más se calientan." },
      { id: "toma", nombre: "Toma de corriente", def: "Aquí entra la electricidad del enchufe. Al lado está el interruptor que la corta." },
      { id: "cables", nombre: "Cables de salida", def: "Llevan la electricidad a la placa base, a los discos y a la gráfica." },
    ],
  },
  {
    id: "lector",
    nombre: "Lector de CD/tarjetas",
    el: "el",
    claves: ["lector", "cd", "dvd", "lectora"],
    def: "Lee los datos de discos (CD, DVD) o de tarjetas de memoria (SD).",
    pista: "Fíjate en la bandeja que sale para meter el disco.",
    sitio: "Va en la parte delantera de la caja, para que puedas meter el disco desde fuera.",
    color: "#4de2e8",
    vista: [28, 30],
    parecidas: ["disco", "fuente", "ssd"],
    partes: [
      { id: "bandeja", nombre: "Bandeja", def: "Sale para que pongas el disco y después lo mete dentro." },
      { id: "laser", nombre: "Lente láser", def: "Lanza un rayo de luz sobre el disco y lee los datos según cómo rebota." },
      { id: "motor", nombre: "Motor", def: "Hace girar el disco." },
      { id: "placa", nombre: "Placa controladora", def: "El circuito que dirige el motor y el láser." },
      { id: "boton", nombre: "Botón de expulsión", def: "Al pulsarlo, la bandeja sale." },
      { id: "tarjetas", nombre: "Ranuras para tarjetas", def: "Aquí se meten las tarjetas de memoria, como las de las cámaras." },
    ],
  },
  {
    id: "cables",
    nombre: "Cables de conexión",
    el: "los",
    claves: ["cable", "cables", "cableado"],
    def: "Conectan los componentes entre sí para llevar datos y energía.",
    pista: "Son las carreteras por las que viajan la información y la electricidad.",
    sitio: "Van por toda la caja: de la fuente a cada pieza y de los discos a la placa base.",
    color: "#ff9d5c",
    vista: [20, 42],
    parecidas: ["fuente", "placa", "lector"],
    partes: [
      { id: "datos", nombre: "Cable de datos", def: "Cable plano que une un disco con la placa base para pasar información." },
      { id: "corriente", nombre: "Cable de corriente", def: "Manojo de hilos de colores que lleva la electricidad de la fuente a la placa base." },
      { id: "cobre", nombre: "Hilos de cobre", def: "El metal de dentro, por donde viaja la electricidad." },
      { id: "funda", nombre: "Funda aislante", def: "Plástico que recubre el metal para que no haya cortocircuitos ni calambres." },
    ],
  },
];

for (const p of PIEZAS) {
  p.foto = `miniaturas/${p.id}.webp`;
  p.fotoAbierta = `miniaturas/${p.id}-abierta.webp`;
  p.enFrase = `${p.el} ${p.nombre.charAt(0).toLowerCase()}${p.nombre.slice(1)}`;
}

export const pieza = (id) => PIEZAS.find((p) => p.id === id);

export function barajar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
