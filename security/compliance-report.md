# Informe de cumplimiento — Política de Seguridad de Aplicaciones

**Entrega:** Obra Nueva Residencial (Savills) — sitio público + gestor de contenidos
**Repositorio:** `oscarnieto/residential`, rama `claude/clever-brahmagupta-abt3is`
**Tipo:** estática, con panel de administración sin servidor
**Fuente de los controles:** `security/policy.yml` (v1)
**Fecha:** ver commit de este archivo

---

## 1. Ámbito aplicado

`policy.yml` define `APP` como «solo si hay backend/auth/sesión/entrada».

- **La web pública** (6 páginas HTML estáticas) no tiene backend, autenticación,
  sesión ni entrada de datos → sólo aplican los controles de ámbito `TODO`.
- **El panel `/admin`** no tiene backend, pero **sí tiene autenticación** (token
  de GitHub), **sí guarda estado de sesión** (localStorage) y **sí recibe
  entrada** (textos y ficheros). Por tanto se evalúa contra los controles `APP`.

Se evalúan los **30 controles** de `policy.yml`. Los que no proceden se marcan
`No aplica` con su motivo, no en bloque.

> **Discrepancia detectada en la plantilla:** su `README.md` habla de «los 27
> controles», pero `policy.yml` define 30 (6 INFO + 6 HDR + 3 AUTH + 3 AUTHZ +
> 5 SESS + 7 INJ). Conviene alinear ambos documentos.

---

## 2. Resumen

| Estado | Nº | Controles |
|---|---|---|
| **Certificado** | 13 | INFO-02, INFO-03, INFO-04, INFO-05, INFO-06, HDR-02, AUTHZ-01, AUTHZ-02, AUTHZ-03, SESS-04, INJ-01, INJ-02, INJ-07 |
| **Activa** (hallazgo abierto) | 5 | INFO-01, HDR-01, HDR-03, HDR-04, HDR-05 |
| **No aplica** | 12 | HDR-06, AUTH-01, AUTH-02, AUTH-03, SESS-01, SESS-02, SESS-03, SESS-05, INJ-03, INJ-04, INJ-05, INJ-06 |

**Los cinco `Activa` tienen ya una única causa raíz:** GitHub Pages no permite
configurar cabeceras HTTP. No son defectos del código, son un límite del
alojamiento, y se cierran de una vez con la migración a servidores propios
(recomendación **R-1**). Todo lo que sí dependía del código está cerrado.

Cambios respecto a la primera versión de este informe, que dejaba ocho `Activa`:

| Control | Antes | Ahora | Qué se hizo |
|---|---|---|---|
| **SESS-04** | Activa | **Certificado** | Cierre de sesión por inactividad a los 15 min. |
| **HDR-02** | Activa | **Certificado** | CSP restrictiva entregada por `<meta http-equiv>`. |
| **INFO-02** | Activa | **Certificado** | Los assets se publican minificados. |
| **HDR-04** | Activa | Activa (menos) | `Referrer-Policy` sí se entrega; `Permissions-Policy` no tiene forma `<meta>`. |

---

## 3. Detalle por control

### Divulgación de información

| ID | Estado | Evidencia |
|---|---|---|
| **INFO-01** · Ocultar huella del servidor | **Activa** | GitHub Pages emite `Server: GitHub.com` y no permite suprimirlo. No corregible en este alojamiento. |
| **INFO-02** · No exponer versiones de librerías; assets minificados | **Certificado** | No hay **ninguna** librería de terceros, así que no se expone versión alguna. Los assets se publican minificados: `build/lib/minify.mjs` genera `css/*.min.css` y `js/main.min.js` en cada build (`styles` 61 → 42 KB, `main.js` 18 → 11 KB) y el HTML referencia esas copias. Los fuentes se quedan en el repositorio, legibles: es minificado, no ofuscación. |
| **INFO-03** · Páginas de error genéricas | **Certificado** | El panel muestra mensajes de error propios y controlados (`admin/js/app.js`, función `explainLoadFailure` y los `toast`), sin trazas ni detalles internos. No hay servidor que pueda emitir un stack trace. |
| **INFO-04** · Sin modo debug en producción | **Certificado** | Sin flags de debug ni rastros de diagnóstico en el código publicado. Verificado por `check_sast.sh` con semgrep (regla `sin-depuracion-en-produccion`). |
| **INFO-05** · Sin datos sensibles en HTML/JSON/logs | **Certificado** | Los comentarios del HTML generado son sólo marcadores de sección (`<!-- ===== Hero ===== -->`). El contenido de `content/*.json` es material corporativo público. |
| **INFO-06** · Sin secretos en el código | **Certificado** | Verificado por `check_secrets.sh` y por revisión manual. La única coincidencia es el texto de ejemplo `github_pat_...` del campo del formulario. |

