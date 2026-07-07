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
    const numericValue = isDecimal
      ? parseFloat(rawNumber.replace(',', '.'))
      : parseInt(rawNumber.replace(/\./g, ''), 10);

    const format = (value) => {
      if (isDecimal) return value.toFixed(1).replace('.', ',');
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
      heroVideo.autoplay = false;
      heroVideo.pause();
    }
    const heroSource = heroVideo.querySelector('source');
    heroSource.addEventListener('error', () => heroVideo.classList.add('is-hidden'));
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
  const gallery = document.querySelector('.track-gallery');
  if (gallery) {
    const track = gallery.querySelector('.track-gallery__track');
    const sticky = gallery.querySelector('.track-gallery__sticky');
    const products = [...gallery.querySelectorAll('.track-product')];
    const desktopMQ = window.matchMedia('(min-width: 768px)');

    const isPinned = () => desktopMQ.matches && !prefersReducedMotion;
    let maxTravel = 0;
    let ticking = false;

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

    // Escala/opacidad según la distancia de cada tarjeta al centro de la pantalla
    const focus = () => {
      const mid = window.innerWidth / 2;
      products.forEach((p) => {
        const r = p.getBoundingClientRect();
        const center = r.left + r.width / 2;
        const d = Math.min(1, Math.abs(center - mid) / (window.innerWidth * 0.5));
        const eased = d * d;
        const scale = 1 - eased * 0.32; // centro 1.0 → extremos ~0.68
        const opacity = 1 - eased * 0.55;
        p.style.setProperty('--s', scale.toFixed(3));
        p.style.setProperty('--o', opacity.toFixed(3));
      });
    };

    const onScroll = () => {
      if (isPinned()) {
        const top = gallery.getBoundingClientRect().top;
        const travelled = Math.min(Math.max(-top, 0), maxTravel);
        track.style.transform = `translate3d(${-travelled}px, 0, 0)`;
        gallery.classList.toggle('is-end', travelled >= maxTravel - 2);
      }
      focus();
      ticking = false;
    };

    const requestTick = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    track.addEventListener('scroll', requestTick, { passive: true }); // carrusel móvil
    window.addEventListener('resize', () => {
      layout();
      requestTick();
    });
    if (sticky) sticky.addEventListener('transitionend', requestTick);

    layout();
    // primer cálculo tras el layout de imágenes
    requestTick();
    window.addEventListener('load', () => {
      layout();
      requestTick();
    });
  }

  /* ------------------------------------------------------------------
   * Volver arriba
   * ------------------------------------------------------------------ */
  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
})();
