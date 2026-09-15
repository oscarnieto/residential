# Informe de cumplimiento — Política de Seguridad de Aplicaciones

**Entrega:** Obra Nueva Residencial (Savills) — sitio público estático
**Repositorio:** `oscarnieto/residential`, rama `claude/clever-brahmagupta-abt3is`
**Tipo:** estática, sin backend y sin panel de administración
**Fuente de los controles:** `security/policy.yml` (v1)
**Fecha:** ver commit de este archivo

> **Cambio de ámbito respecto a la versión anterior.** El repositorio incluía un
> gestor de contenidos propio en `/admin`, y por eso se evaluaba contra los
> controles `APP`. **Ese panel se ha retirado.** El contenido se edita ahora
> tocando `content/*.json` y haciendo push. Con él desaparecen la autenticación,
> la sesión y la subida de ficheros, así que el ámbito `APP` deja de aplicar.
> Las cifras de este informe cambian por eso, no porque se haya relajado nada.

---

## 1. Ámbito aplicado

`policy.yml` define `APP` como «solo si hay backend/auth/sesión/entrada». Sin el
panel, la entrega es una web estática pura: no hay backend, ni autenticación, ni
estado de sesión, ni ningún punto donde un tercero introduzca datos. **Sólo
aplican los nueve controles de ámbito `TODO`.**

Se listan igualmente los **30 controles** de `policy.yml`, marcando `No aplica`
con su motivo uno por uno, no en bloque.

**Regla que se ha seguido al estrechar el ámbito:** un control que dejó de
aplicar *por definición* se marca `No aplica`, pero un control que sigue
teniendo sujeto real en el código que queda **se mantiene certificado aunque su
ámbito sea `APP`**. Bajarlo a `No aplica` porque «ya no hay app» sería maquillar
el informe. Afecta a INFO-04, INJ-01 e INJ-02: el contenido se sigue
interpolando en el HTML y el JavaScript se sigue publicando.

> **Discrepancia detectada en la plantilla:** su `README.md` habla de «los 27
> controles», pero `policy.yml` define 30 (6 INFO + 6 HDR + 3 AUTH + 3 AUTHZ +
> 5 SESS + 7 INJ). Conviene alinear ambos documentos.

---

## 2. Resumen

| Estado | Nº | Controles |
|---|---|---|
| **Certificado** | 7 | INFO-02, INFO-04, INFO-05, INFO-06, HDR-02, INJ-01, INJ-02 |
| **Activa** (hallazgo abierto) | 5 | INFO-01, HDR-01, HDR-03, HDR-04, HDR-05 |
| **No aplica** | 18 | INFO-03, HDR-06, AUTH-01…03, AUTHZ-01…03, SESS-01…05, INJ-03…07 |

**Los cinco `Activa` tienen una única causa raíz:** GitHub Pages no permite
configurar cabeceras HTTP. No son defectos del código, son un límite del
alojamiento, y se cierran de una vez con la migración a servidores propios
(recomendación **R-1**).

Movimientos respecto a la versión anterior, todos por la retirada del panel:

| Control | Antes | Ahora | Motivo |
|---|---|---|---|
| AUTHZ-01, AUTHZ-02, AUTHZ-03 | Certificado (delegado) | **No aplica** | No hay autorización que delegar: sin panel no hay credencial que presentar. |
| SESS-04 | Certificado | **No aplica** | No hay sesión. El cierre por inactividad se fue con el panel. |
| INJ-07 | Certificado | **No aplica** | No hay subida de ficheros. |
| INFO-03 | Certificado | **No aplica** | No hay aplicación que emita errores; los 404 los sirve GitHub Pages. |
| HDR-01 | Activa | Activa | Sigue abierto. El anti-enmarcado por script cubría sólo el panel y se ha ido con él. |

---

## 3. Detalle por control

### Divulgación de información