### Cabeceras y transporte

| ID | Estado | Evidencia |
|---|---|---|
| **HDR-01** · Anti-clickjacking | **Activa** | `X-Frame-Options` sólo existe como cabecera y `frame-ancestors` **se ignora** cuando la CSP llega por `<meta>`: no hay forma de cumplirlo desde un alojamiento estático. Mitigación parcial en el panel: `admin/js/antiframe.js` se niega a pintarse dentro de un marco. Es más débil que la cabecera y por eso el control sigue abierto. |
| **HDR-02** · CSP restrictiva | **Certificado** | Entregada por `<meta http-equiv="Content-Security-Policy">` en las seis páginas (`build/partials/layout.mjs`) y en `/admin` (`admin/index.html`). El navegador la aplica igual que si viniera en cabecera. Base: `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `form-action 'none'`. `style-src` lleva `'unsafe-inline'` porque el mapa y el carrusel llevan valores variables en atributos `style` (ya saneados con `num()`) y sin servidor no hay forma de usar nonces. Queda pendiente pasarla a cabecera y añadirle `frame-ancestors` con R-1. |
| **HDR-03** · `X-Content-Type-Options: nosniff` | **Activa** | Sólo existe como cabecera; en `<meta>` se ignora. GitHub Pages no permite cabeceras. |
| **HDR-04** · `Referrer-Policy` y `Permissions-Policy` | **Activa** (parcial) | `Referrer-Policy` **sí** se entrega, con `<meta name="referrer" content="strict-origin-when-cross-origin">` en todas las páginas y en el panel. `Permissions-Policy` no tiene forma `<meta>`, así que el control queda a medias. |
| **HDR-05** · HTTPS forzado y HSTS | **Activa** (parcial) | GitHub Pages **sí** fuerza HTTPS y redirige, pero **no** emite `Strict-Transport-Security`. (`github.io` figura en la lista de precarga HSTS de los navegadores, lo que en la práctica ya impide el primer salto en claro; **no se ha podido verificar** desde este entorno, cuyo proxy bloquea `hstspreload.org`, así que no se cuenta como evidencia.) |
| **HDR-06** · CORS restrictivo | **No aplica** | El proyecto no expone ninguna API. El panel consume `api.github.com`, cuya política CORS la fija GitHub. Aun así hay regla de semgrep (`cors-abierto`) por si algún día se añade una cabecera. |

> Cabeceras propuestas para cuando el sitio se sirva desde infraestructura
> propia: ver `SECURITY.md` §3.5. Cierran HDR-01, HDR-03, HDR-04, HDR-05 e
> INFO-01 de una vez, y convierten la CSP de `<meta>` en cabecera.

### Autenticación

| ID | Estado | Evidencia |
|---|---|---|
| **AUTH-01** · Mensajes de login genéricos | **No aplica** | No hay login propio con usuarios. El panel valida un token contra GitHub; no hay identidades que enumerar. |
| **AUTH-02** · Bloqueo por intentos fallidos | **No aplica** | Delegado a GitHub, que aplica sus propios límites sobre la API. |
| **AUTH-03** · Hashing fuerte de contraseñas | **No aplica** | No se almacena ninguna contraseña. |

### Autorización

| ID | Estado | Evidencia |
|---|---|---|
| **AUTHZ-01** · Acceso por rol comprobado en servidor | **Certificado** (delegado) | La autorización real la hace **GitHub** al recibir el token, no el panel. El panel es inerte sin credenciales válidas: sin permiso de escritura no puede leer ni modificar nada. `admin/js/github.js`, método `verify()`, comprueba `permissions.push` y rechaza si falta. |
| **AUTHZ-02** · Autorización a nivel de objeto (IDOR) | **Certificado** (delegado) | No hay identificadores de objeto propios. El token *fine-grained* está acotado a un único repositorio; GitHub rechaza cualquier acceso fuera de él. |
| **AUTHZ-03** · Denegar por defecto, verificación en servidor | **Certificado** (delegado) | Toda operación pasa por la API de GitHub, que deniega por defecto. El panel no puede conceder nada por su cuenta. |

### Sesiones

| ID | Estado | Evidencia |
|---|---|---|
| **SESS-01** · Cookies Secure/HttpOnly/SameSite | **No aplica** | El proyecto **no usa cookies**. El token va en `localStorage` y viaja en la cabecera `Authorization`. |
| **SESS-02** · Cookies sin datos sensibles en claro | **No aplica** | Ídem: no hay cookies. |
| **SESS-03** · Logout invalida la sesión en servidor | **No aplica** | «Cerrar sesión» borra el token del navegador. **Revocarlo** en el servidor es una acción de GitHub (Settings → Tokens → Revoke), fuera del alcance de la aplicación. Documentado en `CMS.md`. |
| **SESS-04** · Cierre por inactividad (ref. 15 min) | **Certificado** | Implementado en `admin/js/app.js` (`lockSession`). A los 15 minutos sin `pointerdown` ni `keydown`, el token se borra de `localStorage` y de memoria, y el panel queda `inert` tras una capa que lo pide de nuevo. La marca de actividad vive en `localStorage`, así que sobrevive a una recarga y la comparten las pestañas. Los cambios sin publicar **no** se pierden: siguen en memoria y se continúa al reautenticarse. Verificado en navegador, ver §4. |
| **SESS-05** · Regeneración del ID de sesión tras login | **No aplica** | No hay identificador de sesión que regenerar; la credencial es el propio token. |

### Validación de entrada e inyección

| ID | Estado | Evidencia |
|---|---|---|
| **INJ-01** · XSS almacenado | **Certificado** | Corregido en la primera revisión. Todo el contenido pasa por `build/lib/html.mjs` antes de llegar al HTML, y ya no queda ni un `innerHTML` en el proyecto: `el()` de `admin/js/util.js` sólo escribe en `textContent`. Cubierto ahora por la regla de semgrep `sin-html-crudo-en-el-dom`. |
| **INJ-02** · XSS reflejado/DOM, codificación contextual | **Certificado** | Tres saneadores según el contexto de destino: `esc()`/`inline()` para texto, `url()` para `href`/`src`, `num()` para `style`. Verificado ejecutando los payloads. Cubierto por las reglas `url-en-atributo-sin-sanear` y `style-en-atributo-sin-sanear`. |
| **INJ-03** · SQLi | **No aplica** | No hay base de datos ni consultas. |
| **INJ-04** · CSRF | **No aplica** | No hay endpoints propios que cambien estado. Las peticiones a GitHub se autentican con un token en cabecera, **no** con una credencial ambiental como una cookie, así que una petición de origen cruzado no la llevaría. |
| **INJ-05** · Inyección de comandos | **No aplica** | El código publicado no ejecuta comandos del sistema. El build sí corre en CI, pero no recibe entrada externa: lee JSON del propio repositorio. |
| **INJ-06** · SSRF | **No aplica** | No hay servidor que emita peticiones salientes. |
| **INJ-07** · Subida de ficheros | **Certificado** | Corregido en la primera revisión. Se valida **magic bytes** contra la extensión declarada, tamaño (12 MB) y, para SVG, ausencia de código ejecutable. Reverificado tras los cambios de esta ronda. |

---

## 4. Hallazgos cerrados en esta segunda ronda

| Control | Estado anterior | Qué faltaba | Qué se ha hecho | Cómo se ha comprobado |
|---|---|---|---|---|
| **SESS-04** | Activa | El token vivía en `localStorage` indefinidamente. En un ordenador compartido o desatendido, cualquiera con acceso al navegador podía publicar. | Cierre por inactividad a los 15 min que **borra la credencial** y bloquea el panel, sin recargar la página para no tirar el trabajo sin publicar. | 8 comprobaciones en navegador real: salta la capa, el token desaparece de `localStorage`, el panel queda `inert`, el cambio pendiente sigue ahí al reanudar, y al recargar con la marca caducada ni se intenta usar el token. |
| **HDR-02** | Activa | Sin CSP. Era la segunda barrera que faltó frente a los XSS de la primera revisión. | CSP restrictiva por `<meta>` en las seis páginas y en el panel. | Las seis páginas y el panel cargan **sin una sola violación de CSP** en consola, y 24 capturas (seis páginas × cuatro alturas de scroll) salen **idénticas byte a byte** a las de antes del cambio. |
| **INFO-02** | Activa | Assets sin minificar. | `build/lib/minify.mjs`, sin dependencias y conservador: sólo quita comentarios y espacio en blanco, no renombra nada. −31 % en CSS, −38 % en JS. | Las mismas 24 capturas, idénticas; el JS minificado pasa `node --check`; el círculo de Servicios, el carrusel de logotipos y los pines del mapa siguen funcionando. |
| **HDR-04** | Activa | Ni `Referrer-Policy` ni `Permissions-Policy`. | `<meta name="referrer">` en todas las páginas. | Presente en el HTML generado. `Permissions-Policy` sigue sin ser posible: el control queda abierto. |
| **HDR-01** (sólo `/admin`) | Activa | El panel se podía enmarcar. | `admin/js/antiframe.js`. | Cargado dentro de un `<iframe>`, el panel se niega a pintarse. El control **sigue abierto** porque esto no equivale a la cabecera. |

### Defectos corregidos en el propio gate

| Dónde | Defecto | Corrección |
|---|---|---|
| `security/checks/check_headers.sh` | **Falso positivo de cumplimiento.** No comprobaba el código de salida de `curl`. Con el sitio inalcanzable imprimía seis FAIL engañosos y, peor, **`OK (INFO-01)`** — porque «las cabeceras que no deben aparecer» tampoco aparecen en una respuesta vacía. | Se comprueba el resultado de `curl` y que haya línea de estado HTTP; si no, FAIL con el motivo. Sin respuesta no hay veredicto. |
| `security/.semgrep.yml` | No existía, así que el SAST corría en modo heurístico y era ciego a la clase de riesgo de este proyecto (§5). | Añadido, con reglas propias. Ver §5. |

Ambas son modificaciones locales a la plantilla corporativa y **endurecen** el
control: conviene llevarlas al repositorio de la plantilla.

---

## 5. Lo que el gate automático ve, y lo que no

En la primera versión de este informe éste era el punto más grave: el gate daba
PASS sin haberlo ganado. Ha mejorado, pero conviene ser exactos.

**Lo que ahora sí ve.** `security/.semgrep.yml` añade reglas para la clase de
riesgo real de este proyecto, no para la de un backend:

| Regla | Qué para |
|---|---|
| `sin-html-crudo-en-el-dom` | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`. |
| `sin-ejecucion-de-cadenas` | `eval`, `new Function`, `setTimeout("…")`. |
| `url-en-atributo-sin-sanear` | Interpolar en `href`/`src` sin pasar por `url()`. `esc()` no basta: `javascript:` no lleva comillas ni ángulos. |
| `style-en-atributo-sin-sanear` | Interpolar en un atributo `style` sin `num()`. |
| `sin-depuracion-en-produccion` | `debugger`, `console.debug`, `console.trace`. |
| `cors-abierto` | Cabecera de CORS con comodín. |

