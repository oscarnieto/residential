# Arquitectura técnica — Obra Nueva Residencial (Savills)

Documento de referencia para el equipo de IT. Describe cómo está construido,
alojado y desplegado el sitio, y cómo mantenerlo.

**Sitio en producción:** https://oscarnieto.github.io/residential/
**Repositorio:** `oscarnieto/residential` (GitHub)
**Rama de trabajo actual:** `claude/clever-brahmagupta-abt3is`

---

## 1. Resumen del stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript **vanilla** (sin frameworks: no React/Vue, no jQuery) |
| Contenido | **JSON** en `content/` — es la fuente de la verdad de todos los textos e imágenes |
| Build | Script propio en **Node** (`build/build.mjs`), **sin dependencias** (no `package.json`, no `node_modules`) |
| CMS | Panel propio en `/admin`, SPA vanilla que escribe en el repositorio vía API de GitHub |
| Hosting | **GitHub Pages** (estático) |
| CI/CD | **GitHub Actions** — construye y despliega automáticamente en cada `push` |
| Backend | No existe. No hay servidor, base de datos ni API propia |
| Formularios | No hay formularios con envío de datos; el contacto es por teléfono (`tel:`) y enlaces a LinkedIn/Instagram |

El stack sigue siendo deliberadamente simple: lo que se publica son **archivos estáticos**. El único paso de build es un script de Node de unas 120 líneas que no instala nada — no hay árbol de dependencias que auditar ni actualizar por vulnerabilidades.

---

## 2. Estructura de archivos

```
residential/
├── content/                     FUENTE DE LA VERDAD del contenido
│   ├── site.json                 Marca, navegación, colores, pie de página
│   ├── inicio.json               Contenido de cada página, uno por archivo
│   ├── red-internacional.json
│   ├── servicios.json
│   ├── track-record.json
│   ├── equipo.json
│   └── contacto.json
│
├── build/                       Generador estático (Node, sin dependencias)
│   ├── build.mjs                 Punto de entrada: lee content/ y escribe el HTML
│   ├── lib/
│   │   ├── html.mjs              Escapado y marcado ligero (*cursiva*, **negrita**)
│   │   ├── icons.mjs             SVG en línea (parte del diseño, no del contenido)
│   │   └── theme.mjs             Genera css/theme.css (colores + imágenes de fondo)
│   ├── partials/
│   │   ├── layout.mjs            <head>, topbar, menú móvil y footer compartidos
│   │   └── hero.mjs              Hero común y variante de Red Internacional
│   └── pages/*.mjs               Un renderizador por página
│
├── admin/                       Gestor de contenidos (ver §12)
│   ├── index.html
│   ├── css/admin.css
│   └── js/{app,schema,fields,github,preview,util}.js
│
├── index.html                 ┐
├── red-internacional.html     │  GENERADOS por build/build.mjs.
├── servicios.html             ├─ Se versionan para que GitHub Pages pueda
├── track-record.html          │  servirlos sin build, pero NO se editan a mano.
├── equipo.html                │
├── contacto.html              ┘
│
├── css/
│   ├── fonts.css                @font-face de las fuentes self-hosted
│   ├── styles.css               Todo el CSS del sitio (~2.745 líneas): tokens
│   │                             de diseño, layout, componentes, responsive
│   └── theme.css                GENERADO: colores de marca e imágenes de fondo
│
├── js/
│   └── main.js                  Todo el JS del sitio (~340 líneas), un único
│                                 IIFE sin dependencias externas
│
├── assets/
│   ├── fonts/                   3 archivos .woff2 (fuentes variables)
│   └── img/                     ~56 imágenes JPG/PNG + 1 vídeo MP4 + 1 SVG
│
├── .github/workflows/deploy.yml Pipeline de build + despliegue a GitHub Pages
├── .nojekyll                    Desactiva el procesado Jekyll de GitHub Pages
└── .claude/settings.json        Config de permisos del asistente de IA (irrelevante para IT)
```

