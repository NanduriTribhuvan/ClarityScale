/** @jsxImportSource preact */
import { useEffect } from 'preact/hooks';

/**
 * Animation island (Requirements 4 & 5).
 *
 * Renders nothing. Hydrated with `client:idle`, so after first paint it loads
 * GSAP (from npm, not a CDN), registers ScrollTrigger, and wires every
 * entrance/scroll/micro-interaction onto the pre-rendered DOM.
 *
 * Graceful degradation: if GSAP fails to load, an IntersectionObserver reveals
 * all [data-scroll-reveal] content so nothing is ever left hidden. A
 * prefers-reduced-motion user gets the functional behaviour with motion
 * suppressed.
 */

// GSAP is intentionally loosely typed here; this file is DOM-glue, not domain logic.
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function Animations() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Always dismiss the cinematic intro so the page can never be trapped.
    dismissIntro(prefersReduced);

    // Functional behaviour that never depends on GSAP.
    initMobileMenu();
    initPricingToggle();
    initActiveNavLinks();
    initMobileBottomNav();
    initNavbarScrollState();
    initSmoothScroll();

    let cancelled = false;

    (async () => {
      if (prefersReduced) {
        revealAllStatic();
        return;
      }

      try {
        const gsapMod: any = await import('gsap');
        const stMod: any = await import('gsap/ScrollTrigger');
        if (cancelled) return;
        const gsap = gsapMod.gsap ?? gsapMod.default;
        const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default;
        gsap.registerPlugin(ScrollTrigger);

        initNavbarEntrance(gsap);
        initHeroAnimations(gsap);
        animateCounters(gsap);
        initScrollReveal(gsap, ScrollTrigger);
        initSectionStaggers(gsap, ScrollTrigger);
        initParallax(gsap);
        initFloatCards(gsap);
        initDashboardAnimations(gsap, ScrollTrigger);
        initFeatureTilt();
        initMagneticButtons();
        initHeroShimmer(gsap);
        initTrustMarquee(gsap);
        initCustomCursor(gsap);
        initProgressBeam(gsap, ScrollTrigger);
        initVisibilityPause(gsap);
      } catch {
        // GSAP unavailable — reveal everything via the IO fallback.
        revealAllStatic();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

/* ============================================================ INTRO */
function dismissIntro(reduced: boolean) {
  const loader = document.querySelector<HTMLElement>('.cs-loader');
  const curtains = Array.from(document.querySelectorAll<HTMLElement>('.cs-curtain'));
  const hide = () => {
    loader?.style.setProperty('display', 'none');
    curtains.forEach((c) => c.style.setProperty('display', 'none'));
  };
  if (reduced) {
    hide();
    return;
  }
  // Brief reveal beat, then clear the overlay.
  window.setTimeout(() => {
    if (loader) {
      loader.style.transition = 'opacity 0.5s ease';
      loader.style.opacity = '0';
      loader.classList.add('is-done');
    }
    curtains.forEach((c) => {
      c.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      c.style.transform = c.classList.contains('cs-curtain-top')
        ? 'translateY(-100%)'
        : 'translateY(100%)';
    });
    window.setTimeout(hide, 600);
  }, 600);
}

/* ============================================================ NAVBAR */
function initNavbarScrollState() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initNavbarEntrance(gsap: any) {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  gsap.from(navbar, { y: -80, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
}

/* ============================================================ MOBILE MENU */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileOverlay');
  if (!hamburger || !drawer || !overlay) return;

  const open = () => {
    hamburger.classList.add('active');
    drawer.classList.add('open');
    overlay.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    hamburger.classList.remove('active');
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    if (drawer.classList.contains('open')) close();
    else open();
  });
  overlay.addEventListener('click', close);
  document.querySelectorAll('.mobile-link').forEach((l) => l.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ============================================================ HERO */
function initHeroAnimations(gsap: any) {
  const tl = gsap.timeline({ delay: 0.3 });
  tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' });
  tl.from('.hero-headline', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');
  tl.from('.hero-sub', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5');
  tl.from(
    '.hero-cta-row .btn',
    { y: 20, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' },
    '-=0.4',
  );
  tl.from(
    '.hero-stat, .stat-sep',
    { y: 16, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
    '-=0.3',
  );
  tl.from('.hero-logo-wrap', { scale: 0.85, opacity: 0, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.8');
  tl.from(
    '.float-card',
    { scale: 0.7, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.6)' },
    '-=0.5',
  );
  tl.from('.scroll-cue', { opacity: 0, duration: 0.5 }, '-=0.2');
}

function animateCounters(gsap: any) {
  document.querySelectorAll<HTMLElement>('.stat-value').forEach((el) => {
    const text = (el.textContent ?? '').trim();
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(num)) return;
    const prefix = text.match(/^\$/) ? '$' : '';
    const suffix = text.replace(/^[$0-9.]+/, '');
    const obj = { val: 0 };
    gsap.to(obj, {
      val: num,
      duration: 2,
      delay: 1,
      ease: 'power2.out',
      onUpdate: () => {
        const v = Number.isInteger(num) ? Math.floor(obj.val) : obj.val.toFixed(1);
        el.textContent = prefix + v + suffix;
      },
      onComplete: () => {
        el.textContent = prefix + num + suffix;
      },
    });
  });
}

function initHeroShimmer(gsap: any) {
  const span = document.querySelector('.hero-headline .gradient-text');
  if (!span) return;
  gsap.to(span, {
    backgroundPosition: '200% center',
    duration: 4,
    ease: 'power1.inOut',
    repeat: -1,
    yoyo: true,
  });
}

/* ============================================================ SCROLL REVEAL */
function initScrollReveal(gsap: any, ScrollTrigger: any) {
  const els = document.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
  els.forEach((el) => {
    el.classList.add('will-animate');
    const delay = parseFloat(el.getAttribute('data-delay') ?? '0') / 1000;
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      y: 40,
      opacity: 0,
      duration: 0.75,
      delay,
      ease: 'power3.out',
      onComplete: () => {
        el.classList.add('revealed');
        el.classList.remove('will-animate');
      },
    });
  });
  ScrollTrigger.refresh();
}

/** Fallback used when GSAP is unavailable or motion is reduced. */
function revealAllStatic() {
  const els = document.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.getAttribute('data-delay') ?? '0', 10);
            window.setTimeout(() => {
              el.classList.add('revealed');
              el.classList.remove('will-animate');
            }, delay);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => obs.observe(el));
  } else {
    els.forEach((el) => {
      el.classList.add('revealed');
      el.classList.remove('will-animate');
    });
  }
}

/* ============================================================ SECTION STAGGERS */
function initSectionStaggers(gsap: any, ScrollTrigger: any) {
  const stagger = (
    trigger: string,
    target: string,
    opts: Record<string, unknown> = {},
  ) => {
    const el = document.querySelector(trigger);
    if (!el) return;
    gsap.from(target, {
      scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      y: 50,
      opacity: 0,
      duration: 0.65,
      stagger: 0.1,
      ease: 'power3.out',
      ...opts,
    });
  };

  stagger('.features-grid', '.feature-card');
  stagger('.pricing-grid', '.pricing-card', { y: 60, duration: 0.7, stagger: 0.12 });
  stagger('.testimonials-grid', '.testimonial-card');
  stagger('.steps-grid', '.step-card', { y: 50, duration: 0.7, stagger: 0.15 });

  const ctaBox = document.querySelector('.cta-box');
  if (ctaBox) {
    gsap.from(ctaBox, {
      scrollTrigger: { trigger: ctaBox, start: 'top 85%', once: true },
      y: 40,
      opacity: 0,
      scale: 0.97,
      duration: 0.9,
      ease: 'power3.out',
    });
  }

  const frame = document.querySelector('.dashboard-frame');
  if (frame) {
    gsap.from(frame, {
      scrollTrigger: { trigger: frame, start: 'top 85%', once: true },
      y: 80,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
    });
  }
  ScrollTrigger.refresh();
}

/* ============================================================ SMOOTH SCROLL */
function initSmoothScroll() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navH =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================ ACTIVE NAV */
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link');
  if (!sections.length || !navLinks.length) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('active'));
          const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          active?.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  );
  sections.forEach((s) => obs.observe(s));
}

/* ============================================================ MOBILE BOTTOM NAV */
function initMobileBottomNav() {
  const items = document.querySelectorAll<HTMLElement>('.mob-nav-item[data-section]');
  if (!items.length) return;
  const ids = ['home', 'services', 'how-it-works', 'pricing', 'testimonials', 'contact'];
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          items.forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-section') === id);
          });
        }
      });
    },
    { threshold: 0.35 },
  );
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}

