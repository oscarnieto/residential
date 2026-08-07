import { esc, inline, paragraphs, url } from '../lib/html.mjs';
import { hero } from '../partials/hero.mjs';
import { plus } from '../lib/icons.mjs';

/**
 * Serializa los pasos para el <script type="application/json">. Se escapan
 * los `<` para que ningún texto del CMS pueda cerrar la etiqueta antes de
 * tiempo; `JSON.parse` en el navegador entiende igualmente <.
 */
const jsonBlock = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

const processSection = (process) => {
  const count = process.steps.length;
  const spacing = 360 / count;

  const dots = process.steps
    .map((_, index) => {
      const angle = +(spacing / 2 + index * spacing).toFixed(4);
      const active = index === 0 ? ' is-active' : '';
      return `            <button class="circle__dot${active}" type="button" data-index="${index}" style="--a: ${angle}deg" aria-label="Paso ${index + 1}"></button>`;
    })
    .join('\n');

  const steps = process.steps.map((step) => ({
    title: step.title,
    strong: step.strong,
    rest: step.rest,
  }));

  return `    <!-- ===== Sección 1 · Proceso (círculo interactivo) ===== -->
    <section class="serv-process section" id="proceso">
      <div class="container container--narrow">
        <h2 class="serv-process__title reveal">${inline(process.title)}</h2>
        <div class="serv-process__intro reveal">
${paragraphs(process.intro, '          ')}
        </div>
      </div>

      <div class="container">
        <div class="circle reveal" role="group" aria-label="Nuestro proceso en ${count} pasos">
          <svg class="circle__ring" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <marker id="serv-arrow" markerUnits="userSpaceOnUse" markerWidth="5" markerHeight="5" refX="1.6" refY="2.5" orient="auto">
                <path d="M0.5 0.6 L4 2.5 L0.5 4.4" fill="none" stroke="var(--navy)" stroke-width="0.55" stroke-linecap="round" stroke-linejoin="round"/>
              </marker>
            </defs>
            <path class="circle__track"
              d="M 61.13 5.37 A 46 46 0 1 1 38.87 5.37"
              fill="none" stroke="var(--navy)" stroke-width="0.5" stroke-linecap="round"
              marker-end="url(#serv-arrow)" />
          </svg>

          <div class="circle__dots">
${dots}
          </div>

          <div class="circle__center" aria-live="polite">
            <p class="circle__num">01</p>
            <h3 class="circle__step-title">${esc(process.steps[0]?.title ?? '')}</h3>
            <p class="circle__step-desc"></p>
          </div>
        </div>
      </div>

      <script type="application/json" id="circle-data">${jsonBlock(steps)}</script>
    </section>`;
};

const typesSection = (types) => `    <!-- ===== Sección 2 · Tipologías ===== -->
    <section class="serv-types section">
      <div class="container">
        <h2 class="section__title reveal">${inline(types.title)}</h2>
        <div class="serv-types__grid">
${types.cards
  .map((card) => {
    const alt = String(card.title).replace(/\s*\n\s*/g, ' ').trim();
    return `          <article class="serv-card reveal">
            <img class="serv-card__img" src="${url(card.image)}" alt="${esc(alt)}" loading="lazy">
            <span class="serv-card__more" aria-hidden="true">
              ${plus}
            </span>
            <div class="serv-card__body">
              <span class="serv-card__rule"></span>
              <h3 class="serv-card__title">${inline(card.title)}</h3>
              <span class="serv-card__rule"></span>
              <p class="serv-card__desc">${inline(card.desc)}</p>
            </div>
          </article>`;
  })
  .join('\n')}
        </div>
      </div>
    </section>`;

export const render = (page) =>
  [
    hero(page.hero, { modifier: 'hero--servicios' }),
    processSection(page.process),
    typesSection(page.types),
  ].join('\n\n');