**Los seis `.html` de la raíz son artefactos generados.** Editarlos a mano no
sirve de nada: el siguiente build los sobrescribe desde `content/`. El header,
el menú móvil y el footer se definen **una sola vez** en
`build/partials/layout.mjs`, así que añadir una página al menú es un cambio en
un único sitio.

Lo mismo aplica a `css/theme.css`, generado desde `content/site.json`.
`css/styles.css` **sí** se edita a mano: contiene el diseño, y consume las
imágenes de fondo como variables (`var(--img-hero-equipo)`) que define el tema
generado.

---

## 3. Páginas del sitio

| Página | Archivo | Contenido |
|---|---|---|
| Inicio | `index.html` | Hero con vídeo, intro, "¿Qué nos hace diferentes?", red internacional (contadores + mapa de puntos interactivo), Savills en España |
| Red Internacional | `red-internacional.html` | Expertise 360, equipos especializados, métricas globales, proyectos internacionales, hero con zoom Ken Burns |
| Servicios | `servicios.html` | Círculo interactivo de 8 pasos (SVG + JS), tarjetas de tipología de producto |
| Track Record | `track-record.html` | Dos galerías horizontales "pinned" (nacional e internacional) con scroll-driven animation |
| Equipo | `equipo.html` | Equipo España (con enlaces LinkedIn on-hover) y equipo Global |
| Contacto | `contacto.html` | Texto sticky + tarjetas de oficina que se desplazan por scroll |

Navegación consistente en las 6 páginas (misma topbar, mismo menú móvil, mismo footer), con el enlace de la página activa marcado vía clase `.is-active` puesta a mano en cada HTML (no hay JS que detecte la página actual).

---

## 4. CSS (`css/styles.css`)

- **Sin metodología de framework** (no Tailwind, no Bootstrap). Convención de nombrado tipo **BEM simplificado**: `.bloque__elemento--modificador` (ej. `.hero__title-line--italic`, `.team-card--link`).
- **Design tokens** centralizados en `:root` (custom properties CSS):
  ```css
  --navy, --navy-light, --cream-light, --yellow, --red   /* paleta */
  --font-serif, --font-sans                               /* Playfair Display / Montserrat */
  --fs-h1 … --fs-body                                      /* escala tipográfica fluida con clamp() */
  --container, --narrow, --gutter                          /* layout */
  --ease                                                    /* curva de easing común */
  ```
- **Responsive**: mobile-first con `clamp()` para tamaños fluidos + `@media` puntuales para reflow de grids (breakpoints habituales: 1100px, 900px, 767px, 620px).
- **Animaciones**: CSS puro (`@keyframes`, `transition`) allí donde es posible; solo se usa JS para lo que CSS no puede resolver (scroll-linked pin de galerías, contador numérico, interacción del círculo).
- Todas las animaciones respetan `@media (prefers-reduced-motion: reduce)` (se desactivan o sustituyen por un estado estático).
- Se usa **`animation-timeline: view()`** (scroll-driven animations, spec moderna) para el efecto de foco de los carruseles móviles, con `@supports` como guarda — en navegadores que no lo soportan simplemente no hay ese efecto extra, pero el carrusel sigue funcionando (scroll-snap nativo).

---

## 5. JavaScript (`js/main.js`)

Un único archivo, un único IIFE (`(() => { ... })()`), sin módulos ES ni bundler. Se carga con `<script src="js/main.js">` al final del `<body>` en las 6 páginas. Módulos internos (por comentario, en orden):

