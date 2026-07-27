/* ==========================================================================
   Panel de administración
   --------------------------------------------------------------------------
   Carga el contenido desde GitHub, lo edita en memoria y lo publica en un
   único commit. El despliegue lo dispara el propio push, igual que cuando se
   edita el repositorio a mano.
   ========================================================================== */

import { SCHEMA } from './schema.js';
import { GitHub, GitHubError, encodeBase64, bufferToBase64 } from './github.js';
import { renderField } from './fields.js';
import { renderPreview } from './preview.js';
import { el, getPath, setPath, clone, isEqual, debounce, slugifyFilename, formatBytes } from './util.js';

/* --------------------------------------------------------------------------
   Configuración
   -------------------------------------------------------------------------- */

const CONFIG_KEY = 'savills-cms-config';
const MEDIA_DIR = 'assets/img';
const IMAGE_TYPES = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VIDEO_TYPES = /\.(mp4|webm)$/i;
/** GitHub rechaza blobs por encima de ~100 MB; avisamos mucho antes. */
const MAX_UPLOAD = 12 * 1024 * 1024;

const DEFAULTS = { owner: 'oscarnieto', repo: 'residential', branch: 'main' };

/** Anchos reales a los que se renderiza la vista previa. */
const PREVIEW_WIDTHS = { desktop: 1440, tablet: 768, mobile: 390 };

const loadConfig = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(CONFIG_KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
};

const saveConfig = (config) => localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

/* --------------------------------------------------------------------------
   Estado
   -------------------------------------------------------------------------- */

const state = {
  api: null,
  config: loadConfig(),
  /** Contenido tal y como está publicado, para calcular qué ha cambiado. */
  original: {},
  /** Contenido con los cambios del editor. */
  content: {},
  shas: {},
  media: [],
  activeCollection: 'inicio',
  openSections: new Set(),
  previewVisible: true,
  previewWidth: 'desktop',
  publishing: false,
};

const root = document.getElementById('root');

/* --------------------------------------------------------------------------
   Avisos
   -------------------------------------------------------------------------- */

const toastStack = el('div', { class: 'toast-stack' });
document.body.append(toastStack);

const toast = (message, kind = '') => {
  const node = el('div', { class: `toast ${kind ? `toast--${kind}` : ''}`, text: message });
  toastStack.append(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity .3s';
    setTimeout(() => node.remove(), 300);
  }, kind === 'error' ? 7000 : 3800);
};

/* --------------------------------------------------------------------------
   Utilidades de contenido
   -------------------------------------------------------------------------- */

const assetUrl = (path) => (path ? `../${path}` : '');

/** Colecciones cuyo JSON difiere de lo publicado. */
const dirtyCollections = () =>
  SCHEMA.filter((collection) => !isEqual(state.original[collection.id], state.content[collection.id])).map(
    (collection) => collection.id
  );

const isDirty = () => dirtyCollections().length > 0;

/* --------------------------------------------------------------------------
   Pantalla de acceso
   -------------------------------------------------------------------------- */

const tokenUrl = (owner, repo) =>
  `https://github.com/settings/personal-access-tokens/new?name=${encodeURIComponent(
    `CMS ${repo}`
  )}&description=${encodeURIComponent('Panel de administración de la web')}`;

