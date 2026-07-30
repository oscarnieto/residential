/* ==========================================================================
   Esquema de contenido
   --------------------------------------------------------------------------
   Describe qué se puede editar y cómo. El panel construye toda su interfaz a
   partir de este archivo: añadir un campo aquí es suficiente para que aparezca
   en el formulario, se guarde y se publique.

   Tipos disponibles:
     text · textarea · rich · image · video · url · tel · color · number
     lines (líneas del titular) · list (colección repetible) · select
   ========================================================================== */

/** Ayuda breve reutilizada en los campos con marcado ligero. */
const RICH_HELP = 'Usa *cursiva*, **negrita** y salto de línea para forzar un corte.';

/* --------------------------------------------------------------------------
   Bloques reutilizables
   -------------------------------------------------------------------------- */

const seoSection = {
  id: 'seo',
  label: 'SEO',
  path: 'seo',
  description: 'Cómo aparece la página en Google y al compartirla.',
  fields: [
    { key: 'title', type: 'text', label: 'Título del navegador' },
    { key: 'description', type: 'textarea', label: 'Descripción', rows: 3 },
  ],
};

const heroSection = ({ video = false } = {}) => ({
  id: 'hero',
  label: 'Hero',
  path: 'hero',
  description: 'La primera pantalla de la página.',
  fields: [
    { key: 'image', type: 'image', label: 'Imagen de fondo' },
    { key: 'imageAlt', type: 'text', label: 'Texto alternativo de la imagen', help: 'Para lectores de pantalla.' },
    {
      key: 'lines',
      type: 'lines',
      label: 'Titular',
      help: 'Cada línea se muestra en un renglón. Marca «cursiva» para el estilo itálico.',
    },
    { key: 'scrollTo', type: 'text', label: 'Ancla del botón de bajar', help: 'Por ejemplo #intro.' },
    ...(video
      ? [
          { key: 'video.src', type: 'video', label: 'Vídeo de fondo (MP4)' },
          { key: 'video.poster', type: 'image', label: 'Póster del vídeo', help: 'Se ve mientras carga el vídeo.' },
        ]
      : []),
  ],
});

const productFields = [
  { key: 'city', type: 'text', label: 'Ubicación' },
  { key: 'name', type: 'text', label: 'Nombre del proyecto' },
  { key: 'image', type: 'image', label: 'Imagen' },
  { key: 'url', type: 'url', label: 'Enlace' },
  {
    key: 'hover',
    type: 'boolean',
    default: true,
    label: 'Enlazable, con «Ver proyecto» al pasar el ratón',
    help: 'Desactívalo para que la imagen se muestre sin enlace ni efecto. Si no hay enlace, se desactiva solo.',
  },
];

const memberFields = [
  { key: 'name', type: 'text', label: 'Nombre' },
  { key: 'role', type: 'text', label: 'Cargo' },
  { key: 'city', type: 'text', label: 'Ciudad' },
  { key: 'photo', type: 'image', label: 'Fotografía' },
  { key: 'linkedin', type: 'url', label: 'LinkedIn', help: 'Déjalo vacío para ocultar el icono.' },
];

/* --------------------------------------------------------------------------
   Colecciones
   -------------------------------------------------------------------------- */

