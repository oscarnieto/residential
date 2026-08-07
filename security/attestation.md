# Atestacion de seguridad (controles runtime)

Los controles marcados `runtime` no se pueden verificar de forma fiable en el PR: requieren
prueba dinamica o revision humana. Rellena esta tabla, firma, y adjuntala como evidencia
requerida del **gate de despliegue** antes de promover a produccion.

- Entrega: `<nombre>`
- Version / commit: `<sha>`
- Tipo: `estatica | con backend`
- Responsable de la prueba: `<nombre>`
- Fecha: `<AAAA-MM-DD>`

Estado por control: **Certificado** (cumple) | **Activa** (hallazgo abierto) | **No aplica**

| ID       | Descripcion                                            | Estado | Evidencia / nota |
|----------|--------------------------------------------------------|--------|------------------|
| INFO-02  | No expone versiones de librerias; assets minificados   |        |                  |
| INFO-03  | Paginas de error genericas                             |        |                  |
| INFO-05  | Sin datos sensibles en HTML/JSON/logs                  |        |                  |
| AUTH-01  | Mensajes de login genericos                            |        |                  |
| AUTH-02  | Bloqueo por intentos fallidos                          |        |                  |
| AUTHZ-01 | Acceso por rol en servidor                             |        |                  |
| AUTHZ-02 | Autorizacion a nivel de objeto (IDOR)                  |        |                  |
| AUTHZ-03 | Denegar por defecto, verificacion en servidor          |        |                  |
| SESS-02  | Cookies sin datos sensibles en claro                   |        |                  |
| SESS-03  | Logout invalida la sesion                              |        |                  |
| SESS-04  | Timeout por inactividad                                |        |                  |
| SESS-05  | Regeneracion del ID de sesion tras login               |        |                  |
| INJ-01   | XSS almacenado (extremo a extremo)                     |        |                  |
| INJ-04   | CSRF (token + SameSite)                                |        |                  |
| INJ-06   | SSRF (allow-list de destinos)                          |        |                  |
| INJ-07   | Subida de ficheros (tipo/extension/tamano/magic bytes) |        |                  |

Controles en estado **Activa**: `<lista o "ninguno">`

Firma del responsable: ________________________