Comprobado que **no son reglas decorativas**: reintroduciendo los cuatro fallos
de la primera revisión en un fichero de prueba, las reglas los marcan. Y las
tres coincidencias que salieron al estrenarlas sobre este repositorio se han
resuelto **cambiando el código**, sin una sola excepción:

- `admin/js/util.js` — se ha eliminado el soporte de HTML crudo en `el()`; los
  tres textos de ayuda del acceso se componen ahora con nodos.
- `admin/js/preview.js` — el `<base>` de la vista previa pasa por `url()`.
- La propia regla de CORS se marcaba a sí misma por el texto de su mensaje; se
  ha reescrito el mensaje.

**Lo que sigue sin ver.**

1. **El texto interpolado en las plantillas.** Un patrón genérico no distingue
   `${dots}` (un fragmento ya compuesto) de `${step.title}` (un campo del CMS
   sin escapar), y la única forma de intentarlo sería una lista de nombres
   permitidos que caducaría con el primer renombrado. Ese control se sostiene
   por diseño — los renderizadores sólo emiten contenido vía `esc()` o
   `inline()` — y por revisión. **No está automatizado.**
2. **Las cabeceras.** `check_headers.sh` sigue dando SKIP porque no hay
   `PREVIEW_URL`: este sitio es estático y no publica preview. Ejecutado contra
   el sitio real fallaría HDR-01, HDR-03, HDR-04 y HDR-05, que es exactamente lo
   que dice el §3. El SKIP ya no puede confundirse con un OK falso gracias a la
   corrección del §4.
