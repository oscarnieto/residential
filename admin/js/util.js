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

/** Crea un elemento con clases, atributos e hijos en una sola llamada. */
export const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
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
