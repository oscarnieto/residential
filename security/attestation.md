# Atestacion de seguridad (controles runtime)

Los controles marcados `runtime` no se pueden verificar de forma fiable en el PR: requieren
prueba dinamica o revision humana. Rellena esta tabla, firma, y adjuntala como evidencia
requerida del **gate de despliegue** antes de promover a produccion.

- Entrega: `Obra Nueva Residencial (Savills) — sitio publico + gestor de contenidos`
- Version / commit: `ver commit de este archivo`
- Tipo: `estatica` (con panel de administracion sin servidor)
- Responsable de la prueba: `<pendiente de firma>`
- Fecha: `<AAAA-MM-DD>`

Estado por control: **Certificado** (cumple) | **Activa** (hallazgo abierto) | **No aplica**

| ID       | Descripcion                                            | Estado | Evidencia / nota |
|----------|--------------------------------------------------------|--------|------------------|
| INFO-02  | No expone versiones de librerias; assets minificados   | Activa | Sin librerias de terceros, luego no se expone version alguna. Los assets **no** estan minificados (styles.css 61 KB, main.js 18 KB): desviacion consciente, el proyecto no tiene paso de minificado. |
| INFO-03  | Paginas de error genericas                             | Certificado | Mensajes propios y controlados en el panel (`explainLoadFailure`, `toast`). Sin servidor que emita trazas. |
| INFO-05  | Sin datos sensibles en HTML/JSON/logs                   | Certificado | Los comentarios del HTML son marcadores de seccion. `content/*.json` es material corporativo publico. |
| AUTH-01  | Mensajes de login genericos                            | No aplica | No hay login propio con usuarios; se valida un token contra GitHub. |
| AUTH-02  | Bloqueo por intentos fallidos                          | No aplica | Delegado a GitHub, que limita su propia API. |
| AUTHZ-01 | Acceso por rol en servidor                             | Certificado | Delegado a GitHub. `github.js::verify()` exige `permissions.push` y rechaza si falta. El panel es inerte sin credencial. |
| AUTHZ-02 | Autorizacion a nivel de objeto (IDOR)                  | Certificado | Sin identificadores propios. El token fine-grained esta acotado a un unico repositorio. |
| AUTHZ-03 | Denegar por defecto, verificacion en servidor          | Certificado | Toda operacion pasa por la API de GitHub, que deniega por defecto. |
| SESS-02  | Cookies sin datos sensibles en claro                   | No aplica | El proyecto no usa cookies. |
| SESS-03  | Logout invalida la sesion                              | No aplica | «Cerrar sesion» borra el token del navegador; revocarlo es una accion en GitHub, fuera del alcance de la aplicacion. Documentado en `CMS.md`. |
| SESS-04  | Timeout por inactividad                                | **Activa** | **No implementado.** El token persiste en `localStorage` hasta cierre manual o caducidad en GitHub. Mitigacion vigente: caducidad al crear el token (recomendacion R-2). |
| SESS-05  | Regeneracion del ID de sesion tras login               | No aplica | No hay identificador de sesion; la credencial es el propio token. |
| INJ-01   | XSS almacenado (extremo a extremo)                     | Certificado | Hallazgo encontrado y corregido en esta revision (`innerHTML` en el circulo de Servicios). Verificado ejecutando el payload antes y despues. Todo el contenido pasa por `build/lib/html.mjs`. |
| INJ-04   | CSRF (token + SameSite)                                | No aplica | Sin endpoints propios con cambio de estado. Las llamadas a GitHub usan token en cabecera, no una credencial ambiental. |
| INJ-06   | SSRF (allow-list de destinos)                          | No aplica | Sin servidor que emita peticiones salientes. |
| INJ-07   | Subida de ficheros (tipo/extension/tamano/magic bytes) | Certificado | Hallazgo corregido en esta revision. Se validan magic bytes contra la extension, tamano (12 MB) y, en SVG, ausencia de codigo ejecutable. Verificado con 10 casos: acepta JPEG/PNG/SVG legitimos; rechaza renombrados, HTML disfrazado y SVG con `<script>`, `on…=` o `<foreignObject>`. |

Controles en estado **Activa**: `INFO-02, SESS-04`

> Fuera de esta tabla quedan otros seis controles en estado **Activa** por
> limitacion del alojamiento (GitHub Pages no permite cabeceras): INFO-01 y
> HDR-01 a HDR-05. Se cierran con la recomendacion R-1 del informe de
> cumplimiento. No son defectos del codigo.

Informe completo: [`compliance-report.md`](compliance-report.md)

Firma del responsable: ________________________
