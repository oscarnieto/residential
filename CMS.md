# Gestor de contenidos — guía de uso

Con este panel puedes cambiar **cualquier texto, cifra, imagen, enlace o color**
de la web sin tocar código. No necesitas saber programar ni instalar nada: se
usa desde el navegador.

**Dirección del panel:** https://oscarnieto.github.io/residential/admin/

---

## 1. Preparación (solo la primera vez)

El panel necesita permiso para escribir en el repositorio. Ese permiso se
concede con un *token*, que es como una contraseña de un solo uso para una
aplicación concreta.

1. Entra en **[github.com → Settings → Developer settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)**.
2. **Token name:** pon algo reconocible, por ejemplo `CMS web residencial`.
3. **Expiration:** elige la caducidad que prefieras. Cuando caduque tendrás que
   repetir estos pasos; un año es un equilibrio razonable.
4. **Repository access:** marca *Only select repositories* y elige
   **`oscarnieto/residential`**.
5. **Permissions → Repository permissions:**
   - `Contents` → **Read and write** *(imprescindible)*
   - `Actions` → **Read-only** *(opcional: sirve para ver si la publicación ha ido bien)*
6. Pulsa **Generate token** y **copia el código** que aparece. GitHub solo te lo
   enseña una vez.
7. Abre el panel, pega el token en el campo **Token de acceso** y entra.

El token se guarda **solo en tu navegador**. No se envía a ningún sitio que no
sea GitHub, y no queda registrado en la web. Si usas otro ordenador tendrás que
volver a pegarlo, y si alguna vez crees que se ha filtrado, bórralo desde
GitHub y genera uno nuevo.

> **Sobre la rama:** el campo *Rama* debe coincidir con la rama desde la que se
> publica la web, y viene ya relleno con la correcta. Si algún día cambia (por
> ejemplo al fusionar el proyecto a `main`), el panel te avisará indicándote en
> qué ramas sí encuentra el contenido.

---

## 2. Cómo funciona

A la izquierda tienes las **siete secciones** editables:

| Sección | Qué controla |
|---|---|
| **Ajustes globales** | Logotipo, favicon, menú de navegación, colores de marca y pie de página. Afecta a las seis páginas a la vez |
| **Inicio** | Portada: hero con vídeo, introducción, tarjetas, cifras, mapa y bloque de España |
| **Red internacional** | Expertise, equipos, métricas y proyectos globales |
| **Servicios** | Círculo de proceso y tarjetas de tipología |
| **Producto** | Los bloques de proyectos (nacional, internacional, track record…) y el carrusel de logotipos |
| **Equipo** | Las personas del equipo en España y del equipo global |
| **Contacto** | Textos de contacto y las oficinas |

Cada sección se despliega en bloques. Al abrir uno aparecen sus campos, y **a la
derecha ves la página real actualizándose mientras escribes**. Esa vista previa
usa exactamente el mismo motor que la web publicada, así que lo que ves es
literalmente lo que se va a publicar.

### Ajustar el espacio de trabajo

Todo el reparto de la pantalla es tuyo, y el panel lo recuerda para la próxima
vez:

| Control | Qué hace |
|---|---|
| **Arrastrar la línea central** | Reparte el espacio entre el formulario y la vista previa. Haz doble clic sobre ella para volver al reparto original |
| **− / + / Ajustar** | Acerca o aleja la vista previa. *Ajustar* la encaja en el espacio que tenga; al ampliar más de lo que cabe, puedes desplazarla |
| **Escritorio / Tablet / Móvil** | Cambia el ancho de pantalla que se simula. No es lo mismo que el zoom: aquí eliges el dispositivo, con el zoom eliges cómo de grande lo ves |
| **Ocultar vista previa** | Deja el formulario a pantalla completa |
| **«** (arriba en el menú lateral) | Contrae el menú a iconos y gana espacio a lo ancho |

El formulario y la vista previa se desplazan por separado: puedes bajar por los
campos sin que la previsualización se mueva de sitio.

