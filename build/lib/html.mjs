/* ==========================================================================
   Helpers de plantilla
   --------------------------------------------------------------------------
   Todo el contenido editable pasa por aquí antes de llegar al HTML, así que
   este archivo es la única frontera entre los datos del CMS y la página.
   Nada de lo que escriba un editor puede inyectar etiquetas: primero se
   escapa y después se aplica el marcado ligero permitido.
   ========================================================================== */

/** Escapa un texto para poder incrustarlo en HTML o en un atributo. */
export const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Marcado ligero para textos editables:
 *   **negrita**  → <strong>
 *   *cursiva*    → <em>
 *   salto de línea → <br>
 */
export const inline = (value = '') =>
  esc(value)
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/gs, '<em>$1</em>')
    .replace(/\r?\n/g, '<br>');

/** Igual que `inline` pero sin convertir los saltos de línea en <br>. */
export const inlineNoBreaks = (value = '') =>
  esc(value)
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/gs, '<em>$1</em>');

/**
 * Número para incrustar en un atributo `style`. Escapar no basta ahí: un valor
 * como `1s;background:url(...)` no lleva comillas ni ángulos, así que pasaría
 * el escapado y se colaría como CSS. Se acepta sólo un número.
 */
export const num = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? String(parsed) : String(fallback);
};

/** Esquemas admitidos en un enlace escrito desde el gestor de contenidos. */
const SAFE_SCHEME = /^(?:https?|mailto|tel):/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * URL para un atributo `href` o `src`.
 *
 * Escapar no basta: `javascript:...` no lleva comillas ni ángulos, así que
 * sobrevive al escapado y se ejecuta al pulsar el enlace. Se admiten sólo
 * esquemas inofensivos, y cualquier ruta relativa o ancla, que no puede
 * ejecutar código. Lo demás se descarta.
 */
export const url = (value = '', fallback = '#') => {
  // Los navegadores ignoran los caracteres de control al resolver una URL,
  // así que se quitan antes de mirar el esquema (`java\nscript:` es un clásico).
  const raw = String(value).replace(/[\u0000-\u0020\u007F]/g, '').trim();
  if (!raw) return esc(fallback);
  if (!HAS_SCHEME.test(raw)) return esc(raw); // relativa, ancla o consulta
  return SAFE_SCHEME.test(raw) ? esc(raw) : esc(fallback);
};

/**
 * Convierte un bloque de texto en párrafos <p>. Cada línea en blanco separa
 * un párrafo; dentro de cada uno se aplica el marcado ligero.
 */
export const paragraphs = (value = '', indent = '') =>
  String(value)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `${indent}<p>${inline(block)}</p>`)
    .join('\n');

/** Une fragmentos descartando los vacíos (útil con mapas condicionales). */
export const join = (parts, separator = '\n') => parts.filter(Boolean).join(separator);

/** Indenta cada línea de un bloque ya renderizado. */
export const indentBlock = (block, spaces) => {
  const pad = ' '.repeat(spaces);
  return String(block)
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n');
};

/** Renderiza una lista de elementos con un separador de línea en blanco. */
export const list = (items = [], renderItem) =>
  items.map((item, index) => renderItem(item, index)).join('\n\n');