| ID | Estado | Evidencia |
|---|---|---|
| **INFO-01** · Ocultar huella del servidor | **Activa** | GitHub Pages emite `Server: GitHub.com` y no permite suprimirlo. No corregible en este alojamiento. |
| **INFO-02** · No exponer versiones de librerías; assets minificados | **Certificado** | No hay **ninguna** librería de terceros, así que no se expone versión alguna. Los assets se publican minificados: `build/lib/minify.mjs` genera `css/*.min.css` y `js/main.min.js` en cada build (`styles` 61 → 42 KB, `main.js` 18 → 11 KB) y el HTML referencia esas copias. Los fuentes se quedan en el repositorio, legibles: es minificado, no ofuscación. |
| **INFO-03** · Páginas de error genéricas | **No aplica** | Ámbito `APP`. Sin panel no hay aplicación que pueda emitir un error con detalle interno; el 404 lo sirve GitHub Pages y es el suyo, genérico. |
| **INFO-04** · Sin modo debug en producción | **Certificado** | Ámbito `APP`, pero se mantiene certificado: `js/main.js` se publica al navegador. Sin `debugger`, `console.debug` ni `console.trace`. Verificado por `check_sast.sh` con semgrep (regla `sin-depuracion-en-produccion`). |
| **INFO-05** · Sin datos sensibles en HTML/JSON/logs | **Certificado** | Los comentarios del HTML generado son sólo marcadores de sección (`<!-- ===== Hero ===== -->`). El contenido de `content/*.json` es material corporativo público. |
| **INFO-06** · Sin secretos en el código | **Certificado** | Verificado por `check_secrets.sh` y por revisión manual. Ya no queda ni el texto de ejemplo `github_pat_...`, que vivía en el formulario del panel. |

### Cabeceras y transporte

| ID | Estado | Evidencia |
|---|---|---|
| **HDR-01** · Anti-clickjacking | **Activa** | `X-Frame-Options` sólo existe como cabecera y `frame-ancestors` **se ignora** cuando la CSP llega por `<meta>`: no hay forma de cumplirlo desde un alojamiento estático. La mitigación por script que existía cubría sólo el panel y se ha retirado con él. |
| **HDR-02** · CSP restrictiva | **Certificado** | Entregada por `<meta http-equiv="Content-Security-Policy">` en las seis páginas (`build/partials/layout.mjs`). El navegador la aplica igual que si viniera en cabecera: `default-src 'self'`, `script-src 'self'`, `img-src`/`media-src`/`font-src 'self'`, `object-src`, `form-action`, `frame-src`, **`connect-src`** y **`base-uri`** en `'none'`. Las dos últimas estaban en `'self'` por la vista previa del panel y se han apretado al retirarlo. La única concesión que queda es `style-src 'unsafe-inline'`, porque el mapa y el carrusel llevan sus valores variables en atributos `style`, ya saneados con `num()`. |
| **HDR-03** · `X-Content-Type-Options: nosniff` | **Activa** | Sólo existe como cabecera; en `<meta>` se ignora. GitHub Pages no permite cabeceras. |
| **HDR-04** · `Referrer-Policy` y `Permissions-Policy` | **Activa** (parcial) | `Referrer-Policy` **sí** se entrega, con `<meta name="referrer" content="strict-origin-when-cross-origin">` en todas las páginas. `Permissions-Policy` no tiene forma `<meta>`, así que el control queda a medias. |
| **HDR-05** · HTTPS forzado y HSTS | **Activa** (parcial) | GitHub Pages **sí** fuerza HTTPS y redirige, pero **no** emite `Strict-Transport-Security`. (`github.io` figura en la lista de precarga HSTS de los navegadores, lo que en la práctica ya impide el primer salto en claro; **no se ha podido verificar** desde este entorno, cuyo proxy bloquea `hstspreload.org`, así que no se cuenta como evidencia.) |
| **HDR-06** · CORS restrictivo | **No aplica** | El proyecto no expone ninguna API y ya no consume ninguna. Se conserva la regla de semgrep `cors-abierto` por si algún día se añade una cabecera. |

> Cabeceras propuestas para cuando el sitio se sirva desde infraestructura
> propia: ver `SECURITY.md` §3.5. Cierran HDR-01, HDR-03, HDR-04, HDR-05 e
> INFO-01 de una vez, y convierten la CSP de `<meta>` en cabecera.

### Autenticación