export const SCHEMA = [
  {
    id: 'site',
    file: 'content/site.json',
    label: 'Ajustes globales',
    icon: '⚙',
    description: 'Marca, navegación, colores y pie de página. Afecta a las seis páginas.',
    sections: [
      {
        id: 'brand',
        label: 'Marca',
        path: 'brand',
        fields: [
          { key: 'name', type: 'text', label: 'Nombre' },
          { key: 'lang', type: 'text', label: 'Idioma del sitio', help: 'Código ISO, por ejemplo es.' },
          { key: 'logo', type: 'image', label: 'Logotipo' },
          { key: 'logoHref', type: 'url', label: 'Enlace del logotipo' },
          { key: 'favicon', type: 'image', label: 'Favicon', help: 'PNG cuadrado de 512×512.' },
        ],
      },
      {
        id: 'nav',
        label: 'Navegación',
        path: '',
        description: 'El orden se refleja en la cabecera, el menú móvil y el pie.',
        fields: [
          {
            key: 'nav',
            type: 'list',
            label: 'Páginas del menú',
            itemLabel: (item) => item.label,
            addLabel: 'Añadir enlace',
            fields: [
              { key: 'label', type: 'text', label: 'Texto' },
              { key: 'href', type: 'text', label: 'Destino' },
              {
                key: 'page',
                type: 'text',
                label: 'Identificador de página',
                help: 'Marca el enlace como activo cuando coincide con la página. Déjalo vacío en enlaces externos.',
              },
            ],
          },
        ],
      },
      {
        id: 'theme',
        label: 'Colores',
        path: 'theme',
        description: 'Los colores de marca del sitio completo.',
        fields: [
          { key: 'navy', type: 'color', label: 'Azul principal' },
          { key: 'navyLight', type: 'color', label: 'Azul claro' },
          { key: 'navyCard', type: 'color', label: 'Azul de tarjetas' },
          { key: 'navyBorder', type: 'color', label: 'Azul de bordes' },
          { key: 'creamLight', type: 'color', label: 'Crema claro' },
          { key: 'creamDark', type: 'color', label: 'Crema oscuro' },
          { key: 'yellow', type: 'color', label: 'Amarillo Savills' },
          { key: 'red', type: 'color', label: 'Rojo Savills' },
        ],
      },
      {
        id: 'footer',
        label: 'Pie de página',
        path: 'footer',
        fields: [
          { key: 'copyright', type: 'rich', label: 'Aviso de copyright', help: RICH_HELP },
          { key: 'backToTop', type: 'text', label: 'Texto de «volver arriba»' },
          {
            key: 'social',
            type: 'list',
            label: 'Redes sociales',
            itemLabel: (item) => item.label,
            addLabel: 'Añadir red social',
            fields: [
              {
                key: 'network',
                type: 'select',
                label: 'Red',
                options: [
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'linkedin', label: 'LinkedIn' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'x', label: 'X (Twitter)' },
                ],
              },
              { key: 'label', type: 'text', label: 'Etiqueta accesible' },
              { key: 'url', type: 'url', label: 'Enlace' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'inicio',
    file: 'content/inicio.json',
    label: 'Inicio',
    icon: '⌂',
    preview: 'index.html',
    sections: [
      seoSection,
      heroSection({ video: true }),
      {
        id: 'intro',
        label: 'Introducción y vídeo',
        path: 'intro',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', rows: 3, help: RICH_HELP },
          { key: 'text', type: 'rich', label: 'Texto', rows: 3, help: RICH_HELP },
          { key: 'video.url', type: 'url', label: 'Vídeo de YouTube (URL de inserción)', help: 'Formato https://www.youtube.com/embed/ID' },
          { key: 'video.poster', type: 'image', label: 'Miniatura del vídeo' },
          { key: 'video.posterAlt', type: 'text', label: 'Texto alternativo de la miniatura' },
        ],
      },
      {
        id: 'services',
        label: '¿Qué nos hace diferentes?',
        path: 'services',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular de la sección', help: RICH_HELP },
          {
            key: 'cards',
            type: 'list',
            label: 'Tarjetas',
            itemLabel: (item) => item.title,
            addLabel: 'Añadir tarjeta',
            fields: [
              { key: 'title', type: 'text', label: 'Título' },
              { key: 'text', type: 'textarea', label: 'Texto', rows: 3 },
            ],
          },
        ],
      },
      {
        id: 'network',
        label: 'Red internacional',
        path: 'network',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', help: RICH_HELP },
          {
            key: 'stats',
            type: 'list',
            label: 'Cifras',
            itemLabel: (item) => `${item.number} · ${item.label}`,
            addLabel: 'Añadir cifra',
            fields: [
              {
                key: 'number',
                type: 'text',
                label: 'Cifra',
                help: 'Se anima al aparecer. Admite prefijos y decimales: +42.000, +£2,60bn.',
              },
              { key: 'label', type: 'text', label: 'Descripción' },
            ],
          },
          { key: 'business.subtitle', type: 'rich', label: 'Subtitular del bloque de negocio', rows: 2, help: RICH_HELP },
          { key: 'business.text', type: 'rich', label: 'Texto del bloque', rows: 8, help: 'Una línea en blanco separa párrafos. ' + RICH_HELP },
          { key: 'business.image', type: 'image', label: 'Imagen del bloque' },
          { key: 'business.imageAlt', type: 'text', label: 'Texto alternativo' },
        ],
      },
      {
        id: 'map',
        label: 'Mapa',
        path: 'network.map',
        description: 'Las coordenadas son porcentajes sobre la imagen del mapa: 0 es el borde izquierdo o superior.',
        fields: [
          { key: 'image', type: 'image', label: 'Imagen del mapa' },
          { key: 'label', type: 'text', label: 'Etiqueta accesible' },
          { key: 'unit', type: 'text', label: 'Unidad de las cifras', help: 'Por ejemplo «oficinas».' },
          {
            key: 'pins',
            type: 'list',
            label: 'Marcadores',
            itemLabel: (item) => `${item.region} · ${item.number}`,
            addLabel: 'Añadir marcador',
            fields: [
              { key: 'region', type: 'text', label: 'Región' },
              { key: 'number', type: 'text', label: 'Cifra' },
              { key: 'x', type: 'number', label: 'Posición horizontal (%)', step: 0.05 },
              { key: 'y', type: 'number', label: 'Posición vertical (%)', step: 0.05 },
              { key: 'highlight', type: 'boolean', label: 'Destacado con radar' },
            ],
          },
        ],
      },
      {
        id: 'spain',
        label: 'Savills en España',
        path: 'spain',
        fields: [
          { key: 'kicker', type: 'text', label: 'Antetítulo' },
          { key: 'title', type: 'rich', label: 'Titular', help: RICH_HELP },
          { key: 'text', type: 'rich', label: 'Texto', rows: 6, help: 'Una línea en blanco separa párrafos. ' + RICH_HELP },
          { key: 'image', type: 'image', label: 'Imagen de fondo' },
          {
            key: 'stats',
            type: 'list',
            label: 'Cifras',
            itemLabel: (item) => `${item.number} · ${item.label}`,
            addLabel: 'Añadir cifra',
            fields: [
              { key: 'number', type: 'text', label: 'Cifra' },
              { key: 'label', type: 'text', label: 'Descripción' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'red-internacional',
    file: 'content/red-internacional.json',
    label: 'Red internacional',
    icon: '◍',
    preview: 'red-internacional.html',
    sections: [
      seoSection,
      heroSection(),
      {
        id: 'expertise',
        label: 'Expertise 360',
        path: 'expertise',
        fields: [
          { key: 'kicker', type: 'text', label: 'Antetítulo' },
          { key: 'title', type: 'rich', label: 'Titular', rows: 3, help: RICH_HELP },
          { key: 'lead', type: 'rich', label: 'Entradilla', rows: 3, help: RICH_HELP },
          {
            key: 'stats',
            type: 'list',
            label: 'Cifras',
            itemLabel: (item) => `${item.number} · ${item.label}`,
            addLabel: 'Añadir cifra',
            fields: [
              { key: 'number', type: 'text', label: 'Cifra' },
              { key: 'label', type: 'text', label: 'Descripción' },
            ],
          },
        ],
      },
      {
        id: 'teams',
        label: 'Equipos especializados',
        path: 'teams',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', rows: 2, help: RICH_HELP },
          { key: 'intro', type: 'rich', label: 'Introducción', rows: 8, help: 'Una línea en blanco separa párrafos. ' + RICH_HELP },
          { key: 'feature.image', type: 'image', label: 'Imagen destacada' },
          { key: 'feature.imageAlt', type: 'text', label: 'Texto alternativo' },
          { key: 'feature.subtitle', type: 'rich', label: 'Subtitular destacado', rows: 3, help: RICH_HELP },
          { key: 'feature.text', type: 'rich', label: 'Texto destacado', rows: 3, help: RICH_HELP },
          {
            key: 'metrics',
            type: 'list',
            label: 'Métricas con imagen',
            itemLabel: (item) => `${item.number} · ${item.label}`,
            addLabel: 'Añadir métrica',
            fields: [
              { key: 'image', type: 'image', label: 'Imagen' },
              { key: 'number', type: 'text', label: 'Cifra' },
              { key: 'label', type: 'textarea', label: 'Descripción', rows: 2 },
            ],
          },
        ],
      },
      {
        id: 'projects',
        label: 'Proyectos globales',
        path: 'projects',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', help: RICH_HELP },
          { key: 'cta', type: 'text', label: 'Texto del hover', help: 'Aparece al pasar el ratón sobre cada proyecto.' },
          {
            key: 'items',
            type: 'list',
            label: 'Proyectos',
            itemLabel: (item) => item.name,
            addLabel: 'Añadir proyecto',
            fields: [
              { key: 'name', type: 'text', label: 'Nombre' },
              { key: 'place', type: 'text', label: 'Ubicación', help: 'Ciudad, país.' },
              { key: 'image', type: 'image', label: 'Imagen' },
              { key: 'url', type: 'url', label: 'Enlace' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'servicios',
    file: 'content/servicios.json',
    label: 'Servicios',
    icon: '❖',
    preview: 'servicios.html',
    sections: [
      seoSection,
      heroSection(),
      {
        id: 'process',
        label: 'Proceso (círculo)',
        path: 'process',
        description: 'Los pasos se reparten automáticamente alrededor del círculo, sea cual sea su número.',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', rows: 2, help: RICH_HELP },
          { key: 'intro', type: 'rich', label: 'Introducción', rows: 6, help: 'Una línea en blanco separa párrafos. ' + RICH_HELP },
          {
            key: 'steps',
            type: 'list',
            label: 'Pasos',
            itemLabel: (item) => item.title,
            addLabel: 'Añadir paso',
            fields: [
              { key: 'title', type: 'text', label: 'Título del paso' },
              { key: 'strong', type: 'textarea', label: 'Frase destacada', rows: 2, help: 'Se muestra en negrita.' },
              { key: 'rest', type: 'textarea', label: 'Resto del texto', rows: 3 },
            ],
          },
        ],
      },
      {
        id: 'types',
        label: 'Tipologías',
        path: 'types',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', rows: 2, help: RICH_HELP },
          {
            key: 'cards',
            type: 'list',
            label: 'Tarjetas',
            itemLabel: (item) => String(item.title).replace(/\n/g, ' '),
            addLabel: 'Añadir tipología',
            fields: [
              { key: 'title', type: 'textarea', label: 'Título', rows: 2, help: 'Cada salto de línea es un renglón.' },
              { key: 'image', type: 'image', label: 'Imagen' },
              { key: 'desc', type: 'textarea', label: 'Descripción', rows: 3 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'producto',
    file: 'content/producto.json',
    label: 'Producto',
    icon: '▤',
    preview: 'producto.html',
    sections: [
      seoSection,
      heroSection(),
      {
        id: 'intro',
        label: 'Introducción',
        path: '',
        fields: [
          { key: 'intro.title', type: 'rich', label: 'Titular de entrada', rows: 4, help: RICH_HELP },
          {
            key: 'cta',
            type: 'text',
            label: 'Texto del hover',
            help: 'Aparece sobre cada proyecto de todas las galerías.',
          },
        ],
      },
      {
        id: 'blocks',
        label: 'Bloques de producto',
        path: '',
        description:
          'Cada bloque es una sección con su titular y su galería. Los botones de navegación de la parte superior se generan solos a partir de esta lista, en este mismo orden.',
        fields: [
          {
            key: 'blocks',
            type: 'list',
            label: 'Bloques',
            itemLabel: (item) => item.navLabel,
            addLabel: 'Añadir bloque',
            fields: [
              { key: 'navLabel', type: 'text', label: 'Nombre en la navegación' },
              {
                key: 'id',
                type: 'text',
                label: 'Identificador',
                help: 'Se usa como ancla del botón. Sin espacios ni acentos, por ejemplo producto-nacional.',
              },
              {
                key: 'theme',
                type: 'select',
                label: 'Fondo',
                options: [
                  { value: 'cream', label: 'Crema' },
                  { value: 'navy', label: 'Azul' },
                ],
              },
              { key: 'title', type: 'rich', label: 'Titular', rows: 3, help: RICH_HELP },
              {
                key: 'lead',
                type: 'rich',
                label: 'Entradilla',
                rows: 5,
                help: 'Una línea en blanco separa párrafos. ' + RICH_HELP,
              },
              {
                key: 'products',
                type: 'list',
                label: 'Proyectos',
                itemLabel: (item) => `${item.name} · ${item.city}`,
                addLabel: 'Añadir proyecto',
                fields: productFields,
              },
            ],
          },
        ],
      },
      {
        id: 'logos',
        label: 'Carrusel de logotipos',
        path: 'logos',
        description:
          'Se desplaza solo, en bucle. Todos los logotipos se muestran a la misma altura, así que da igual el tamaño del archivo que subas.',
        fields: [
          { key: 'label', type: 'text', label: 'Etiqueta accesible' },
          {
            key: 'speed',
            type: 'number',
            label: 'Duración de una vuelta (segundos)',
            step: 5,
            help: 'Más segundos, más lento. 45 es un ritmo cómodo.',
          },
          {
            key: 'items',
            type: 'list',
            label: 'Logotipos',
            itemLabel: (item) => item.name,
            addLabel: 'Añadir logotipo',
            fields: [
              { key: 'name', type: 'text', label: 'Nombre' },
              {
                key: 'image',
                type: 'image',
                label: 'Logotipo',
                help: 'PNG o SVG con fondo transparente. Se ajusta solo a la altura del carrusel.',
              },
              { key: 'url', type: 'url', label: 'Enlace', help: 'Opcional. Déjalo vacío si no debe ser clicable.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'equipo',
    file: 'content/equipo.json',
    label: 'Equipo',
    icon: '☺',
    preview: 'equipo.html',
    sections: [
      seoSection,
      heroSection(),
      {
        id: 'spain',
        label: 'Equipo en España',
        path: 'spain',
        fields: [
          { key: 'lead', type: 'rich', label: 'Entradilla', rows: 4, help: RICH_HELP },
          { key: 'title', type: 'rich', label: 'Titular', help: RICH_HELP },
          {
            key: 'members',
            type: 'list',
            label: 'Personas',
            itemLabel: (item) => item.name,
            addLabel: 'Añadir persona',
            fields: memberFields,
          },
        ],
      },
      {
        id: 'global',
        label: 'Equipo global',
        path: 'global',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', help: RICH_HELP },
          { key: 'background', type: 'image', label: 'Imagen de fondo de la sección' },
          {
            key: 'members',
            type: 'list',
            label: 'Personas',
            itemLabel: (item) => item.name,
            addLabel: 'Añadir persona',
            fields: memberFields,
          },
        ],
      },
    ],
  },

  {
    id: 'contacto',
    file: 'content/contacto.json',
    label: 'Contacto',
    icon: '✉',
    preview: 'contacto.html',
    sections: [
      seoSection,
      heroSection(),
      {
        id: 'intro',
        label: 'Introducción',
        path: 'intro',
        fields: [
          { key: 'title', type: 'rich', label: 'Titular', rows: 2, help: RICH_HELP },
          { key: 'lead', type: 'rich', label: 'Entradilla', rows: 3, help: RICH_HELP },
          { key: 'cta', type: 'rich', label: 'Llamada a la acción lateral', rows: 3, help: RICH_HELP },
        ],
      },
      {
        id: 'offices',
        label: 'Oficinas',
        path: '',
        fields: [
          {
            key: 'offices',
            type: 'list',
            label: 'Oficinas',
            itemLabel: (item) => item.city,
            addLabel: 'Añadir oficina',
            fields: [
              { key: 'city', type: 'text', label: 'Ciudad' },
              { key: 'address', type: 'text', label: 'Dirección' },
              { key: 'phone', type: 'tel', label: 'Teléfono', help: 'El enlace tel: se genera automáticamente.' },
              { key: 'image', type: 'image', label: 'Fotografía' },
            ],
          },
        ],
      },
    ],
  },
];

/** Devuelve la colección con ese identificador. */
export const collectionById = (id) => SCHEMA.find((collection) => collection.id === id);

/**
 * Plantilla vacía para un elemento nuevo de una lista. Un campo puede declarar
 * `default` para estrenarse con otro valor que el vacío de su tipo.
 */
export const blankItem = (fields) => {
  const item = {};
  for (const field of fields) {
    if (field.default !== undefined) item[field.key] = field.default;
    else if (field.type === 'boolean') item[field.key] = false;
    else if (field.type === 'number') item[field.key] = 0;
    else if (field.type === 'select') item[field.key] = field.options[0].value;
    else item[field.key] = '';
  }
  return item;
};
