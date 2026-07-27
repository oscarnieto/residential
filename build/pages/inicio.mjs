import { esc, inline, inlineNoBreaks, paragraphs } from '../lib/html.mjs';
import { hero } from '../partials/hero.mjs';
import { play, mapPin } from '../lib/icons.mjs';

const introSection = (intro) => `    <!-- ===== Sección 1 · Intro + vídeo ===== -->
    <section class="intro section" id="intro">
      <div class="container container--narrow">
        <span class="ornament reveal" aria-hidden="true"></span>
        <h2 class="intro__title reveal">${inline(intro.title)}</h2>
        <p class="intro__text reveal">${inline(intro.text)}</p>
        <span class="ornament reveal" aria-hidden="true"></span>
      </div>
      <div class="container">
        <div class="video reveal" data-video-url="${esc(intro.video.url)}">
          <img class="video__poster" src="${esc(intro.video.poster)}" alt="${esc(intro.video.posterAlt)}">
          <button class="video__play" aria-label="Reproducir vídeo">
            ${play}
          </button>
        </div>
      </div>
    </section>`;

const servicesSection = (services) => `    <!-- ===== Sección 2 · Servicios ===== -->
    <section class="services section" id="servicios">
      <div class="container">
        <h2 class="section__title reveal">${inline(services.title)}</h2>
        <div class="services__grid">
${services.cards
  .map(
    (card) => `          <article class="card reveal">
            <h3 class="card__title">${inline(card.title)}</h3>
            <p class="card__text">${inline(card.text)}</p>
          </article>`
  )
  .join('\n')}
        </div>
      </div>
    </section>`;

const mapPins = (map) =>
  map.pins
    .map((pin) => {
      const classes = ['map__pin', pin.highlight ? 'map__pin--spain' : ''].filter(Boolean).join(' ');
      const radar = pin.highlight ? '\n            <span class="map__radar" aria-hidden="true"></span>' : '';
      return `          <li class="${classes}" style="--x: ${esc(pin.x)}%; --y: ${esc(pin.y)}%;">${radar}
            <button class="map__pin-btn" type="button" aria-label="${esc(pin.region)}: ${esc(pin.number)} ${esc(map.unit)}">
              ${mapPin}
            </button>
            <span class="map__card">
              <span class="map__card-region">${esc(pin.region)}</span>
              <span class="map__card-number">${esc(pin.number)}</span>
              <span class="map__card-label">${esc(map.unit)}</span>
            </span>
          </li>`;
    })
    .join('\n');

const networkSection = (network) => `    <!-- ===== Sección 3 · Red internacional ===== -->
    <section class="network section" id="red-internacional">
      <div class="container">
        <h2 class="section__title section__title--light reveal">${inline(network.title)}</h2>

        <div class="network__stats">
${network.stats
  .map(
    (stat) => `          <div class="stat reveal">
            <p class="stat__number" data-counter="${esc(stat.number)}">${esc(stat.number)}</p>
            <p class="stat__label">${inline(stat.label)}</p>
          </div>`
  )
  .join('\n')}
        </div>

        <div class="network__business">
          <div class="network__business-text reveal">
            <h3 class="network__subtitle">${inline(network.business.subtitle)}</h3>
${paragraphs(network.business.text, '            ')}
          </div>
          <figure class="network__business-img reveal">
            <img src="${esc(network.business.image)}" alt="${esc(network.business.imageAlt)}" loading="lazy">
          </figure>
        </div>
      </div>

      <div class="map reveal">
        <img class="map__world" src="${esc(network.map.image)}" alt="" aria-hidden="true">
        <ul class="map__pins" aria-label="${esc(network.map.label)}">
${mapPins(network.map)}
        </ul>
      </div>
    </section>`;

const spainSection = (spain) => `    <!-- ===== Sección 4 · Savills en España ===== -->
    <section class="spain section" id="savills-espana">
      <div class="spain__overlay"></div>
      <div class="container container--narrow spain__content">
        <p class="spain__kicker reveal">${inline(spain.kicker)}</p>
        <h2 class="spain__title reveal">${inlineNoBreaks(spain.title)}</h2>
${String(spain.text)
  .split(/\n\s*\n/)
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => `        <p class="spain__text reveal">${inline(block)}</p>`)
  .join('\n')}
        <div class="spain__data">
${spain.stats
  .map(
    (stat) => `          <div class="stat stat--big reveal">
            <p class="stat__number" data-counter="${esc(stat.number)}">${esc(stat.number)}</p>
            <p class="stat__label">${inline(stat.label)}</p>
          </div>`
  )
  .join('\n')}
        </div>
      </div>
    </section>`;

export const render = (page) =>
  [
    hero(page.hero, { video: page.hero.video }),
    introSection(page.intro),
    servicesSection(page.services),
    networkSection(page.network),
    spainSection(page.spain),
  ].join('\n\n');