| ID | Estado | Evidencia |
|---|---|---|
| **AUTH-01** · Mensajes de login genéricos | **No aplica** | No hay login. |
| **AUTH-02** · Bloqueo por intentos fallidos | **No aplica** | No hay nada contra lo que autenticarse. |
| **AUTH-03** · Hashing fuerte de contraseñas | **No aplica** | No se almacena ninguna contraseña. |

### Autorización

| ID | Estado | Evidencia |
|---|---|---|
| **AUTHZ-01** · Acceso por rol comprobado en servidor | **No aplica** | La entrega es un sitio estático público: no hay recursos protegidos ni roles. Quién puede **cambiarlo** lo decide el control de acceso del repositorio en GitHub, que es gobernanza, no código de la aplicación (recomendación R-6). |
| **AUTHZ-02** · Autorización a nivel de objeto (IDOR) | **No aplica** | No hay identificadores de objeto ni recursos por usuario. |
| **AUTHZ-03** · Denegar por defecto, verificación en servidor | **No aplica** | No hay servidor de aplicación que verifique nada. |

### Sesiones

| ID | Estado | Evidencia |
|---|---|---|
| **SESS-01** · Cookies Secure/HttpOnly/SameSite | **No aplica** | El proyecto **no usa cookies**. |
| **SESS-02** · Cookies sin datos sensibles en claro | **No aplica** | Ídem: no hay cookies. |
| **SESS-03** · Logout invalida la sesión en servidor | **No aplica** | No hay sesión ni logout. |
| **SESS-04** · Cierre por inactividad (ref. 15 min) | **No aplica** | No hay sesión que cerrar. El cierre por inactividad que se implementó protegía el token del panel; ya no hay token ni panel. |
| **SESS-05** · Regeneración del ID de sesión tras login | **No aplica** | No hay identificador de sesión. |

### Validación de entrada e inyección

| ID | Estado | Evidencia |
|---|---|---|
| **INJ-01** · XSS almacenado | **Certificado** | Ámbito `APP`, pero se mantiene certificado: `content/*.json` es contenido persistido que acaba en el HTML de todos los visitantes. Todo pasa por `build/lib/html.mjs`, y no queda ni un `innerHTML` en el proyecto. Cubierto por la regla de semgrep `sin-html-crudo-en-el-dom`. |
| **INJ-02** · XSS reflejado/DOM, codificación contextual | **Certificado** | Ídem. Tres saneadores según el contexto de destino: `esc()`/`inline()` para texto, `url()` para `href`/`src`, `num()` para `style`. Verificado en su día ejecutando los payloads. Cubierto por `url-en-atributo-sin-sanear` y `style-en-atributo-sin-sanear`. |
| **INJ-03** · SQLi | **No aplica** | No hay base de datos ni consultas. |
| **INJ-04** · CSRF | **No aplica** | No hay endpoints propios que cambien estado, ni credencial ambiental. |
| **INJ-05** · Inyección de comandos | **No aplica** | El código publicado no ejecuta comandos del sistema. El build corre en CI pero no recibe entrada externa: lee JSON del propio repositorio. |
| **INJ-06** · SSRF | **No aplica** | No hay servidor que emita peticiones salientes. El sitio publicado no hace ni una llamada de red (`connect-src 'none'`). |
| **INJ-07** · Subida de ficheros | **No aplica** | Ya no hay subida. La validación por *magic bytes* que se implementó vivía en el panel. Añadir imágenes es ahora un commit al repositorio, revisable como cualquier otro cambio. |

---

## 4. Lo que el gate automático ve, y lo que no

**Lo que ve.** `security/.semgrep.yml` mantiene reglas para la clase de riesgo
real de este proyecto, y todas siguen teniendo sujeto tras la retirada del panel:

| Regla | Qué para |
|---|---|
| `sin-html-crudo-en-el-dom` | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`. |
| `sin-ejecucion-de-cadenas` | `eval`, `new Function`, `setTimeout("…")`. |
| `url-en-atributo-sin-sanear` | Interpolar en `href`/`src` sin pasar por `url()`. `esc()` no basta: `javascript:` no lleva comillas ni ángulos. |
| `style-en-atributo-sin-sanear` | Interpolar en un atributo `style` sin `num()`. |
| `sin-depuracion-en-produccion` | `debugger`, `console.debug`, `console.trace`. |
| `cors-abierto` | Cabecera de CORS con comodín. |

**Lo que no ve.**

1. **El texto interpolado en las plantillas.** Un patrón genérico no distingue
   `${dots}` (un fragmento ya compuesto) de `${step.title}` (un campo sin
   escapar). Ese control se sostiene por diseño —los renderizadores sólo emiten
   contenido vía `esc()` o `inline()`— y por revisión. **No está automatizado.**
2. **Las cabeceras.** `check_headers.sh` da SKIP porque no hay `PREVIEW_URL`:
   este sitio es estático y no publica preview. Ejecutado contra el sitio real
   fallaría HDR-01, HDR-03, HDR-04 y HDR-05, que es exactamente lo que dice el
   §3. Desde la corrección del fallo de red, un SKIP ya no puede confundirse con
   un OK falso.

**Y el límite de gobernanza, que no ha cambiado:** el workflow sólo se dispara
en *pull request*, y aquí se hace push directo a la rama. Sin **protección de
rama** con el gate como *check* requerido, esto es un aviso, no una barrera
(**R-3**). Con el panel retirado importa más que antes: publicar contenido es
ahora exactamente lo mismo que publicar código.

---

## 5. Piezas de la plantilla que faltan en el repositorio

El subidor web de GitHub («Add files via upload») **ignora archivos y carpetas
que empiezan por punto**. Por eso falta esto:

| Pieza | Estado |
|---|---|
| `.claude/skills/seguridad-aplicaciones/SKILL.md` | **Sigue faltando.** Comprobado en el commit `58ecfd1`, que intentaba subirla: sólo llegaron `CLAUDE.md`, `README.md` y `security/attestation.md`. Hay que subirlo con `git push`. |
| `.claude/settings.json` (hooks) | **Sigue faltando.** No se ejecutan los checks rápidos al editar. (El `.claude/settings.json` que hay en el repositorio es la configuración del proyecto, no los hooks de la plantilla.) |
| `security/.semgrep.yml` | Añadido, con reglas propias del proyecto. |
| `.github/workflows/security-gate.yml` | Añadido, replicando `azure-pipelines.yml`. |
| `README.md` de la plantilla | Llegó en `58ecfd1` a la **raíz**, donde sobrescribió el README de la web. Se devolvió el README del proyecto a su sitio y la plantilla se conserva en [`PLANTILLA.md`](PLANTILLA.md). |

---

## 6. Recomendaciones

| # | Recomendación | Estado | Cierra |
|---|---|---|---|
| **R-1** | Al migrar a servidores propios, configurar las cabeceras de `SECURITY.md` §3.5, y pasar la CSP de `<meta>` a cabecera añadiéndole `frame-ancestors 'none'`. | Pendiente (depende del alojamiento) | INFO-01, HDR-01, HDR-03, HDR-04, HDR-05 |
| **R-3** | **Activar la protección de rama** con el gate como *check requerido*. | **Pendiente — es lo único que convierte el gate en barrera** | Gobernanza |
| **R-5** | Subir las piezas con punto de la plantilla mediante `git push`. | Pendiente (`SKILL.md` y los hooks) | §5 |
| **R-6** | Revisar quién tiene acceso de escritura al repositorio y exigir 2FA. Con el panel retirado es **el único** control de acceso que queda sobre el contenido. | Pendiente | Gobernanza |
| **R-7** | Alinear el recuento de controles entre el `README.md` de la plantilla (27) y `policy.yml` (30). | Pendiente | Higiene de la plantilla |
| **R-8** | Llevar al repositorio de la plantilla las dos correcciones locales: el fallo de red en `check_headers.sh` y las reglas de semgrep para front-end. | Pendiente | Higiene de la plantilla |

*(R-2 y R-4 de la versión anterior se han retirado: la primera trataba de la
caducidad de los tokens del panel, que ya no existen; la segunda pedía el
`.semgrep.yml`, que está hecho.)*

---

## 7. Cómo reproducir esta verificación

```bash
# Gate completo (secretos + SAST + cabeceras)
bash security/checks/run_all.sh

# Con semgrep instalado el SAST pasa a ser autoritativo:
pip install semgrep && bash security/checks/run_all.sh

# El check de cabeceras no aprueba una respuesta vacía:
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
