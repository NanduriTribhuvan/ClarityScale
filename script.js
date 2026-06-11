/* ════════════════════════════════════════════════════════════════
   CLARITYSCALE — "OBSIDIAN PRISM" engine
   Three.js refractive gem + aurora shader · GSAP ScrollSmoother /
   ScrollTrigger / SplitText choreography · feature-detected with
   full graceful degradation (no GSAP / reduced motion → static site).
   ════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const doc = document.documentElement;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP        = typeof window.gsap !== 'undefined';

  /* ──────────────────────────────────────────────────────────────
     DEGRADED MODE — no GSAP or reduced motion: static, fully usable
  ────────────────────────────────────────────────────────────── */
  if (!hasGSAP || prefersReduced) {
    doc.classList.remove('js', 'fine-pointer');
    $$('.loader, .shutter, .cursor, .cursor-tag, #gl').forEach((el) => el.remove());
    onReady(() => {
      initClockBasic();
      initBurgerBasic();
      initBillingToggle(null);
    });
    return;
  }

  doc.classList.add('js');
  if (finePointer) doc.classList.add('fine-pointer');

  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollSmoother)  gsap.registerPlugin(ScrollSmoother);
  if (window.SplitText)       gsap.registerPlugin(SplitText);
  if (window.ScrollToPlugin)  gsap.registerPlugin(ScrollToPlugin);
  if (window.Draggable)       gsap.registerPlugin(Draggable);
  if (window.InertiaPlugin)   gsap.registerPlugin(InertiaPlugin);

  let smoother = null;
  const gemState = { scroll: 0, mouseX: 0, mouseY: 0, vel: 0 };
  const DECK_MQ = '(min-width: 1080px)'; // process deck stacks on desktop; grid on smaller screens

  onReady(() => {
    // SplitText measures glyphs — wait for webfonts so lines don't re-wrap.
    const go = () => boot();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(go);
      setTimeout(go, 2500); // safety net if fonts.ready never resolves
    } else go();
  });

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;

    initWebGL();

    if (window.ScrollSmoother) {
      smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.2,
        smoothTouch: 0.1,
        effects: true,
      });
      smoother.paused(true);
    }

    runIntro(() => {
      if (smoother) smoother.paused(false);
      initScrollFx();
    });

    if (finePointer) { initCursor(); initMagnetic(); initTilt(); initCardGlow(); initCaseParallax(); }
    initNavState();
    initMenu();
    initAnchors();
    initMarquee();
    initBillingToggle(animatePriceSwap);
    initVoicesDrag();
    initFaq();
    initClock();
    initSound();
  }

  /* ──────────────────────────────────────────────────────────────
     INTRO — counter, mark, shutter wipe, headline rise
  ────────────────────────────────────────────────────────────── */
  function runIntro(done) {
    const loader = $('#loader');
    const shutters = $$('.shutter');
    const count = $('#loaderCount');
    const word = $('#loaderWord');
    const words = ['CLARITY', 'SCALE', 'GRAVITY'];

    gsap.set(shutters, { scaleX: 1 });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => { loader && loader.remove(); shutters.forEach((s) => s.remove()); done(); },
    });

    const n = { v: 0 };
    let wi = 0;

    tl.to('.loader-mark', { opacity: 1, scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.7)' })
      .to(n, {
        v: 100, duration: 2.1, ease: 'power2.inOut',
        onUpdate: () => {
          if (count) count.textContent = String(Math.round(n.v)).padStart(2, '0');
          const target = Math.min(words.length - 1, Math.floor(n.v / 38));
          if (word && target !== wi) { wi = target; word.textContent = words[wi]; }
        },
      }, '-=0.4')
      .to(loader, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, '+=0.15')
      .set(loader, { display: 'none' })
      .to(shutters, { scaleX: 0, duration: 0.9, ease: 'power4.inOut', stagger: 0.06 }, '-=0.1')
      .add(heroReveal(), '-=0.55');

    return tl;
  }

  /* background-clip:text doesn't survive SplitText (child spans lose the
     gradient) — repaint a continuous gradient across the split pieces. */
  function fixGradientSplit(el, pieces) {
    if (!el.classList.contains('ht-grad')) return;
    const rect = el.getBoundingClientRect();
    pieces.forEach((p) => {
      const r = p.getBoundingClientRect();
      p.style.backgroundImage = 'linear-gradient(92deg,#00d4ff 0%,#8b3df5 38%,#ff3dac 70%,#ff6a00 100%)';
      p.style.backgroundSize = Math.max(rect.width, 1) + 'px 100%';
      p.style.backgroundPosition = (rect.left - r.left) + 'px 0';
      p.style.webkitBackgroundClip = 'text';
      p.style.backgroundClip = 'text';
      p.style.color = 'transparent';
    });
  }

  function heroReveal() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    const lines = $$('.hero-title [data-split]');

    if (window.SplitText) {
      lines.forEach((line, i) => {
        line.classList.add('split-ready');
        const split = new SplitText(line, { type: 'chars', mask: 'chars' });
        fixGradientSplit(line, split.chars);
        tl.from(split.chars, {
          yPercent: 120, rotateX: -50, opacity: 0,
          transformOrigin: '50% 100%',
          duration: 0.9, stagger: 0.028,
        }, i * 0.12);
      });
    } else {
      lines.forEach((l) => l.classList.add('split-ready'));
      tl.from(lines, { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.1 });
    }

    tl.to('.hero [data-reveal]', {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.09,
      onComplete: () => $$('.hero [data-reveal]').forEach((el) => el.setAttribute('data-revealed', '')),
    }, '-=0.6');

    return tl;
  }

  /* ──────────────────────────────────────────────────────────────
     SCROLL FX — created after intro so positions are final
  ────────────────────────────────────────────────────────────── */
  function initScrollFx() {
    // Progress hairline
    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Illustrated horizon drifts down as the hero scrolls away (depth parallax)
    if ($('.mountains')) {
      gsap.to('.mountains', {
        yPercent: 16, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
    }

    // Gem + aurora respond to overall page depth
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { gemState.scroll = self.progress; } });

    // Corner frame labels decode in
    $$('.hf').forEach((el, i) => gsap.delayedCall(0.15 * i, () => scrambleText(el, 1)));

    // Nav + footer links scramble on hover
    if (finePointer) {
      $$('.nav-links a, .footer-col a').forEach((a) => {
        a.addEventListener('pointerenter', () => scrambleText(a, 0.45));
      });
    }

    // Deck choreographs the step cards itself — opt them out of generic reveals
    // (otherwise the reveal tween would overwrite the deck's scrub tweens)
    if (window.matchMedia(DECK_MQ).matches) {
      $$('.step[data-reveal]').forEach((c) => { c.removeAttribute('data-reveal'); gsap.set(c, { opacity: 1, y: 0 }); });
    }

    // Generic reveals (hero handled in intro)
    ScrollTrigger.batch('[data-reveal]:not([data-revealed])', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => {
        gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: 'auto' });
        els.forEach((el) => { if (el.hasAttribute('data-scramble')) scrambleText(el, 0.9); });
      },
    });

    // Split headlines outside the hero
    if (window.SplitText) {
      $$('[data-split]').forEach((el) => {
        if (el.closest('.hero')) return;
        el.classList.add('split-ready');
        const split = new SplitText(el, { type: 'lines', mask: 'lines' });
        fixGradientSplit(el, split.lines);
        gsap.from(split.lines, {
          yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });
    } else {
      $$('[data-split]').forEach((el) => el.classList.add('split-ready'));
    }

    initManifesto();
    initPortal();
    initServicesRail();
    initCounters();
    initDeck();
    initStepsBeam();
    initFooterWord();
    initActiveNav();
  }

  /* Active nav — highlight the link for the section in view */
  function initActiveNav() {
    const links = $$('.nav-links a[data-nav-link]');
    if (!links.length) return;
    const byId = {};
    links.forEach((a) => { byId[a.getAttribute('href').slice(1)] = a; });

    const setActive = (id) => {
      links.forEach((a) => a.classList.remove('is-active'));
      if (byId[id]) byId[id].classList.add('is-active');
    };

    Object.keys(byId).forEach((id) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: (self) => { if (self.isActive) setActive(id); },
      });
    });
  }

  /* Service cards — glow follows the cursor (CSS custom props) */
  function initCardGlow() {
    $$('.svc').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* Case studies — 3D tilt on the image frame (the inner <img> is owned
     by ScrollSmoother's data-speed parallax, so we only tilt the figure) */
  function initCaseParallax() {
    $$('.case').forEach((card) => {
      const fig = $('.case-media', card);
      if (!fig) return;
      gsap.set(fig, { transformPerspective: 1100, transformOrigin: '50% 50%' });
      const rx = gsap.quickTo(fig, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(fig, 'rotationY', { duration: 0.6, ease: 'power3' });
      const sc = gsap.quickTo(fig, 'scale', { duration: 0.6, ease: 'power3' });
      card.addEventListener('pointerenter', () => sc(1.015));
      card.addEventListener('pointermove', (e) => {
        const r = fig.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 9);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 9);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); sc(1); });
    });
  }

  /* Portal — fly through the type into the work */
  function initPortal() {
    const word = $('.portal-word');
    if (!word) return;
    gsap.timeline({
      scrollTrigger: { trigger: '.portal', start: 'top top', end: '+=170%', pin: true, scrub: 0.7, anticipatePin: 1 },
    })
      .fromTo(word, { scale: 0.55, opacity: 0.95 }, { scale: 26, ease: 'power2.in', duration: 1 }, 0)
      .to(word, { opacity: 0, duration: 0.2 }, 0.8);
  }

  /* Process — cards stack into a deck while pinned (desktop) */
  function initDeck() {
    const wrap = $('.steps');
    const cards = $$('.step');
    if (!wrap || cards.length < 2) return;

    gsap.matchMedia().add(DECK_MQ, () => {
      wrap.classList.add('is-deck');
      const h = Math.max.apply(null, cards.map((c) => c.offsetHeight));
      wrap.style.height = h + 80 + 'px';
      gsap.set(cards, { zIndex: (i) => i + 1, left: '50%', xPercent: -50 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.process', start: 'top top', end: '+=190%', pin: true, scrub: 0.8, anticipatePin: 1 },
      });
      cards.forEach((c, i) => {
        if (!i) return;
        tl.from(c, { yPercent: 150, rotation: i % 2 ? 6 : -6, ease: 'none', duration: 1 }, i - 1)
          .to(cards[i - 1], { scale: 0.92, opacity: 0.45, rotation: i % 2 ? -3 : 3, ease: 'none', duration: 1 }, i - 1);
      });
      tl.to({}, { duration: 0.25 }); // hold the finished deck a beat

      return () => { wrap.classList.remove('is-deck'); wrap.style.height = ''; };
    });
  }

  /* Manifesto — pinned, words ignite one by one */
  function initManifesto() {
    const text = $('#manifestoText');
    if (!text) return;

    const words = text.textContent.trim().split(/\s+/);
    text.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');

    gsap.to(text.querySelectorAll('.w'), {
      opacity: 1, ease: 'none', stagger: 0.06,
      scrollTrigger: {
        trigger: '.manifesto',
        start: 'top top',
        end: '+=140%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });
  }

  /* Services — vertical scroll drives the rail sideways */
  function initServicesRail() {
    const rail = $('#servicesRail');
    if (!rail) return;
    const dist = () => Math.max(0, rail.scrollWidth - window.innerWidth);

    gsap.to(rail, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.services',
        start: 'top top',
        end: () => '+=' + (dist() + window.innerHeight * 0.25),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  /* Counters — count up when they enter */
  function initCounters() {
    $$('[data-counter]').forEach((el) => {
      const target = parseFloat(el.dataset.counter);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const n = { v: 0 };
      gsap.to(n, {
        v: target, duration: 2, ease: 'power2.out',
        onUpdate: () => { el.textContent = n.v.toFixed(decimals); },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  }

  function initStepsBeam() {
    const fill = $('#stepsBeamFill');
    if (!fill || $('.steps.is-deck')) return;
    gsap.to(fill, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: 0.5 },
    });
  }

  function initFooterWord() {
    const word = $('.footer-word span');
    if (!word) return;
    word.innerHTML = [...word.textContent].map((c) => '<i>' + c + '</i>').join('');
    const letters = $$('i', word);
    const ramp = gsap.utils.interpolate(['#00d4ff', '#8b3df5', '#ff3dac', '#ff6a00']);

    gsap.fromTo(word, { xPercent: -3 }, {
      xPercent: 3, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
    });

    const wrap = $('.footer-word');
    wrap.addEventListener('pointerenter', () => {
      gsap.to(letters, { color: (i) => ramp(i / (letters.length - 1)), webkitTextStrokeColor: 'rgba(255,255,255,0)', duration: 0.4, stagger: 0.012, overwrite: 'auto' });
      gsap.fromTo(letters, { yPercent: 0 }, { yPercent: -14, duration: 0.26, ease: 'power2.out', stagger: 0.014, yoyo: true, repeat: 1 });
    });
    wrap.addEventListener('pointerleave', () => {
      gsap.to(letters, { color: 'rgba(255,255,255,0)', webkitTextStrokeColor: 'rgba(244,242,236,0.16)', duration: 0.6, overwrite: 'auto' });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     MARQUEE — perpetual drift, accelerates with scroll velocity
  ────────────────────────────────────────────────────────────── */
  function initMarquee() {
    const tracks = $$('.marquee-track');
    if (!tracks.length) return;

    let vel = 0, skew = 0;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { vel = self.getVelocity(); gemState.vel = vel; } });

    const rows = tracks.map((t) => ({ t, x: 0, dir: parseFloat(t.dataset.dir || '-1') }));
    gsap.ticker.add((_, dt) => {
      const boost = Math.min(Math.abs(vel) / 220, 9);
      skew += ((gsap.utils.clamp(-10, 10, vel / 320)) - skew) * 0.1;
      vel *= 0.92;
      rows.forEach((row) => {
        row.x += row.dir * (0.028 + boost * 0.012) * (dt / 16.7);
        if (row.x <= -100 / 3) row.x += 100 / 3; // 3 identical chunks per row
        if (row.x > 0) row.x -= 100 / 3;
        gsap.set(row.t, { xPercent: row.x, skewX: skew * row.dir * -1 });
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     SCRAMBLE — decode-style text resolve
  ────────────────────────────────────────────────────────────── */
  const SCRAM_CHARS = '!<>-_\\/[]{}=+*^?#$%&';
  function scrambleText(el, dur) {
    const orig = el.dataset.orig || (el.dataset.orig = el.textContent);
    const len = orig.length;
    const obj = { p: 0 };
    gsap.to(obj, {
      p: 1, duration: dur || 0.9, ease: 'none', overwrite: true,
      onUpdate: () => {
        const reveal = Math.floor(obj.p * len);
        let out = '';
        for (let i = 0; i < len; i++) {
          out += i < reveal || orig[i] === ' ' ? orig[i] : SCRAM_CHARS[(Math.random() * SCRAM_CHARS.length) | 0];
        }
        el.textContent = out;
      },
      onComplete: () => { el.textContent = orig; },
    });
  }

  /* ──────────────────────────────────────────────────────────────
     CURSOR / MAGNETIC / TILT (fine pointers only)
  ────────────────────────────────────────────────────────────── */
  function initCursor() {
    const dot = $('#cursor');
    const tag = $('#cursorTag');
    if (!dot) return;

    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const tx = gsap.quickTo(tag, 'x', { duration: 0.35, ease: 'power3' });
    const ty = gsap.quickTo(tag, 'y', { duration: 0.35, ease: 'power3' });

    window.addEventListener('pointermove', (e) => {
      dx(e.clientX); dy(e.clientY); tx(e.clientX); ty(e.clientY);
      gemState.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      gemState.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    const LABELS = { view: 'VIEW', drag: 'DRAG', case: 'OPEN CASE' };
    document.addEventListener('pointerover', (e) => {
      const hot = e.target.closest('a, button, summary, [data-cursor]');
      dot.classList.toggle('is-big', !!hot);
      const labelled = e.target.closest('[data-cursor]');
      if (labelled && tag) {
        tag.textContent = LABELS[labelled.dataset.cursor] || 'VIEW';
        tag.classList.add('is-on');
      } else if (tag) tag.classList.remove('is-on');
    });
  }

  function initMagnetic() {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  function initTilt() {
    $$('[data-tilt]').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     NAV / MENU / ANCHORS
  ────────────────────────────────────────────────────────────── */
  function initNavState() {
    const nav = $('#nav');
    if (!nav) return;
    let lastY = 0;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('is-solid', y > 50);
        nav.classList.toggle('is-hidden', y > 160 && y > lastY && !$('#menu').classList.contains('is-open'));
        lastY = y;
      },
    });
  }

  function initMenu() {
    const menu = $('#menu');
    const burger = $('#burger');
    if (!menu || !burger) return;

    const bg = $('.menu-bg', menu);
    const spans = $$('.menu-link span', menu);
    const meta = $('.menu-meta', menu);
    let open = false;

    const tl = gsap.timeline({ paused: true, onReverseComplete: () => menu.classList.remove('is-open') });
    tl.to(bg, { y: '0%', duration: 0.65, ease: 'power4.inOut' }, 0)
      .to(spans, { y: 0, duration: 0.7, ease: 'power4.out', stagger: 0.06 }, 0.25)
      .from(meta, { opacity: 0, y: 20, duration: 0.5 }, 0.5);
    gsap.set(bg, { y: '-100%' });
    gsap.set(spans, { y: '110%' });

    const focusable = () => $$('a[href], button', menu).filter((el) => el.offsetParent !== null);

    window.__toggleMenu = (force) => {
      open = typeof force === 'boolean' ? force : !open;
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      $('#nav').classList.toggle('menu-open', open);
      if (open) {
        menu.classList.add('is-open'); tl.timeScale(1).play(); if (smoother) smoother.paused(true);
        const f = focusable(); if (f[0]) gsap.delayedCall(0.4, () => f[0].focus());
      } else {
        tl.timeScale(1.4).reverse(); if (smoother) smoother.paused(false);
        burger.focus();
      }
    };
    burger.addEventListener('click', () => window.__toggleMenu());

    // Esc closes; Tab is trapped inside the open menu (a11y)
    document.addEventListener('keydown', (e) => {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { window.__toggleMenu(false); return; }
      if (e.key !== 'Tab') return;
      const f = focusable();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = a.hash && a.hash.length > 1 ? $(a.hash) : null;
      if (!target) return;
      e.preventDefault();
      if (window.__toggleMenu) window.__toggleMenu(false);
      const go = () => {
        if (smoother) smoother.scrollTo(target, true, 'top 64px');
        else if (window.ScrollToPlugin) gsap.to(window, { duration: 1, scrollTo: { y: target, offsetY: 64 }, ease: 'power3.inOut' });
        else target.scrollIntoView({ behavior: 'smooth' });
      };
      setTimeout(go, 80); // let the menu start closing first
    });

    const toTop = $('#toTop');
    if (toTop) toTop.addEventListener('click', () => {
      if (smoother) smoother.scrollTo(0, true);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     PRICING TOGGLE
  ────────────────────────────────────────────────────────────── */
  function initBillingToggle(animate) {
    const sw = $('#billSwitch');
    if (!sw) return;
    const lM = $('#btMonthly'), lO = $('#btOneoff');
    lM && lM.classList.add('is-on');

    sw.addEventListener('click', () => {
      const oneoff = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(oneoff));
      lM && lM.classList.toggle('is-on', !oneoff);
      lO && lO.classList.toggle('is-on', oneoff);

      $$('.plan-price b[data-monthly]').forEach((b) => {
        const next = oneoff ? b.dataset.oneoff : b.dataset.monthly;
        const per = b.parentElement.querySelector('.plan-per');
        const swap = () => { b.textContent = next; if (per) per.textContent = oneoff ? 'one-off' : '/mo'; };
        if (animate) animate(b, swap); else swap();
      });
    });
  }

  function animatePriceSwap(el, swap) {
    gsap.timeline()
      .to(el, { yPercent: -40, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: swap })
      .fromTo(el, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  }

  /* ──────────────────────────────────────────────────────────────
     VOICES — draggable rail with inertia
  ────────────────────────────────────────────────────────────── */
  function initVoicesDrag() {
    const rail = $('#voicesRail');
    const track = $('#voicesTrack');
    if (!rail || !track || !window.Draggable) return;

    const bounds = () => ({ minX: Math.min(0, rail.clientWidth - track.scrollWidth), maxX: 0 });
    const d = Draggable.create(track, {
      type: 'x',
      bounds: bounds(),
      inertia: !!window.InertiaPlugin,
      edgeResistance: 0.82,
      cursor: 'grab',
      activeCursor: 'grabbing',
    })[0];
    window.addEventListener('resize', () => d.applyBounds(bounds()));

    // idle auto-drift; hands off while the user hovers, drags or focuses
    let hover = false, focused = false;
    rail.addEventListener('pointerenter', () => { hover = true; });
    rail.addEventListener('pointerleave', () => { hover = false; });
    rail.addEventListener('focusin', () => { focused = true; });
    rail.addEventListener('focusout', () => { focused = false; });
    gsap.ticker.add((_, dt) => {
      if (hover || focused || d.isPressed || d.isThrowing) return;
      const b = bounds();
      let x = gsap.getProperty(track, 'x') - 0.38 * (dt / 16.7);
      if (x < b.minX) x = 0;
      gsap.set(track, { x });
    });

    // Keyboard control — arrow keys / Home / End step the rail (a11y)
    rail.addEventListener('keydown', (e) => {
      const step = $('.voice', track) ? $('.voice', track).offsetWidth + 22 : 320;
      const b = bounds();
      let x = gsap.getProperty(track, 'x');
      if (e.key === 'ArrowRight')      x -= step;
      else if (e.key === 'ArrowLeft')  x += step;
      else if (e.key === 'Home')       x = b.maxX;
      else if (e.key === 'End')        x = b.minX;
      else return;
      e.preventDefault();
      gsap.to(track, { x: gsap.utils.clamp(b.minX, b.maxX, x), duration: 0.6, ease: 'power3.out' });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     SOUND — synthesized ambient drone + UI blips (no audio files)
  ────────────────────────────────────────────────────────────── */
  function initSound() {
    const btn = $('#soundBtn');
    if (!btn || !(window.AudioContext || window.webkitAudioContext)) return;

    let ctx = null, master = null, on = false, lastBlip = 0;

    const build = () => {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      filter.connect(master);

      [[55, 0.5], [110.4, 0.22], [164.9, 0.07]].forEach(([f, g]) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const gn = ctx.createGain(); gn.gain.value = g;
        o.connect(gn); gn.connect(filter); o.start();
      });
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
      const lg = ctx.createGain(); lg.gain.value = 110;
      lfo.connect(lg); lg.connect(filter.frequency); lfo.start();
    };

    const blip = (f) => {
      if (!on || !ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.7, t + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.045, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.16);
    };
    window.__blip = blip;

    btn.addEventListener('click', () => {
      if (!ctx) build();
      if (ctx.state === 'suspended') ctx.resume();
      on = !on;
      btn.textContent = 'SOUND: ' + (on ? 'ON' : 'OFF');
      btn.setAttribute('aria-pressed', String(on));
      gsap.to(master.gain, { value: on ? 0.1 : 0, duration: 1.2 });
      if (on) blip(540);
    });

    document.addEventListener('pointerover', (e) => {
      if (!on || !e.target.closest('a, button, summary')) return;
      const now = performance.now();
      if (now - lastBlip < 90) return;
      lastBlip = now;
      blip(620 + Math.random() * 420);
    });
    document.addEventListener('pointerdown', (e) => {
      if (on && e.target.closest('a, button, summary')) blip(330);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     FAQ — animated <details>
  ────────────────────────────────────────────────────────────── */
  function initFaq() {
    $$('.qa').forEach((qa) => {
      const summary = $('summary', qa);
      const body = $(':scope > p', qa);
      if (!summary || !body) return;

      summary.addEventListener('click', (e) => {
        e.preventDefault();
        if (qa.open) {
          gsap.to(body, {
            height: 0, opacity: 0, duration: 0.35, ease: 'power2.inOut',
            onComplete: () => { qa.open = false; gsap.set(body, { clearProps: 'all' }); },
          });
        } else {
          qa.open = true;
          gsap.from(body, {
            height: 0, opacity: 0, duration: 0.45, ease: 'power3.out',
            onComplete: () => gsap.set(body, { clearProps: 'all' }),
          });
        }
        ScrollTrigger.refresh();
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     WEBGL — aurora field + refractive gem (Three.js)
  ────────────────────────────────────────────────────────────── */
  function initWebGL() {
    if (typeof window.THREE === 'undefined') return;
    const canvas = $('#gl');
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (err) { return; }

    const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;

    /* — Aurora backdrop (fullscreen shader quad) — */
    const bgScene = new THREE.Scene();
    const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bgUniforms = {
      uTime:   { value: 0 },
      uRes:    { value: new THREE.Vector2(window.innerWidth * DPR, window.innerHeight * DPR) },
      uScroll: { value: 0 },
    };
    bgScene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: bgUniforms,
        depthWrite: false,
        vertexShader: 'void main(){ gl_Position = vec4(position, 1.0); }',
        fragmentShader: `
          precision highp float;
          uniform float uTime; uniform vec2 uRes; uniform float uScroll;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
          float noise(vec2 p){
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
          }
          float fbm(vec2 p){
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
            return v;
          }
          void main(){
            vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
            float t = uTime * 0.045;
            // calm cool family — indigo / electric blue / violet / soft cyan
            vec3 indigo = vec3(0.05, 0.07, 0.20);
            vec3 blue   = vec3(0.10, 0.40, 0.92);
            vec3 violet = vec3(0.38, 0.20, 0.85);
            vec3 cyan   = vec3(0.18, 0.72, 0.96);
            vec3 col = indigo * 0.55;                        // quiet ambient base
            col += blue   * smoothstep(0.46, 0.98, fbm(uv * 1.4 + vec2( t,       -t * 0.6))) * 0.30;
            col += violet * smoothstep(0.44, 0.98, fbm(uv * 1.9 + vec2(-t * 0.8,  t * 0.5) + 3.7)) * 0.26;
            col += cyan   * smoothstep(0.60, 1.00, fbm(uv * 1.2 + vec2(-t * 0.5,  t * 0.35) + 7.3)) * 0.16;
            float vig = smoothstep(1.4, 0.15, length(uv));
            float depth = 1.0 - uScroll * 0.66;             // dim as you descend
            depth += smoothstep(0.82, 1.0, uScroll) * 0.5;  // gentle re-ignite at the CTA
            gl_FragColor = vec4(col * vig * depth * 0.62, 1.0);
          }`,
      })
    ));

    /* — Gem scene — */
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 50);
    cam.position.z = 6;

    const gemUniforms = { uTime: { value: 0 }, uOp: { value: 1 }, uPulse: { value: 0 } };
    const gemMat = new THREE.ShaderMaterial({
      uniforms: gemUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        precision highp float;
        varying vec3 vN; varying vec3 vV;
        uniform float uTime; uniform float uOp; uniform float uPulse;
        vec3 spectrum(float x){
          x = fract(x);
          vec3 cyan   = vec3(0.10, 0.82, 1.00);
          vec3 blue   = vec3(0.20, 0.45, 0.98);
          vec3 violet = vec3(0.55, 0.28, 0.96);
          vec3 orchid = vec3(0.82, 0.40, 0.95);
          if (x < 0.33) return mix(cyan, blue, x / 0.33);
          if (x < 0.66) return mix(blue, violet, (x - 0.33) / 0.33);
          return mix(violet, orchid, (x - 0.66) / 0.34);
        }
        void main(){
          vec3 n = normalize(vN); vec3 v = normalize(vV);
          float fres = pow(1.0 - abs(dot(n, v)), 2.0);
          float band = n.y * 0.5 + 0.5 + uTime * 0.03;
          vec3 col = spectrum(band) * 0.16
                   + spectrum(band + fres * 0.55) * fres * 1.5
                   + vec3(1.0) * pow(fres, 7.0) * 0.9;
          col += vec3(0.95, 0.9, 1.0) * uPulse;
          gl_FragColor = vec4(col, uOp * (0.3 + fres * 0.7));
        }`,
    });

    // Non-indexed octahedron → hard facets
    const geo = new THREE.OctahedronGeometry(1.5, 0); // detail 0 is already non-indexed → flat facets
    geo.computeVertexNormals();
    const gem = new THREE.Mesh(geo, gemMat);

    const wire = new THREE.Mesh(
      geo.clone(),
      new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.16, color: 0xffffff })
    );
    wire.scale.setScalar(1.002);
    const group = new THREE.Group();
    group.add(gem); group.add(wire);

    // Soft violet halo behind the gem
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const cg = cv.getContext('2d');
    const grd = cg.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(150,95,255,0.5)');
    grd.addColorStop(0.5, 'rgba(80,40,180,0.16)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    cg.fillStyle = grd; cg.fillRect(0, 0, 256, 256);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(7.5, 7.5, 1);
    group.add(glow);
    scene.add(group);

    /* — Mountains. The illustrated horizon (.mountains DOM layer) is the active
       backdrop; flip USE_3D_TERRAIN back to true to restore the procedural GPU range. — */
    const USE_3D_TERRAIN = false;
    let terrainUniforms = null;
    if (USE_3D_TERRAIN) {
    const lowPower = window.innerWidth < 900;
    const SEG = lowPower ? 128 : 240;
    terrainUniforms = { uTime: { value: 0 }, uScroll: { value: 0 } };
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 100, SEG, SEG),
      new THREE.ShaderMaterial({
        uniforms: terrainUniforms,
        transparent: true,
        depthWrite: true,
        vertexShader: `
          precision highp float;
          uniform float uTime; uniform float uScroll;
          varying float vH; varying float vFog;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
          float noise(vec2 p){
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
          }
          // ridged multifractal → sharp alpine peaks (5 octaves = calmer ridgelines)
          float ridged(vec2 p){
            float v = 0.0, a = 0.55, f = 1.0;
            for (int i = 0; i < 5; i++){
              float n = 1.0 - abs(noise(p * f) * 2.0 - 1.0);
              v += a * n * n; f *= 2.02; a *= 0.5;
            }
            return v;
          }
          void main(){
            vec3 pos = position;
            // scroll + time drift the range toward the viewer (endless fly-through)
            vec2 sp = pos.xy * 0.042 + vec2(0.0, uScroll * 2.6 + uTime * 0.016);
            float h = ridged(sp);
            // deep valley near the camera, a calm peak band toward the horizon
            float rise = smoothstep(0.0, 0.62, (pos.y + 50.0) / 100.0);
            h *= mix(0.10, 1.0, rise);
            pos.z += h * 10.0 - 3.0;          // lower peaks → more open sky
            vH = h;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            vFog = smoothstep(8.0, 40.0, -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          precision highp float;
          varying float vH; varying float vFog;
          void main(){
            // cool family — midnight indigo → deep blue → violet → icy peaks
            vec3 base   = vec3(0.02, 0.03, 0.09);
            vec3 indigo = vec3(0.09, 0.13, 0.42);
            vec3 violet = vec3(0.30, 0.18, 0.72);
            vec3 ice    = vec3(0.58, 0.86, 1.00);
            vec3 col = mix(base, indigo, smoothstep(0.04, 0.5, vH));
            col = mix(col, violet, smoothstep(0.48, 0.80, vH));
            float peak = smoothstep(0.74, 0.97, vH);   // icy snow-line glow
            col = mix(col, ice, peak * 0.6);
            col += peak * peak * vec3(0.40, 0.62, 0.92);
            col += indigo * (1.0 - vFog) * 0.10;        // soft valley bounce-light
            float alpha = (1.0 - vFog) * smoothstep(-0.20, 0.10, vH);
            gl_FragColor = vec4(col, alpha);
          }`,
      })
    );
    terrain.rotation.x = -Math.PI * 0.5;
    terrain.position.set(0, -5.0, -11);   // lower + further → open sky above the range
    terrain.renderOrder = -1;
    scene.add(terrain);
    }

    // Cosmic dust field
    const pCount = window.innerWidth > 900 ? 360 : 150;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 11;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 7 - 1;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.016, color: 0xaec4ff, transparent: true, opacity: 0.28,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    scene.add(dust);

    // Shockwave ring (fired on hero click)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    scene.add(ring);

    let baseScale = 1;
    const fit = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      bgUniforms.uRes.value.set(w * DPR, h * DPR);
      baseScale = gsap.utils.clamp(0.55, 1.15, Math.min(w, h) / 900);
      group.scale.setScalar(baseScale);
    };
    fit();
    window.addEventListener('resize', fit);

    const pulse = () => {
      gsap.timeline()
        .fromTo(ring.scale, { x: 0.5, y: 0.5 }, { x: 10, y: 10, duration: 1.2, ease: 'power2.out' }, 0)
        .fromTo(ring.material, { opacity: 0.75 }, { opacity: 0, duration: 1.2, ease: 'power2.out' }, 0)
        .fromTo(gemUniforms.uPulse, { value: 0.85 }, { value: 0, duration: 1, ease: 'power3.out' }, 0)
        .fromTo(group.scale,
          { x: baseScale * 1.18, y: baseScale * 1.18, z: baseScale * 1.18 },
          { x: baseScale, y: baseScale, z: baseScale, duration: 1.2, ease: 'elastic.out(1, 0.4)' }, 0);
      if (window.__blip) window.__blip(160);
    };
    gemState.pulse = pulse;
    const heroEl = $('.hero');
    if (heroEl) heroEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      pulse();
    });

    let raf, t0 = performance.now();
    const render = (now) => {
      raf = requestAnimationFrame(render);
      const t = (now - t0) / 1000;
      const p = gemState.scroll;

      bgUniforms.uTime.value = t;
      bgUniforms.uScroll.value = p;
      gemUniforms.uTime.value = t;
      if (terrainUniforms) { terrainUniforms.uTime.value = t; terrainUniforms.uScroll.value = p; }

      // descend + spin with the page, drift back up for the CTA
      const ctaPhase = gsap.utils.clamp(0, 1, (p - 0.8) / 0.2);
      const velSpin = gsap.utils.clamp(0, 0.14, Math.abs(gemState.vel) / 30000);
      group.rotation.y = t * 0.22 + p * Math.PI * 4 + velSpin * t;
      group.rotation.x = Math.sin(t * 0.18) * 0.18 + p * 1.2;
      group.position.y = 0.15 - p * 5.2 + ctaPhase * 5.6;
      group.position.x = Math.sin(p * Math.PI) * 1.4 * (window.innerWidth > 900 ? 1 : 0.4);
      gemUniforms.uOp.value = 1 - gsap.utils.clamp(0, 1, (p - 0.06) / 0.2) * 0.75 + ctaPhase * 0.75;

      // dust drifts, ring tracks the gem
      dust.rotation.y = t * 0.018 + p * 0.9;
      dust.rotation.x = gemState.mouseY * 0.04;
      dust.position.y = p * 2.4;
      ring.position.copy(group.position);

      // mouse parallax + gentle scroll rise (lifts the eye over the range)
      cam.position.x += (gemState.mouseX * 0.45 - cam.position.x) * 0.04;
      cam.position.y += ((-gemState.mouseY * 0.3 + p * 0.5) - cam.position.y) * 0.04;
      cam.lookAt(0, 0, 0);

      renderer.clear();
      renderer.render(bgScene, bgCam);
      renderer.clearDepth();
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(render);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { t0 = performance.now() - (bgUniforms.uTime.value * 1000); raf = requestAnimationFrame(render); }
    });
  }

  /* ──────────────────────────────────────────────────────────────
     CLOCK (IST) + degraded-mode helpers
  ────────────────────────────────────────────────────────────── */
  function initClock() { initClockBasic(); }
  function initClockBasic() {
    const el = $('#clock');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const tick = () => { el.textContent = fmt.format(new Date()) + ' IST'; };
    tick();
    setInterval(tick, 1000);
  }

  function initBurgerBasic() {
    const burger = $('#burger');
    const menu = $('#menu');
    if (!burger || !menu) return;
    burger.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      $('.menu-bg', menu).style.transform = open ? 'none' : '';
      $$('.menu-link span', menu).forEach((s) => { s.style.transform = open ? 'none' : ''; });
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) burger.click();
    });
  }

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
})();
