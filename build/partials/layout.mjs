/* ==========================================================================
   Partes comunes a todas las páginas
   --------------------------------------------------------------------------
   Cabecera, menú móvil y pie se generan una sola vez desde `content/site.json`,
   de modo que un cambio en la navegación o en el pie se propaga a las seis
   páginas sin tocar el HTML.
   ========================================================================== */

import { esc, inline, join } from '../lib/html.mjs';
import { social as socialIcons } from '../lib/icons.mjs';

/**
 * Resuelve el destino de un enlace de navegación desde la página actual.
 * En su propia página los enlaces de inicio apuntan al ancla del hero, para
 * conservar el comportamiento de «volver arriba» que ya tenía el sitio.
 */
const navHref = (item, pageId) =>
  item.page === pageId && item.selfHref ? item.selfHref : item.href;

/**
 * Añade una huella del contenido a los CSS y al JS: `styles.css?v=1a2b3c4d`.
 * Cuando el archivo cambia, la URL cambia, así que el navegador se baja la
 * versión nueva en lugar de servir la que tenía en caché. Sin esto, un cambio
 * de estilos puede tardar días en verse en un navegador que ya había estado
 * en la web.
 *
 * `assets` lo calcula el build; la vista previa del panel no lo necesita y
 * pasa un objeto vacío, con lo que las rutas salen sin sufijo.
 */
const versioned = (assets) => (path) => (assets[path] ? `${path}?v=${assets[path]}` : path);

export const head = ({ site, page, assets = {} }) => {
  const title = page.seo.title;
  const description = page.seo.description;
  const v = versioned(assets);

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" type="image/png" href="${esc(site.brand.favicon)}">
  <link rel="preload" href="assets/fonts/playfair-display-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/montserrat-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${esc(v('css/fonts.css'))}">
  <link rel="stylesheet" href="${esc(v('css/styles.css'))}">
  <link rel="stylesheet" href="${esc(v('css/theme.css'))}">
</head>`;
};

export const topbar = ({ site, page }) => {
  const items = site.nav;
  const half = Math.ceil(items.length / 2);
  const renderGroup = (group) =>
    group
      .map((item) => {
        const active = item.page === page.id ? ' is-active' : '';
        return `        <li><a href="${esc(navHref(item, page.id))}" class="topbar__link${active}">${esc(item.label)}</a></li>`;
      })
      .join('\n');

  return `  <!-- ===== Topbar ===== -->
  <header class="topbar" id="topbar">
    <nav class="topbar__nav" aria-label="Navegación principal">
      <ul class="topbar__menu topbar__menu--left">
${renderGroup(items.slice(0, half))}
      </ul>
      <a href="${esc(site.brand.logoHref)}" class="topbar__logo" aria-label="${esc(site.brand.name)}" target="_blank" rel="noopener">
        <img src="${esc(site.brand.logo)}" alt="${esc(site.brand.name)}" width="90" height="90">
      </a>
      <ul class="topbar__menu topbar__menu--right">
${renderGroup(items.slice(half))}
      </ul>
      <button class="topbar__burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-menu">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </header>`;
};

export const mobileMenu = ({ site, page }) => `  <!-- Mobile menu overlay -->
  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    <ul class="mobile-menu__list">
${site.nav
  .map(
    (item) =>
      `      <li><a href="${esc(navHref(item, page.id))}" class="mobile-menu__link">${esc(item.label)}</a></li>`
  )
  .join('\n')}
    </ul>
  </div>`;

export const footer = ({ site, page }) => {
  const links = site.nav
    .map(
      (item) => `            <li><a href="${esc(navHref(item, page.id))}">${esc(item.label)}</a></li>`
    )
    .join('\n');

  const socialLinks = site.footer.social
    .filter((item) => item.url && socialIcons[item.network])
    .map(
      (item) => `          <a href="${esc(item.url)}" target="_blank" rel="noopener" aria-label="${esc(item.label)}">
            ${socialIcons[item.network]}
          </a>`
    )
    .join('\n');

  return `  <!-- ===== Footer ===== -->
  <footer class="footer" id="contacto">
    <div class="footer__main">
      <div class="container footer__main-inner">
        <a href="${esc(site.brand.logoHref)}" class="footer__logo" aria-label="${esc(site.brand.name)}" target="_blank" rel="noopener">
          <img src="${esc(site.brand.logo)}" alt="${esc(site.brand.name)}" width="88" height="88">
        </a>
        <nav aria-label="Navegación del pie de página">
          <ul class="footer__menu">
${links}
          </ul>
        </nav>
        <div class="footer__social">
${socialLinks}
        </div>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <p>${inline(site.footer.copyright)}</p>
        <button class="footer__top" id="back-to-top">${esc(site.footer.backToTop)}</button>
      </div>
    </div>
  </footer>`;
};

/** Envuelve el contenido de una página en el documento completo. */
export const document = ({ site, page, main, assets = {} }) =>
  `<!DOCTYPE html>
<html lang="${esc(site.brand.lang)}">
${head({ site, page, assets })}
<body>

${topbar({ site, page })}

${mobileMenu({ site, page })}

  <main>

${main}

  </main>

${footer({ site, page })}

  <script src="${esc(versioned(assets)('js/main.js'))}"></script>
</body>
</html>
`;

export { join };
