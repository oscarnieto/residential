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
| **Certificado** | 10 | INFO-04, INFO-05, INFO-06, INJ-01, INJ-02, INJ-07, AUTHZ-01, AUTHZ-02, AUTHZ-03, INFO-03 |
| **Activa** (hallazgo abierto) | 8 | INFO-01, INFO-02, HDR-01, HDR-02, HDR-03, HDR-04, HDR-05, SESS-04 |
| **No aplica** | 12 | HDR-06, AUTH-01, AUTH-02, AUTH-03, SESS-01, SESS-02, SESS-03, SESS-05, INJ-03, INJ-04, INJ-05, INJ-06 |

**Todos los `Activa` tienen la misma causa raíz**, salvo SESS-04: GitHub Pages no
permite configurar cabeceras HTTP. No son defectos del código, son un límite del
alojamiento, y se resuelven con la migración a servidores propios ya prevista.

---

## 3. Detalle por control

### Divulgación de información

| ID | Estado | Evidencia |
|---|---|---|
| **INFO-01** · Ocultar huella del servidor | **Activa** | GitHub Pages emite `Server: GitHub.com` y no permite suprimirlo. No corregible en este alojamiento. |
| **INFO-02** · No exponer versiones de librerías; assets minificados | **Activa** (parcial) | No hay **ninguna** librería de terceros, así que no se expone versión alguna. Pero los assets **no están minificados** (`styles.css` 61 KB, `main.js` 18 KB). Desviación consciente: el proyecto no tiene paso de minificado y prioriza legibilidad y trazabilidad del diff. |
| **INFO-03** · Páginas de error genéricas | **Certificado** | El panel muestra mensajes de error propios y controlados (`admin/js/app.js`, función `explainLoadFailure` y los `toast`), sin trazas ni detalles internos. No hay servidor que pueda emitir un stack trace. |
| **INFO-04** · Sin modo debug en producción | **Certificado** | Sin flags de debug ni `console.log` de diagnóstico en el código publicado. Verificado por `check_sast.sh`. |
| **INFO-05** · Sin datos sensibles en HTML/JSON/logs | **Certificado** | Los comentarios del HTML generado son sólo marcadores de sección (`<!-- ===== Hero ===== -->`). El contenido de `content/*.json` es material corporativo público. |
| **INFO-06** · Sin secretos en el código | **Certificado** | Verificado por `check_secrets.sh` y por revisión manual. La única coincidencia es el texto de ejemplo `github_pat_...` del campo del formulario. |

### Cabeceras y transporte

| ID | Estado | Evidencia |
|---|---|---|
| **HDR-01** · Anti-clickjacking | **Activa** | Sin `X-Frame-Options` ni `frame-ancestors`. GitHub Pages no permite cabeceras. |
| **HDR-02** · CSP restrictiva | **Activa** | Ídem. Es la más relevante: una CSP habría sido segunda barrera frente a los XSS del §4. |
| **HDR-03** · `X-Content-Type-Options: nosniff` | **Activa** | Ídem. |
| **HDR-04** · `Referrer-Policy` y `Permissions-Policy` | **Activa** | Ídem. |
| **HDR-05** · HTTPS forzado y HSTS | **Activa** (parcial) | GitHub Pages **sí** fuerza HTTPS y redirige, pero **no** emite `Strict-Transport-Security`. |
| **HDR-06** · CORS restrictivo | **No aplica** | El proyecto no expone ninguna API. El panel consume `api.github.com`, cuya política CORS la fija GitHub. |

> Cabeceras propuestas para cuando el sitio se sirva desde infraestructura
> propia: ver `SECURITY.md` §3.5. Cierran HDR-01…05 e INFO-01 de una vez.

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
| **SESS-04** · Cierre por inactividad (ref. 15 min) | **Activa** | **No implementado.** El token permanece en `localStorage` indefinidamente hasta que se pulsa «Cerrar sesión» o caduca en GitHub. Mitigación vigente: poner caducidad al token al crearlo. Ver recomendación R-2. |
| **SESS-05** · Regeneración del ID de sesión tras login | **No aplica** | No hay identificador de sesión que regenerar; la credencial es el propio token. |

### Validación de entrada e inyección

| ID | Estado | Evidencia |
|---|---|---|
| **INJ-01** · XSS almacenado | **Certificado** | Corregido en esta revisión. Ver §4. Todo el contenido pasa por `build/lib/html.mjs` antes de llegar al HTML. |
| **INJ-02** · XSS reflejado/DOM, codificación contextual | **Certificado** | Tres saneadores según el contexto de destino: `esc()`/`inline()` para texto, `url()` para `href`/`src`, `num()` para `style`. Verificado ejecutando los payloads. |
| **INJ-03** · SQLi | **No aplica** | No hay base de datos ni consultas. |
| **INJ-04** · CSRF | **No aplica** | No hay endpoints propios que cambien estado. Las peticiones a GitHub se autentican con un token en cabecera, **no** con una credencial ambiental como una cookie, así que una petición de origen cruzado no la llevaría. |
| **INJ-05** · Inyección de comandos | **No aplica** | El código publicado no ejecuta comandos del sistema. El build sí corre en CI, pero no recibe entrada externa: lee JSON del propio repositorio. |
| **INJ-06** · SSRF | **No aplica** | No hay servidor que emita peticiones salientes. |
| **INJ-07** · Subida de ficheros | **Certificado** | Corregido en esta revisión. Ver §4. Se valida **magic bytes** contra la extensión declarada, tamaño (12 MB) y, para SVG, ausencia de código ejecutable. |

---

## 4. Hallazgos corregidos durante esta revisión

Cuatro vías de inyección, todas verificadas **explotándolas** antes de corregir y
volviendo a comprobarlas después.