Los cambios **no se publican solos**. Mientras editas:

- arriba aparece un aviso de *«N secciones sin publicar»*,
- en el menú de la izquierda sale un punto amarillo junto a lo que has tocado.

Cuando estés conforme, pulsa **Publicar cambios**. Te pedirá una breve
descripción (queda en el historial) y en **1-3 minutos** la web estará
actualizada. El indicador de arriba te avisa cuando termina.

Si te arrepientes antes de publicar, **Descartar** deja todo como estaba.

---

## 3. Escribir textos

La mayoría de campos son texto normal. En los que llevan botones **B** e *I*
puedes dar formato:

| Escribes | Se ve |
|---|---|
| `*así*` | *cursiva* |
| `**así**` | **negrita** |
| Un salto de línea | Fuerza un corte de línea en el titular |
| Una línea **en blanco** entre dos párrafos | Separa en párrafos |

También puedes seleccionar el texto y pulsar **B** o *I*, que es más cómodo.

La cursiva es el recurso de estilo de la marca: en los titulares suele ir la
parte destacada. Por ejemplo `¿Qué nos hace *diferentes*?` se ve como
«¿Qué nos hace *diferentes*?».

### Las cifras animadas

Los campos de cifra (`+42.000`, `+£2,60bn`, `+35M`) se animan solos al aparecer
en pantalla. Escríbelas tal cual quieras que se lean: el sistema entiende
prefijos (`+`, `£`), separador de miles con punto y decimales con coma. No hace
falta configurar nada.

---

## 4. Imágenes

En cualquier campo de imagen tienes **Elegir imagen**. Se abre la biblioteca con
todo lo que ya está subido, y puedes:

- **Elegir una existente** — haz clic para seleccionarla (doble clic la elige y
  cierra).
- **Subir una nueva** — arrastra el archivo a la zona de puntos, o haz clic para
  buscarlo. Se sube al instante.
- **Borrar** — pasa el ratón por encima y pulsa la **✕** de la esquina.

### Borrar imágenes

Un **punto verde** en la esquina marca los archivos que se están usando en
alguna sección. Antes de borrar, el panel comprueba si es el caso:

- Si **no se usa en ninguna parte**, te lo dice y lo borra sin más.
- Si **sí se está usando**, el aviso te indica en qué secciones y te advierte de
  que ahí quedará una imagen rota. Sigue siendo tu decisión, pero con la
  información delante.

El borrado se aplica al repositorio al instante, igual que las subidas: no
espera a que pulses *Publicar cambios*. Aun así, **nada se pierde de verdad** —
todo queda en el historial del repositorio y se puede recuperar.

Los archivos sin punto verde son candidatos a limpieza: suelen quedar cuando
cambias una foto por otra o quitas a alguien del equipo.

Consejos:

- **Comprime antes de subir.** Una foto de 5 MB hace la web más lenta para todo
  el mundo. Lo ideal está entre 200 y 600 KB. El panel rechaza archivos de más
  de 12 MB.
- **Anchos recomendados:** heros y fondos, 1920 px; fotos de equipo, 800 px;
  tarjetas y proyectos, 1200 px.
- **Si solo quieres cambiar una foto por otra** manteniendo todo igual, súbela
  con el mismo nombre y sustituirá a la anterior en todas partes.
- El **texto alternativo** describe la imagen para personas ciegas y para
  Google. Merece la pena rellenarlo bien.

---

## 5. Listas: equipo, proyectos, oficinas, cifras…

Todo lo que aparece repetido en la web (personas, proyectos, tarjetas, oficinas,
marcadores del mapa, pasos del proceso) se gestiona igual. Cada elemento tiene
sus botones a la derecha:

| Botón | Qué hace |
|---|---|
| ↑ ↓ | Cambia el orden. **El orden de la lista es el orden en la web** |
| ⧉ | Duplica el elemento, útil para crear uno parecido |
| ✕ | Lo elimina (te pide confirmación) |

