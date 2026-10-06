import { esc, inline, num, url } from '../lib/html.mjs';
import { hero } from '../partials/hero.mjs';

/** Navegación de anclas a cada bloque. */
const blockNav = (blocks) => `    <nav class="producto-nav reveal" aria-label="Secciones de producto">
${blocks
  .map(
    (block) =>
      // `data-label` repite el texto para que el CSS pinte la copia en azul
      // marino dentro de la máscara amarilla del hover (ver .producto-nav__link).
      `      <a class="producto-nav__link" href="#${esc(block.id)}" data-label="${esc(block.navLabel)}">${esc(block.navLabel)}</a>`
  )
  .join('\n')}
    </nav>`;

const introSection = (page) => `    <!-- ===== Sección 1 · Intro ===== -->
    <section class="producto-intro section" id="experiencia">
      <div class="container container--narrow">
        <h2 class="producto-intro__title reveal">${inline(page.intro.title)}</h2>
      </div>
    </section>`;

/**
 * Barra de navegación entre bloques. Va debajo de las fotos de las cifras y se
 * queda pegada (sticky) bajo la topbar mientras se recorren los bloques, así que
 * tiene que ser hija directa del contenedor que los envuelve (`.producto-body`):
 * un elemento sticky solo se queda pegado mientras dure su padre. El JS marca como activo el botón de la
 * sección en la que se está (`is-current`).
 */
const stickyNav = (blocks) => `    <div class="producto-sticky">
      <div class="container">
${blockNav(blocks)}
      </div>
    </div>`;

/**
 * Tres cifras destacadas entre la intro y el primer bloque de producto: una
 * foto de fondo, un número grande (animado al entrar en pantalla, igual que
 * `.ri-metric` en Red internacional) y una etiqueta.
 */
const statsSection = (stats) => {
  if (!stats?.length) return '';

  return `    <!-- ===== Cifras destacadas ===== -->
    <section class="track-stats section">
      <div class="container">
        <div class="track-stats__grid">
${stats
  .map(
    (stat) => `          <article class="track-stats__card reveal">
            <img class="track-stats__img" src="${url(stat.image)}" alt="" loading="lazy">
            <div class="track-stats__body">
              <p class="track-stats__number" data-counter="${esc(stat.number)}">${esc(stat.number)}</p>
              <p class="track-stats__label">${inline(stat.label)}</p>
            </div>
          </article>`
  )
  .join('\n')}
        </div>
      </div>
    </section>`;
};

const gallery = (block, cta) => `      <!-- Galería horizontal anclada (pin) -->
      <div class="track-gallery" id="gallery-${esc(block.id)}">
        <div class="track-gallery__sticky">
          <div class="track-gallery__track">

${block.products
  .map((product) => {
    // El nombre del proyecto puede faltar mientras no se conozca. Se compone
    // con lo que haya para no acabar en un «, Barcelona», que es lo que leería
    // un lector de pantalla.
    const alt = [product.name, product.city].filter(Boolean).join(', ');
    const image = `<img src="${url(product.image)}" alt="${esc(alt)}" loading="lazy">`;

    // Sin enlace, o con el hover desactivado a mano, la imagen se muestra
    // tal cual: ni <a> ni capa de «Ver proyecto».
    const media =
      product.url && product.hover !== false
        ? `              <a class="track-product__media" href="${url(product.url)}" target="_blank" rel="noopener" aria-label="${esc(cta)}: ${esc(alt)}">
                ${image}
                <span class="track-product__overlay"><span class="track-product__cta">${esc(cta)}</span></span>
              </a>`
        : `              <div class="track-product__media track-product__media--static">
                ${image}
              </div>`;

    // Sin nombre no se emite el párrafo: uno vacío dejaría su margen y su
    // altura de línea como hueco bajo la foto.
    const nombre = product.name
      ? `\n              <p class="track-product__name">${esc(product.name)}</p>`
      : '';

    return `            <article class="track-product">
              <p class="track-product__city">${esc(product.city)}</p>
${media}${nombre}
            </article>`;
  })
  .join('\n\n')}

          </div>
        </div>
      </div>`;

/**
 * Un bloque de producto. Mientras no tenga proyectos, se omite la galería
 * para que la página no muestre un hueco vacío.
 */
