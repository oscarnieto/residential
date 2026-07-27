/* ==========================================================================
   Hero
   --------------------------------------------------------------------------
   Todas las páginas comparten la misma estructura de hero salvo Red
   Internacional, que usa su propio bloque con resplandor. La imagen de fondo
   no se imprime aquí: se declara como variable CSS en `css/theme.css`, que
   también genera el build.
   ========================================================================== */

import { esc } from '../lib/html.mjs';
import { chevronDown } from '../lib/icons.mjs';

const titleLines = (lines, baseClass) =>
  lines
    .map((line) => {
      const tag = line.italic ? 'em' : 'span';
      const italic = line.italic ? ` ${baseClass}--italic` : '';
      return `        <${tag} class="${baseClass}${italic}">${esc(line.text)}</${tag}>`;
    })
    .join('\n');

const scrollLink = (hero) => `      <a href="${esc(hero.scrollTo)}" class="hero__scroll" aria-label="Bajar a la siguiente sección">
        ${chevronDown}
      </a>`;

/** Hero estándar (Inicio, Servicios, Track Record, Equipo, Contacto). */
export const hero = (hero_, { modifier = '', video = null } = {}) => {
  const classes = ['hero', modifier].filter(Boolean).join(' ');
  const videoMarkup = video
    ? `\n      <video class="hero__video" autoplay muted loop playsinline preload="metadata" poster="${esc(video.poster)}" aria-hidden="true" tabindex="-1">
        <source src="${esc(video.src)}" type="video/mp4">
      </video>`
    : '';

  return `    <!-- ===== Hero ===== -->
    <section class="${classes}" id="inicio">
      <div class="hero__bg" role="img" aria-label="${esc(hero_.imageAlt)}"></div>${videoMarkup}
      <div class="hero__overlay"></div>
      <h1 class="hero__title">
${titleLines(hero_.lines, 'hero__title-line')}
      </h1>
${scrollLink(hero_)}
    </section>`;
};

/** Hero específico de la página Red Internacional. */
export const riHero = (hero_) => `    <!-- ===== Hero ===== -->
    <section class="ri-hero" id="inicio">
      <div class="ri-hero__bg" role="img" aria-label="${esc(hero_.imageAlt)}"></div>
      <div class="ri-hero__overlay" aria-hidden="true"></div>
      <div class="ri-hero__glow" aria-hidden="true"></div>
      <h1 class="ri-hero__title">
${titleLines(hero_.lines, 'ri-hero__title-line')}
      </h1>
${scrollLink(hero_)}
    </section>`;