const renderLogin = (error = '') => {
  const config = state.config;

  const owner = el('input', { class: 'input', type: 'text', value: config.owner });
  const repo = el('input', { class: 'input', type: 'text', value: config.repo });
  const branch = el('input', { class: 'input', type: 'text', value: config.branch });
  const token = el('input', {
    class: 'input',
    type: 'password',
    placeholder: 'github_pat_...',
    autocomplete: 'off',
  });

  const button = el('button', { class: 'btn btn--primary btn--block', type: 'submit', text: 'Entrar' });

  const form = el(
    'form',
    {
      onsubmit: async (event) => {
        event.preventDefault();
        button.disabled = true;
        button.replaceChildren(el('span', { class: 'spinner' }), document.createTextNode('Comprobando…'));

        const next = {
          owner: owner.value.trim(),
          repo: repo.value.trim(),
          branch: branch.value.trim() || 'main',
          token: token.value.trim(),
        };

        try {
          const api = new GitHub(next);
          await api.verify();
          saveConfig(next);
          state.config = next;
          state.api = api;
          await boot();
        } catch (caught) {
          const message =
            caught instanceof GitHubError && caught.status === 401
              ? 'El token no es válido o ha caducado.'
              : caught instanceof GitHubError && caught.status === 404
              ? 'No se encuentra el repositorio. Revisa el propietario, el nombre y que el token tenga acceso.'
              : caught.message;
          renderLogin(message);
        }
      },
    },
    [
      el('div', { class: 'field' }, [el('label', { class: 'field__label', text: 'Propietario' }), owner]),
      el('div', { class: 'field' }, [el('label', { class: 'field__label', text: 'Repositorio' }), repo]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: 'Rama' }),
        branch,
        el('p', {
          class: 'field__help',
          text: 'La rama desde la que se publica la web. Si no estás seguro, déjala en main.',
        }),
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', text: 'Token de acceso' }),
        token,
        el('p', {
          class: 'field__help',
          text: 'Se guarda sólo en este navegador. Nunca se envía a ningún sitio que no sea GitHub.',
        }),
      ]),
      button,
    ]
  );

  root.replaceChildren(
    el('div', { class: 'login' }, [
      el('div', { class: 'login__card' }, [
        el('div', { class: 'login__logo', text: 'savills' }),
        el('h1', { class: 'login__title', text: 'Gestor de contenidos' }),
        el('p', { class: 'login__sub', text: 'Obra Nueva Residencial' }),
        error ? el('div', { class: 'login__error', text: error }) : null,
        el('ol', { class: 'login__steps' }, [
          el('li', {}, [
            'Crea un token en ',
            el('a', {
              href: tokenUrl(config.owner, config.repo),
              target: '_blank',
              rel: 'noopener',
              text: 'GitHub → Fine-grained tokens',
            }),
            '.',
          ]),
          el('li', { html: 'En <strong>Repository access</strong> elige <em>Only select repositories</em> y marca este repositorio.' }),
          el('li', { html: 'En <strong>Permissions → Repository permissions</strong> pon <code>Contents</code> en <em>Read and write</em>.' }),
          el('li', { html: 'Añade también <code>Actions</code> en <em>Read-only</em> si quieres ver el estado de las publicaciones.' }),
          el('li', { text: 'Copia el token y pégalo aquí abajo.' }),
        ]),
        form,
      ]),
    ])
  );
};

/* --------------------------------------------------------------------------
   Carga
   -------------------------------------------------------------------------- */

const renderLoading = (message) =>
  root.replaceChildren(
    el('div', { class: 'loading' }, [el('div', { class: 'spinner spinner--dark' }), el('p', { text: message })])
  );

const boot = async () => {
  renderLoading('Cargando contenido…');
  try {
    const files = await Promise.all(
      SCHEMA.map(async (collection) => {
        const file = await state.api.readFile(collection.file);
        return { id: collection.id, data: JSON.parse(file.text), sha: file.sha };
      })
    );

    for (const file of files) {
      state.original[file.id] = file.data;
      state.content[file.id] = clone(file.data);
      state.shas[file.id] = file.sha;
    }

    await loadMedia();
    renderApp();
  } catch (caught) {
    renderLogin(`No se ha podido cargar el contenido: ${caught.message}`);
  }
};

