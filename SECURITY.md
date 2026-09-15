# Informe de seguridad — Obra Nueva Residencial (Savills)

**Alcance:** el sitio estático, el generador (`build/`) y el pipeline de
despliegue.
**Repositorio:** `oscarnieto/residential`, rama `claude/clever-brahmagupta-abt3is`.
**Método:** revisión manual del código más verificación dinámica con un
navegador. Cada hallazgo se comprobó explotándolo antes de darlo por bueno, y se
volvió a comprobar después de corregirlo.

> **Complemento:** este documento recoge la revisión y su investigación. La
> certificación formal contra la Política de Seguridad de Aplicaciones de la
> empresa, control por control, está en
> [`security/compliance-report.md`](security/compliance-report.md).

> **Cambio de alcance.** Este informe se escribió cuando el repositorio
> incluía un gestor de contenidos propio en `/admin`. **El panel se ha retirado**
> (ver §3.8): el contenido se edita ahora tocando `content/*.json` y haciendo
> push. Los hallazgos 1-3 y su corrección siguen vigentes —el código que los
> causaba y el que los arregló están en `build/` y en `js/`—, pero el tramo del
> relato que hablaba de robar el token del panel ya no tiene sujeto. Los
> hallazgos 4, 5, 7 y 8 se han cerrado con la retirada.

> **Nota sobre el encargo.** Se pidió generar este informe con el skill
> `seguridad-aplicaciones`. La plantilla corporativa sí está en el repositorio,
> pero el `SKILL.md` no llegó a subirse (el subidor web de GitHub ignora las
> carpetas que empiezan por punto), así que la revisión se hizo a mano tomando
> como referencia `security/policy.yml`, que la propia plantilla designa fuente
> única de verdad. No se usó ninguna herramienta automática de análisis
> estático: conviene tenerlo en cuenta al valorar la cobertura (ver §5).

---

## 1. Resumen

Se encontraron **cuatro vulnerabilidades de inyección**, todas explotables por
alguien con permiso de edición de contenidos, y todas corregidas. Las tres
primeras salieron de esta revisión manual; la cuarta la destapó después la
certificación contra la política corporativa (control INJ-07), y está detallada
en [`security/compliance-report.md`](security/compliance-report.md) §4.

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | XSS almacenado en los pasos del círculo de Servicios (`innerHTML`) | **Alta** | Corregido |
| 2 | XSS almacenado vía `javascript:` en campos de enlace | **Alta** | Corregido |
| 3 | Inyección de CSS en atributos `style` | Baja | Corregido |
| 4 | Subida de ficheros sin validar contenido; SVG con script (INJ-07) | **Alta** | Corregido, y después retirado con el panel |
| 5 | El panel es público (por diseño) | Informativo | Ya no aplica: panel retirado |
| 6 | Sin cabeceras de seguridad (CSP, HSTS…) | Baja | Parcialmente corregido |
| 7 | Token del editor en `localStorage` | Baja | Ya no aplica: panel retirado |
| 8 | Sin caducidad por inactividad del token (SESS-04) | Baja | Corregido, y después retirado con el panel |

**Superficie de ataque general:** muy reducida. Sin backend, sin base de datos,
sin dependencias de terceros (`npm`), sin formularios que reciban datos y sin
JavaScript de terceros. No se encontró **ningún secreto** en el repositorio.

---

## 2. Modelo de amenazas

Conviene fijar quién es el atacante, porque determina la severidad real.

| Actor | Capacidad | Relevancia |
|---|---|---|
| Visitante anónimo | Sólo lee el sitio publicado | No tiene ninguna vía de entrada: no hay formularios, ni subidas, ni parámetros que el servidor procese |
| **Quien tiene permiso de push** | Escribe en `content/*.json` y en el código, y publica haciendo push | **Es el actor relevante.** De aquí parten los hallazgos 1-3 |
| Atacante con una cuenta de GitHub comprometida | Equivale al anterior | Se ataja con 2FA y revisando la lista de colaboradores |
| Cadena de suministro | — | Sin dependencias que comprometer |

Quien edita contenido es un actor **semi-confiable**: tiene permiso para
publicar, pero no debería poder ejecutar código arbitrario en el navegador de
los visitantes. Los hallazgos 1 y 2 rompían esa frontera.