| Control | Hallazgo | Corrección |
|---|---|---|
| INJ-01 / INJ-02 | **XSS almacenado** en el círculo de Servicios: los pasos se pintaban con `innerHTML` desde texto del CMS. Un `<img src=x onerror=…>` ejecutaba código en la página publicada. | Construcción con nodos del DOM (`js/main.js`). |
| INJ-02 | **XSS mediante `javascript:`** en campos de enlace. Escapar no basta: el esquema no lleva comillas ni ángulos. Confirmado en el ancla del hero. | Saneador `url()` con lista blanca de esquemas. |
| INJ-02 | **Inyección de CSS** en atributos `style` (coordenadas del mapa, velocidad del carrusel). | Saneador `num()`. |
| **INJ-07** | **Subida de ficheros sin validar contenido.** Sólo se comprobaba extensión y tamaño, y se admitían SVG. Como el campo de imagen ofrece un enlace «Ver» que abre el archivo **en primer plano y en el mismo origen del panel**, un SVG con `<script>` habría ejecutado código con acceso al `localStorage` — es decir, al token de quien lo abriera. | Validación de magic bytes y rechazo de SVG con código ejecutable (`admin/js/util.js`, `validarArchivo`). |

Los tres primeros elevaban privilegios de un editor a otro por la misma vía: la
vista previa del panel renderiza el HTML en un iframe con `allow-same-origin`,
o sea en el origen de `/admin`, donde vive el token.

---

## 5. Lo que el gate automático **no** ve

Es el punto más importante de este informe para gobernanza.

**`security/checks/run_all.sh` da PASS sobre este repositorio, y ese PASS no
refleja el estado real de cumplimiento.** Dos motivos:

1. **`check_sast.sh` corre en modo *fallback*.** Faltan `semgrep` y
   `security/.semgrep.yml` (no llegaron al repositorio, ver §6). Sus patrones
   heurísticos buscan idioms de backend — `os.system`, `subprocess(shell=True)`,
   `child_process.exec`, `DEBUG=True`, `hashlib.md5` — y **ninguno detecta las
   cuatro vulnerabilidades reales del §4**, que son de front-end: `innerHTML`,
   esquemas `javascript:`, inyección en `style` y subida sin validar. El gate
   habría dado verde con las cuatro presentes.

2. **`check_headers.sh` se salta.** Sin `PREVIEW_URL` devuelve SKIP y no cuenta
   como fallo. Ejecutado contra el sitio real, fallaría HDR-01…05 e INFO-01.

**Conclusión:** para este proyecto el gate cubre hoy INFO-06 e INFO-04, y poco
más. Los ocho `Activa` los ha encontrado la revisión manual, no el gate.

---

## 6. Piezas de la plantilla que faltan en el repositorio

El subidor web de GitHub («Add files via upload») **ignora archivos y carpetas
que empiezan por punto**. Por eso falta todo esto, que el propio README de la
plantilla documenta como parte de ella:

| Pieza | Efecto de su ausencia |
|---|---|
| `.claude/skills/seguridad-aplicaciones/SKILL.md` | La guía de autoría segura no se aplica sola en las sesiones de Claude Code. Este informe se ha hecho con `policy.yml`, que la plantilla designa fuente única de verdad. |
| `.claude/settings.json` (hooks) | No se ejecutan los checks rápidos al editar; los problemas se ven más tarde. |
| `security/.semgrep.yml` | El SAST queda en heurístico, con el efecto descrito en §5. |
| `.github/workflows/security-gate.yml` | **Añadido en esta revisión**, replicando `azure-pipelines.yml`. |

Para subir los que faltan hay que usar `git push`, no el subidor web.

---

## 7. Recomendaciones

| # | Recomendación | Cierra |
|---|---|---|
| **R-1** | Al migrar a servidores propios, configurar las cabeceras de `SECURITY.md` §3.5. | INFO-01, HDR-01…05 |
| **R-2** | Poner caducidad a los tokens (máx. 1 año), uno por persona, y revocarlos al rotar equipo. | SESS-04 (mitigación) |
| **R-3** | **Activar la protección de rama** con el gate como *check requerido*. Hoy se hace push directo sin PR, así que el workflow casi nunca se dispara: la obligatoriedad la da la protección de rama, no el YAML. | Gobernanza |
| **R-4** | Añadir `security/.semgrep.yml` con reglas para la clase de riesgo real de este proyecto: `innerHTML` con datos de contenido, esquemas `javascript:` en `href`, interpolación en atributos `style`. Sin esto el gate seguirá ciego a lo que de verdad falla aquí. | §5, punto 1 |
| **R-5** | Subir las piezas con punto de la plantilla mediante `git push`. | §6 |
| **R-6** | Revisar quién tiene acceso de escritura al repositorio y exigir 2FA. Es el control que de verdad protege el contenido. | Gobernanza |
| **R-7** | Alinear el recuento de controles entre `README.md` (27) y `policy.yml` (30). | Higiene de la plantilla |

---

## 8. Cómo reproducir esta verificación

```bash
# Gate completo (secretos + SAST + cabeceras)
bash security/checks/run_all.sh

# Cabeceras contra el sitio real: mostrará los FAIL de HDR-01..05
bash security/checks/check_headers.sh https://oscarnieto.github.io/residential/

# Validación de subida de ficheros (INJ-07): 10 casos
# Ver el bloque de pruebas descrito en §4; acepta JPEG/PNG/SVG legítimos y
# rechaza renombrados, HTML disfrazado y SVG con script.
```

La revisión manual detallada, con el modelo de amenazas y la verificación
dinámica de cada hallazgo, está en [`SECURITY.md`](../SECURITY.md). Este informe
y aquél son complementarios: éste certifica contra la política corporativa,
aquél documenta la investigación.