const loadMedia = async () => {
  try {
    const entries = await state.api.listDirectory(MEDIA_DIR);
    state.media = entries
      .filter((entry) => entry.type === 'file')
      .map((entry) => ({ name: entry.name, path: entry.path, sha: entry.sha, size: entry.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    state.media = [];
  }
};

/* --------------------------------------------------------------------------
   Biblioteca de medios
   -------------------------------------------------------------------------- */

const pickMedia = ({ video = false } = {}) =>
  new Promise((resolve) => {
    let selected = null;
    const filter = video ? VIDEO_TYPES : IMAGE_TYPES;

    const grid = el('div', { class: 'media-grid' });
    const close = (value) => {
      overlay.remove();
      resolve(value);
    };

    const paintGrid = () => {
      const items = state.media.filter((item) => filter.test(item.name));
      if (!items.length) {
        grid.replaceChildren(el('p', { class: 'list__empty', text: 'No hay archivos de este tipo todavía.' }));
        return;
      }
      grid.replaceChildren(
        ...items.map((item) => {
          const node = el('button', { class: 'media-item', type: 'button' }, [
            el('div', {
              class: 'media-item__thumb',
              style: video ? '' : `background-image:url('${assetUrl(item.path)}')`,
              text: video ? '▶' : '',
            }),
            el('div', { class: 'media-item__name', text: item.name, title: `${item.name} · ${formatBytes(item.size)}` }),
          ]);
          node.addEventListener('click', () => {
            grid.querySelectorAll('.media-item').forEach((other) => other.classList.remove('is-selected'));
            node.classList.add('is-selected');
            selected = item.path;
            confirm.disabled = false;
          });
          node.addEventListener('dblclick', () => close(item.path));
          return node;
        })
      );
    };

    const upload = async (files) => {
      const accepted = [...files].filter((file) => filter.test(file.name));
      if (!accepted.length) {
        toast('Ese tipo de archivo no se admite aquí.', 'error');
        return;
      }

      const tooBig = accepted.find((file) => file.size > MAX_UPLOAD);
      if (tooBig) {
        toast(`«${tooBig.name}» pesa ${formatBytes(tooBig.size)}. Comprímelo por debajo de ${formatBytes(MAX_UPLOAD)}.`, 'error');
        return;
      }

      dropzone.textContent = 'Subiendo…';
      try {
        const blobs = await Promise.all(
          accepted.map(async (file) => ({
            path: `${MEDIA_DIR}/${slugifyFilename(file.name)}`,
            content: bufferToBase64(await file.arrayBuffer()),
            encoding: 'base64',
          }))
        );

        await state.api.commitFiles(
          blobs,
          `Subir ${blobs.length === 1 ? 'imagen' : `${blobs.length} imágenes`} desde el gestor de contenidos`
        );

        await loadMedia();
        paintGrid();
        selected = blobs[0].path;
        confirm.disabled = false;
        toast(`${blobs.length === 1 ? 'Archivo subido' : `${blobs.length} archivos subidos`}.`, 'ok');
      } catch (caught) {
        toast(`No se ha podido subir: ${caught.message}`, 'error');
      } finally {
        dropzone.textContent = dropzoneLabel;
      }
    };

    const dropzoneLabel = 'Arrastra archivos aquí o haz clic para elegirlos';
    const fileInput = el('input', {
      type: 'file',
      multiple: true,
      accept: video ? 'video/mp4,video/webm' : 'image/*',
      style: 'display:none',
      onchange: (event) => upload(event.target.files),
    });

    const dropzone = el('div', {
      class: 'dropzone',
      text: dropzoneLabel,
      onclick: () => fileInput.click(),
      ondragover: (event) => {
        event.preventDefault();
        dropzone.classList.add('is-over');
      },
      ondragleave: () => dropzone.classList.remove('is-over'),
      ondrop: (event) => {
        event.preventDefault();
        dropzone.classList.remove('is-over');
        upload(event.dataTransfer.files);
      },
    });

    const confirm = el('button', {
      class: 'btn btn--primary',
      type: 'button',
      text: 'Usar este archivo',
      disabled: true,
      onclick: () => close(selected),
    });

    const overlay = el('div', { class: 'modal' }, [
      el('div', { class: 'modal__panel' }, [
        el('div', { class: 'modal__head' }, [
          el('span', { class: 'modal__title', text: video ? 'Vídeos' : 'Imágenes' }),
          el('button', { class: 'modal__close', type: 'button', text: '✕', onclick: () => close(null) }),
        ]),
        el('div', { class: 'modal__body' }, [dropzone, fileInput, grid]),
        el('div', { class: 'modal__foot' }, [
          el('span', {
            class: 'field__help',
            style: 'margin:0',
            text: 'Las subidas se guardan en el repositorio al instante.',
          }),
          el('button', { class: 'btn btn--ghost', type: 'button', text: 'Cancelar', onclick: () => close(null) }),
          confirm,
        ]),
      ]),
    ]);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(null);
    });

    paintGrid();
    document.body.append(overlay);
  });

/* --------------------------------------------------------------------------
   Publicación
   -------------------------------------------------------------------------- */

const publish = async () => {
  const dirty = dirtyCollections();
  if (!dirty.length || state.publishing) return;

  const message = window.prompt(
    'Describe brevemente el cambio (aparecerá en el historial):',
    `Actualizar ${dirty.map((id) => SCHEMA.find((c) => c.id === id).label).join(', ').toLowerCase()}`
  );
  if (message === null) return;

  state.publishing = true;
  renderApp();

  try {
    const files = dirty.map((id) => {
      const collection = SCHEMA.find((item) => item.id === id);
      return {
        path: collection.file,
        content: `${JSON.stringify(state.content[id], null, 2)}\n`,
        encoding: 'utf-8',
      };
    });

    await state.api.commitFiles(files, message.trim() || 'Actualizar contenido');

    for (const id of dirty) state.original[id] = clone(state.content[id]);

    toast('Publicado. La web se actualizará en un par de minutos.', 'ok');
    trackDeploy();
  } catch (caught) {
    const detail =
      caught instanceof GitHubError && caught.status === 409
        ? 'Alguien ha publicado antes que tú. Recarga la página para traer los últimos cambios.'
        : caught.message;
    toast(`No se ha podido publicar: ${detail}`, 'error');
  } finally {
    state.publishing = false;
    renderApp();
  }
};

/** Sigue el despliegue hasta que termina, sin bloquear la interfaz. */
const trackDeploy = async () => {
  const started = Date.now();
  const badge = () => document.getElementById('deploy-status');

  const tick = async () => {
    if (Date.now() - started > 10 * 60 * 1000) return;
    try {
      const run = await state.api.latestDeploy();
      const node = badge();
      if (!node) return;
      node.hidden = false;

      if (!run || run.status !== 'completed') {
        node.className = 'badge';
        node.textContent = 'Publicando…';
        setTimeout(tick, 12000);
        return;
      }

      if (run.conclusion === 'success') {
        node.className = 'badge badge--ok';
        node.textContent = 'Web actualizada ✓';
        setTimeout(() => {
          if (badge()) badge().hidden = true;
        }, 10000);
      } else {
        node.className = 'badge badge--error';
        node.textContent = `El despliegue ha fallado (${run.conclusion})`;
      }
    } catch {
      /* Sin permiso de Actions: no pasa nada, el despliegue sigue su curso. */
    }
  };

  setTimeout(tick, 6000);
};

/* --------------------------------------------------------------------------
   Vista previa
   -------------------------------------------------------------------------- */

let previewFrame = null;
/** Se reutiliza entre repintados para no dejar observadores huérfanos. */
let previewResizeObserver = null;

const refreshPreview = debounce(() => {
  if (!previewFrame || !state.previewVisible) return;
  const collection = SCHEMA.find((item) => item.id === state.activeCollection);
  const pageId = collection.preview ? collection.id : 'inicio';
  try {
    previewFrame.srcdoc = renderPreview(pageId, state.content);
  } catch (caught) {
    previewFrame.srcdoc = `<pre style="font-family:monospace;padding:20px;color:#c90c0f">Error al generar la vista previa:\n\n${caught.message}</pre>`;
  }
}, 260);

/* --------------------------------------------------------------------------
   Interfaz principal
   -------------------------------------------------------------------------- */

const renderSidebar = () => {
  const dirty = new Set(dirtyCollections());

  return el('aside', { class: 'sidebar' }, [
    el('div', { class: 'sidebar__brand' }, [
      el('span', { class: 'sidebar__mark', text: 'sv' }),
      el('div', {}, [
        el('div', { class: 'sidebar__title', text: 'Gestor de contenidos' }),
        el('div', { class: 'sidebar__repo', text: `${state.config.owner}/${state.config.repo} · ${state.config.branch}` }),
      ]),
    ]),
    el('div', { class: 'sidebar__group', text: 'Contenido' }),
    ...SCHEMA.map((collection) =>
      el(
        'button',
        {
          class: `sidebar__link ${collection.id === state.activeCollection ? 'is-active' : ''}`,
          type: 'button',
          onclick: () => {
            state.activeCollection = collection.id;
            state.openSections.clear();
            renderApp();
          },
        },
        [
          el('span', { class: 'sidebar__icon', text: collection.icon }),
          el('span', { text: collection.label }),
          dirty.has(collection.id) ? el('span', { class: 'sidebar__dot', title: 'Cambios sin publicar' }) : null,
        ]
      )
    ),
    el('div', { class: 'sidebar__foot' }, [
      el('a', {
        href: `https://github.com/${state.config.owner}/${state.config.repo}/commits/${state.config.branch}`,
        target: '_blank',
        rel: 'noopener',
        text: 'Historial de cambios ↗',
      }),
      el('a', { href: '../index.html', target: '_blank', rel: 'noopener', text: 'Ver la web ↗' }),
      el('button', {
        type: 'button',
        text: 'Cerrar sesión',
        onclick: () => {
          if (isDirty() && !window.confirm('Hay cambios sin publicar que se perderán. ¿Salir igualmente?')) return;
          localStorage.removeItem(CONFIG_KEY);
          location.reload();
        },
      }),
    ]),
  ]);
};

const renderSection = (collection, section) => {
  const isOpen = state.openSections.has(section.id);

  const head = el(
    'button',
    {
      class: 'section-card__head',
      type: 'button',
      onclick: () => {
        if (isOpen) state.openSections.delete(section.id);
        else state.openSections.add(section.id);
        renderApp();
      },
    },
    [
      el('span', { class: 'section-card__name', text: section.label }),
      el('span', { class: 'section-card__chevron', text: '▾' }),
    ]
  );

  const body = isOpen
    ? el('div', { class: 'section-card__body' }, [
        section.description ? el('p', { class: 'section-card__desc', text: section.description }) : null,
        ...section.fields.map((field) => {
          const fullPath = [section.path, field.key].filter(Boolean).join('.');
          return renderField(
            field,
            () => getPath(state.content[collection.id], fullPath),
            (value) => {
              setPath(state.content[collection.id], fullPath, value);
              markDirty();
            },
            { assetUrl, pickMedia }
          );
        }),
      ])
    : null;

  return el('div', { class: `section-card ${isOpen ? 'is-open' : ''}` }, [head, body]);
};

/** Actualiza sólo lo que depende del estado «sin publicar». */
const markDirty = () => {
  const dirty = dirtyCollections();
  const badge = document.getElementById('dirty-badge');
  if (badge) {
    badge.className = dirty.length ? 'badge badge--dirty' : 'badge';
    badge.textContent = dirty.length
      ? `${dirty.length} ${dirty.length === 1 ? 'sección' : 'secciones'} sin publicar`
      : 'Al día';
  }

  const publishButton = document.getElementById('publish-btn');
  if (publishButton) publishButton.disabled = !dirty.length || state.publishing;

  const dirtySet = new Set(dirty);
  document.querySelectorAll('.sidebar__link').forEach((link, index) => {
    const collection = SCHEMA[index];
    const dot = link.querySelector('.sidebar__dot');
    if (dirtySet.has(collection.id) && !dot) {
      link.append(el('span', { class: 'sidebar__dot', title: 'Cambios sin publicar' }));
    } else if (!dirtySet.has(collection.id) && dot) {
      dot.remove();
    }
  });

  refreshPreview();
};

const renderApp = () => {
  const collection = SCHEMA.find((item) => item.id === state.activeCollection);
  const dirty = dirtyCollections();

  const publishButton = el('button', {
    class: 'btn btn--primary',
    id: 'publish-btn',
    type: 'button',
    disabled: !dirty.length || state.publishing,
    onclick: publish,
  });
  publishButton.replaceChildren(
    state.publishing ? el('span', { class: 'spinner' }) : document.createTextNode(''),
    document.createTextNode(state.publishing ? 'Publicando…' : 'Publicar cambios')
  );

  const topbar = el('div', { class: 'topbar' }, [
    el('div', {}, [
      el('div', { class: 'topbar__title', text: collection.label }),
      collection.description ? el('div', { class: 'topbar__desc', text: collection.description }) : null,
    ]),
    el('div', { class: 'topbar__actions' }, [
      el('span', {
        class: dirty.length ? 'badge badge--dirty' : 'badge',
        id: 'dirty-badge',
        text: dirty.length
          ? `${dirty.length} ${dirty.length === 1 ? 'sección' : 'secciones'} sin publicar`
          : 'Al día',
      }),
      el('span', { class: 'badge', id: 'deploy-status', text: '', hidden: true }),
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: state.previewVisible ? 'Ocultar vista previa' : 'Ver vista previa',
        onclick: () => {
          state.previewVisible = !state.previewVisible;
          renderApp();
        },
      }),
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        text: 'Descartar',
        disabled: !dirty.length,
        onclick: () => {
          if (!window.confirm('Se perderán todos los cambios sin publicar. ¿Continuar?')) return;
          for (const id of dirtyCollections()) state.content[id] = clone(state.original[id]);
          renderApp();
          toast('Cambios descartados.');
        },
      }),
      publishButton,
    ]),
  ]);

  const editor = el('div', { class: 'editor' }, collection.sections.map((section) => renderSection(collection, section)));

  previewFrame = el('iframe', {
    class: 'preview__frame',
    id: 'preview-frame',
    title: 'Vista previa',
    sandbox: 'allow-same-origin allow-scripts',
  });

  const canvas = el('div', { class: 'preview__canvas' }, [previewFrame]);
  const stage = el('div', { class: 'preview__stage' }, [canvas]);

  /** Ajusta la escala para que quepa el ancho real del dispositivo elegido. */
  const fitPreview = () => {
    const target = PREVIEW_WIDTHS[state.previewWidth];
    const available = stage.clientWidth;
    const height = stage.clientHeight;
    if (!available || !height) return;
    const scale = Math.min(1, available / target);
    previewFrame.style.width = `${target}px`;
    previewFrame.style.height = `${height / scale}px`;
    previewFrame.style.transform = `scale(${scale})`;
    canvas.style.width = `${target * scale}px`;
    canvas.style.height = `${height}px`;
  };

  previewResizeObserver?.disconnect();
  previewResizeObserver = new ResizeObserver(fitPreview);
  previewResizeObserver.observe(stage);

  const sizeButtons = [
    ['desktop', 'Escritorio'],
    ['tablet', 'Tablet'],
    ['mobile', 'Móvil'],
  ].map(([value, label]) =>
    el('button', {
      class: `preview__size ${state.previewWidth === value ? 'is-active' : ''}`,
      type: 'button',
      text: label,
      dataset: { size: value },
      onclick: (event) => {
        state.previewWidth = value;
        event.target.parentElement.querySelectorAll('.preview__size').forEach((button) => {
          button.classList.toggle('is-active', button.dataset.size === value);
        });
        fitPreview();
      },
    })
  );

  const preview = el('div', { class: 'preview' }, [
    el('div', { class: 'preview__bar' }, [
      el('span', { text: collection.preview ? collection.preview : 'Vista previa de la portada' }),
      el('div', { class: 'preview__sizes' }, sizeButtons),
    ]),
    stage,
  ]);

  root.replaceChildren(
    el('div', { class: 'app' }, [
      renderSidebar(),
      el('div', { class: 'main' }, [
        topbar,
        el('div', { class: `content ${state.previewVisible ? 'has-preview' : ''}` }, [
          editor,
          state.previewVisible ? preview : null,
        ]),
      ]),
    ])
  );

  refreshPreview();
};

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

window.addEventListener('beforeunload', (event) => {
  if (!isDirty()) return;
  event.preventDefault();
  event.returnValue = '';
});

const config = loadConfig();
if (config.token) {
  state.api = new GitHub(config);
  state.api
    .verify()
    .then(boot)
    .catch(() => renderLogin('La sesión ha caducado. Vuelve a introducir el token.'));
} else {
  renderLogin();
}
