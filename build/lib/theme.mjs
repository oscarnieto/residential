/* ==========================================================================
   Tema CSS generado
   --------------------------------------------------------------------------
   Colores de marca e imágenes de fondo. Vive en un módulo propio y sin
   dependencias de Node para que lo usen tanto el build como la vista previa
   del panel de administración.
   ========================================================================== */

/**
 * @param site   contenido de content/site.json
 * @param pages  lista de { id, data } con el contenido de cada página
 * @param prefix prefijo para las rutas de las imágenes ('../' desde /css)
 */
export const renderTheme = (site, pages, prefix = '../') => {
  const theme = site.theme;
  const url = (path) => `url('${prefix}${path}')`;

  const heroVars = pages
    .map(({ id, data }) => `  --img-hero-${id}: ${url(data.hero.image)};`)
    .join('\n');

  const inicio = pages.find((page) => page.id === 'inicio')?.data;
  const equipo = pages.find((page) => page.id === 'equipo')?.data;

  const extra = [
    inicio ? `  --img-spain: ${url(inicio.spain.image)};` : '',
    equipo ? `  --img-team-earth: ${url(equipo.global.background)};` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `:root {
  /* Colores de marca */
  --navy: ${theme.navy};
  --navy-light: ${theme.navyLight};
  --navy-card: ${theme.navyCard};
  --navy-border: ${theme.navyBorder};
  --cream-light: ${theme.creamLight};
  --cream-dark: ${theme.creamDark};
  --yellow: ${theme.yellow};
  --red: ${theme.red};

  /* Imágenes de fondo */
${heroVars}
${extra}
}
`;
};
