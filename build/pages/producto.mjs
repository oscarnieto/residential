import { esc, inline, paragraphs } from '../lib/html.mjs';
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
    const image = `<img src="${esc(product.image)}" alt="${esc(alt)}" loading="lazy">`;

    // Sin enlace, o con el hover desactivado a mano, la imagen se muestra
    // tal cual: ni <a> ni capa de «Ver proyecto».
    const media =
      product.url && product.hover !== false
        ? `              <a class="track-product__media" href="${esc(product.url)}" target="_blank" rel="noopener" aria-label="${esc(cta)}: ${esc(alt)}">
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
 * Carrusel infinito de logotipos. La lista se imprime dos veces para que el
 * desplazamiento pueda volver al origen sin salto visible; la copia queda
 * oculta a los lectores de pantalla.
 */
const logosSection = (logos) => {
  if (!logos?.items?.length) return '';

  const item = (logo) => {
    const image = `<img class="logo-marquee__img" src="${esc(logo.image)}" alt="${esc(logo.name)}" loading="lazy">`;
    return `          <li class="logo-marquee__item">${
      logo.url
        ? `<a href="${esc(logo.url)}" target="_blank" rel="noopener">${image}</a>`
        : image
    }</li>`;
  };

  const list = logos.items.map(item).join('\n');
  const clone = logos.items
    .map((logo) =>
      item({ ...logo, name: '' }).replace('<li class="logo-marquee__item">', '<li class="logo-marquee__item" aria-hidden="true">')
    )
    .join('\n');

  return `    <!-- ===== Carrusel de logotipos ===== -->
    <section class="logo-marquee" aria-label="${esc(logos.label)}">
      <div class="logo-marquee__viewport">
        <ul class="logo-marquee__track" style="--marquee-duration: ${esc(logos.speed)}s">
${list}
${clone}
        </ul>
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
