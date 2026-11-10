# Montaje PC (próximo material)

Un ordenador en 3D para aprender sus piezas: verlas, tocarlas, montarlo, desmontarlo y repararlo. Varias actividades sobre el mismo modelo.

Estado: ideas. Cuando empiece, este documento se mueve a `materiales/montaje-pc/README.md`.

## Actividades

Todas usan el mismo PC y los mismos datos de piezas.

1. **Explora.** Giras el PC, tocas una pieza y ves qué es, para qué sirve y cómo se conecta. Puedes sacarla y darle la vuelta para ver sus conectores.
2. **Identifica.** "Toca la memoria RAM." Contrarreloj, con niveles: primero piezas grandes, luego conectores y puertos.
3. **Monta y desmonta.** Colocas las piezas en su sitio y en orden. Cada pieza encaja solo en su ranura. Los errores típicos tienen respuesta: RAM en el canal equivocado, olvidar la pasta térmica, no conectar el cable de 8 pines de la CPU.
4. **Averías.** Un síntoma ("no arranca", "pita tres veces", "se apaga al rato") y el alumno inspecciona, cambia piezas y comprueba. Cada avería es un caso en un JSON, así que se pueden añadir sin programar.
5. **Preguntas.** Un test que se genera a partir de los datos de las piezas. Sirve para repasar o para cerrar la sesión.

Primera versión: Explora e Identifica, con unas 10 piezas. Después Monta. Averías y Preguntas al final, porque reutilizan todo lo anterior.

## Piezas de la primera versión

Caja, placa base, procesador, disipador, memoria RAM, tarjeta gráfica, SSD M.2, disco SATA, fuente de alimentación y ventiladores. Los cables, en una segunda vuelta.

## A tener en cuenta

- **Un solo archivo de datos.** `piezas.json` con nombre, descripción, función, conectores, dónde encaja y en qué orden. Todas las actividades leen de ahí; si se corrige un dato, se corrige en todas.
- **Modelos 3D.** Primero, piezas hechas en código con formas simples (cajas, cilindros, ranuras). Un modelo de IA actual las genera bien y con detalle suficiente: estilo coherente, ligeras y sin problemas de licencia. Después, las piezas que lo pidan se sustituyen por modelos `.glb` descargados (Sketchfab, Poly Pizza), comprobando licencia y peso de cada uno. Como todo cuelga de `piezas.json`, cambiar el modelo de una pieza no toca las actividades.
- **Puntos de encaje.** Cada ranura del modelo lleva un punto con nombre (`ranura-ram-1`). Al soltar una pieza cerca de su punto, se coloca sola. Así montar no exige precisión con el ratón.
- **Ordenadores del aula.** Muchos son modestos. Pocas caras por modelo, sin sombras en tiempo real, y que solo se redibuje cuando algo cambia.
- **Ratón y pantalla táctil.** Que funcione en tablets y en pizarra digital.
- **Textos fuera del 3D.** Las fichas, preguntas y avisos van en HTML encima del canvas, no dibujados en 3D. Se leen mejor, se pueden traducir y son accesibles.
- **Sin cuentas ni servidor.** El progreso se guarda en el navegador. Si algún día hace falta un ranking de clase, eso sí iría aparte (ver [como-funciona.md](como-funciona.md)).
- **Tecnología.** Three.js sin framework y sin compilar: módulos de JavaScript normales y una copia de Three.js dentro de la carpeta, para que funcione aunque el centro bloquee las CDN. La carpeta que se ve en el repo es exactamente lo que se publica. Vivirá en `materiales/montaje-pc/`. Solo se pasaría a Vite si el proyecto se vuelve lento de cargar.

## Referencias

- [PC Anatomy](https://github.com/Yoosseph/pc-anatomy): explorador 3D de hardware hecho con Three.js y React, de código abierto. Buena referencia para la actividad Explora. Revisar su licencia antes de reutilizar nada.
- Falta: el repositorio que tenías guardado sobre este tema.
