import { esc, inline, paragraphs, num, url } from '../lib/html.mjs';
import { hero } from '../partials/hero.mjs';

/** Navegación de anclas a cada bloque. */
const blockNav = (blocks) => `    <nav class="producto-nav reveal" aria-label="Secciones de producto">
${blocks
  .map(
    (block) =>
      `      <a class="producto-nav__link" href="#${esc(block.id)}">${esc(block.navLabel)}</a>`
  )
  .join('\n')}
    </nav>`;

const introSection = (page) => `    <!-- ===== Sección 1 · Intro + navegación ===== -->
    <section class="producto-intro section" id="experiencia">
      <div class="container container--narrow">
        <h2 class="producto-intro__title reveal">${inline(page.intro.title)}</h2>
      </div>
      <div class="container">
${blockNav(page.blocks)}
      </div>
    </section>`;

const gallery = (block, cta) => `      <!-- Galería horizontal anclada (pin) -->
      <div class="track-gallery" id="gallery-${esc(block.id)}">
        <div class="track-gallery__sticky">
          <div class="track-gallery__track">

${block.products
  .map((product) => {
    const alt = `${product.name}, ${product.city}`;
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

    return `            <article class="track-product">
              <p class="track-product__city">${esc(product.city)}</p>
${media}
              <p class="track-product__name">${esc(product.name)}</p>
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
 * Carrusel infinito de logotipos.
 *
 * La lista se imprime dos veces en dos grupos idénticos: desplazar el track un
 * 50% equivale exactamente al ancho de un grupo, así que al terminar la vuelta
 * la imagen es la misma y el bucle no da salto. Cada grupo se estira para
 * cubrir como mínimo el ancho de la ventana (ver `min-width` en el CSS), que es
 * lo que evita que quede hueco cuando hay pocos logotipos.
 */
const logosSection = (logos) => {
  if (!logos?.items?.length) return '';

  const item = (logo, hidden) => {
    // Carga inmediata a propósito: con `lazy`, los logotipos desplazados a la
    // derecha por la animación no entran en el viewport y aparecían en blanco
    // al llegar su turno. Pesan poco, así que sale más barato traerlos ya.
    const image = `<img class="logo-marquee__img" src="${url(logo.image)}" alt="${hidden ? '' : esc(logo.name)}" loading="eager" decoding="async">`;
    return `            <li class="logo-marquee__item">${
      logo.url ? `<a href="${url(logo.url)}" target="_blank" rel="noopener">${image}</a>` : image
    }</li>`;
  };

  const group = (hidden) => `          <ul class="logo-marquee__group"${hidden ? ' aria-hidden="true"' : ''}>
${logos.items.map((logo) => item(logo, hidden)).join('\n')}
          </ul>`;

  return `    <!-- ===== Carrusel de logotipos ===== -->
    <section class="logo-marquee" aria-label="${esc(logos.label)}">
      <div class="logo-marquee__viewport">
        <div class="logo-marquee__track" style="--marquee-duration: ${num(logos.speed, 45)}s">
${group(false)}
${group(true)}
        </div>
      </div>
    </section>`;
};

export const render = (page) =>
  [
    hero(page.hero, { modifier: 'hero--track' }),
    introSection(page),
    ...page.blocks.map((block, index) => blockSection(block, page.cta, index)),
    logosSection(page.logos),
  ]
    .filter(Boolean)
    .join('\n\n');
