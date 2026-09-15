# Atestacion de seguridad (controles runtime)

Los controles marcados `runtime` no se pueden verificar de forma fiable en el PR: requieren
prueba dinamica o revision humana. Rellena esta tabla, firma, y adjuntala como evidencia
requerida del **gate de despliegue** antes de promover a produccion.

- Entrega: `Obra Nueva Residencial (Savills) — sitio publico estatico`
- Version / commit: `ver commit de este archivo`
- Tipo: `estatica` (sin backend y sin panel de administracion)
- Responsable de la prueba: `<pendiente de firma>`
- Fecha: `<AAAA-MM-DD>`

Estado por control: **Certificado** (cumple) | **Activa** (hallazgo abierto) | **No aplica**

> **Por que esta tabla esta casi entera en «No aplica».** El repositorio incluia
> un gestor de contenidos propio en `/admin`, con autenticacion, sesion y subida
> de ficheros, y por eso se evaluaba contra el ambito `APP`. **Ese panel se ha
> retirado**: el contenido se edita tocando `content/*.json` y haciendo push. Sin
> backend, sin auth, sin sesion y sin entrada, el ambito `APP` deja de aplicar.
> Las dos filas que siguen certificadas lo estan a proposito: su control sigue
> teniendo sujeto real en el codigo que queda.

| ID       | Descripcion                                            | Estado | Evidencia / nota |
|----------|--------------------------------------------------------|--------|------------------|
| INFO-02  | No expone versiones de librerias; assets minificados   | Certificado | Sin librerias de terceros, luego no se expone version alguna. `build/lib/minify.mjs` genera `css/*.min.css` y `js/main.min.js` en cada build (styles 61->42 KB, main.js 18->11 KB) y el HTML referencia esas copias. |
| INFO-03  | Paginas de error genericas                             | No aplica | Ambito APP. Sin panel no hay aplicacion que emita errores; el 404 lo sirve GitHub Pages. |
| INFO-05  | Sin datos sensibles en HTML/JSON/logs                   | Certificado | Los comentarios del HTML son marcadores de seccion. `content/*.json` es material corporativo publico. |
| AUTH-01  | Mensajes de login genericos                            | No aplica | No hay login. |
| AUTH-02  | Bloqueo por intentos fallidos                          | No aplica | No hay nada contra lo que autenticarse. |
| AUTHZ-01 | Acceso por rol en servidor                             | No aplica | Sitio estatico publico: no hay recursos protegidos ni roles. Quien puede cambiarlo lo decide el control de acceso del repositorio (gobernanza, recomendacion R-6). |
| AUTHZ-02 | Autorizacion a nivel de objeto (IDOR)                  | No aplica | No hay identificadores de objeto ni recursos por usuario. |
| AUTHZ-03 | Denegar por defecto, verificacion en servidor          | No aplica | No hay servidor de aplicacion. |
| SESS-02  | Cookies sin informacion sensible en claro              | No aplica | El proyecto no usa cookies. |
| SESS-03  | Logout invalida la sesion                              | No aplica | No hay sesion ni logout. |
| SESS-04  | Timeout por inactividad                                | No aplica | No hay sesion que cerrar. El cierre por inactividad protegia el token del panel; ya no hay token ni panel. |
| SESS-05  | Regeneracion del ID de sesion tras login               | No aplica | No hay identificador de sesion. |
| INJ-01   | XSS almacenado (extremo a extremo)                     | Certificado | Ambito APP, pero se mantiene: `content/*.json` es contenido persistido que acaba en el HTML de todos los visitantes. Todo pasa por `build/lib/html.mjs` y no queda ni un `innerHTML` en el proyecto. Hallazgo original encontrado y corregido verificando el payload antes y despues. |
| INJ-04   | CSRF (token + SameSite)                                | No aplica | Sin endpoints propios con cambio de estado ni credencial ambiental. |
| INJ-06   | SSRF (allow-list de destinos)                          | No aplica | Sin servidor que emita peticiones salientes. El sitio no hace ni una llamada de red (`connect-src 'none'`). |
| INJ-07   | Subida de ficheros (tipo/extension/tamano/magic bytes) | No aplica | Ya no hay subida. La validacion por magic bytes vivia en el panel. Anadir una imagen es ahora un commit, revisable como cualquier otro cambio. |

Controles en estado **Activa** en esta tabla: `ninguno`

> Los cinco controles que siguen en **Activa** estan fuera de esta tabla y son
> todos de cabeceras HTTP, que GitHub Pages no permite configurar: INFO-01,
> HDR-01, HDR-03, HDR-04 (la mitad de `Permissions-Policy`) y HDR-05. HDR-02 y
> la otra mitad de HDR-04 si se entregan, por `<meta>`. Los cinco se cierran con
> la recomendacion R-1 del informe de cumplimiento. No son defectos del codigo.

Informe completo: [`compliance-report.md`](compliance-report.md)

Firma del responsable: ________________________
