# Guía para agentes

Repositorio público de materiales educativos interactivos (informática y tecnología, ESO). Lo mantiene un profesor con ayuda de agentes de IA. Lee esto antes de cambiar nada.

## Principios

- **Simple antes que listo.** La raíz no tiene dependencias. La portada es HTML, CSS y JS sin framework. No añadas herramientas sin que te lo pidan.
- **Cada material es independiente.** Su carpeta contiene todo lo que necesita. No compartas código entre materiales.
- **Archivar no es mejorar.** Al añadir un material, guarda el HTML tal cual. No lo reescribas, ni lo formatees, ni le cambies el estilo, salvo que te lo pidan.

## Cómo escribir documentación

Este repo lo leen personas, muchas de ellas docentes sin perfil técnico.

- Español de España, tuteo, frases cortas, voz activa.
- Escribe lo justo para que alguien pueda hacer algo. Si una sección no ayuda a hacer nada, sobra.
- Un dato vive en un solo sitio. En los demás, enlaza.
- Sin emoji decorativos, sin listas de "características", sin tono de marketing.
- Si un cambio afecta a lo documentado, actualiza la documentación en el mismo commit.
- Antes de crear un archivo `.md` nuevo, mira si cabe en uno que ya existe.

## Añadir un material

Es la tarea más habitual.

1. Elige un nombre de carpeta: minúsculas, guiones, sin tildes. Ej.: `clasifica-componentes`.
2. Guarda el HTML como `materiales/<nombre>/index.html`. Si trae más archivos (imágenes, JS, modelos 3D), van en la misma carpeta y se enlazan con rutas relativas.
3. Copia `materiales/_plantilla/ficha.json` a la carpeta y rellénala. Lo que no puedas deducir del HTML (asignatura, cursos), pregúntalo. Si no hay respuesta, deja `cursos` vacío: equivale a toda la ESO.
4. Si hace falta una asignatura o curso nuevo, añádelo a `materiales/categorias.json`.
5. Opcional: guarda una captura como `portada.png` (1200 × 750) para la tarjeta.
6. Ejecuta `npm run check`. Debe terminar sin errores.
7. Commit: `Añade material: <título>`.

Los campos de la ficha están en [docs/nuevo-material.md](docs/nuevo-material.md).

## Materiales grandes

- **Con varios archivos, sin compilar:** carpeta normal. Nada especial.
- **Con compilación (Vite, etc.):** el material tiene su propio `package.json` dentro de su carpeta. En la ficha, `"construir": { "comando": "npm ci && npm run build", "salida": "dist" }`. Configura rutas relativas (`base: "./"` en Vite).
- **Con servidor o base de datos:** no vive aquí. Va en su propio repositorio y hosting; aquí solo se añade su ficha con `"enlace"`.

Más contexto en [docs/como-funciona.md](docs/como-funciona.md).

## Normas

- No metas datos personales del alumnado, analítica ni cookies en ningún material. Los usan menores.
- No borres ni renombres materiales sin confirmarlo: hay enlaces compartidos que dejarían de funcionar.
- Commits en español, en imperativo y en una línea: `Añade material: ...`, `Corrige ...`, `Actualiza ...`.
