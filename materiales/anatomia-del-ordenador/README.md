# Anatomía del ordenador

Un ordenador en 3D para aprender sus piezas: verlas, abrirlas, montarlo y, más adelante, encenderlo y repararlo. Un solo ordenador, sin marcas ni presupuestos, y cada vez un poco más difícil.

## El itinerario

| Taller | Qué hace el alumno | Estado |
| --- | --- | --- |
| 1. Conoce | Gira y abre las piezas. Dos retos de preguntas. | Hecho |
| 2. Monta | Coloca las piezas en la caja, las atornilla y conecta los cables. | Hecho: niveles con guía y sin guía |
| 3. Enciende | Ve por dónde van la corriente y los datos, y qué pasa si falta una pieza. | Pendiente |
| 4. Repara | Recibe un ordenador con un síntoma y busca la avería. | Pendiente |

El progreso se guarda en el navegador de cada alumno. La portada lo resume en un carné con un código de seis letras; el docente lo lee en `#/profe`.

## Dónde está cada cosa

- `js/datos.js`: las piezas del atlas y sus textos.
- `js/modelos/`: los modelos 3D, dibujados con código. `kit.js` tiene las herramientas comunes.
- `js/montaje/pasos.js`: el guion del taller de montaje. Piezas de la bandeja, pasos y textos.
- `js/montaje/mundo.js` y `caja.js`: dónde encaja cada cosa dentro de la caja.
- `js/carne.js`: el carné y el código de resultado.

Para cambiar un texto del montaje, o el orden de los pasos, basta con tocar `pasos.js`. Cada paso explica al principio del archivo qué campos lleva.

Para probar un paso sin hacer los anteriores, abre el taller con `?paso=12` delante de la almohadilla: `index.html?paso=12#/jugar/montaje/1`.

## Lo siguiente

En este orden:

1. **Montaje, nivel 3.** Sin pasos: el alumno elige el orden y el taller le explica por qué no puede adelantarse.
2. **Enciende.** Flechas que recorren los cables de corriente y de datos. «¿Y si quito…?»: quitar una pieza y encender para ver qué falla.
3. **Repara.** Cada avería es un caso en un archivo de datos (síntoma, causa y solución), para poder añadirlas sin programar.
4. **Arranque y BIOS.** Pitidos de error y una pantalla de ajustes sencilla: orden de arranque y velocidad de la memoria.
5. **Personalizar.** Acabados de la caja y pegatinas, al terminar el montaje.
6. **Más piezas.** SSD M.2, wifi, altavoces y otros periféricos, también en el atlas.
7. **Desmontar.** El montaje al revés.

## A tener en cuenta

- **Modelos propios.** Todo se dibuja con código: pesa poco, tiene un solo estilo y las piezas se pueden abrir. No se importan modelos descargados.
- **Medidas reales.** Las piezas van en centímetros y encajan entre sí. Si cambias una, comprueba que sigue cabiendo en la caja.
- **Ordenadores del aula.** El taller solo vuelve a pintar cuando algo cambia. Si va lento, quita solo las sombras y baja la resolución.
- **Ratón y pantalla táctil.** Se elige la pieza y se toca su sitio. Con ratón también se puede arrastrar.
- **Sin cuentas ni servidor.** Ver [cómo funciona](../../docs/como-funciona.md).

## Referencias

- [Device Lab](https://github.com/Htet-Myark/device-lab) (MIT): el montaje por pasos, el destornillador y los errores explicados se inspiran en él. El código es propio.
- [PC Anatomy](https://github.com/Yoosseph/pc-anatomy) (MIT, con permiso de su autor): su capa de flujo de corriente es la referencia para el taller Enciende.
- [pc-builder](https://github.com/Wissemm697/pc-builder) (MIT): su pantalla de BIOS es la referencia para el punto 4.
