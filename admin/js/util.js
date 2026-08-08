/* ==========================================================================
   Utilidades
   ========================================================================== */

/** Lee un valor anidado con notación de puntos: getPath(obj, 'a.b.c'). */
export const getPath = (object, path) => {
  if (!path) return object;
  return path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), object);
};

/** Escribe un valor anidado creando los objetos intermedios que falten. */
export const setPath = (object, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  let current = object;
  for (const key of keys) {
    if (current[key] == null || typeof current[key] !== 'object') current[key] = {};
    current = current[key];
  }
  current[last] = value;
  return object;
};

export const clone = (value) => JSON.parse(JSON.stringify(value));

/** Comparación estructural, usada para saber qué archivos han cambiado. */
export const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Crea un elemento con clases, atributos e hijos en una sola llamada.
 *
 * No admite HTML en crudo a propósito: `text` escribe siempre en `textContent`
 * y las etiquetas se componen pasando nodos en `children`. Así el panel no
 * tiene ni un solo punto por el que un texto del CMS pueda convertirse en
 * marcado, que es justo por donde entraron los XSS que se corrigieron.
 */
export const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
};

/** Espera a que el usuario deje de escribir antes de refrescar la vista previa. */
export const debounce = (fn, wait = 220) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

/** Normaliza un nombre de archivo para subirlo al repositorio. */
export const slugifyFilename = (name) => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'imagen'}${ext}`;
};

/* --------------------------------------------------------------------------
   Validación del contenido de un archivo subido (control INJ-07)
   --------------------------------------------------------------------------
   Fiarse de la extensión no vale: la pone quien sube el archivo. Se comprueban
   los primeros bytes, que sí describen el formato real.
   -------------------------------------------------------------------------- */

/** Lee `n` bytes como ASCII desde la posición `desde`. */
const ascii = (bytes, desde, n) =>
  String.fromCharCode(...bytes.subarray(desde, desde + n));

const FIRMAS = [
  { ext: /\.jpe?g$/i, formato: 'JPEG', ok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: /\.png$/i, formato: 'PNG', ok: (b) => b[0] === 0x89 && ascii(b, 1, 3) === 'PNG' },
  { ext: /\.gif$/i, formato: 'GIF', ok: (b) => ascii(b, 0, 3) === 'GIF' },
  { ext: /\.webp$/i, formato: 'WebP', ok: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP' },
  { ext: /\.avif$/i, formato: 'AVIF', ok: (b) => ascii(b, 4, 4) === 'ftyp' },
  { ext: /\.mp4$/i, formato: 'MP4', ok: (b) => ascii(b, 4, 4) === 'ftyp' },
  { ext: /\.webm$/i, formato: 'WebM', ok: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];

/**
 * Un SVG es texto y puede traer script dentro. Importa porque el campo de
 * imagen ofrece un enlace «Ver» que abre el archivo en primer plano y en el
 * mismo origen del panel: ahí sí se ejecutaría, con acceso al token guardado.
 */
const SVG_PELIGROSO = /<script[\s>]|<foreignObject[\s>]|\son[a-z]+\s*=|javascript:/i;

/**
 * Comprueba que el contenido corresponde a la extensión.
 * Devuelve `null` si está bien, o un mensaje explicando el problema.
 */
export const validarArchivo = (nombre, buffer) => {
  const bytes = new Uint8Array(buffer);

  if (/\.svg$/i.test(nombre)) {
    const texto = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 65536));
    if (!/<svg[\s>]/i.test(texto)) return `«${nombre}» no parece un SVG válido.`;
    if (SVG_PELIGROSO.test(texto)) {
      return `«${nombre}» contiene código ejecutable (script o manejadores de eventos) y no se puede subir. Expórtalo de nuevo como SVG plano, o súbelo en PNG.`;
    }
    return null;
  }

  const firma = FIRMAS.find((f) => f.ext.test(nombre));
  if (!firma) return null; // extensión ya filtrada antes; sin firma conocida no se bloquea
  if (bytes.length < 12) return `«${nombre}» está vacío o incompleto.`;
  if (!firma.ok(bytes)) {
    return `El contenido de «${nombre}» no es ${firma.formato} de verdad, aunque lo parezca por la extensión. No se sube.`;
  }
  return null;
};

export const formatBytes = (bytes) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
};
