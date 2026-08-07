# Obra Nueva Residencial — Savills

Sitio de seis páginas desarrollado a partir del diseño de Figma
[Residential New Developments](https://www.figma.com/design/jdwx4oQaPNUSJVW76JAmQG/Residential-New-Developments).

**Web:** https://oscarnieto.github.io/residential/
**Gestor de contenidos:** https://oscarnieto.github.io/residential/admin/

## Documentación

| Documento | Para quién |
|---|---|
| [`CMS.md`](CMS.md) | Quien edita el contenido de la web. Cómo entrar al panel, escribir textos, subir imágenes y publicar |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Equipo técnico. Stack, estructura, despliegue, seguridad y decisiones de diseño |
| [`SECURITY.md`](SECURITY.md) | Equipo técnico. Informe de seguridad: modelo de amenazas, hallazgos y recomendaciones |
| [`security/compliance-report.md`](security/compliance-report.md) | Equipo técnico. Cumplimiento de la Política de Seguridad de Aplicaciones: los 30 controles, estado y evidencia |

## Stack

HTML, CSS y JavaScript vanilla, sin frameworks ni dependencias. El contenido
vive en `content/*.json` y un script de Node sin dependencias
(`build/build.mjs`) genera los seis HTML. GitHub Actions construye y publica en
GitHub Pages en cada push (`.github/workflows/deploy.yml`).

## Estructura

```
├── content/            Contenido editable (fuente de la verdad)
├── build/              Generador estático (Node, sin dependencias)
├── admin/              Gestor de contenidos
├── *.html              GENERADOS por el build — no editar a mano
├── css/
│   ├── fonts.css       @font-face (fuentes variables self-hosted)
│   ├── styles.css      Estilos: tokens de diseño, layout, responsive
│   └── theme.css       GENERADO: colores de marca e imágenes de fondo
├── js/
│   └── main.js         Menú móvil, reveals, contadores, mapa, galerías, vídeo
└── assets/
    ├── fonts/          Playfair Display + Montserrat (woff2, latin)
    └── img/            Imágenes, vídeo y SVG
```

## Páginas

| Página | Contenido |
|---|---|
| **Inicio** | Hero con vídeo, intro, «¿Qué nos hace diferentes?», red internacional con contadores y mapa interactivo, Savills en España |
| **Red internacional** | Expertise 360, equipos especializados, métricas globales y proyectos internacionales |
| **Servicios** | Círculo interactivo de proceso y tarjetas de tipología de producto |
| **Producto** | Bloques de producto con galerías horizontales ancladas al scroll y carrusel de logotipos |
| **Equipo** | Equipo en España y equipo global, con enlaces a LinkedIn |
| **Contacto** | Textos de contacto y las tres oficinas |

## Desarrollo en local

```bash
node build/build.mjs          # regenera los 6 HTML y css/theme.css
python3 -m http.server 8000   # http://localhost:8000
```

El panel de administración se sirve igual, en `/admin/`, y funciona contra el
repositorio real de GitHub (necesita un token, ver [`CMS.md`](CMS.md)).

## Créditos

- Fuentes: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) y
  [Montserrat](https://fonts.google.com/specimen/Montserrat) (Google Fonts, OFL).
- Silueta del mapa mundial: [simple-world-map](https://github.com/flekschas/simple-world-map).
