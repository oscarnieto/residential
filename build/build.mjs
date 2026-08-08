#!/usr/bin/env node
/* ==========================================================================
   Build del sitio
   --------------------------------------------------------------------------
   Lee `content/*.json` y escribe las seis páginas HTML más `css/theme.css`.
   No tiene dependencias: se ejecuta con `node build/build.mjs` en local y en
   el workflow de despliegue.

   El contenido es la fuente de la verdad; el HTML generado se versiona
   igualmente para que GitHub Pages pueda servirlo sin build si hiciera falta.
   ========================================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join as joinPath } from 'node:path';
import { createHash } from 'node:crypto';

import { document } from './partials/layout.mjs';
import { renderTheme } from './lib/theme.mjs';
import { minifyCss, minifyJs } from './lib/minify.mjs';
import * as inicio from './pages/inicio.mjs';
import * as redInternacional from './pages/red-internacional.mjs';
import * as servicios from './pages/servicios.mjs';
import * as producto from './pages/producto.mjs';
import * as equipo from './pages/equipo.mjs';
import * as contacto from './pages/contacto.mjs';

const root = joinPath(dirname(fileURLToPath(import.meta.url)), '..');

/** Orden y destino de cada página. El `id` casa con `page` en site.json. */
export const PAGES = [
  { id: 'inicio', content: 'inicio.json', output: 'index.html', renderer: inicio },
  {
    id: 'red-internacional',
    content: 'red-internacional.json',
    output: 'red-internacional.html',
    renderer: redInternacional,
  },
  { id: 'servicios', content: 'servicios.json', output: 'servicios.html', renderer: servicios },
  { id: 'producto', content: 'producto.json', output: 'producto.html', renderer: producto },
  { id: 'equipo', content: 'equipo.json', output: 'equipo.html', renderer: equipo },
  { id: 'contacto', content: 'contacto.json', output: 'contacto.html', renderer: contacto },
];

const readJson = async (relativePath) => JSON.parse(await readFile(joinPath(root, relativePath), 'utf8'));

/** Cabecera del CSS generado, para que nadie lo edite a mano por error. */
const THEME_HEADER = `/* ==========================================================================
   Tema generado — NO EDITAR A MANO
   --------------------------------------------------------------------------
   Este archivo lo escribe \`build/build.mjs\` a partir de \`content/site.json\`
   y de la imagen de hero de cada página. Para cambiar cualquier valor usa el
   panel de administración (/admin) o edita los JSON de \`content/\`.
   ========================================================================== */

`;

/**
 * Assets que se publican minificados (INFO-02). La clave es el fuente, que
 * sigue siendo lo que se edita y lo que se versiona de forma legible; el valor
 * es la copia que referencia el HTML. El minificador está en `lib/minify.mjs`
 * y sólo quita comentarios y espacio en blanco.
 */
const MINIFICABLES = {
  'css/fonts.css': 'css/fonts.min.css',
  'css/styles.css': 'css/styles.min.css',
  'css/theme.css': 'css/theme.min.css',
  'js/main.js': 'js/main.min.js',
};

/** Huella corta del contenido de un archivo. */
const fingerprint = async (relativePath) =>
  createHash('sha1')
    .update(await readFile(joinPath(root, relativePath)))
    .digest('hex')
    .slice(0, 8);

export const build = async () => {
  const site = await readJson('content/site.json');

  const pages = await Promise.all(
    PAGES.map(async (page) => ({ ...page, data: await readJson(`content/${page.content}`) }))
  );

  const written = [];

  // El tema se escribe antes de calcular las huellas: es uno de los archivos
  // versionados, así que su contenido tiene que estar ya en disco.
  await writeFile(joinPath(root, 'css/theme.css'), THEME_HEADER + renderTheme(site, pages), 'utf8');
  written.push('css/theme.css');

  // Se minifica después de escribir el tema (es uno de los assets) y antes de
  // calcular las huellas, que se toman sobre el archivo que de verdad se
  // descarga el navegador.
  const assets = {};
  for (const [source, minified] of Object.entries(MINIFICABLES)) {
    const original = await readFile(joinPath(root, source), 'utf8');
    const minify = source.endsWith('.css') ? minifyCss : minifyJs;
    await writeFile(joinPath(root, minified), minify(original), 'utf8');
    written.push(minified);
    assets[source] = `${minified}?v=${await fingerprint(minified)}`;
  }

  for (const page of pages) {
    const main = page.renderer.render(page.data);
    const html = document({ site, page: { ...page.data, id: page.id }, main, assets });
    await writeFile(joinPath(root, page.output), html, 'utf8');
    written.push(page.output);
  }

  return written;
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const written = await build();
  console.log(`✔ Generados ${written.length} archivos:`);
  written.forEach((file) => console.log(`  · ${file}`));
}