> Cuando existía el panel `/admin`, esa frontera importaba todavía más: la
> vista previa renderizaba el HTML en el mismo origen donde vivía el token de
> otros editores, así que un XSS en el contenido escalaba de un editor a otro.
> Retirado el panel, queda el riesgo para el visitante, que es el que justifica
> mantener los saneadores.

---

## 3. Hallazgos

### 3.1 — XSS almacenado en el círculo de Servicios · Alta · Corregido

**Dónde:** `js/main.js`, pintado del paso activo.

Los pasos del proceso se incrustaban en la página con `innerHTML` a partir de
texto que escribe el editor:

```js
descEl.innerHTML = `<strong>${step.strong}</strong> ${step.rest}`;
```

El generador escapaba correctamente ese contenido al serializarlo en el bloque
JSON, pero el escapado se deshace al hacer `JSON.parse`, y `innerHTML` vuelve a
interpretar el resultado como HTML.

**Verificación.** Se escribió `<img src=x onerror="document.title='XSS-EJECUTADO'">`
en el campo *Resto del texto* de un paso y se construyó el sitio. El navegador
ejecutó el código:

```
title de la página: "XSS-EJECUTADO"
⚠️  EL SCRIPT INYECTADO SE HA EJECUTADO
```

**Impacto.** Ejecución de código arbitrario en el navegador de cualquier
visitante de la página de Servicios, plantada por quien edite el contenido.

> Cuando existía el panel, el impacto era mayor: su vista previa renderizaba el
> mismo HTML en un iframe con `allow-same-origin`, o sea **en el origen de
> `/admin`**, donde vivía el token de GitHub de quien lo abriera. Era una vía de
> escalada de un editor a otro. Ese tramo desapareció con el panel (§3.8); el
> riesgo para el visitante, no.

**Corrección.** Se construye con nodos del DOM en lugar de con HTML:

```js
const strong = document.createElement('strong');
strong.textContent = step.strong;
descEl.replaceChildren(strong, document.createTextNode(` ${step.rest}`));
```

**Comprobado tras el arreglo:** el mismo payload ya no se ejecuta, y el texto
legítimo sigue mostrándose con su negrita y cambiando de paso correctamente.

---

### 3.2 — XSS almacenado mediante `javascript:` en enlaces · Alta · Corregido

**Dónde:** todos los campos de enlace del contenido (enlace de proyecto, LinkedIn,
logotipo, enlaces del menú, ancla del hero).

El generador escapaba los valores antes de meterlos en un `href`, lo que impide
romper el atributo pero **no impide un esquema peligroso**: `javascript:alert(1)`
no contiene comillas ni ángulos, así que atraviesa el escapado intacto.

**Verificación.** Se puso `javascript:void(document.title='XSS-HERO')` en el
campo *Ancla del botón de bajar* de la portada. Al pulsar la flecha del hero:

```
title tras pulsar la flecha del hero: "XSS-HERO"
⚠️  SE EJECUTA — enlace sin target=_blank
```

Un detalle que conviene señalar, porque es fácil sacar la conclusión equivocada:
en los enlaces que llevan `target="_blank"` el navegador **bloquea** los
esquemas `javascript:`, así que la primera prueba pareció negativa. La
vulnerabilidad era real igualmente en los enlaces sin `target` (hero y menú).
Depender de ese bloqueo habría sido depender de una casualidad del navegador, no
de una defensa.

**Corrección.** Nuevo saneador `url()` en `build/lib/html.mjs`, aplicado a todos
los `href` y `src` que provienen del contenido. Admite `http(s)`, `mailto`,
`tel`, rutas relativas y anclas; cualquier otro esquema se sustituye por `#`.
Se eliminan antes los caracteres de control, porque el navegador los ignora al
resolver la URL y permiten disfraces como `java&#9;script:`.

**Comprobado tras el arreglo:** con payloads en el hero, en un proyecto y en un
LinkedIn, no queda **ni un solo** `javascript:` en las seis páginas generadas, y
el enlace del hero deja de ejecutar código.

---

### 3.3 — Inyección de CSS en atributos `style` · Baja · Corregido

**Dónde:** coordenadas de los pines del mapa (`--x`, `--y`) y velocidad del
carrusel de logotipos (`--marquee-duration`).

Mismo patrón que el anterior: escapar no protege un contexto CSS. Un valor como
`1s;background:url(https://externo/x)` pasa el escapado y se inserta como CSS.