Abajo del todo, **+ Añadir** crea uno nuevo en blanco.

Añadir o quitar elementos es seguro: el diseño se adapta solo. Puedes tener
siete personas en el equipo o doce, cinco proyectos o nueve, y la maquetación
sigue funcionando. Incluso el círculo de Servicios reparte sus pasos
automáticamente alrededor, tenga los que tenga.

### Los bloques de Producto

En la página de Producto, cada **bloque** es una sección completa con su
titular, su texto y su galería. Se gestionan como cualquier otra lista, así que
puedes reordenarlos, duplicar uno para crear otro parecido o añadir uno nuevo.
Dos detalles propios:

- **Los botones de navegación de arriba se generan solos** a partir de los
  bloques y en el mismo orden. No hay que mantenerlos aparte.
- Cada bloque elige su **fondo**, crema o azul, para poder alternarlos.
- Un bloque **sin proyectos** muestra solo su titular y su texto, sin galería
  vacía. Es útil para dejar una sección preparada antes de tener las fotos.

En cada proyecto, la casilla **«Enlazable, con *Ver proyecto* al pasar el
ratón»** controla si la imagen es clicable. Desmárcala y el proyecto se muestra
como una imagen sin enlace, sin la capa oscura ni el zoom al pasar por encima
—útil para promociones que todavía no tienen ficha publicada. Si dejas el campo
de enlace vacío, se desactiva solo, aunque la casilla esté marcada.

### El carrusel de logotipos

Se desplaza solo, en bucle continuo y sin parar. Además **se puede arrastrar con
el ratón o con el dedo** para adelantarlo o retrocederlo; al soltar retoma la
marcha desde donde lo hayas dejado, conservando el impulso del gesto.

**Todos los logotipos ocupan la misma caja**, así que no te preocupes por el
tamaño ni la proporción del archivo: sube el que tengas y el carrusel lo encaja
sin deformarlo. Lo ideal es un PNG o SVG **con fondo transparente**. El orden de
la lista es el orden en que aparecen, y con *Duración de una vuelta* ajustas la
velocidad — más segundos, más lento.

Conviene subirlos ya reducidos: no hace falta más de unos 600 px de ancho, porque
se muestran a unos 170 px.

---

## 6. Cosas que conviene saber

**Puedo romper la web?** Es difícil. Los textos se limpian automáticamente antes
de publicarse, así que no se puede colar código por accidente. Lo peor que puede
pasar es que algo quede feo, y siempre se puede volver atrás.

**Cómo deshago algo ya publicado?** Todo cambio queda registrado. En
*Historial de cambios* (abajo a la izquierda) puedes ver quién cambió qué y
cuándo. Para revertir algo, pídeselo a quien lleve el repositorio.

**Puede editar más de una persona?** Sí, pero no a la vez sobre lo mismo. Si
alguien publica mientras tú tenías cambios abiertos, el panel te avisa y te pide
recargar en vez de pisar su trabajo.

**He publicado y no veo el cambio.** Espera 2-3 minutos y recarga con
`Ctrl+F5` (o `Cmd+Shift+R` en Mac) para saltarte la caché del navegador.

**Se me ha olvidado publicar y he cerrado.** El navegador avisa antes de salir
si hay cambios sin publicar. Si aun así se perdieron, no pasa nada: la web
publicada nunca llegó a cambiar.

---

## 7. Lo que no se edita desde aquí

El panel cubre el contenido. El **diseño** —tipografías, tamaños, espaciados,
animaciones, cómo se comporta el círculo o las galerías— vive en el código
(`css/styles.css` y `js/main.js`) y lo toca quien mantiene el sitio. Los colores
de marca sí son editables, en *Ajustes globales*.

Para cualquier cambio de esos, o para añadir una página nueva, habla con el
equipo técnico: en [`ARCHITECTURE.md`](ARCHITECTURE.md) tienen documentado todo
el montaje.
