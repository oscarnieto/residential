import { esc, inline } from '../lib/html.mjs';
import { hero } from '../partials/hero.mjs';

/** `+34 93 439 54 54` → `tel:+34934395454` */
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

const contactSection = (page) => `    <!-- ===== Sección 1 · Contacto ===== -->
    <section class="contact section" id="contacto-oficinas">
      <div class="container container--narrow contact__intro">
        <h2 class="contact__title reveal">${inline(page.intro.title)}</h2>
        <p class="contact__lead reveal">${inline(page.intro.lead)}</p>
        <span class="contact__rule reveal" aria-hidden="true"></span>
      </div>

      <div class="container contact__block">
        <div class="contact__aside">
          <p class="contact__cta reveal">${inline(page.intro.cta)}</p>
        </div>

        <div class="contact__cities">

${page.offices
  .map(
    (office) => `          <article class="contact-city reveal">
            <div class="contact-city__media">
              <img src="${esc(office.image)}" alt="Oficina de Savills en ${esc(office.city)}" loading="lazy">
            </div>
            <h3 class="contact-city__name">${esc(office.city)}</h3>
            <p class="contact-city__addr">${esc(office.address)}</p>
            <p class="contact-city__phone"><a href="${esc(telHref(office.phone))}">${esc(office.phone)}</a></p>
          </article>`
  )
  .join('\n\n')}

        </div>
      </div>
    </section>`;

export const render = (page) =>
  [hero(page.hero, { modifier: 'hero--contacto' }), contactSection(page)].join('\n\n');