const blockSection = (block, cta, index) => {
  const classes = ['track', block.theme === 'navy' ? 'track--navy' : '', 'section']
    .filter(Boolean)
    .join(' ');

  const leadParagraphs = String(block.lead)
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => `        <p class="track__lead reveal">${inline(text)}</p>`)
    .join('\n');

  return `    <!-- ===== Sección ${index + 2} · ${block.navLabel} ===== -->
    <section class="${classes}" id="${esc(block.id)}">
      <div class="container container--narrow track__intro">
        <h2 class="track__title reveal">${inline(block.title)}</h2>
${leadParagraphs}
      </div>
${block.products.length ? `\n${gallery(block, cta)}` : ''}
    </section>`;
};

/**
 * Carrusel infinito de logotipos, en filas.
 *
 * Cada fila es un carrusel independiente y las filas alternan de sentido: la
 * primera avanza hacia la derecha, la segunda hacia la izquierda, la tercera
 * hacia la derecha… El sentido lo decide la posición, no el contenido.
 *
 * La lista de cada fila se imprime dos veces en dos grupos idénticos: desplazar
 * el track un 50% equivale exactamente al ancho de un grupo, así que al terminar
 * la vuelta la imagen es la misma y el bucle no da salto. Cada grupo se estira
 * para cubrir como mínimo el ancho de la ventana (ver `min-width` en el CSS),
 * que es lo que evita que quede hueco cuando hay pocos logotipos.
 *
 * Velocidad: `secondsPerLogo` es el tiempo que tarda en pasar cada logotipo por
 * un punto de la fila. La duración de una vuelta es ese tiempo por el número de
 * logotipos de la fila, así que el ritmo es el mismo lleve la fila 6 logotipos
 * o 14. Con una duración fija por vuelta, repartir los logotipos en dos filas
 * habría ralentizado el movimiento a la mitad.
 *
 * Eso rige tal cual cuando la fila es más ancha que la ventana. Si tiene pocos
 * logotipos, sus grupos se estiran y el JS calcula la velocidad con el ancho sin
 * estirar, para que el ritmo no cambie (ver `naturalWidth` en `main.js`). El
 * respaldo CSS sin JS sí correría más en esas filas.
 */
const logosSection = (logos) => {
  const rows = (logos?.rows ?? []).filter((row) => row?.items?.length);
  if (!rows.length) return '';

  const secondsPerLogo = Number.parseFloat(logos.secondsPerLogo) || 3.2;

  const item = (logo, hidden) => {
    // Carga inmediata a propósito: con `lazy`, los logotipos desplazados a la
    // derecha por la animación no entran en el viewport y aparecían en blanco
    // al llegar su turno. Pesan poco, así que sale más barato traerlos ya.
    const image = `<img class="logo-marquee__img" src="${url(logo.image)}" alt="${hidden ? '' : esc(logo.name)}" loading="eager" decoding="async">`;
    return `            <li class="logo-marquee__item">${
      logo.url ? `<a href="${url(logo.url)}" target="_blank" rel="noopener">${image}</a>` : image
    }</li>`;
  };

  const group = (row, hidden) => `          <ul class="logo-marquee__group"${hidden ? ' aria-hidden="true"' : ''}>
${row.items.map((logo) => item(logo, hidden)).join('\n')}
          </ul>`;

  const viewport = (row, index) => `      <div class="logo-marquee__viewport" data-direction="${index % 2 === 0 ? 'right' : 'left'}">
        <div class="logo-marquee__track" style="--marquee-duration: ${num(+(row.items.length * secondsPerLogo).toFixed(2), 45)}s">
${group(row, false)}
${group(row, true)}
        </div>
      </div>`;

  return `    <!-- ===== Carrusel de logotipos ===== -->
    <section class="logo-marquee" aria-label="${esc(logos.label)}">
${rows.map(viewport).join('\n')}
    </section>`;
};

export const render = (page) =>
  [
    hero(page.hero, { modifier: 'hero--track' }),
    introSection(page),
    // Envuelve las cifras, la barra pegada y los bloques: la barra se suelta al
    // acabar el último bloque y no acompaña al carrusel de logotipos.
    `    <div class="producto-body">
${[
  statsSection(page.stats),
  stickyNav(page.blocks),
  ...page.blocks.map((block, index) => blockSection(block, page.cta, index)),
]
  .filter(Boolean)
  .join('\n\n')}
    </div>`,
    logosSection(page.logos),
  ]
    .filter(Boolean)
    .join('\n\n');
