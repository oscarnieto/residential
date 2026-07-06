/* ==========================================================================
   Residential New Developments — Savills
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
   * Topbar: fondo al hacer scroll + enlace activo según sección visible
   * ------------------------------------------------------------------ */
  const topbar = document.getElementById('topbar');

  const onScroll = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = document.querySelectorAll('.topbar__link');
  const linkFor = (id) =>
    [...navLinks].find((a) => a.getAttribute('href') === `#${id}`);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = linkFor(entry.target.id);
        if (!link) return;
        navLinks.forEach((a) => a.classList.remove('is-active'));
        link.classList.add('is-active');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );

  ['inicio', 'servicios', 'red-internacional', 'savills-espana']
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .forEach((section) => sectionObserver.observe(section));

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
   * Volver arriba
   * ------------------------------------------------------------------ */
  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
})();
