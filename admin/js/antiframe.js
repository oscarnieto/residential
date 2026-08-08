/* ==========================================================================
   Anti-enmarcado (HDR-01)
   --------------------------------------------------------------------------
   El control pide `X-Frame-Options` o `frame-ancestors`. Ninguna de las dos
   tiene forma de <meta>: la primera sólo existe como cabecera HTTP y la segunda
   se ignora expresamente cuando la CSP llega por <meta>. GitHub Pages no deja
   configurar cabeceras, así que esto es lo único que queda.

   Es una barrera más débil que la cabecera y así queda declarado en
   security/compliance-report.md: HDR-01 sigue como hallazgo abierto. Sirve
   para el caso que importa aquí — que alguien enmarque el panel en su web y
   engañe a un editor para que publique con sus clics — y no para un atacante
   que controle el marco por completo.

   Se carga sin `type="module"` y antes que nada para que el panel no llegue a
   pintarse dentro del marco.
   ========================================================================== */

if (window.self !== window.top) {
  document.documentElement.textContent =
    'El gestor de contenidos no puede abrirse dentro de otra página. Ábrelo directamente.';
  document.documentElement.setAttribute(
    'style',
    'font:16px/1.5 system-ui,sans-serif;padding:24px;color:#111;background:#fff'
  );
  // Detiene el resto de la carga: sin esto app.js seguiría arrancando.
  window.stop?.();
}
