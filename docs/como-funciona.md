# Cómo funciona

## La idea

El repositorio es el archivo. No hay base de datos ni panel de administración: cada material es una carpeta y su ficha es un JSON al lado. Un script lee las carpetas y genera la portada.

```
materiales/<nombre>/    →    scripts/build.mjs    →    _site/    →    GitHub Pages
  index.html                 valida las fichas         portada
  ficha.json                 copia los materiales      catalogo.json
                             genera el índice          materiales/
```

Cada vez que algo llega a `main`, GitHub Actions ejecuta el script y publica `_site/` ([`.github/workflows/publicar.yml`](../.github/workflows/publicar.yml)). En las pull requests solo valida.

El script también publica `catalogo.json`, con todos los materiales y sus datos. Sirve para que otras herramientas o agentes lean el catálogo sin rascar HTML.

## Tipos de material

De más simple a más complejo. Casi todo debería quedarse en los dos primeros.

| Tipo | Ejemplo | Qué hace falta |
| --- | --- | --- |
| Un HTML | Actividad de clasificar componentes | Nada |
| Varios archivos estáticos | App 3D con Three.js y modelos `.glb` | Nada; rutas relativas |
| Se compila | Proyecto con Vite que ha crecido | `package.json` propio y `construir` en la ficha |
| Necesita servidor | Partidas en directo, guardar notas | Otro repositorio y otro hosting; aquí solo la ficha con `enlace` |

Un material puede pasar de un tipo a otro sin cambiar de carpeta ni de URL, salvo el último.

## Antes de pensar en un servidor

Muchas cosas que parecen necesitarlo no lo necesitan:

- **Guardar el progreso del alumno:** `localStorage`, en su navegador.
- **Entregar resultados:** que el material genere un código o un archivo que el alumno entrega por el aula virtual.
- **Contenido editable:** un JSON dentro de la carpeta del material.

Si de verdad hace falta servidor (tiempo real entre alumnos, cuentas, datos compartidos), ese material se separa a su propio repositorio y se despliega en Vercel, Netlify o Cloudflare Pages. Aquí queda su ficha con el enlace.

## Despliegue

GitHub Pages, gratis y sin configurar nada más que esto:

1. **Settings → Pages → Source: GitHub Actions.**
2. Que la rama por defecto sea `main`.

La web queda en `https://davidsolerb-clase.github.io/materiales-dsb/`. Se puede poner un dominio propio en la misma pantalla.