3. **Todo lo `runtime`.** AUTHZ-\*, SESS-03/04/05, INJ-01 de extremo a extremo,
   CSRF, SSRF y subida de ficheros se verifican a mano y se firman en
   `attestation.md`. El gate lo recuerda al terminar, pero no lo comprueba.

**Y el límite de gobernanza, que no ha cambiado:** el workflow sólo se dispara
en *pull request*, y aquí se hace push directo a la rama. Sin **protección de
rama** con el gate como *check* requerido, esto es un aviso, no una barrera.
Es la recomendación **R-3** y depende de un ajuste en GitHub, no del código.

---

## 6. Piezas de la plantilla que faltan en el repositorio

El subidor web de GitHub («Add files via upload») **ignora archivos y carpetas
que empiezan por punto**. Por eso faltaba todo esto:

| Pieza | Estado |
|---|---|
| `.claude/skills/seguridad-aplicaciones/SKILL.md` | **Sigue faltando.** Comprobado en el commit `58ecfd1`, que intentaba subirla: sólo llegaron `CLAUDE.md`, `README.md` y `security/attestation.md`. La guía de autoría segura no se aplica sola en las sesiones de Claude Code. Este informe se ha hecho con `policy.yml`, que la plantilla designa fuente única de verdad. Hay que subirlo con `git push`. |
| `.claude/settings.json` (hooks) | **Sigue faltando.** No se ejecutan los checks rápidos al editar; los problemas se ven más tarde. (El `.claude/settings.json` que hay en el repositorio es la configuración del proyecto, no los hooks de la plantilla.) |
| `security/.semgrep.yml` | **Añadido en esta revisión**, con reglas propias del proyecto. Ver §5. |
| `.github/workflows/security-gate.yml` | **Añadido en la revisión anterior**, replicando `azure-pipelines.yml`. |
| `README.md` de la plantilla | Llegó en `58ecfd1` a la **raíz**, donde sobrescribió el README de la web. Se ha devuelto el README del proyecto a su sitio y la plantilla se conserva en [`PLANTILLA.md`](PLANTILLA.md), junto al resto de sus piezas. |

