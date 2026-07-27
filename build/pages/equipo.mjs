import { esc, inline } from '../lib/html.mjs';
import { hero } from '../partials/hero.mjs';
import { linkedinSquare } from '../lib/icons.mjs';

const memberCard = (member) => {
  const linked = Boolean(member.linkedin);
  const classes = ['team-card', linked ? 'team-card--link' : '', 'reveal'].filter(Boolean).join(' ');
  const linkedinMarkup = linked
    ? `
              <a class="team-card__linkedin" href="${esc(member.linkedin)}" target="_blank" rel="noopener" aria-label="Perfil de LinkedIn de ${esc(member.name)}">
                ${linkedinSquare}
              </a>`
    : '';

  return `        <article class="${classes}">
          <div class="team-card__media">
            <img src="${esc(member.photo)}" alt="${esc(member.name)}" loading="lazy">
            <div class="team-card__tag">
              <span class="team-card__city">${esc(member.city)}</span>${linkedinMarkup}
            </div>
          </div>
          <h4 class="team-card__name">${esc(member.name)}</h4>
          <p class="team-card__role">${esc(member.role)}</p>
        </article>`;
};

const spainSection = (spain) => `    <!-- ===== Sección 1 · Nuestro equipo en España ===== -->
    <section class="team team--es section" id="equipo-espana">
      <div class="container container--narrow team__intro">
        <h2 class="team__lead reveal">${inline(spain.lead)}</h2>
        <span class="team__rule reveal" aria-hidden="true"></span>
        <h3 class="team__title reveal">${inline(spain.title)}</h3>
      </div>

      <div class="container team__grid">

${spain.members.map(memberCard).join('\n\n')}

      </div>
    </section>`;

const globalSection = (global) => `    <!-- ===== Sección 2 · Nuestro equipo a nivel global ===== -->
    <section class="team team--global section">
      <div class="team__earth" aria-hidden="true"></div>
      <div class="container container--narrow team__intro">
        <h3 class="team__title team__title--light reveal">${inline(global.title)}</h3>
      </div>

      <div class="container team__grid">

${global.members.map(memberCard).join('\n\n')}

      </div>
    </section>`;

export const render = (page) =>
  [hero(page.hero, { modifier: 'hero--equipo' }), spainSection(page.spain), globalSection(page.global)].join(
    '\n\n'
  );
