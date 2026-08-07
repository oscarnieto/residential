import { esc, inline, paragraphs, url } from '../lib/html.mjs';
import { riHero } from '../partials/hero.mjs';

/** El alt y el aria-label usan sólo la ciudad, no el país. */
const shortPlace = (place) => String(place).split(',')[0].trim();

const expertiseSection = (expertise) => `    <!-- ===== Sección 1 · Expertise 360 ===== -->
    <section class="ri-expertise section" id="expertise">
      <div class="container ri-expertise__grid">
        <div class="ri-expertise__text">
          <p class="ri-kicker reveal">${inline(expertise.kicker)}</p>
          <h2 class="ri-expertise__title reveal">${inline(expertise.title)}</h2>
          <p class="ri-expertise__lead reveal">${inline(expertise.lead)}</p>
        </div>
        <div class="ri-expertise__stats">
${expertise.stats
  .map(
    (stat, index) => `${index > 0 ? '          <span class="ri-stat__divider" aria-hidden="true"></span>\n' : ''}          <div class="ri-stat reveal">
            <p class="ri-stat__number" data-counter="${esc(stat.number)}">${esc(stat.number)}</p>
            <p class="ri-stat__label">${inline(stat.label)}</p>
          </div>`
  )
  .join('\n')}
        </div>
      </div>
    </section>`;

const teamsSection = (teams) => `    <!-- ===== Sección 2 · Equipos especializados ===== -->
    <section class="ri-teams section">
      <div class="container">
        <h2 class="section__title reveal">${inline(teams.title)}</h2>
        <div class="ri-teams__intro reveal">
${paragraphs(teams.intro, '          ')}
        </div>

        <div class="ri-teams__feature">
          <figure class="ri-teams__img reveal">
            <img src="${url(teams.feature.image)}" alt="${esc(teams.feature.imageAlt)}" loading="lazy">
          </figure>
          <div class="ri-teams__feature-text reveal">
            <h3 class="ri-teams__subtitle">${inline(teams.feature.subtitle)}</h3>
${paragraphs(teams.feature.text, '            ')}
          </div>
        </div>

        <div class="ri-metrics">
${teams.metrics
  .map(
    (metric) => `          <article class="ri-metric reveal">
            <img class="ri-metric__img" src="${url(metric.image)}" alt="" loading="lazy">
            <div class="ri-metric__body">
              <p class="ri-metric__number" data-counter="${esc(metric.number)}">${esc(metric.number)}</p>
              <p class="ri-metric__label">${inline(metric.label)}</p>
            </div>
          </article>`
  )
  .join('\n')}
        </div>
      </div>
    </section>`;

const projectsSection = (projects) => `    <!-- ===== Sección 3 · Proyectos globales ===== -->
    <section class="ri-projects section">
      <div class="container">
        <h2 class="section__title section__title--light reveal">${inline(projects.title)}</h2>
        <div class="ri-projects__grid">
${projects.items
  .map((item) => {
    const alt = `${item.name}, ${shortPlace(item.place)}`;
    return `          <article class="ri-project reveal">
            <a class="ri-project__link" href="${url(item.url)}" target="_blank" rel="noopener" aria-label="${esc(projects.cta)}: ${esc(alt)}">
              <img class="ri-project__img" src="${url(item.image)}" alt="${esc(alt)}" loading="lazy">
              <span class="ri-project__overlay"><span class="ri-project__cta">${esc(projects.cta)}</span></span>
            </a>
            <figcaption class="ri-project__caption">
              ${esc(item.name)}
              <span class="ri-project__place">${esc(item.place)}</span>
            </figcaption>
          </article>`;
  })
  .join('\n')}
        </div>
      </div>
    </section>`;

export const render = (page) =>
  [
    riHero(page.hero),
    expertiseSection(page.expertise),
    teamsSection(page.teams),
    projectsSection(page.projects),
  ].join('\n\n');
