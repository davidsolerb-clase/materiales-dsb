# Anatomía del ordenador

Un ordenador en 3D para aprender sus piezas: verlas, abrirlas, montarlo y, más adelante, encenderlo y repararlo. Un solo ordenador, sin marcas ni presupuestos, y cada vez un poco más difícil.

## El itinerario

| Taller | Qué hace el alumno | Estado |
| --- | --- | --- |
| 1. Conoce | Gira y abre las piezas. Dos retos de preguntas. | Hecho |
| 2. Monta | Coloca las piezas en la caja, las atornilla y conecta los cables. | Hecho: niveles con guía y sin guía |
| 3. Enciende | Quita una pieza o un cable, enciende y ve qué pasa. Flechas de corriente y de datos por los cables. | Hecho: experimenta y predice |
| 4. Repara | Recibe un ordenador con un síntoma y busca la avería. | Hecho: algo suelto y pieza rota |

El progreso se guarda en el navegador de cada alumno. La portada lo resume en un carné con un código de ocho letras; el docente lo lee en `#/profe`.

## Dónde está cada cosa

- `js/datos.js`: las piezas del atlas y sus textos.
- `js/modelos/`: los modelos 3D, dibujados con código. `kit.js` tiene las herramientas comunes.
- `js/montaje/pasos.js`: el guion del taller de montaje. Piezas de la bandeja, pasos y textos.
- `js/montaje/mundo.js` y `caja.js`: dónde encaja cada cosa dentro de la caja.
- `js/montaje/sistema.js`: qué le pasa al ordenador según lo que le falte, y los casos de avería.
- `js/montaje/puesto.js`: el ordenador ya montado que usan Enciende y Repara.
- `js/carne.js`: el carné y el código de resultado.

Para cambiar un texto del montaje, o el orden de los pasos, basta con tocar `pasos.js`. Cada paso explica al principio del archivo qué campos lleva.

Para añadir una avería, copia una línea de `AVERIAS` y cambia la queja y el fallo. Para cambiar qué pasa cuando falta algo, toca `diagnostico`, en el mismo archivo.

Para probar un paso del montaje sin hacer los anteriores, abre el taller con `?paso=12` delante de la almohadilla: `index.html?paso=12#/jugar/montaje/1`.

## Lo siguiente

En este orden:

1. **Más averías.** Cada caso es una línea en `AVERIAS` (`sistema.js`): la queja del cliente y qué falla. Se añaden sin programar.
2. **Montaje, nivel 3.** Sin pasos: el alumno elige el orden y el taller le explica por qué no puede adelantarse.
3. **El viaje de un dato.** Al abrir un juego, ver el recorrido disco, memoria, procesador, gráfica y pantalla.
4. **BIOS.** Una pantalla de ajustes sencilla: orden de arranque y velocidad de la memoria.
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
