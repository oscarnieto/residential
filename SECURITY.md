# Informe de seguridad — Obra Nueva Residencial (Savills)

**Alcance:** el sitio estático, el generador (`build/`), el gestor de contenidos
(`/admin`) y el pipeline de despliegue.
**Repositorio:** `oscarnieto/residential`, rama `claude/clever-brahmagupta-abt3is`.
**Método:** revisión manual del código más verificación dinámica con un
navegador. Cada hallazgo se comprobó explotándolo antes de darlo por bueno, y se
volvió a comprobar después de corregirlo.

> **Complemento:** este documento recoge la revisión y su investigación. La
> certificación formal contra la Política de Seguridad de Aplicaciones de la
> empresa, control por control, está en
> [`security/compliance-report.md`](security/compliance-report.md).

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
| 4 | Subida de ficheros sin validar contenido; SVG con script (INJ-07) | **Alta** | Corregido |
| 5 | El panel es público (por diseño) | Informativo | Aceptado |
| 6 | Sin cabeceras de seguridad (CSP, HSTS…) | Baja | Abierto |
| 7 | Token del editor en `localStorage` | Baja | Aceptado con matices |
| 8 | Sin caducidad por inactividad del token (SESS-04) | Baja | Abierto |

**Superficie de ataque general:** muy reducida. Sin backend, sin base de datos,
sin dependencias de terceros (`npm`), sin formularios que reciban datos y sin
JavaScript de terceros. No se encontró **ningún secreto** en el repositorio.

---

## 2. Modelo de amenazas

Conviene fijar quién es el atacante, porque determina la severidad real.

| Actor | Capacidad | Relevancia |
|---|---|---|
| Visitante anónimo | Sólo lee el sitio publicado | No tiene ninguna vía de entrada: no hay formularios ni parámetros que el servidor procese |
| **Editor de contenidos** | Escribe en `content/*.json` y sube imágenes mediante el panel | **Es el actor relevante.** Los tres hallazgos parten de aquí |
| Atacante externo con un token filtrado | Equivale a un editor | Mitigado revocando el token en GitHub |
| Cadena de suministro | — | Sin dependencias que comprometer |

El editor es un actor **semi-confiable**: tiene permiso para publicar, pero no
debería poder ejecutar código arbitrario en el navegador de los visitantes ni
escalar privilegios sobre otros editores. Los hallazgos 1 y 2 rompían esa
frontera.

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

**Impacto.** Mayor de lo que parece a primera vista. Además de afectar a los
visitantes, la vista previa del panel renderiza el mismo HTML en un iframe con
`allow-same-origin`, es decir, **en el mismo origen que `/admin`**. Un payload
plantado por un editor se ejecuta con acceso al `localStorage` del panel, donde
vive el token de GitHub de quien lo abra. Es, por tanto, una vía de escalada de
un editor a otro.

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

