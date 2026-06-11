/**
 * ClarityScale — experience.js
 * "Kinetic Aurora" next-level motion layer (additive, loads after script.js)
 *
 * Design intent: commit to a bold MOTION identity on top of the existing
 * premium-dark visual system. Cinematic intro, masked headline reveal,
 * scroll-progress beam, aurora depth, gradient-sweep section titles,
 * deeper parallax, and a refined custom cursor.
 *
 * Safety: everything is feature-detected. If GSAP is missing OR the user
 * prefers reduced motion, the page degrades to the base experience with
 * no hidden content (the `cs-ready` gate is never applied, so nothing that
 * relies on JS stays hidden).
 */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const isDesktop = window.matchMedia('(min-width: 1025px)').matches;

  /* ----------------------------------------------------------
     Graceful degradation: no GSAP or reduced motion → just make
     sure the intro loader is gone and bail out of fancy stuff.
  ---------------------------------------------------------- */
  if (!hasGSAP || prefersReduced) {
    document.addEventListener('DOMContentLoaded', dismissLoaderInstant);
    if (document.readyState !== 'loading') dismissLoaderInstant();
    return;
  }

  const gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  // Mark the document so CSS hides JS-driven elements only now that we
  // KNOW we can animate them back in.
  document.documentElement.classList.add('cs-ready');

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  let inited = false;
  function init() {
    if (inited) return;
    inited = true;

    runIntro();
    initScrollProgress();
    initSectionTitleReveals();
    initDeepParallax();
    if (isDesktop) initCustomCursor();
  }

  /* ==========================================================
     1. CINEMATIC INTRO — loader fill, brand reveal, curtain wipe
  ========================================================== */
  function runIntro() {
    const loader = document.querySelector('.cs-loader');
    const tl = gsap.timeline();

    if (loader) {
      const mark = loader.querySelector('.cs-loader-mark');
      const words = loader.querySelectorAll('.cs-loader-word span');
      const fill = loader.querySelector('.cs-loader-bar-fill');

      tl.to(mark, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)' })
        .to(words, { y: '0%', duration: 0.6, stagger: 0.05, ease: 'power3.out' }, '-=0.3')
        .to(fill, { width: '100%', duration: 0.9, ease: 'power2.inOut' }, '-=0.4')
        .to(loader, { opacity: 0, duration: 0.5, ease: 'power2.inOut', onComplete: () => loader.remove() }, '+=0.1');
    }

    // Curtain wipe to reveal the page
    const top = document.querySelector('.cs-curtain-top');
    const bot = document.querySelector('.cs-curtain-bot');
    if (top && bot) {
      tl.to(top, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, '-=0.2')
        .to(bot, { yPercent: 100, duration: 0.8, ease: 'power4.inOut', onComplete: () => { top.remove(); bot.remove(); } }, '<');
    }

    // Hand off to the hero headline reveal
    tl.add(revealHero, '-=0.5');
  }

  /* ==========================================================
     2. HERO HEADLINE — masked, staggered character rise
  ========================================================== */
  function revealHero() {
    const headline = document.querySelector('.hero-headline');
    if (!headline) return;

    // Prefer GSAP SplitText (free since 3.13); fall back to manual split.
    if (window.SplitText) {
      const split = new window.SplitText(headline, { type: 'chars,words', charsClass: 'cs-char' });
      gsap.from(split.chars, {
        yPercent: 120,
        opacity: 0,
        rotateX: -40,
        transformOrigin: '50% 100%',
        duration: 0.85,
        ease: 'power4.out',
        stagger: 0.022,
      });
    } else {
      manualCharSplit(headline);
      gsap.from(headline.querySelectorAll('.cs-char'), {
        yPercent: 120,
        opacity: 0,
        duration: 0.8,
        ease: 'power4.out',
        stagger: 0.02,
      });
    }
  }

  // Lightweight char splitter that preserves inline elements (e.g. the
  // .gradient-text span and <br>) — used only when SplitText is absent.
  function manualCharSplit(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          [...child.textContent].forEach((ch) => {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'cs-char';
            s.textContent = ch;
            frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  }

  /* ==========================================================
     3. SCROLL PROGRESS BEAM
  ========================================================== */
  function initScrollProgress() {
    const bar = document.querySelector('.cs-progress');
    if (!bar || !window.ScrollTrigger) return;
    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });
  }

  /* ==========================================================
     4. SECTION TITLES — gradient sweep mask reveal
     Wraps each [data-cs-title] in line/inner spans, then rises in.
  ========================================================== */
  function initSectionTitleReveals() {
    if (!window.ScrollTrigger) return;
    document.querySelectorAll('[data-cs-title]').forEach((title) => {
      // Wrap the title content in a masking line + moving inner span.
      const inner = document.createElement('span');
      inner.append(...title.childNodes);
      const line = document.createElement('span');
      line.className = 'cs-line';
      line.appendChild(inner);
      title.appendChild(line);

      gsap.to(inner, {
        yPercent: 0,
        duration: 0.9,
        ease: 'power4.out',
        scrollTrigger: { trigger: title, start: 'top 85%', once: true },
      });
    });
  }

  /* ==========================================================
     5. DEEP PARALLAX — hero visual + aurora drift on scroll
  ========================================================== */
  function initDeepParallax() {
    if (!window.ScrollTrigger) return;

    const visual = document.querySelector('.hero-visual');
    if (visual) {
      gsap.to(visual, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      });
    }

    const aurora = document.querySelector('.cs-aurora');
    if (aurora) {
      gsap.to(aurora, {
        yPercent: 24,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.4 },
      });
    }
  }

  /* ==========================================================
     6. CUSTOM CURSOR — dot + lagging ring with hover swell
  ========================================================== */
  function initCustomCursor() {
    const dot = document.querySelector('.cs-cursor');
    const ring = document.querySelector('.cs-cursor-ring');
    if (!dot || !ring) return;

    const xToDot = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
    const yToDot = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
    const xToRing = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const yToRing = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      xToDot(e.clientX); yToDot(e.clientY);
      xToRing(e.clientX); yToRing(e.clientY);
    }, { passive: true });

    const interactive = 'a, button, .btn, .feature-card, .pricing-card, .testimonial-card, .toggle-switch';
    document.querySelectorAll(interactive).forEach((el) => {
      el.addEventListener('mouseenter', () => { dot.classList.add('is-hover'); ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', () => { dot.classList.remove('is-hover'); ring.classList.remove('is-hover'); });
    });
  }

  /* ==========================================================
     Helpers
  ========================================================== */
  function dismissLoaderInstant() {
    document.querySelectorAll('.cs-loader, .cs-curtain').forEach((el) => el.remove());
  }
})();
