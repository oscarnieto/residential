/* ==========================================================================
   Renderizado de campos
   --------------------------------------------------------------------------
   Cada tipo del esquema se convierte aquí en un control. Todos reciben el
   mismo contrato: leen su valor con `read()` y avisan del cambio con
   `write(valor)`; el resto (marcar cambios, refrescar la vista previa) lo
   gestiona la aplicación.
   ========================================================================== */

import { el, getPath, setPath } from './util.js';
import { blankItem } from './schema.js';

/** Envoltorio común: etiqueta, control y ayuda. */
const wrap = (field, control, { inline = false } = {}) =>
  el('div', { class: inline ? 'field field--inline' : 'field' }, [
    inline ? control : el('label', { class: 'field__label', text: field.label }),
    inline ? el('label', { class: 'field__label', text: field.label, style: 'margin:0' }) : control,
    field.help ? el('p', { class: 'field__help', text: field.help }) : null,
  ]);

/* --------------------------------------------------------------------------
   Controles simples
   -------------------------------------------------------------------------- */

const textControl = (field, read, write) => {
  const type = field.type === 'url' ? 'url' : field.type === 'tel' ? 'tel' : 'text';
  const input = el('input', {
    class: 'input',
    type,
    value: read() ?? '',
    placeholder: field.placeholder ?? '',
    oninput: (event) => write(event.target.value),
  });
  return wrap(field, input);
};

const textareaControl = (field, read, write) => {
  const textarea = el('textarea', {
    class: 'textarea',
    rows: field.rows ?? 3,
    oninput: (event) => write(event.target.value),
  });
  textarea.value = read() ?? '';
  return wrap(field, textarea);
};

const numberControl = (field, read, write) => {
  const input = el('input', {
    class: 'input',
    type: 'number',
    step: field.step ?? 1,
    value: read() ?? 0,
    oninput: (event) => write(event.target.value),
  });
  return wrap(field, input);
};

const booleanControl = (field, read, write) => {
  const input = el('input', {
    class: 'checkbox',
    type: 'checkbox',
    oninput: (event) => write(event.target.checked),
  });
  input.checked = Boolean(read());
  return wrap(field, input, { inline: true });
};

const selectControl = (field, read, write) => {
  const select = el(
    'select',
    { class: 'select', onchange: (event) => write(event.target.value) },
    field.options.map((option) => el('option', { value: option.value, text: option.label }))
  );
  select.value = read() ?? field.options[0].value;
  return wrap(field, select);
};

