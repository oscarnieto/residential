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
        descEl.innerHTML = `<strong>${step.strong}</strong> ${step.rest}`;
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
      const products = [...gallery.querySelectorAll('.track-product')];
      let maxTravel = 0;

      // distancia entre el centro del primer y del último producto
      // (con offsetLeft/offsetWidth, que no se ven afectados por el `scale`)
      const travelDistance = () => {
        if (products.length < 2) return 0;
        const c = (el) => el.offsetLeft + el.offsetWidth / 2;
        return Math.max(0, c(products[products.length - 1]) - c(products[0]));
      };

      const layout = () => {
        if (isPinned()) {
          maxTravel = travelDistance();
          gallery.style.height = window.innerHeight + maxTravel + 'px';
        } else {
          gallery.style.height = '';
          track.style.transform = '';
        }
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
        const top = gallery.getBoundingClientRect().top;
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
   *  - Avanza solo, en bucle continuo.
   *  - Se puede arrastrar con el ratón o el dedo, y al soltar retoma la
   *    marcha desde donde se ha quedado, conservando el impulso.
   *
   * El desplazamiento lo lleva JS y no la animación CSS porque ambos
   * escriben el mismo `transform`: una animación en curso gana a cualquier
   * valor en línea, así que no se puede arrastrar mientras esté activa. La
   * animación se queda en el CSS como respaldo para cuando este código no
   * llega a ejecutarse.
   * ------------------------------------------------------------------ */
  const marquee = document.querySelector('.logo-marquee');
  if (marquee && !prefersReducedMotion) {
    const track = marquee.querySelector('.logo-marquee__track');
    const group = marquee.querySelector('.logo-marquee__group');
    const viewport = marquee.querySelector('.logo-marquee__viewport');

    // JS toma el control del transform
    track.style.animation = 'none';

    /** Ancho de un grupo: la distancia tras la que el bucle se repite. */
    let groupWidth = group.offsetWidth;

    /** Velocidad de crucero en px/s, derivada de la duración configurada. */
    const cruiseSpeed = () => {
      const declared = parseFloat(getComputedStyle(track).getPropertyValue('--marquee-duration')) || 45;
      return groupWidth / declared;
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

      if (!dragging && !marquee.contains(document.activeElement)) {
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
      marquee.classList.add('is-dragging');
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
      marquee.classList.remove('is-dragging');
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
  }

  /* ------------------------------------------------------------------
   * Volver arriba
   * ------------------------------------------------------------------ */
  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
})();