1. **Topbar** — añade fondo sólido al hacer scroll.
2. **Menú móvil** — abre/cierra el overlay, gestiona `aria-*` y bloqueo de scroll del body.
3. **Reveal on scroll** — `IntersectionObserver` genérico que añade `.is-visible` a cualquier `.reveal`, con retardo escalonado por grupo (`--reveal-delay`).
4. **Contadores animados** — anima los números tipo `+42.000`, `£2,3MM` respetando prefijos/sufijos y separadores, vía `IntersectionObserver` + `requestAnimationFrame`.
5. **Vídeo embed** (Inicio) — carga un iframe de YouTube/Vimeo al pulsar play, si `data-video-url` está definido.
6. **Vídeo de fondo del hero** (Inicio) — fuerza `play()` con reintento en el primer gesto del usuario si el navegador bloquea el autoplay; oculta el vídeo si falla y deja el poster estático.
7. **Círculo interactivo** (Servicios) — lee los 8 pasos de un `<script type="application/json" id="circle-data">` embebido en el HTML, gestiona el estado activo y la navegación con flechas de teclado.
8. **Galerías horizontales "pinned"** (Track Record) — en desktop, ancla la sección (`position: sticky`) y traduce el scroll vertical en `translateX` del track, con efecto de foco (`scale`/`opacity`) calculado en cada frame; en móvil se desactiva y el carrusel pasa a ser scroll-snap nativo con el efecto CSS del §4. Soporta **múltiples galerías independientes en la misma página** (Track Record tiene dos).
9. **Volver arriba** — scroll suave al inicio.

No hay estado global ni gestión de rutas: cada interacción es local a su sección.

---

## 6. Assets

- **Fuentes**: Playfair Display (+ itálica) y Montserrat, **self-hosted** como `.woff2` variables (subset latin) en `assets/fonts/`, referenciadas por `@font-face` en `css/fonts.css`. Precargadas con `<link rel="preload">` en el `<head>` de cada página. **No se llama a Google Fonts en producción** (mejor privacidad y rendimiento, sin bloqueo por CDN externo).
- **Imágenes**: todas en `assets/img/`, JPEG progresivo calidad 85 + un PNG indexado con transparencia (`img-map.png`, el mapa de puntos). Peso total optimizado: **~7,7 MB** (antes de una limpieza reciente pesaban ~17 MB). `loading="lazy"` en las imágenes fuera del viewport inicial.
- **Vídeo**: `assets/img/hero.mp4` (hero de Inicio), H.264, ~3,3 MB, con `poster` de fallback y `preload="metadata"`.
- **Favicon**: `assets/img/favicon.png` (512×512, PNG con transparencia), referenciado como `<link rel="icon" type="image/png">` en las 6 páginas.
- **Logo**: `assets/img/savills-logo.svg` (vectorial, el isotipo corporativo real).

---

## 7. Despliegue (CI/CD)

Workflow: `.github/workflows/deploy.yml`

- **Disparador**: cualquier `push` a las ramas `main` o `claude/clever-brahmagupta-abt3is`, o manualmente vía `workflow_dispatch`.
- **Pasos**: checkout → `setup-node` (Node 22) → `node build/build.mjs` → commit del HTML regenerado si ha cambiado → `actions/configure-pages` → `actions/upload-pages-artifact` (sube todo el repo) → `actions/deploy-pages`.
- **El build se ejecuta siempre**, de modo que lo publicado corresponde a `content/` aunque el HTML versionado se hubiera quedado atrás — que es justo lo que pasa cuando se edita desde `/admin`, que solo commitea los JSON.
- El paso que devuelve el HTML regenerado al repositorio usa el `GITHUB_TOKEN` del propio workflow. GitHub **no vuelve a disparar workflows** para pushes hechos con ese token, así que no hay bucle infinito. Requiere `contents: write` en los permisos del job.
- **Sin tests ni lint** — el build es la única verificación (falla el job si un JSON está mal formado).
- `concurrency: group: pages, cancel-in-progress: true` — si se hace push varias veces seguidas, el run anterior se cancela y solo se despliega el último.
- El sitio se sirve desde el dominio de GitHub Pages del repositorio (`https://oscarnieto.github.io/residential/`); no hay dominio propio configurado en este momento.

**Nota operativa:** en las últimas semanas la cola de GitHub Actions ha estado intermitentemente lenta (deploys que quedan varios minutos en `queued`); no es un problema del repositorio, sino del servicio de Actions. Si un deploy se queda atascado, un `workflow_dispatch` manual normalmente lo destrasca.

---

## 8. Rendimiento, SEO y accesibilidad

