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
| Build | **Ninguno.** No hay bundler, transpilador ni gestor de paquetes (no `package.json`, no `node_modules`) |
| Hosting | **GitHub Pages** (estático) |
| CI/CD | **GitHub Actions** — despliega automáticamente en cada `push` |
| Backend | No existe. No hay servidor, base de datos ni API propia |
| Formularios | No hay formularios con envío de datos; el contacto es por teléfono (`tel:`) y enlaces a LinkedIn/Instagram |

Es, deliberadamente, el stack más simple posible: **archivos estáticos servidos tal cual**. No hay nada que compilar, instalar (`npm install`) ni actualizar por vulnerabilidades de dependencias, porque no hay dependencias.

---

## 2. Estructura de archivos

```
residential/
├── index.html                 Inicio
├── red-internacional.html     Red Internacional
├── servicios.html             Servicios
├── track-record.html          Track Record
├── equipo.html                Equipo
├── contacto.html               Contacto
│
├── css/
│   ├── fonts.css               @font-face de las fuentes self-hosted
│   └── styles.css               Todo el CSS del sitio (~2.740 líneas): tokens
│                                 de diseño, layout, componentes, responsive
│
├── js/
│   └── main.js                  Todo el JS del sitio (~340 líneas), un único
│                                 IIFE sin dependencias externas
│
├── assets/
│   ├── fonts/                   3 archivos .woff2 (fuentes variables)
│   └── img/                     ~55 imágenes JPG/PNG + 1 vídeo MP4 + 1 SVG
│
├── .github/workflows/deploy.yml Pipeline de despliegue a GitHub Pages
├── .nojekyll                    Desactiva el procesado Jekyll de GitHub Pages
└── .claude/settings.json        Config de permisos del asistente de IA (irrelevante para IT)
```

**Cada página HTML es un archivo independiente y autocontenido** — no hay
plantillas ni "includes" del lado servidor. El header, el menú móvil y el
footer están **duplicados literalmente en los 6 archivos `.html`**. Es la
principal deuda técnica del proyecto (ver §9).

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
- **Pasos**: checkout → `actions/configure-pages` → `actions/upload-pages-artifact` (sube **todo el repo tal cual**, sin build) → `actions/deploy-pages`.
- **Sin pasos de test, lint ni build** — es deploy directo de los archivos estáticos.
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

- **Duplicación de header/footer/menú en 6 archivos.** Cualquier cambio de navegación (añadir una página, cambiar un enlace del footer) hay que replicarlo a mano en los 6 HTML. Es el mayor riesgo de inconsistencia del proyecto. Si el sitio crece más, valdría la pena introducir un generador estático mínimo (11ty, Astro, o incluso un script de build simple con includes) — implicaría añadir un paso de build al workflow de deploy.
- **Sin gestor de contenido.** Todos los textos, nombres del equipo, teléfonos, etc. están escritos directamente en el HTML. Cualquier cambio de contenido requiere editar código y hacer un nuevo commit/deploy.
- **Sin tests automatizados.** La verificación se hace manualmente (visual, con capturas) antes de cada despliegue.
- **Imágenes de placeholder pendientes de sustituir**: revisa si queda algún archivo de imagen sin la foto real definitiva subida por el equipo de marketing (los nombres de archivo son descriptivos, p. ej. `team-es-4-beatriz-hernandez.jpg`).

---

## 10. Cómo hacer cambios habituales

| Cambio | Dónde |
|---|---|
| Texto de una sección | Editar el `<h1>/<h2>/<p>` correspondiente en el `.html` de esa página |
| Sustituir una imagen | Sobrescribir el archivo en `assets/img/` **con el mismo nombre** (no requiere tocar HTML/CSS) |
| Color de marca / tipografía | Variables en `:root` al inicio de `css/styles.css` |
| Añadir/editar un enlace de navegación | Repetir el cambio en las 6 páginas: `<ul class="topbar__menu...">`, `<ul class="mobile-menu__list">` y `<ul class="footer__menu">` |
| Nueva página | Duplicar la estructura de una página existente (header/footer/menú), añadir su enlace en las 6 páginas existentes |

Tras cualquier cambio: `git commit` + `git push` a la rama de despliegue → GitHub Actions publica automáticamente en 1-3 minutos (salvo que la cola de Actions esté lenta, ver §7).

---

## 11. Seguridad

- Superficie de ataque mínima: sin backend, sin base de datos, sin dependencias npm (sin riesgo de supply-chain vía paquetes), sin formularios que reciban datos de usuarios.
- Todos los enlaces externos (`target="_blank"`) llevan `rel="noopener"`.
- El despliegue usa el `GITHUB_TOKEN` efímero estándar de Actions con permisos mínimos (`contents: read`, `pages: write`, `id-token: write`), sin secretos adicionales configurados.