> **Efecto colateral del mismo commit:** `security/attestation.md` volvió a la
> versión en blanco de la plantilla, perdiendo la evidencia ya registrada. Se ha
> restaurado y actualizado. Merece la pena tenerlo presente: subir la plantilla
> por la interfaz web sobre un repositorio que ya la ha adoptado **pisa el
> trabajo hecho** y no trae las piezas con punto, que son las que de verdad
> faltan.

---

## 7. Recomendaciones

| # | Recomendación | Estado | Cierra |
|---|---|---|---|
| **R-1** | Al migrar a servidores propios, configurar las cabeceras de `SECURITY.md` §3.5, y pasar la CSP de `<meta>` a cabecera añadiéndole `frame-ancestors`. | Pendiente (depende del alojamiento) | INFO-01, HDR-01, HDR-03, HDR-04, HDR-05 |
| **R-2** | Poner caducidad a los tokens (máx. 1 año), uno por persona, y revocarlos al rotar equipo. | Recomendado igualmente | Refuerza SESS-04, ya certificado |
| **R-3** | **Activar la protección de rama** con el gate como *check requerido*. Hoy se hace push directo sin PR, así que el workflow casi nunca se dispara: la obligatoriedad la da la protección de rama, no el YAML. | **Pendiente — es lo único que convierte el gate en barrera** | Gobernanza |
| **R-4** | Añadir `security/.semgrep.yml` con reglas para la clase de riesgo real de este proyecto. | **Hecho** en esta revisión | §5, punto 1 |
| **R-5** | Subir las piezas con punto de la plantilla mediante `git push`. | Pendiente (`SKILL.md` y los hooks) | §6 |
| **R-6** | Revisar quién tiene acceso de escritura al repositorio y exigir 2FA. Es el control que de verdad protege el contenido. | Pendiente | Gobernanza |
| **R-7** | Alinear el recuento de controles entre el `README.md` de la plantilla (27) y `policy.yml` (30). | Pendiente | Higiene de la plantilla |
| **R-8** | Llevar al repositorio de la plantilla las dos correcciones del §4 (el fallo de red en `check_headers.sh` y las reglas de semgrep para front-end). | Pendiente | Higiene de la plantilla |

---

## 8. Cómo reproducir esta verificación

```bash
# Gate completo (secretos + SAST + cabeceras)
bash security/checks/run_all.sh

# Con semgrep instalado el SAST pasa a ser autoritativo:
pip install semgrep && bash security/checks/run_all.sh

# El check de cabeceras ya no aprueba una respuesta vacía:
bash security/checks/check_headers.sh https://ejemplo-inalcanzable.invalid   # FAIL con motivo

# Cabeceras contra el sitio real: mostrará los FAIL de HDR-01, 03, 04 y 05
bash security/checks/check_headers.sh https://oscarnieto.github.io/residential/

# Build: regenera los seis HTML, css/theme.css y los assets minificados
node build/build.mjs
```

La revisión manual detallada, con el modelo de amenazas y la verificación
dinámica de cada hallazgo, está en [`SECURITY.md`](../SECURITY.md). Este informe
y aquél son complementarios: éste certifica contra la política corporativa,
aquél documenta la investigación.