**Dónde:** todos los campos de enlace del CMS (enlace de proyecto, LinkedIn,
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
código. Requiere además ser editor.

**Corrección.** Saneador `num()`, que acepta únicamente un número.
**Comprobado:** `1s;background:url(...)` se convierte en `1s`.

---

### 3.4 — El panel de administración es público · Informativo · Aceptado

`/admin` es accesible para cualquiera. Es una consecuencia inevitable de alojar
en GitHub Pages, que no admite autenticación.

**No es una vulnerabilidad**, porque el panel es inerte sin credenciales: la
autorización real la hace GitHub al recibir el token, no el panel. Sin un token
con permiso de escritura no se puede leer ni modificar nada. La página lleva
`noindex, nofollow`.

Lo que sí conviene tener presente: expone públicamente la estructura del
proyecto y el nombre del repositorio. Si eso molesta, la vía es servir `/admin`
desde la intranet o en local, cosa que funciona sin cambios porque el panel sólo
habla con `api.github.com`.

---

### 3.5 — Sin cabeceras de seguridad · Baja · Abierto

No hay `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` ni
`Permissions-Policy`. GitHub Pages **no permite configurar cabeceras**, así que
no es corregible mientras el alojamiento sea ese.

Una CSP habría sido una segunda barrera frente a los hallazgos 1 y 2: aunque el
payload se hubiera colado, `script-src 'self'` habría impedido su ejecución.

**Recomendación.** Al mover el sitio a los servidores de la empresa (algo ya
previsto), pedir a IT que sirva al menos:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data:;
  style-src 'self' 'unsafe-inline'; frame-src https://www.youtube.com;
  object-src 'none'; base-uri 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`'unsafe-inline'` en `style-src` es necesario por los atributos `style` que
genera el build (posición de los pines y velocidad del carrusel). Se podría
eliminar moviendo esos valores a clases o a un CSS generado, si IT lo exige.

---

### 3.6 — Token del editor en `localStorage` · Baja · Aceptado con matices

El token de GitHub se guarda en `localStorage` del navegador del editor.

**Por qué se aceptó:** sin backend no hay alternativa mejor. Una cookie
`HttpOnly` requeriría un servidor, que es justo lo que este montaje evita. El
token nunca viaja a otro sitio que no sea `api.github.com`, y es de tipo
*fine-grained*, acotado a un repositorio y a `Contents`.

**El matiz:** `localStorage` es legible por cualquier JavaScript del mismo
origen. Eso es exactamente lo que convertía el hallazgo 3.1 en una escalada de
privilegios. Corregido ese hallazgo, el riesgo vuelve a ser bajo, pero la
dependencia es estructural: **cualquier XSS futuro en el mismo origen del panel
implica el robo del token**.

**Recomendaciones prácticas:**
- Poner caducidad al token (un año como máximo).
- Revocarlo en GitHub cuando un editor deje de necesitarlo, y al cambiar de equipo.
- No reutilizar el mismo token entre varias personas: si hay que revocar, se revoca a una.

---

## 4. Comprobaciones realizadas sin hallazgos

| Comprobación | Resultado |
|---|---|
| Secretos, tokens o claves en el repositorio | Ninguno. El único positivo es el texto de ejemplo `github_pat_…` del formulario |
| `eval`, `new Function`, `document.write` | No se usan |
| `innerHTML` con datos del CMS | Sólo el hallazgo 3.1, ya corregido. El resto son cadenas fijas del propio panel |
| Enlaces externos sin `rel="noopener"` | Ninguno en las seis páginas |
| Secretos en el workflow de despliegue | Ninguno; sólo el `GITHUB_TOKEN` efímero de Actions |
| Permisos del workflow | `contents: write`, `pages: write`, `id-token: write`. El de escritura es necesario para devolver el HTML regenerado |
| Dependencias de terceros | Ninguna. Sin `package.json` ni `node_modules`: no hay riesgo de cadena de suministro por paquetes |
| JavaScript de terceros, analítica, cookies | Ninguno |
| Ruptura de atributos por comillas | No es posible: `esc()` escapa `"` y todos los atributos usan comilla doble |
| Fuga del bloque `<script type="application/json">` | Protegida: se escapan los `<` como `<` |
| Rutas de imagen dentro de `url()` en CSS | Se codifican con `encodeURI`, de modo que no pueden cerrar el paréntesis |
| Concurrencia al publicar | El panel commitea contra el SHA leído; si otro editor publicó antes, GitHub rechaza y el panel pide recargar en vez de pisar |

---

## 5. Limitaciones de esta revisión

Para que se valore con la cobertura que realmente tiene:

- **Revisión manual, sin herramientas automáticas.** No se ejecutó ningún SAST,
  ni escáner de dependencias (no aplica: no hay), ni análisis dinámico
  automatizado. Un escáner podría encontrar patrones que se hayan escapado.
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
   depende de la configuración del servidor.
2. **Revisar quién tiene acceso de escritura al repositorio** y exigir 2FA. Es
   el control que de verdad protege el contenido; todo lo demás asume que los
   editores son quienes dicen ser.
3. **Poner caducidad a los tokens** y revocarlos al rotar personas.
4. **Mantener la regla de saneado** al añadir campos nuevos: nunca `innerHTML`
   con contenido, `url()` en enlaces, `num()` en estilos. Está documentada en
   `ARCHITECTURE.md` §11.
5. **Considerar una protección de rama** sobre la rama de publicación, para que
   un token comprometido no pueda reescribir el historial.

---

*Revisión realizada sobre el estado del repositorio en la fecha del último
commit de este archivo. Las correcciones de §3.1, §3.2 y §3.3 se incluyen en ese
mismo commit.*