- **Sin JS de terceros, sin analytics, sin cookies** en el estado actual del repo.
- Cada página tiene `<title>` y `<meta name="description">` propios (SEO on-page básico, sin sitemap.xml ni robots.txt configurados todavía).
- HTML semántico (`<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`), atributos `aria-*` en menú, botones y controles interactivos, `alt` descriptivo en imágenes de contenido y `aria-hidden` en las puramente decorativas.
- `prefers-reduced-motion` respetado en todas las animaciones (CSS y JS).
- No hay polyfills: se apoya en **progressive enhancement** — las funciones más modernas (scroll-driven animations, `:has()` si se usara, etc.) se comprueban con `@supports` y degradan a una versión estática/funcional en navegadores antiguos.

---

## 9. Deuda técnica y limitaciones conocidas

- **Sin tests automatizados.** La verificación se hace manualmente (visual, con capturas) antes de cada despliegue. El build sí falla si un JSON de contenido está mal formado, lo que cubre el error más probable.
- **El texto enriquecido es deliberadamente pobre.** Los campos de contenido admiten `*cursiva*`, `**negrita**` y saltos de línea, y nada más. No se puede meter HTML arbitrario desde el CMS — es una decisión de seguridad (ver §11), no una carencia.
- **Un solo idioma.** La estructura de `content/` soportaría traducciones (un directorio por idioma), pero ni el build ni el CMS lo contemplan hoy.
- **Imágenes de placeholder pendientes de sustituir**: revisa si queda algún archivo de imagen sin la foto real definitiva subida por el equipo de marketing (los nombres de archivo son descriptivos, p. ej. `team-es-4-beatriz-hernandez.jpg`).
- *(Resuelto)* La duplicación del header/footer/menú en los 6 HTML, que era la principal deuda del proyecto, desapareció al introducir el generador: ahora está definida una sola vez en `build/partials/layout.mjs`.

---

## 10. Cómo hacer cambios habituales

La vía normal para **cualquier cambio de contenido** es el panel `/admin`
(ver §12): no requiere tocar código ni conocer git. La tabla siguiente es la
equivalencia para quien prefiera trabajar en el repositorio.

| Cambio | Dónde |
|---|---|
| Texto, cifras, enlaces, fotos del equipo, proyectos… | `content/<página>.json` |
| Sustituir una imagen conservando el nombre | Sobrescribir el archivo en `assets/img/` (no requiere tocar nada más) |
| Color de marca | `content/site.json` → `theme` |
| Imagen de fondo de un hero | `content/<página>.json` → `hero.image` |
| Añadir/editar un enlace de navegación | `content/site.json` → `nav` (se propaga a topbar, menú móvil y footer) |
| Tipografía, layout, componentes, animaciones | `css/styles.css` (a mano, como siempre) |
| Comportamiento interactivo | `js/main.js` (a mano, como siempre) |
| Nueva página | Añadir `content/nueva.json`, un renderizador en `build/pages/`, su entrada en `PAGES` (`build/build.mjs`), su enlace en `site.json` → `nav` y su colección en `admin/js/schema.js` |

Para trabajar en local:

```bash
node build/build.mjs        # regenera los 6 HTML y css/theme.css
python3 -m http.server 8000 # y abre http://localhost:8000
```

Tras cualquier cambio: `git commit` + `git push` a la rama de despliegue → GitHub Actions construye y publica automáticamente en 1-3 minutos (salvo que la cola de Actions esté lenta, ver §7).

---

## 11. Seguridad