**Impacto.** Limitado: permite alterar el estilo y provocar una petición a un
servidor externo (lo que filtraría la IP del visitante), pero no ejecutar
código. Requiere además permiso de escritura sobre el repositorio.

**Corrección.** Saneador `num()`, que acepta únicamente un número.
**Comprobado:** `1s;background:url(...)` se convierte en `1s`.

---

### 3.4 — El panel de administración es público · Informativo · Cerrado

`/admin` era accesible para cualquiera, consecuencia inevitable de alojar en
GitHub Pages, que no admite autenticación. No era una vulnerabilidad —el panel
era inerte sin credenciales— pero exponía la estructura del proyecto.

**Cerrado por retirada del panel** (§3.8).

---

### 3.5 — Sin cabeceras de seguridad · Baja · Parcialmente corregido

Una CSP habría sido una segunda barrera frente a los hallazgos 1 y 2: aunque el
payload se hubiera colado, `script-src 'self'` habría impedido su ejecución. Por
eso se ha entregado ya, sin esperar al cambio de alojamiento.

**Lo que se ha hecho.** GitHub Pages no permite configurar cabeceras, pero dos
de estas políticas también viajan en `<meta>` y el navegador las aplica igual:

- **`Content-Security-Policy`** por `<meta http-equiv>` en las seis páginas
  (`build/partials/layout.mjs`).
- **`Referrer-Policy`** por `<meta name="referrer">`.

Al retirar el panel se apretaron además dos directivas que estaban en `'self'`
sólo por su causa: `connect-src` y `base-uri` están ahora en `'none'`. El sitio
no hace ni una llamada de red y ninguna página lleva `<base>`.

**Lo que sigue abierto, y por qué.** `X-Content-Type-Options` y
`Strict-Transport-Security` sólo existen como cabecera; `Permissions-Policy`
tampoco tiene forma `<meta>`; y `frame-ancestors` **se ignora** expresamente
cuando la CSP llega por `<meta>`, así que el anti-clickjacking sigue sin
cubrirse. Nada de esto es corregible mientras el alojamiento sea GitHub Pages.

**Recomendación.** Al mover el sitio a los servidores de la empresa (algo ya
previsto), pedir a IT que sirva al menos:

