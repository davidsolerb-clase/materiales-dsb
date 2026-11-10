# Añadir un material

Hay tres formas. Elige la que te resulte más cómoda; el resultado es el mismo.

## Desde la web de GitHub

1. Entra en la carpeta [`materiales/`](../materiales/) del repositorio.
2. Pulsa **Add file → Upload files** y arrastra la carpeta del material. Si solo tienes un HTML, súbelo tal cual: también funciona.
3. Pulsa **Commit changes**.

En un par de minutos aparece en la web. Si no añadiste ficha, se muestra con el título del HTML y sin asignatura. Puedes completarla más tarde.

## Pidiéndoselo a un agente de IA

Dale el HTML y dile algo como: *"Añade este material al repositorio materiales-dsb. Es de Tecnología y Digitalización para 1.º y 2.º de ESO."* El agente sigue las instrucciones de [AGENTS.md](../AGENTS.md).

## En tu ordenador

```
materiales/clasifica-componentes/
├── index.html
├── ficha.json
└── portada.png      (opcional)
```

Comprueba con `npm run check`, mira el resultado con `npm run dev` y sube los cambios.

## La ficha

`ficha.json` describe el material. Todos los campos son opcionales.

```json
{
  "titulo": "Clasifica los componentes del ordenador",
  "descripcion": "Arrastra cada pieza a su categoría.",
  "asignaturas": ["tecnologia-digitalizacion"],
  "cursos": ["1eso", "2eso"],
  "etiquetas": ["hardware", "arrastrar"],
  "hecho_con": "Gemini",
  "fecha": "2026-11-10",
  "estado": "listo"
}
```

| Campo | Qué es | Si no lo pones |
| --- | --- | --- |
| `titulo` | Nombre que se ve en la tarjeta | El `<title>` del HTML |
| `descripcion` | Una frase: qué hace el alumnado | La `<meta name="description">` del HTML |
| `asignaturas` | Claves de [`categorias.json`](../materiales/categorias.json) | Ninguna |
| `cursos` | Claves de `categorias.json` | Toda la ESO |
| `etiquetas` | Palabras para el buscador | Ninguna |
| `hecho_con` | Herramienta con la que se creó | No se muestra |
| `fecha` | Fecha de alta, `AAAA-MM-DD` | La del commit que lo añadió |
| `estado` | `listo` o `borrador`. Los borradores no salen en el índice, pero su enlace funciona | `listo` |
| `enlace` | URL externa, para materiales que viven en otro sitio | — |
| `construir` | `{ "comando", "salida" }` para materiales que se compilan | — |

Para añadir una asignatura o un curso, edita `materiales/categorias.json`.
