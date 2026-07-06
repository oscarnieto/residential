# Residential New Developments — Savills

Landing page one-page desarrollada a partir del diseño de Figma
[Residential New Developments](https://www.figma.com/design/jdwx4oQaPNUSJVW76JAmQG/Residential-New-Developments).

**Demo:** https://oscarnieto.github.io/residential/

## Stack

HTML + CSS + JavaScript vanilla, sin dependencias ni build. Se despliega
automáticamente en GitHub Pages con GitHub Actions en cada push
(`.github/workflows/deploy.yml`).

## Estructura

```
├── index.html          Página completa (6 secciones)
├── css/
│   ├── fonts.css       @font-face (fuentes variables self-hosted)
│   └── styles.css      Estilos: tokens de diseño, layout, responsive
├── js/
│   └── main.js         Menú móvil, reveals, contadores, mapa, vídeo
└── assets/
    ├── fonts/          Playfair Display + Montserrat (woff2, latin)
    └── img/            Imágenes y SVG
```

## Secciones

1. **Hero** — imagen a pantalla completa, navegación con logo central.
2. **Intro + vídeo** — claim principal y vídeo que se solapa con la sección siguiente.
3. **Servicios** — “¿Qué nos hace diferentes?”, rejilla de 6 tarjetas.
4. **Red internacional** — contadores animados, bloque de negocio y mapa mundial punteado con pins.
5. **Savills en España** — fondo fotográfico fijo con cifras destacadas.
6. **Footer** — menú, redes sociales y barra legal.

## Imágenes placeholder

La red de este entorno no permite exportar los bitmaps de Figma, así que estas
imágenes son degradados generados como marcador de posición. Para usar las
reales, exporta desde Figma y sobreescribe el archivo con el mismo nombre:

| Archivo                        | Nodo en Figma                  | Tamaño sugerido |
| ------------------------------ | ------------------------------ | --------------- |
| `assets/img/hero.jpg`          | `Hero > hero-bg`               | 1920×1080       |
| `assets/img/video-poster.jpg`  | `section-1 > video`            | 1440×700        |
| `assets/img/lifestyle.jpg`     | `section-3 > img`              | 1152×758        |
| `assets/img/aerial.jpg`        | `section-4 > bg-section4`      | 1920×900        |
| `assets/img/savills-logo.svg`  | `savills-logo` (logo real)     | vectorial       |

El vídeo de la sección 2 se activa poniendo la URL (YouTube/Vimeo embed) en el
atributo `data-video-url` del `div.video` en `index.html`.

## Créditos

- Fuentes: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) y
  [Montserrat](https://fonts.google.com/specimen/Montserrat) (Google Fonts, OFL).
- Silueta del mapa mundial: [simple-world-map](https://github.com/flekschas/simple-world-map).