```
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline';
  object-src 'none'; base-uri 'none'; frame-ancestors 'none';
  form-action 'none'; connect-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`'unsafe-inline'` en `style-src` es necesario por los atributos `style` que
genera el build (posición de los pines y velocidad del carrusel). Se podría
eliminar moviendo esos valores a clases o a un CSS generado, si IT lo exige.

Lo que cierra de verdad el anti-clickjacking es `frame-ancestors 'none'`, que
sólo funciona en cabecera; por eso va en la propuesta y no en el `<meta>`.

---

### 3.6 — Token del editor en `localStorage` · Baja · Cerrado

El panel guardaba el token de GitHub en `localStorage` del navegador del editor.
Se aceptó en su día porque sin backend no había alternativa —una cookie
`HttpOnly` exige un servidor, que es justo lo que el montaje evitaba— con el
matiz estructural de que **cualquier XSS en el mismo origen implicaba el robo
del token**.

**Cerrado por retirada del panel** (§3.8): ya no hay ningún token en ningún
navegador.

---

### 3.7 — Sin caducidad por inactividad del token · Baja · Cerrado

El token sobrevivía en `localStorage` hasta el cierre manual o su caducidad en
GitHub. Se corrigió con un cierre de sesión a los 15 minutos de inactividad que
borraba la credencial sin tirar los cambios sin publicar.

**Cerrado por retirada del panel** (§3.8), que elimina la causa entera.

---

### 3.8 — Retirada del gestor de contenidos

El panel `/admin` se ha eliminado del repositorio. Con él se van sus tres
hallazgos abiertos o aceptados (§3.4, §3.6, §3.7) y el control INJ-07 de subida
de ficheros, porque ya no hay subida.

**Lo que queda.** El contenido sigue viviendo en `content/*.json` y sigue
interpolándose en el HTML por `build/lib/html.mjs`. Por eso **no se ha tocado ni
un saneador**: cambia quién puede plantar un payload —ahora hace falta permiso
de push— pero no el hecho de que el payload llegaría al navegador del visitante.
Las reglas de `security/.semgrep.yml` se quedan igualmente, para que los tres
agujeros de §3.1-§3.3 no puedan volver.

**Lo que empeora.** Editar contenido pasa a requerir git y saber tocar un JSON.
Es un coste de usabilidad, no de seguridad, y conviene decirlo: el panel se
retiró por decisión de producto, no porque fuera inseguro.

**Cómo recuperarlo.** Está entero en el historial. El último commit que lo
contiene es `5aff72b`, así que basta con:

```bash
git checkout 5aff72b -- admin/ CMS.md
```

---

## 4. Comprobaciones realizadas sin hallazgos

| Comprobación | Resultado |
|---|---|
| Secretos, tokens o claves en el repositorio | Ninguno |
| `eval`, `new Function`, `document.write` | No se usan; hay regla de semgrep que lo impide en adelante |
| `innerHTML` con datos de `content/` | Ninguno. Tras el hallazgo 3.1 no queda **ni un solo** `innerHTML` en el proyecto, y una regla de semgrep bloquea que vuelva a aparecer |
| Enlaces externos sin `rel="noopener"` | Ninguno en las seis páginas |
| Secretos en el workflow de despliegue | Ninguno; sólo el `GITHUB_TOKEN` efímero de Actions |
| Permisos del workflow | `contents: write`, `pages: write`, `id-token: write`. El de escritura es necesario para devolver el HTML regenerado |
| Dependencias de terceros | Ninguna. Sin `package.json` ni `node_modules`: no hay riesgo de cadena de suministro por paquetes |
| JavaScript de terceros, analítica, cookies | Ninguno |
| Ruptura de atributos por comillas | No es posible: `esc()` escapa `"` y todos los atributos usan comilla doble |
| Fuga del bloque `<script type="application/json">` | Protegida: se escapan los `<` como `<` |
| Rutas de imagen dentro de `url()` en CSS | Se codifican con `encodeURI`, de modo que no pueden cerrar el paréntesis |
| Concurrencia al publicar | La resuelve git: dos cambios simultáneos se reconcilian con un merge o un rebase, como cualquier otro cambio de código |

---

## 5. Limitaciones de esta revisión

Para que se valore con la cobertura que realmente tiene:

- **La revisión original fue manual, sin herramientas automáticas.** Después se
  añadió un SAST propio (`security/.semgrep.yml`) que corre en el gate y cubre
  las tres clases de inyección de §3.1-§3.3, pero el resto del repaso sigue
  siendo revisión humana. No hay escáner de dependencias porque no hay
  dependencias.
- **No se probó contra el sitio publicado.** Este entorno tiene bloqueado el
  acceso a `oscarnieto.github.io`, así que todo se verificó en local sobre el
  mismo código que se despliega.
- **No se auditó la configuración de la cuenta de GitHub**: quién tiene acceso
  al repositorio, si hay 2FA obligatorio en la organización, ni las reglas de
  protección de rama. Es donde está el control de acceso real y merece una
  revisión aparte por parte de IT.
- **No se revisó el contenido publicado** desde la óptica de protección de datos
  (fotos y nombres del equipo, teléfonos de oficina). Es material corporativo
  público, pero la valoración RGPD corresponde a quien lleve privacidad.

---

## 6. Recomendaciones, por orden de utilidad

1. **Al migrar a los servidores de la empresa, añadir las cabeceras de §3.5.**
   Es la mejora con mejor relación coste/beneficio que queda pendiente, y sólo
   depende de la configuración del servidor. La CSP ya se entrega por `<meta>`;
   lo que falta ahí son `nosniff`, HSTS, `Permissions-Policy` y
   `frame-ancestors`.
2. **Revisar quién tiene acceso de escritura al repositorio** y exigir 2FA. Es
   el control que de verdad protege el contenido; todo lo demás asume que los
   editores son quienes dicen ser.
3. **Proteger la rama de publicación**, para que un cambio en el sitio exija
   revisión y no baste con un push directo. Es lo que sustituye, en el modelo
   nuevo, al control que antes daba la sesión del panel.
4. **Mantener la regla de saneado** al añadir campos nuevos: nunca `innerHTML`
   con contenido, `url()` en enlaces, `num()` en estilos. Está documentada en
   `ARCHITECTURE.md` §11.
5. **Considerar una protección de rama** sobre la rama de publicación, para que
   un token comprometido no pueda reescribir el historial.

---

*Revisión realizada sobre el estado del repositorio en la fecha del último
commit de este archivo. Las correcciones de §3.1, §3.2 y §3.3 se incluyen en ese
mismo commit.*
