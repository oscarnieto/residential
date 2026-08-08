/* ==========================================================================
   Minificado de los assets publicados (INFO-02)
   --------------------------------------------------------------------------
   Sin dependencias, como el resto del build, y deliberadamente conservador:
   sólo se quitan comentarios y espacio en blanco. No se renombra nada, no se
   reordenan declaraciones y no se reescribe ninguna expresión. Es minificado,
   no ofuscación: quien lea el fuente en el repositorio ve exactamente lo mismo
   que se ejecuta, y el diff sigue siendo legible.

   Los fuentes (`css/*.css`, `js/main.js`) siguen siendo la entrada del build;
   estos archivos generan las copias `*.min.css` y `*.min.js` que referencia el
   HTML.
   ========================================================================== */

/** ¿Puede una barra en esta posición abrir una expresión regular? */
const REGEX_PUEDE_EMPEZAR = /[({[,;:=!&|?+\-*%~^<>]$/;

/**
 * Recorre el JavaScript carácter a carácter distinguiendo cadenas, plantillas,
 * expresiones regulares y comentarios. Hace falta el recorrido completo: buscar
 * `//` con una expresión regular destrozaría una URL dentro de una cadena o una
 * barra escapada dentro de otra expresión regular.
 */
export const minifyJs = (source) => {
  let out = '';
  let i = 0;
  // Último carácter significativo emitido; decide si `/` abre una expresión
  // regular (`split(/,/)`) o es una división (`a / b`).
  let anterior = '';

  /**
   * Pila de contextos de literal de plantilla. `plantilla` es el texto entre
   * comillas invertidas, que se copia tal cual; `expr` es el interior de un
   * `${…}`, donde vuelve a regir la sintaxis normal. `llaves` cuenta las llaves
   * abiertas dentro de la expresión para saber cuál es la que la cierra: sin
   * ese contador, un objeto o una función dentro de `${…}` haría creer al
   * recorrido que ha vuelto al texto de la plantilla.
   */
  const pila = [];
  const cima = () => pila[pila.length - 1];

  const copiar = (hasta) => {
    out += source.slice(i, hasta);
    anterior = source[hasta - 1];
    i = hasta;
  };

  while (i < source.length) {
    const c = source[i];
    const siguiente = source[i + 1];

    // Texto de una plantilla: verbatim hasta la comilla de cierre o un `${`.
    if (cima()?.tipo === 'plantilla') {
      if (c === '\\') { copiar(i + 2); continue; }
      if (c === '`') { pila.pop(); copiar(i + 1); continue; }
      if (c === '$' && siguiente === '{') { pila.push({ tipo: 'expr', llaves: 0 }); copiar(i + 2); continue; }
      copiar(i + 1);
      continue;
    }

    // Comentario de línea
    if (c === '/' && siguiente === '/') {
      const fin = source.indexOf('\n', i);
      i = fin === -1 ? source.length : fin;
      continue;
    }

    // Comentario de bloque: se sustituye por un salto de línea si abarcaba
    // varias, para no pegar dos sentencias que estaban separadas.
    if (c === '/' && siguiente === '*') {
      const fin = source.indexOf('*/', i + 2);
      const bloque = source.slice(i, fin === -1 ? source.length : fin + 2);
      i = fin === -1 ? source.length : fin + 2;
      if (bloque.includes('\n') && out && anterior !== '\n') { out += '\n'; anterior = '\n'; }
      continue;
    }

    // Cadenas
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < source.length && source[j] !== c) j += source[j] === '\\' ? 2 : 1;
      copiar(Math.min(j + 1, source.length));
      continue;
    }

    // Apertura de un literal de plantilla
    if (c === '`') {
      pila.push({ tipo: 'plantilla' });
      copiar(i + 1);
      continue;
    }

    // Llaves: sólo interesan para saber cuál cierra un `${…}`.
    if (c === '{' && cima()?.tipo === 'expr') { cima().llaves += 1; copiar(i + 1); continue; }
    if (c === '}' && cima()?.tipo === 'expr') {
      if (cima().llaves === 0) pila.pop();
      else cima().llaves -= 1;
      copiar(i + 1);
      continue;
    }

    // Expresión regular
    if (c === '/' && (anterior === '' || REGEX_PUEDE_EMPEZAR.test(anterior))) {
      let j = i + 1;
      let clase = false;
      let cerrada = false;
      while (j < source.length) {
        const d = source[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '[') clase = true;
        else if (d === ']') clase = false;
        else if (d === '/' && !clase) { cerrada = true; break; }
        else if (d === '\n') break; // no era una expresión regular
        j++;
      }
      if (cerrada) {
        j++;
        while (j < source.length && /[a-z]/.test(source[j])) j++; // banderas
        copiar(j);
        continue;
      }
    }

    // Espacio en blanco: se colapsa, conservando los saltos de línea. Mantener
    // el salto es lo que hace que este minificado no pueda romper nada por la
    // inserción automática de punto y coma.
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      let j = i;
      let haySalto = false;
      while (j < source.length && ' \t\n\r'.includes(source[j])) {
        if (source[j] === '\n') haySalto = true;
        j++;
      }
      i = j;
      if (!out) continue;
      if (haySalto) {
        if (anterior !== '\n') { out += '\n'; anterior = '\n'; }
      } else if (anterior !== '\n') {
        out += ' ';
        anterior = ' ';
      }
      continue;
    }

    copiar(i + 1);
  }

  // No hace falta limpiar nada después: el propio recorrido ya colapsa cada
  // racha de espacios en un solo salto o un solo espacio. Aplicar expresiones
  // regulares sobre el resultado sería justo lo peligroso, porque también
  // alcanzarían al interior de los literales de plantilla.
  return out.trim() + '\n';
};