/* ============================================================ PRICING TOGGLE */
function initPricingToggle() {
  const toggle = document.getElementById('billingToggle') as HTMLInputElement | null;
  if (!toggle) return;
  const amounts = document.querySelectorAll<HTMLElement>('.price-amount');
  toggle.addEventListener('change', () => {
    const isAnnual = toggle.checked;
    amounts.forEach((el) => {
      const monthly = el.getAttribute('data-monthly');
      const annual = el.getAttribute('data-annual');
      if (!monthly || !annual) return;
      el.textContent = isAnnual ? annual : monthly;
    });
  });
}

/* ============================================================ PARALLAX */
function initParallax(gsap: any) {
  const orbs = document.querySelectorAll<HTMLElement>('.hero .orb');
  const heroVisual = document.querySelector('.hero-visual');
  if (!orbs.length) return;
  window.addEventListener(
    'mousemove',
    (e) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 12;
        gsap.to(orb, { x: mx * depth, y: my * depth, duration: 1.2, ease: 'power1.out', overwrite: 'auto' });
      });
      if (heroVisual) {
        gsap.to(heroVisual, {
          rotateY: mx * 4,
          rotateX: -my * 3,
          duration: 1,
          ease: 'power1.out',
          overwrite: 'auto',
          transformPerspective: 600,
        });
      }
    },
    { passive: true },
  );
}

