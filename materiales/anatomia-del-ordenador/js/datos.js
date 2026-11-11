// Las piezas del ordenador. Es el único sitio donde viven sus nombres y textos:
// el atlas y las actividades los leen de aquí.
//
// Para añadir una pieza: pon su modelo en modelos/, su imagen en miniaturas/
// y añade una entrada a esta lista.
//
//   giro       inclinación inicial del modelo [x, y, z], en radianes
//   zoom       mayor que 1 aleja la cámara
//   parecidas  piezas con las que se confunde (las actividades las usan como trampa)

const CC_BY = { nombre: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/deed.es" };
const CC_BY_NC_ND = { nombre: "CC BY-NC-ND 4.0", url: "https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es" };

export const PIEZAS = [
  {
    id: "placa",
    nombre: "Placa base",
    def: "Circuito principal al que se conectan todos los componentes.",
    pista: "Es como una ciudad: todos los componentes «viven» conectados a ella.",
    sitio: "Va atornillada al fondo de la caja. Todo lo demás se conecta a ella.",
    color: "#36d399",
    giro: [0.5, 0.5, 0],
    zoom: 1.2,
    parecidas: ["cpu", "grafica"],
    credito: { obra: "PC motherboard ASUS Prime H510M-K", autor: "zhigulinsky", url: "https://skfb.ly/oFrRt", licencia: CC_BY, cambios: true },
  },
  {
    id: "cpu",
    nombre: "Procesador",
    def: "Recibe, envía y procesa todos los datos del ordenador.",
    pista: "Es el cerebro: hace todos los cálculos.",
    sitio: "Encaja en el zócalo de la placa base, debajo del disipador.",
    color: "#ff8a3d",
    giro: [0.6, -0.4, 0],
    zoom: 1.15,
    parecidas: ["ram", "placa"],
    credito: { obra: "CPU Ryzen 5 3600", autor: "Fochdog", url: "https://skfb.ly/on9Ao", licencia: CC_BY, cambios: true },
  },
  {
    id: "disipador",
    nombre: "Disipador + ventilador",
    def: "Enfría el procesador para que no se caliente.",
    pista: "Las aletas de metal recogen el calor y el ventilador lo sopla fuera.",
    sitio: "Se coloca justo encima del procesador, tocándolo.",
    color: "#5cc8ff",
    giro: [0.25, 0.4, 0],
    parecidas: ["fuente", "grafica"],
    credito: { obra: "(Free) AMD Wraith Stealth CPU Cooler", autor: "PolyDavid", url: "https://skfb.ly/pJXNM", licencia: CC_BY, cambios: true },
  },
  {
    id: "ram",
    nombre: "Memoria RAM",
    def: "Guarda información temporalmente para que el procesador trabaje rápido.",
    pista: "Es la mesa de trabajo: al apagar el ordenador, se vacía.",
    sitio: "Se pincha en las ranuras largas de la placa base, cerca del procesador.",
    color: "#c6f432",
    giro: [0.1, -0.5, 0],
    parecidas: ["disco", "ssd"],
    credito: { obra: "[RAM DDR4] G.Skill Trident Z NEO", autor: "Zon Digital", url: "https://skfb.ly/6WOrn", licencia: CC_BY_NC_ND, cambios: false },
  },
  {
    id: "grafica",
    nombre: "Tarjeta gráfica",
    def: "Se encarga de la parte gráfica: crea las imágenes que ves en la pantalla.",
    pista: "Los juegos con buenos gráficos necesitan una potente.",
    sitio: "Se pincha en la ranura más larga de la placa base. A ella se conecta el monitor.",
    color: "#ff5c8a",
    giro: [1.0, 0, 0],
    parecidas: ["placa", "cpu"],
    credito: { obra: "MSI GeForce RTX 3080 Gaming X Trio", autor: "M E U", url: "https://skfb.ly/ow8HY", licencia: CC_BY, cambios: true },
  },
  {
    id: "disco",
    nombre: "Disco duro",
    def: "Guarda los datos de forma permanente.",
    pista: "Es el armario: aunque apagues, tus fotos y juegos siguen ahí.",
    sitio: "Va en una bahía de la caja y se une a la placa base con un cable.",
    color: "#ffd23f",
    giro: [0.5, 0.5, 0],
    zoom: 1.15,
    parecidas: ["ssd", "ram"],
    credito: { obra: "WD Green 1TB Hard Disk HDD", autor: "MajdyModels", url: "https://skfb.ly/oESOn", licencia: CC_BY, cambios: true },
  },
  {
    id: "ssd",
    nombre: "Disco SSD",
    def: "Guarda los datos de forma permanente usando chips, sin piezas que giren; es mucho más rápido.",
    pista: "No confundir con el disco duro: hacen lo mismo, pero el SSD no tiene discos que giran.",
    sitio: "Va en una bahía de la caja, como el disco duro, pero ocupa menos.",
    color: "#b79cff",
    giro: [0.6, -0.4, 0],
    zoom: 1.15,
    parecidas: ["disco", "ram"],
    credito: { obra: "(SSD) Solid State Drive", autor: "MarkCP", url: "https://skfb.ly/otSKU", licencia: CC_BY, cambios: true },
  },
  {
    id: "fuente",
    nombre: "Fuente de alimentación",
    def: "Recibe la electricidad del enchufe y la reparte a todos los componentes.",
    pista: "Sin ella no se enciende nada: es la «central eléctrica» del ordenador.",
    sitio: "Va en una esquina de la caja. De ella salen cables hacia todas las piezas.",
    color: "#ff6b4a",
    giro: [0.2, 0.6, 0],
    zoom: 1.15,
    parecidas: ["disipador", "placa"],
    credito: { obra: "PSU Power Supply Unit", autor: "Groovex", url: "https://skfb.ly/oBPC9", licencia: CC_BY, cambios: true },
  },
];

for (const p of PIEZAS) {
  p.modelo = `modelos/${p.id}.glb`;
  p.foto = `miniaturas/${p.id}.webp`;
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
