/* ==========================================================================
   Vista previa
   --------------------------------------------------------------------------
   Importa los mismos módulos que usa el build, así que lo que se ve aquí es
   exactamente lo que se publicará: no hay una segunda implementación de las
   plantillas que pueda desincronizarse.
   ========================================================================== */

import { document as renderDocument } from '../../build/partials/layout.mjs';
import { renderTheme } from '../../build/lib/theme.mjs';

import * as inicio from '../../build/pages/inicio.mjs';
import * as redInternacional from '../../build/pages/red-internacional.mjs';
import * as servicios from '../../build/pages/servicios.mjs';
import * as trackRecord from '../../build/pages/track-record.mjs';
import * as equipo from '../../build/pages/equipo.mjs';
import * as contacto from '../../build/pages/contacto.mjs';

const RENDERERS = {
  inicio,
  'red-internacional': redInternacional,
  servicios,
  'track-record': trackRecord,
  equipo,
  contacto,
};

/** Identificadores de página en el orden en que los espera el tema. */
export const PAGE_IDS = Object.keys(RENDERERS);

/**
 * Raíz del sitio vista desde /admin/. Tiene que ser absoluta: dentro de un
 * iframe `srcdoc` con sandbox, un <base> relativo no se resuelve y los assets
 * acabarían buscándose dentro de /admin/.
 */
export const siteRoot = () =>
  typeof location === 'undefined' ? '../' : new URL('../', location.href).href;

/**
 * Genera el HTML completo de una página a partir del contenido en memoria.
 *
 * @param pageId   identificador de la página
 * @param content  mapa { id → datos } con todas las colecciones cargadas
 * @param baseHref raíz absoluta del sitio para resolver los assets
 */
export const renderPreview = (pageId, content, baseHref = siteRoot()) => {
  const renderer = RENDERERS[pageId];
  if (!renderer) return '<p style="font-family:sans-serif;padding:40px">Esta sección no tiene vista previa.</p>';

  const site = content.site;
  const data = content[pageId];

  const main = renderer.render(data);
  const html = renderDocument({ site, page: { ...data, id: pageId }, main });

  // El tema se calcula en vivo para que los colores y las imágenes de fondo
  // reflejen los cambios sin necesidad de publicar. Las rutas se emiten
  // absolutas porque un `url()` dentro de una variable CSS se resuelve contra
  // la hoja que la consume (styles.css, en /css/), no contra la que la declara.
  const pages = PAGE_IDS.filter((id) => content[id]).map((id) => ({ id, data: content[id] }));
  const theme = renderTheme(site, pages, baseHref);

  return html
    .replace('<head>', `<head>\n  <base href="${baseHref}">`)
    .replace('</head>', `  <style id="preview-theme">${theme}</style>\n</head>`);
};