/* ============================================================ FLOAT CARDS */
function initFloatCards(gsap: any) {
  document.querySelectorAll<HTMLElement>('.float-card').forEach((card) => {
    card.addEventListener('mouseenter', () =>
      gsap.to(card, {
        scale: 1.06,
        boxShadow: '0 16px 48px rgba(41,121,255,0.3)',
        duration: 0.3,
        ease: 'power2.out',
      }),
    );
    card.addEventListener('mouseleave', () =>
      gsap.to(card, { scale: 1, boxShadow: '', duration: 0.4, ease: 'power2.out' }),
    );
  });
}

/* ============================================================ DASHBOARD */
function initDashboardAnimations(gsap: any, ScrollTrigger: any) {
  const bars = document.querySelectorAll('.chart-bar');
  if (bars.length) {
    gsap.from(bars, {
      scrollTrigger: { trigger: '.dashboard-frame', start: 'top 80%', once: true },
      scaleY: 0,
      transformOrigin: 'bottom center',
      duration: 0.7,
      stagger: 0.08,
      ease: 'power2.out',
    });
  }
  const fills = document.querySelectorAll('.source-fill');
  if (fills.length) {
    gsap.from(fills, {
      scrollTrigger: { trigger: '.dashboard-frame', start: 'top 80%', once: true },
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.8,
      stagger: 0.12,
      ease: 'power2.out',
      delay: 0.4,
    });
  }
  document.querySelectorAll<HTMLElement>('.kpi-value').forEach((el) => {
    const orig = el.textContent ?? '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.from(el, {
          textContent: '0',
          duration: 1,
          ease: 'power1.out',
          snap: { textContent: 1 },
          onComplete: () => {
            el.textContent = orig;
          },
        });
      },
    });
  });
}

/* ============================================================ FEATURE TILT */
function initFeatureTilt() {
  if (window.matchMedia('(max-width: 768px)').matches) return;
  document
    .querySelectorAll<HTMLElement>('.feature-card, .pricing-card, .testimonial-card')
    .forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${y * 6}deg) rotateY(${-x * 6}deg) translateY(-4px)`;
        card.style.transition = 'transform 0.1s ease';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition =
          'transform 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease';
      });
    });
}

/* ============================================================ MAGNETIC BUTTONS */
function initMagneticButtons() {
  if (window.matchMedia('(max-width: 1024px)').matches) return;
  document.querySelectorAll<HTMLElement>('.btn-primary').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px) translateY(-2px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ============================================================ TRUST MARQUEE */
function initTrustMarquee(gsap: any) {
  if (!window.matchMedia('(max-width: 768px)').matches) return;
  const track = document.querySelector('.trust-logos');
  if (!track) return;
  gsap.to(track, { x: '-50%', duration: 12, ease: 'none', repeat: -1 });
}

/* ============================================================ CUSTOM CURSOR */
function initCustomCursor(gsap: any) {
  if (window.matchMedia('(max-width: 1024px)').matches) return;
  const dot = document.querySelector<HTMLElement>('.cs-cursor');
  const ring = document.querySelector<HTMLElement>('.cs-cursor-ring');
  if (!dot || !ring) return;
  window.addEventListener(
    'mousemove',
    (e) => {
      gsap.to(dot, { left: e.clientX, top: e.clientY, duration: 0.12, ease: 'power2.out' });
      gsap.to(ring, { left: e.clientX, top: e.clientY, duration: 0.32, ease: 'power2.out' });
    },
    { passive: true },
  );
  document.querySelectorAll('a, button, .btn, input, textarea').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      dot.classList.add('is-hover');
      ring.classList.add('is-hover');
    });
    el.addEventListener('mouseleave', () => {
      dot.classList.remove('is-hover');
      ring.classList.remove('is-hover');
    });
  });
}

/* ============================================================ PROGRESS BEAM */
function initProgressBeam(gsap: any, ScrollTrigger: any) {
  const beam = document.querySelector('.cs-progress');
  if (!beam) return;
  gsap.to(beam, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });
  ScrollTrigger.refresh();
}

/* ============================================================ VISIBILITY */
function initVisibilityPause(gsap: any) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
  });
}
