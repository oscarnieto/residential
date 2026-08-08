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
| INFO-02  | No expone versiones de librerias; assets minificados   | Certificado | Sin librerias de terceros, luego no se expone version alguna. Los assets se publican minificados: `build/lib/minify.mjs` genera `css/*.min.css` y `js/main.min.js` en cada build (styles 61->42 KB, main.js 18->11 KB). Verificado comparando 24 capturas de las seis paginas antes y despues: identicas byte a byte. |
| INFO-03  | Paginas de error genericas                             | Certificado | Mensajes propios y controlados en el panel (`explainLoadFailure`, `toast`). Sin servidor que emita trazas. |
| INFO-05  | Sin datos sensibles en HTML/JSON/logs                   | Certificado | Los comentarios del HTML son marcadores de seccion. `content/*.json` es material corporativo publico. |
| AUTH-01  | Mensajes de login genericos                            | No aplica | No hay login propio con usuarios; se valida un token contra GitHub. |
| AUTH-02  | Bloqueo por intentos fallidos                          | No aplica | Delegado a GitHub, que limita su propia API. |
| AUTHZ-01 | Acceso por rol en servidor                             | Certificado | Delegado a GitHub. `github.js::verify()` exige `permissions.push` y rechaza si falta. El panel es inerte sin credencial. |
| AUTHZ-02 | Autorizacion a nivel de objeto (IDOR)                  | Certificado | Sin identificadores propios. El token fine-grained esta acotado a un unico repositorio. |
| AUTHZ-03 | Denegar por defecto, verificacion en servidor          | Certificado | Toda operacion pasa por la API de GitHub, que deniega por defecto. |
| SESS-02  | Cookies sin datos sensibles en claro                   | No aplica | El proyecto no usa cookies. |
| SESS-03  | Logout invalida la sesion                              | No aplica | «Cerrar sesion» borra el token del navegador; revocarlo es una accion en GitHub, fuera del alcance de la aplicacion. Documentado en `CMS.md`. |
| SESS-04  | Timeout por inactividad                                | Certificado | Implementado: 15 minutos sin `pointerdown` ni `keydown` y el token se borra de `localStorage` y de memoria (`admin/js/app.js`, `lockSession`). El panel queda `inert` tras una capa que pide el token otra vez; los cambios sin publicar se conservan en memoria. Verificado en navegador (8 comprobaciones): salta la capa, el token desaparece de `localStorage`, el cambio pendiente sigue ahi al reanudar, y al recargar con la marca caducada ni se intenta usar el token. |
| SESS-05  | Regeneracion del ID de sesion tras login               | No aplica | No hay identificador de sesion; la credencial es el propio token. |
| INJ-01   | XSS almacenado (extremo a extremo)                     | Certificado | Hallazgo encontrado y corregido en esta revision (`innerHTML` en el circulo de Servicios). Verificado ejecutando el payload antes y despues. Todo el contenido pasa por `build/lib/html.mjs`. |
| INJ-04   | CSRF (token + SameSite)                                | No aplica | Sin endpoints propios con cambio de estado. Las llamadas a GitHub usan token en cabecera, no una credencial ambiental. |
| INJ-06   | SSRF (allow-list de destinos)                          | No aplica | Sin servidor que emita peticiones salientes. |
| INJ-07   | Subida de ficheros (tipo/extension/tamano/magic bytes) | Certificado | Hallazgo corregido en esta revision. Se validan magic bytes contra la extension, tamano (12 MB) y, en SVG, ausencia de codigo ejecutable. Verificado con 10 casos: acepta JPEG/PNG/SVG legitimos; rechaza renombrados, HTML disfrazado y SVG con `<script>`, `on…=` o `<foreignObject>`. |

Controles en estado **Activa** en esta tabla: `ninguno`

> Los cinco controles que siguen en **Activa** estan fuera de esta tabla y son
> todos de cabeceras HTTP, que GitHub Pages no permite configurar: INFO-01,
> HDR-01, HDR-03, HDR-04 (la mitad de `Permissions-Policy`) y HDR-05. HDR-02 y
> la otra mitad de HDR-04 si se entregan, por `<meta>`. Los cinco se cierran con
> la recomendacion R-1 del informe de cumplimiento. No son defectos del codigo.

Informe completo: [`compliance-report.md`](compliance-report.md)

Firma del responsable: ________________________