- Superficie de ataque mínima: sin backend, sin base de datos, sin dependencias npm (sin riesgo de supply-chain vía paquetes), sin formularios que reciban datos de usuarios.
- Todos los enlaces externos (`target="_blank"`) llevan `rel="noopener"`.
- El despliegue usa el `GITHUB_TOKEN` efímero estándar de Actions con permisos `contents: write` (necesario para devolver el HTML regenerado), `pages: write` e `id-token: write`. No hay secretos adicionales configurados.
- **Todo el contenido se escapa al generar el HTML.** `build/lib/html.mjs` es la única frontera entre los datos del CMS y la página: escapa `& < > "` y solo después aplica el marcado ligero permitido. Un editor no puede inyectar etiquetas ni scripts, ni siquiera intencionadamente. El bloque JSON del círculo de Servicios escapa además los `<` para que ningún texto pueda cerrar la etiqueta `<script>` antes de tiempo.
- **El panel `/admin` es público pero inerte.** Cualquiera puede abrir la URL; sin un token de GitHub con permiso de escritura sobre el repositorio no puede leer ni modificar nada. La autorización real la hace GitHub, no el panel. La página lleva `noindex, nofollow`.
- **El token del editor vive solo en su navegador** (`localStorage`) y viaja únicamente a `api.github.com`. No hay servidor intermedio que pueda interceptarlo. Si se filtra, se revoca desde GitHub y deja de servir al instante.

---

## 12. Gestor de contenidos (`/admin`)

**URL:** https://oscarnieto.github.io/residential/admin/
**Guía para editores:** [`CMS.md`](CMS.md)

Un CMS a medida de una sola página, sin servidor. El flujo completo:

```
Editor en /admin  ──escribe──▶  content/*.json  ──API de GitHub──▶  commit en la rama
                                                                          │
                                                                          ▼
                                                              GitHub Actions: build
                                                                          │
                                                                          ▼
                                                              GitHub Pages: web nueva
```

### Piezas

| Archivo | Responsabilidad |
|---|---|
| `admin/js/schema.js` | **Describe qué se puede editar.** Declara cada colección, sección y campo con su tipo. Toda la interfaz se construye desde aquí: añadir un campo al esquema basta para que aparezca en el formulario, se guarde y se publique |
| `admin/js/fields.js` | Convierte cada tipo del esquema en un control (texto, imagen, color, lista repetible, líneas del titular…) |
| `admin/js/github.js` | Cliente de la API de GitHub. Lee los JSON, sube imágenes y publica **todos los cambios en un único commit** usando la Git Data API (blobs → tree → commit → ref), de modo que cada publicación dispara exactamente un despliegue |
| `admin/js/preview.js` | Vista previa en vivo. **Importa los mismos módulos de `build/` que usa el build de producción**, así que lo que se ve es exactamente lo que se publicará; no hay una segunda implementación de las plantillas que pueda desincronizarse |
| `admin/js/app.js` | Estado, navegación, detección de cambios sin publicar, biblioteca de medios, publicación y seguimiento del despliegue |

### Detalles de implementación que conviene conocer

- **Autenticación:** token personal *fine-grained* de GitHub con `Contents: Read and write` sobre este repositorio (y opcionalmente `Actions: Read-only` para ver el estado del despliegue). No se usa OAuth porque el *device flow* de GitHub no permite CORS desde el navegador y exigiría un servidor intermedio, que es justo lo que este montaje evita.
- **Detección de cambios:** el panel guarda una copia del contenido tal como está publicado y la compara estructuralmente con la copia editada. Solo se commitean los archivos que difieren.
- **Concurrencia:** el commit se hace contra el SHA de la rama leído en ese momento. Si otra persona publicó entre medias, GitHub rechaza el `PATCH` de la referencia y el panel pide recargar en lugar de pisar el trabajo ajeno.
- **Subida de imágenes:** se commitean al instante (antes de publicar el resto), porque el campo necesita una ruta real que apunte a un archivo que exista. Se normaliza el nombre (minúsculas, sin acentos ni espacios) y se rechazan archivos por encima de 12 MB.
- **Vista previa:** se renderiza en un `<iframe srcdoc>` con `<base>` **absoluto**. Tiene que ser absoluto: dentro de un iframe con `sandbox`, un `<base>` relativo no se resuelve y los assets se buscarían dentro de `/admin/`. Por el mismo motivo el tema de la vista previa emite rutas absolutas — un `url()` dentro de una variable CSS se resuelve contra la hoja que la **consume** (`css/styles.css`, en `/css/`), no contra la que la declara.