const colorControl = (field, read, write) => {
  const swatch = el('input', {
    type: 'color',
    value: read() ?? '#000000',
    oninput: (event) => {
      hex.value = event.target.value;
      write(event.target.value);
    },
  });
  const hex = el('input', {
    class: 'input',
    type: 'text',
    value: read() ?? '',
    oninput: (event) => {
      const value = event.target.value.trim();
      if (/^#[0-9a-f]{6}$/i.test(value)) swatch.value = value;
      write(value);
    },
  });
  return wrap(field, el('div', { class: 'color-row' }, [swatch, hex]));
};

/* --------------------------------------------------------------------------
   Texto con marcado ligero
   -------------------------------------------------------------------------- */

/** Envuelve la selección con un marcador, o lo inserta si no hay selección. */
const surround = (textarea, marker, write) => {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end) || 'texto';
  const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`;
  textarea.value = next;
  textarea.focus();
  textarea.setSelectionRange(start + marker.length, start + marker.length + selected.length);
  write(next);
};

const richControl = (field, read, write) => {
  const textarea = el('textarea', {
    class: 'textarea',
    rows: field.rows ?? 2,
    oninput: (event) => write(event.target.value),
  });
  textarea.value = read() ?? '';

  const bar = el('div', { class: 'rich__bar' }, [
    el('button', {
      class: 'rich__btn rich__btn--b',
      type: 'button',
      text: 'B',
      title: 'Negrita',
      onclick: () => surround(textarea, '**', write),
    }),
    el('button', {
      class: 'rich__btn rich__btn--i',
      type: 'button',
      text: 'I',
      title: 'Cursiva',
      onclick: () => surround(textarea, '*', write),
    }),
  ]);

  return wrap(field, el('div', { class: 'rich' }, [bar, textarea]));
};

/* --------------------------------------------------------------------------
   Imagen y vídeo
   -------------------------------------------------------------------------- */

const mediaControl = (field, read, write, ctx) => {
  const isVideo = field.type === 'video';

  const preview = el('div', { class: 'media-field__preview' });
  const input = el('input', {
    class: 'input',
    type: 'text',
    value: read() ?? '',
    oninput: (event) => {
      write(event.target.value);
      paint(event.target.value);
    },
  });

  const paint = (value) => {
    if (!value) {
      preview.style.backgroundImage = '';
      preview.textContent = 'Sin imagen';
      return;
    }
    if (isVideo) {
      preview.style.backgroundImage = '';
      preview.textContent = '▶ vídeo';
      return;
    }
    preview.textContent = '';
    preview.style.backgroundImage = `url('${ctx.assetUrl(value)}')`;
  };
  paint(read());

  const choose = el('button', {
    class: 'btn btn--ghost btn--sm',
    type: 'button',
    text: isVideo ? 'Elegir vídeo' : 'Elegir imagen',
    onclick: async () => {
      const picked = await ctx.pickMedia({ video: isVideo });
      if (!picked) return;
      input.value = picked;
      write(picked);
      paint(picked);
    },
  });

  const open = el('a', {
    class: 'btn btn--ghost btn--sm',
    target: '_blank',
    rel: 'noopener',
    text: 'Ver',
    href: ctx.assetUrl(read() ?? ''),
  });
  input.addEventListener('input', () => {
    open.href = ctx.assetUrl(input.value);
  });

  return wrap(
    field,
    el('div', { class: 'media-field' }, [
      preview,
      el('div', { class: 'media-field__body' }, [
        input,
        el('div', { class: 'media-field__actions' }, [choose, open]),
      ]),
    ])
  );
};

/* --------------------------------------------------------------------------
   Líneas del titular
   -------------------------------------------------------------------------- */

const linesControl = (field, read, write) => {
  const container = el('div');

  const paint = () => {
    const lines = read() ?? [];
    container.replaceChildren(
      ...lines.map((line, index) =>
        el('div', { class: 'lines__row' }, [
          el('input', {
            class: 'input',
            type: 'text',
            value: line.text ?? '',
            oninput: (event) => {
              const next = read().map((item, i) => (i === index ? { ...item, text: event.target.value } : item));
              write(next);
            },
          }),
          el('label', { class: 'lines__italic' }, [
            (() => {
              const checkbox = el('input', {
                class: 'checkbox',
                type: 'checkbox',
                onchange: (event) => {
                  const next = read().map((item, i) =>
                    i === index ? { ...item, italic: event.target.checked } : item
                  );
                  write(next);
                },
              });
              checkbox.checked = Boolean(line.italic);
              return checkbox;
            })(),
            'cursiva',
          ]),
          el('button', {
            class: 'icon-btn icon-btn--danger',
            type: 'button',
            title: 'Eliminar línea',
            text: '✕',
            onclick: () => {
              write(read().filter((_, i) => i !== index));
              paint();
            },
          }),
        ])
      ),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        type: 'button',
        text: '+ Añadir línea',
        onclick: () => {
          write([...(read() ?? []), { text: '', italic: false }]);
          paint();
        },
      })
    );
  };

  paint();
  return wrap(field, container);
};

/* --------------------------------------------------------------------------
   Listas repetibles
   -------------------------------------------------------------------------- */

const listControl = (field, read, write, ctx) => {
  const container = el('div', { class: 'list' });
  const openItems = new Set();

  const paint = () => {
    const items = read() ?? [];

    if (!items.length) {
      container.replaceChildren(
        el('p', { class: 'list__empty', text: 'Todavía no hay elementos.' }),
        el('div', { class: 'list__add' }, [addButton()])
      );
      return;
    }

    const nodes = items.map((item, index) => {
      const isOpen = openItems.has(index);
      const imageKey = field.fields.find((f) => f.type === 'image')?.key;
      const thumb = imageKey ? getPath(item, imageKey) : null;

      const head = el('div', { class: 'list__head' }, [
        el('button', {
          class: 'list__toggle',
          type: 'button',
          onclick: () => {
            if (isOpen) openItems.delete(index);
            else openItems.add(index);
            paint();
          },
        }, [
          el('span', { class: 'list__index', text: String(index + 1) }),
          thumb
            ? el('span', {
                class: 'list__thumb',
                style: `background-image:url('${ctx.assetUrl(thumb)}')`,
              })
            : null,
          el('span', {
            class: 'list__name',
            text: (field.itemLabel ? field.itemLabel(item) : '') || 'Sin título',
          }),
        ]),
        el('div', { class: 'list__tools' }, [
          el('button', {
            class: 'icon-btn',
            type: 'button',
            title: 'Subir',
            text: '↑',
            disabled: index === 0,
            onclick: () => move(index, index - 1),
          }),
          el('button', {
            class: 'icon-btn',
            type: 'button',
            title: 'Bajar',
            text: '↓',
            disabled: index === items.length - 1,
            onclick: () => move(index, index + 1),
          }),
          el('button', {
            class: 'icon-btn',
            type: 'button',
            title: 'Duplicar',
            text: '⧉',
            onclick: () => {
              const next = read().slice();
              next.splice(index + 1, 0, JSON.parse(JSON.stringify(next[index])));
              write(next);
              openItems.clear();
              paint();
            },
          }),
          el('button', {
            class: 'icon-btn icon-btn--danger',
            type: 'button',
            title: 'Eliminar',
            text: '✕',
            onclick: () => {
              const label = (field.itemLabel ? field.itemLabel(items[index]) : '') || `elemento ${index + 1}`;
              if (!window.confirm(`¿Eliminar «${label}»?`)) return;
              write(read().filter((_, i) => i !== index));
              openItems.clear();
              paint();
            },
          }),
        ]),
      ]);

      const body = isOpen
        ? el(
            'div',
            { class: 'list__body' },
            field.fields.map((sub) =>
              renderField(
                sub,
                () => getPath(read()[index], sub.key),
                (value) => {
                  const next = read().slice();
                  // Copia profunda: `sub.key` puede ser una ruta anidada y una
                  // copia superficial compartiría el objeto intermedio.
                  next[index] = setPath(JSON.parse(JSON.stringify(next[index])), sub.key, value);
                  write(next);
                  // Refresca sólo la cabecera para no perder el foco del campo.
                  const label = head.querySelector('.list__name');
                  if (label && field.itemLabel) label.textContent = field.itemLabel(next[index]) || 'Sin título';
                  const thumbNode = head.querySelector('.list__thumb');
                  if (thumbNode && imageKey && sub.key === imageKey) {
                    thumbNode.style.backgroundImage = `url('${ctx.assetUrl(value)}')`;
                  }
                },
                ctx
              )
            )
          )
        : null;

      return el('div', { class: 'list__item' }, [head, body]);
    });

    container.replaceChildren(...nodes, el('div', { class: 'list__add' }, [addButton()]));
  };

  const move = (from, to) => {
    const next = read().slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    write(next);
    openItems.clear();
    paint();
  };

  const addButton = () =>
    el('button', {
      class: 'btn btn--ghost btn--sm btn--block',
      type: 'button',
      text: field.addLabel ?? '+ Añadir',
      onclick: () => {
        const next = [...(read() ?? []), blankItem(field.fields)];
        write(next);
        openItems.clear();
        openItems.add(next.length - 1);
        paint();
      },
    });

  paint();

  return el('div', { class: 'field' }, [
    el('label', { class: 'field__label', text: field.label }),
    field.help ? el('p', { class: 'field__help', style: 'margin:0 0 8px', text: field.help }) : null,
    container,
  ]);
};

/* --------------------------------------------------------------------------
   Selector
   -------------------------------------------------------------------------- */

const RENDERERS = {
  text: textControl,
  url: textControl,
  tel: textControl,
  textarea: textareaControl,
  rich: richControl,
  number: numberControl,
  boolean: booleanControl,
  select: selectControl,
  color: colorControl,
  image: mediaControl,
  video: mediaControl,
  lines: linesControl,
  list: listControl,
};

export const renderField = (field, read, write, ctx) => {
  const renderer = RENDERERS[field.type] ?? textControl;
  return renderer(field, read, write, ctx);
};
