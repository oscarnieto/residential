import { esc, inline } from '../lib/html.mjs';
import { hero } from '../partials/hero.mjs';

const gallery = (block, { id, cta }) => `      <!-- Galería horizontal anclada (pin) -->
      <div class="track-gallery" id="${esc(id)}">
        <div class="track-gallery__sticky">
          <div class="track-gallery__track">

${block.products
  .map((product) => {
    const alt = `${product.name}, ${product.city}`;
    return `            <article class="track-product">
              <p class="track-product__city">${esc(product.city)}</p>
              <a class="track-product__media" href="${esc(product.url)}" target="_blank" rel="noopener" aria-label="${esc(cta)}: ${esc(alt)}">
                <img src="${esc(product.image)}" alt="${esc(alt)}" loading="lazy">
                <span class="track-product__overlay"><span class="track-product__cta">${esc(cta)}</span></span>
              </a>
              <p class="track-product__name">${esc(product.name)}</p>
            </article>`;
  })
  .join('\n\n')}

          </div>
        </div>
      </div>`;

const nationalSection = (block, cta) => `    <!-- ===== Sección 1 · Experiencia + galería de productos ===== -->
    <section class="track section" id="experiencia">
      <div class="container container--narrow track__intro">
        <h2 class="track__title reveal">${inline(block.title)}</h2>
        <p class="track__lead reveal">${inline(block.lead)}</p>
      </div>

${gallery(block, { id: 'track-gallery', cta })}
    </section>`;

const internationalSection = (block, cta) => `    <!-- ===== Sección 2 · Track Record Internacional (navy) ===== -->
    <section class="track track--navy section">
      <div class="container container--narrow track__intro">
        <h2 class="track__title reveal">${inline(block.title)}</h2>
        <p class="track__lead reveal">${inline(block.lead)}</p>
      </div>

${gallery(block, { id: 'track-gallery-2', cta })}
    </section>`;

export const render = (page) =>
  [
    hero(page.hero, { modifier: 'hero--track' }),
    nationalSection(page.national, page.cta),
    internationalSection(page.international, page.cta),
  ].join('\n\n');
