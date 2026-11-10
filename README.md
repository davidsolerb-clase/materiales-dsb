# Materiales DSB

Actividades interactivas para clases de informática y tecnología en la ESO. Cada material es una página web: se abre en el navegador, sin instalar nada ni crear cuentas.

**[Ver todos los materiales →](https://davidsolerb-clase.github.io/materiales-dsb/)**

## Usar un material

Abre su enlace en la web y proyéctalo o compártelo con tu alumnado. Si quieres usarlo sin conexión, descarga su carpeta de [`materiales/`](materiales/) y abre el `index.html`.

Puedes adaptarlos libremente (ver [Licencia](#licencia)).

## Añadir un material

1. Crea una carpeta en `materiales/` con el nombre del material, en minúsculas y con guiones: `materiales/clasifica-componentes/`.
2. Mete dentro el HTML como `index.html`, y los demás archivos que use.
3. Añade una `ficha.json` con el título, la asignatura y los cursos. Es opcional pero recomendable.

Al subirlo a `main`, la web se regenera sola en un par de minutos. Los detalles están en [docs/nuevo-material.md](docs/nuevo-material.md).

## Cómo está organizado

```
materiales/   un material por carpeta, con su ficha.json
web/          la portada que lista los materiales
scripts/      genera la web (Node, sin dependencias)
docs/         guías cortas
```

Para verlo en tu ordenador: `npm run dev` y abre http://localhost:8080. Cómo funciona por dentro: [docs/como-funciona.md](docs/como-funciona.md).

## Hechos con IA

La mayoría de materiales están creados con ayuda de IA (Gemini, Claude) y revisados antes de llevarlos a clase. La ficha de cada uno indica con qué se hizo.

## Licencia

Los materiales tienen licencia [CC BY-SA 4.0](LICENSE): puedes usarlos, adaptarlos y compartirlos citando la autoría y con la misma licencia. El código de `scripts/` y `web/` tiene licencia [MIT](LICENSE-CODIGO).
