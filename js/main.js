/* ==========================================================================
   Residential New Developments — Savills
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
   * Topbar: fondo al hacer scroll
   * (El enlace activo se marca por página con .is-active en el HTML,
   *  no según el scroll.)
   * ------------------------------------------------------------------ */
  const topbar = document.getElementById('topbar');

  const onScroll = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
   * Menú móvil
   * ------------------------------------------------------------------ */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-menu__link');

  mobileLinks.forEach((link, i) => link.style.setProperty('--i', i));

  const toggleMenu = (open) => {
    burger.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () =>
    toggleMenu(!burger.classList.contains('is-open'))
  );
  mobileLinks.forEach((link) =>
    link.addEventListener('click', () => toggleMenu(false))
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(false);
  });

  /* ------------------------------------------------------------------
   * Animaciones de aparición con retardo escalonado por grupo
   * ------------------------------------------------------------------ */
  const revealables = document.querySelectorAll('.reveal');

  const groupIndex = new Map();
  revealables.forEach((el) => {
    const parent = el.parentElement;
    const index = (groupIndex.get(parent) ?? -1) + 1;
    groupIndex.set(parent, index);
    el.style.setProperty('--reveal-delay', `${Math.min(index * 90, 540)}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealables.forEach((el) => revealObserver.observe(el));

  /* ------------------------------------------------------------------
   * Contadores animados (+42.000, +700, +£2,3MM…)
   * Respeta el formato original: prefijos, separador de miles y decimales.
   * ------------------------------------------------------------------ */
  const animateCounter = (el) => {
    const target = el.dataset.counter;
    const match = target.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!match) return;

    const [, prefix, rawNumber, suffix] = match;
    const isDecimal = /^\d+,\d+$/.test(rawNumber);
    const decimalDigits = isDecimal ? rawNumber.split(',')[1].length : 0;
    const numericValue = isDecimal
      ? parseFloat(rawNumber.replace(',', '.'))
      : parseInt(rawNumber.replace(/\./g, ''), 10);

    const format = (value) => {
      if (isDecimal) return value.toFixed(decimalDigits).replace('.', ',');
      return Math.round(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const duration = 1800;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = prefix + format(numericValue * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll('[data-counter]');

  if (prefersReducedMotion) {
    counters.forEach((el) => (el.textContent = el.dataset.counter));
  } else {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ------------------------------------------------------------------
   * Vídeo: si se define data-video-url, el botón lo carga en un iframe
   * ------------------------------------------------------------------ */
  const video = document.querySelector('.video');
  if (video) {
    const playButton = video.querySelector('.video__play');
    playButton.addEventListener('click', () => {
      const url = video.dataset.videoUrl;
      if (!url) return; // sin vídeo configurado todavía

      const iframe = document.createElement('iframe');
      iframe.className = 'video__iframe';
      iframe.src = url;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.title = 'Vídeo de presentación';
      video.append(iframe);
      playButton.remove();
    });
  }

  /* ------------------------------------------------------------------
   * Vídeo de fondo del hero: oculto si no carga, pausado si el usuario
   * prefiere movimiento reducido (queda el poster estático)
   * ------------------------------------------------------------------ */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    if (prefersReducedMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else {
      // Forzamos la reproducción: el atributo `autoplay` no siempre basta,
      // sobre todo con vídeos algo más pesados o al volver a la pestaña.
      const playHero = () => {
        const promise = heroVideo.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => {
            // Si el navegador bloquea el autoplay, reintentamos en el primer
            // gesto del usuario (sigue viéndose el póster mientras tanto).
            const resume = () => heroVideo.play().catch(() => {});
            document.addEventListener('pointerdown', resume, { once: true });
            document.addEventListener('touchstart', resume, { once: true });
          });
        }
      };

      if (heroVideo.readyState >= 2) playHero();
      heroVideo.addEventListener('loadeddata', playHero, { once: true });
      heroVideo.addEventListener('canplay', playHero, { once: true });
      // Reanuda si el vídeo se pausa al cambiar de pestaña
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && heroVideo.paused) heroVideo.play().catch(() => {});
      });
    }

    // Solo ocultamos el vídeo si falla de verdad (queda el póster/imagen de
    // fondo, que es idéntico al primer frame). Escuchamos el error del propio
    // elemento, no del <source>, para no ocultarlo por hipos transitorios.
    heroVideo.addEventListener('error', () => heroVideo.classList.add('is-hidden'));
  }

  /* ------------------------------------------------------------------
   * Círculo de proceso interactivo (página Servicios)
   * ------------------------------------------------------------------ */
  const circle = document.querySelector('.circle');
  const circleData = document.getElementById('circle-data');
  if (circle && circleData) {
    let steps = [];
    try {
      steps = JSON.parse(circleData.textContent);
    } catch (_) {
      steps = [];
    }

    const dots = [...circle.querySelectorAll('.circle__dot')];
    const numEl = circle.querySelector('.circle__num');
    const titleEl = circle.querySelector('.circle__step-title');
    const descEl = circle.querySelector('.circle__step-desc');
    const center = circle.querySelector('.circle__center');

    dots.forEach((dot, i) => {
      const step = steps[i];
      if (step) dot.setAttribute('aria-label', `Paso ${i + 1}: ${step.title}`);
    });

    const showStep = (index) => {
      const step = steps[index];
      if (!step) return;

      dots.forEach((d, i) => {
        const active = i === index;
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-pressed', String(active));
      });

      // Transición suave del contenido central
      center.classList.add('is-changing');
      window.setTimeout(() => {
        numEl.textContent = String(index + 1).padStart(2, '0');
        titleEl.textContent = step.title;
        // Se construye con nodos en vez de innerHTML: el texto viene del
        // contenido editable y con innerHTML cualquier etiqueta que se
        // escribiera ahí se ejecutaría en la página publicada.
        const strong = document.createElement('strong');
        strong.textContent = step.strong;
        descEl.replaceChildren(strong, document.createTextNode(` ${step.rest}`));
        center.classList.remove('is-changing');
      }, prefersReducedMotion ? 0 : 200);
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => showStep(Number(dot.dataset.index)));
    });

    // Navegación con flechas del teclado entre pasos
    circle.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const current = dots.findIndex((d) => d.classList.contains('is-active'));
      const next =
        e.key === 'ArrowRight'
          ? (current + 1) % dots.length
          : (current - 1 + dots.length) % dots.length;
      dots[next].focus();
      showStep(next);
    });

    showStep(0);
  }

  /* ------------------------------------------------------------------
   * Barra de botones de Producto (pegada bajo la topbar)
   *  - El CSS la pega (sticky); aquí se mide lo que ocupa arriba junto con la
   *    topbar (`--producto-stack-h`, que usan las galerías ancladas y el
   *    margen de las anclas) y se marca el botón de la sección actual.
   *  - «Sección actual» es la que cruza una línea justo bajo la barra. En la
   *    intro, las cifras y los logotipos no hay ninguna.
   * ------------------------------------------------------------------ */
  const stickyBar = document.querySelector('.producto-sticky');
  let stackHeight = 0;

  const topbarScrolledHeight = () =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-scrolled-h')) || 64;

  /** Alto que ocupan arriba la topbar y la barra pegada, en px. 0 si no hay barra. */
  const measureStack = () => {
    stackHeight = stickyBar ? topbarScrolledHeight() + stickyBar.offsetHeight : 0;
    if (stickyBar) document.documentElement.style.setProperty('--producto-stack-h', stackHeight + 'px');
    return stackHeight;
  };

  const productoNav = stickyBar?.querySelector('.producto-nav');
  if (productoNav) {
    const links = [...productoNav.querySelectorAll('.producto-nav__link')];
    const sections = links.map((link) => document.getElementById(link.getAttribute('href').slice(1)));
    let current = -1;
    let navTicking = false;

    const setCurrent = (index) => {
      if (index === current) return;
      current = index;
      links.forEach((link, i) => {
        link.classList.toggle('is-current', i === index);
        if (i === index) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      // Con la barra en una sola fila con scroll (móvil), el activo se centra
      if (index >= 0 && productoNav.scrollWidth > productoNav.clientWidth) {
        const link = links[index];
        productoNav.scrollTo({
          left: link.offsetLeft - (productoNav.clientWidth - link.offsetWidth) / 2,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    };

    const updateNav = () => {
      navTicking = false;
      const line = stackHeight + 2;
      setCurrent(
        sections.findIndex((section) => {
          if (!section) return false;
          const r = section.getBoundingClientRect();
          return r.top <= line && r.bottom > line;
        })
      );
    };
    const requestNavTick = () => {
      if (navTicking) return;
      navTicking = true;
      requestAnimationFrame(updateNav);
    };
    const remeasureNav = () => {
      measureStack();
      requestNavTick();
    };

    window.addEventListener('scroll', requestNavTick, { passive: true });
    window.addEventListener('resize', remeasureNav);
    window.addEventListener('load', remeasureNav);
    document.fonts?.ready.then(remeasureNav);
    remeasureNav();
  }

  /* ------------------------------------------------------------------
   * Galería horizontal anclada (página Track Record)
   *  - Desktop: la sección se ancla (sticky) y el scroll vertical se
   *    traduce en avance horizontal; la tarjeta central crece y las de
   *    los extremos se reducen.
   *  - Móvil / reduced-motion: carrusel de swipe nativo (lo maneja el CSS)
   *    con el mismo efecto de foco.
   * ------------------------------------------------------------------ */
  const galleries = [...document.querySelectorAll('.track-gallery')];
  if (galleries.length) {
    const desktopMQ = window.matchMedia('(min-width: 768px)');
    const isPinned = () => desktopMQ.matches && !prefersReducedMotion;
    let ticking = false;

    const setup = (gallery) => {
      const track = gallery.querySelector('.track-gallery__track');
      const sticky = gallery.querySelector('.track-gallery__sticky');
      const products = [...gallery.querySelectorAll('.track-product')];
      let maxTravel = 0;

      // distancia entre el centro del primer y del último producto
      // (con offsetLeft/offsetWidth, que no se ven afectados por el `scale`)
      const travelDistance = () => {
        if (products.length < 2) return 0;
        const c = (el) => el.offsetLeft + el.offsetWidth / 2;
        return Math.max(0, c(products[products.length - 1]) - c(products[0]));
      };

      // Sólo la galería del último bloque: el hueco vacío bajo su última tarjeta
      // se resta del espacio hasta el carrusel de logotipos (ver `--gallery-dead`)
      const isLastBlock = !!gallery.closest('.producto-body > .track:last-child');

      /**
       * Espacio vacío entre la última tarjeta y el borde inferior de la galería.
       * Anclada, la tarjeta queda centrada en la zona anclada, y la central crece
       * un 8 % desde su centro; sin anclaje, es el relleno de la zona y del track.
       */
      const deadSpace = () => {
        if (isPinned()) {
          const card = track.offsetHeight;
          return (sticky.offsetHeight - card) / 2 - card * 0.04;
        }
        const pad = (el) => parseFloat(getComputedStyle(el).paddingBottom) || 0;
        return pad(sticky) + pad(track);
      };

      const layout = () => {
        if (isPinned()) {
          measureStack(); // la zona anclada empieza bajo la topbar y la barra de botones
          maxTravel = travelDistance();
          gallery.style.height = sticky.offsetHeight + maxTravel + 'px';
        } else {
          gallery.style.height = '';
          track.style.transform = '';
        }
        if (isLastBlock) gallery.style.setProperty('--gallery-dead', deadSpace().toFixed(1) + 'px');
      };

      // Escala/opacidad según la distancia de cada tarjeta al centro
      const focus = () => {
        const mid = window.innerWidth / 2;
        products.forEach((p) => {
          const r = p.getBoundingClientRect();
          const center = r.left + r.width / 2;
          const d = Math.min(1, Math.abs(center - mid) / (window.innerWidth * 0.5));
          const eased = d * d;
          const scale = 1.08 - eased * 0.5; // centro 1.08 → extremos ~0.58
          const opacity = 1 - eased * 0.6;
          p.style.setProperty('--s', scale.toFixed(3));
          p.style.setProperty('--o', opacity.toFixed(3));
        });
      };

      const onScroll = () => {
        if (!isPinned()) return; // en móvil el foco lo da la animación CSS
        // El anclaje empieza cuando la galería llega bajo la barra, no al borde de la ventana
        const top = gallery.getBoundingClientRect().top - stackHeight;
        const travelled = Math.min(Math.max(-top, 0), maxTravel);
        track.style.transform = `translate3d(${-travelled}px, 0, 0)`;
        focus();
      };

      return { layout, onScroll };
    };

    const instances = galleries.map(setup);

    const onScrollAll = () => {
      instances.forEach((i) => i.onScroll());
      ticking = false;
    };
    const requestTick = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScrollAll);
    };
    const relayout = () => {
      instances.forEach((i) => i.layout());
      requestTick();
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', relayout);
    window.addEventListener('load', relayout);
    relayout();
  }

  /* ------------------------------------------------------------------
   * Carrusel de logotipos (página Producto)
   *  - Cada fila es un carrusel independiente y las filas alternan de
   *    sentido (`data-direction`): `right` avanza hacia la derecha, `left`
   *    hacia la izquierda.
   *  - Avanza solo, en bucle continuo.
   *  - Se puede arrastrar con el ratón o el dedo, y al soltar retoma la
   *    marcha desde donde se ha quedado, conservando el impulso. Arrastrar
   *    una fila no mueve la otra.
   *
   * El desplazamiento lo lleva JS y no la animación CSS porque ambos
   * escriben el mismo `transform`: una animación en curso gana a cualquier
   * valor en línea, así que no se puede arrastrar mientras esté activa. La
   * animación se queda en el CSS como respaldo para cuando este código no
   * llega a ejecutarse.
   * ------------------------------------------------------------------ */
  const initMarqueeRow = (viewport) => {
    const track = viewport.querySelector('.logo-marquee__track');
    const group = viewport.querySelector('.logo-marquee__group');

    // JS toma el control del transform
    track.style.animation = 'none';

    /**
     * El `offset` crece cuando el contenido avanza hacia la izquierda. Una fila
     * que avanza hacia la derecha lo hace decrecer: es lo único que cambia
     * entre sentidos, porque el signo va en la velocidad de crucero y todo lo
     * demás (convergencia, impulso al soltar, arrastre) ya es simétrico.
     */
    const sign = viewport.dataset.direction === 'right' ? -1 : 1;

    /** Ancho de un grupo: la distancia tras la que el bucle se repite. */
    let groupWidth = group.offsetWidth;

    /**
     * Ancho que ocuparían los logotipos del grupo sin estirarse: los que haya por
     * lo que mide cada uno más el hueco. Un grupo con pocos logotipos se reparte
     * hasta cubrir la ventana (`min-width` en el CSS) y mide más que eso.
     */
    const naturalWidth = () => {
      const items = group.children.length;
      const gap = parseFloat(getComputedStyle(group).columnGap) || 0;
      return items * ((group.firstElementChild?.offsetWidth ?? 0) + gap);
    };

    /**
     * Velocidad de crucero en px/s, con signo, derivada de la duración configurada.
     * La duración es «segundos por logotipo × logotipos», así que la velocidad es
     * el ancho natural entre esa duración: los logotipos pasan al mismo ritmo en
     * todas las filas, tengan 4 logotipos o 7. Con el ancho estirado, una fila
     * corta correría más que una larga.
     */
    const cruiseSpeed = () => {
      const declared = parseFloat(getComputedStyle(track).getPropertyValue('--marquee-duration')) || 45;
      return (sign * Math.min(groupWidth, naturalWidth() || groupWidth)) / declared;
    };

    let speed = cruiseSpeed();
    let offset = 0; // px recorridos, siempre dentro de [0, groupWidth)
    let velocity = speed;
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startOffset = 0;
    let lastX = 0;
    let lastTime = 0;
    let moved = 0;

    const apply = () => {
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };

    let previous = performance.now();
    const step = (now) => {
      const dt = Math.min((now - previous) / 1000, 0.1); // ignora saltos al volver a la pestaña
      previous = now;

      if (!dragging && !viewport.contains(document.activeElement)) {
        // La velocidad converge suavemente a la de crucero, de modo que el
        // impulso del arrastre se disuelve sin dar un tirón.
        velocity += (speed - velocity) * (1 - Math.pow(0.002, dt));
        offset += velocity * dt;
        if (groupWidth > 0) offset = ((offset % groupWidth) + groupWidth) % groupWidth;
        apply();
      }

      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    /* --- Arrastre --- */

    viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      dragging = true;
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startOffset = offset;
      lastTime = performance.now();
      moved = 0;
      velocity = 0;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(pointerId);
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      event.preventDefault();

      const dx = event.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      offset = startOffset - dx;
      if (groupWidth > 0) offset = ((offset % groupWidth) + groupWidth) % groupWidth;
      apply();

      // Velocidad instantánea, para el impulso al soltar
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      if (dt > 0) velocity = -(event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastTime = now;
    });

    const endDrag = (event) => {
      if (!dragging || (event && event.pointerId !== pointerId)) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      // Un impulso desmedido daría un salto; se acota a algo creíble
      velocity = Math.max(-4000, Math.min(4000, velocity));
      previous = performance.now();
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // Tras arrastrar no debe abrirse el enlace del logotipo que quede debajo
    viewport.addEventListener(
      'click',
      (event) => {
        if (moved > 6) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    window.addEventListener('resize', () => {
      groupWidth = group.offsetWidth;
      speed = cruiseSpeed();
      if (groupWidth > 0) offset = ((offset % groupWidth) + groupWidth) % groupWidth;
      apply();
    });

    // Las imágenes cambian el ancho del grupo al acabar de cargar
    window.addEventListener('load', () => {
      groupWidth = group.offsetWidth;
      speed = cruiseSpeed();
    });
  };

  if (!prefersReducedMotion) {
    document.querySelectorAll('.logo-marquee__viewport').forEach(initMarqueeRow);
  }

  /* ------------------------------------------------------------------
   * Volver arriba
   * ------------------------------------------------------------------ */
  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
})();
