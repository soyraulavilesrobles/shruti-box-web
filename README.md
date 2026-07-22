# Shruti Box Virtual

Caja shruti virtual para navegador, construida con HTML/CSS/JS puro y la Web Audio API. Sin build, sin dependencias.

## Uso

Abre `index.html` en cualquier navegador moderno, o entra a la versión publicada en GitHub Pages.

1. Elige la tónica (Sa) con el selector.
2. Toca los botones de bordón (Sa grave, Sa, Ma, Pa, Sa agudo) para prenderlos/apagarlos. Se pueden combinar varios a la vez.
3. "Detener todo" corta todos los bordones activos.

## Cómo funciona

Cada bordón activo genera dos osciladores tipo diente de sierra ligeramente desafinados entre sí (para simular el batido de una lengüeta real), pasados por un filtro pasa-bajos y modulados por un LFO lento que agrega un leve vibrato — buscando aproximar el timbre de una caja shruti acústica. Los bordones están afinados como intervalos relativos a la tónica elegida (Sa=0, Ma=+5, Pa=+7 semitonos, más las octavas).

## Publicar cambios

El sitio se sirve directo desde la rama `main` vía GitHub Pages. Cualquier push a `main` actualiza el sitio.