/**
 * CSS: fuera comentarios y espacio sobrante. El interior de las cadenas y de
 * `url(…)` se copia tal cual, y no se toca el espacio alrededor de los
 * operadores: dentro de `calc()` un espacio de menos cambia el resultado.
 */
export const minifyCss = (source) => {
  let out = '';
  let i = 0;

  /**
   * Cadenas y `url(…)` salen del texto durante la limpieza y vuelven al final.
   * Sin esto, la última pasada de expresiones regulares también entraría en
   * ellas y convertiría `content: "a, b"` en `content:"a,b"`.
   */
  const literales = [];
  const MARCA = '\u0000';
  const reservar = (texto) => `${MARCA}${literales.push(texto) - 1}${MARCA}`;

  // El NUL no es válido en CSS; se quita por si acaso, para que no colisione
  // con el marcador.
  source = source.split(MARCA).join('');

  while (i < source.length) {
    const c = source[i];

    if (c === '/' && source[i + 1] === '*') {
      const fin = source.indexOf('*/', i + 2);
      i = fin === -1 ? source.length : fin + 2;
      continue;
    }

    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < source.length && source[j] !== c) j += source[j] === '\\' ? 2 : 1;
      out += reservar(source.slice(i, Math.min(j + 1, source.length)));
      i = j + 1;
      continue;
    }

    // `url(` sin comillas: se copia literal hasta el paréntesis de cierre.
    if (/^url\(/i.test(source.slice(i, i + 4))) {
      const fin = source.indexOf(')', i);
      out += reservar(source.slice(i, fin === -1 ? source.length : fin + 1));
      i = fin === -1 ? source.length : fin + 1;
      continue;
    }

    if (/\s/.test(c)) {
      let j = i;
      while (j < source.length && /\s/.test(source[j])) j++;
      out += ' ';
      i = j;
      continue;
    }

    out += c;
    i++;
  }

  const limpio = out
    // Espacio pegado a los caracteres de estructura. Ninguno de ellos puede
    // ser un operador de `calc()`, así que quitarlo no cambia ningún valor.
    .replace(/\s*([{};,])\s*/g, '$1')
    // Detrás de los dos puntos de una declaración. Delante nunca: rompería
    // los selectores con pseudoclase.
    .replace(/:\s+/g, ':')
    // Punto y coma justo antes de cerrar el bloque.
    .replace(/;}/g, '}')
    .trim();

  // Vuelven las cadenas y las `url(…)`, intactas.
  return limpio.replace(new RegExp(`${MARCA}(\\d+)${MARCA}`, 'g'), (_, n) => literales[Number(n)]) + '\n';
};
