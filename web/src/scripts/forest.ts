/**
 * Forest behaviour (v3, no dependencies).
 *
 * forest.css does the visual work; this file only writes numbers and classes:
 * - Hero walk-in: scroll through the hero is eased into --p (0 → 1) and the
 *   pointer into --mx (-1 → 1). Fireflies drift in the clearing (canvas).
 * - Headings split into words that rise into place; blocks fade up.
 * - The studio manifesto lights word by word as you read down the page.
 * - The process path fills with scroll and lights each step in turn.
 * - Magnetic buttons, the pricing toggle with a counting price.
 * - Navigation: scrolled / hidden state, mobile menu, scroll-spy.
 *
 * Every feature checks for its markup first, so the script is safe on any
 * page that uses the forest navigation. With reduced motion only the
 * functional parts run (menu, scroll-spy, pricing).
 */

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Runs `fn` every frame while `isActive()` is true; restart with the returned `wake()`. */
function loop(fn: (time: number) => void, isActive: () => boolean): () => void {
  let id = 0;
  const frame = (time: number): void => {
    id = 0;
    if (!isActive()) return;
    fn(time);
    id = requestAnimationFrame(frame);
  };
  return () => {
    if (id === 0 && isActive()) id = requestAnimationFrame(frame);
  };
}

/* ── Hero ─────────────────────────────────────────────────── */

function initHero(): void {
  const hero = document.querySelector<HTMLElement>('[data-f-hero]');
  if (!hero || reducedMotion) return;

  let visible = true;
  let target = 0;
  let progress = 0;
  let tmx = 0;
  let mx = 0;
  let settling = true;

  const measure = (): void => {
    const travel = hero.offsetHeight - window.innerHeight;
    target = travel > 0 ? clamp(-hero.getBoundingClientRect().top / travel, 0, 1) : 0;
  };

  const wakeWalk = loop(
    () => {
      progress = lerp(progress, target, 0.09);
      mx = lerp(mx, tmx, 0.05);
      if (Math.abs(progress - target) < 0.0003) progress = target;
      if (Math.abs(mx - tmx) < 0.0005) mx = tmx;
      hero.style.setProperty('--p', progress.toFixed(4));
      hero.style.setProperty('--mx', mx.toFixed(4));
      settling = progress !== target || mx !== tmx;
    },
    () => settling
  );

  const kick = (): void => {
    measure();
    settling = true;
    wakeWalk();
  };
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  if (finePointer) {
    hero.addEventListener('pointermove', (event: PointerEvent) => {
      tmx = (event.clientX / window.innerWidth) * 2 - 1;
      kick();
    });
  }
  kick();

  const flies = hero.querySelector<HTMLCanvasElement>('[data-f-flies]');
  if (!flies) return;
  const wakeFlies = initFireflies(flies, () => visible && !document.hidden);
  new IntersectionObserver((entries) => {
    for (const entry of entries) visible = entry.isIntersecting;
    if (visible) wakeFlies();
  }).observe(hero);
  document.addEventListener('visibilitychange', wakeFlies);
}

interface Fly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  speed: number;
}

/** A few warm points of light drifting low in the clearing. */
function initFireflies(canvas: HTMLCanvasElement, isActive: () => boolean): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let flies: Fly[] = [];

  const spawn = (): Fly => ({
    x: Math.random() * w,
    y: h * (0.55 + Math.random() * 0.42),
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.12,
    r: 0.8 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 1.2,
  });

  const resize = (): void => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp(w / 34, 14, 42));
    flies = Array.from({ length: count }, spawn);
  };
  resize();
  window.addEventListener('resize', resize);

  let last = 0;
  const wake = loop(
    (time) => {
      const dt = last ? Math.min(time - last, 48) / 16.7 : 1;
      last = time;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const f of flies) {
        f.vx = clamp(f.vx + (Math.random() - 0.5) * 0.02, -0.35, 0.35);
        f.vy = clamp(f.vy + (Math.random() - 0.5) * 0.02, -0.25, 0.25);
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.x < -10) f.x = w + 10;
        if (f.x > w + 10) f.x = -10;
        if (f.y < h * 0.5 || f.y > h) f.vy *= -1;
        const flicker = 0.5 + 0.5 * Math.sin(time * 0.0016 * f.speed + f.phase);
        const alpha = 0.15 + flicker * 0.75;
        const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
        glow.addColorStop(0, `rgba(255, 214, 150, ${alpha})`);
        glow.addColorStop(0.25, `rgba(255, 160, 90, ${alpha * 0.45})`);
        glow.addColorStop(1, 'rgba(255, 120, 80, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    () => {
      const active = isActive();
      if (!active) last = 0;
      return active;
    }
  );
  wake();
  return wake;
}

/* ── Word splitting ───────────────────────────────────────── */

/** Wraps every word in `el` (keeping inline elements like <em>) and returns the inner spans. */
function splitWords(el: HTMLElement, wrapClass: string | null): HTMLSpanElement[] {
  const words: HTMLSpanElement[] = [];
  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (part === '') continue;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            continue;
          }
          const inner = document.createElement('span');
          inner.textContent = part;
          words.push(inner);
          if (wrapClass) {
            const outer = document.createElement('span');
            outer.className = wrapClass;
            outer.appendChild(inner);
            frag.appendChild(outer);
          } else {
            frag.appendChild(inner);
          }
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(el);
  return words;
}

/* ── Reveals ──────────────────────────────────────────────── */

function initReveal(): void {
  const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-f-reveal]'));
  const headings = Array.from(document.querySelectorAll<HTMLElement>('[data-f-split]'));
  if (reducedMotion || blocks.length + headings.length === 0) return;

  for (const heading of headings) {
    splitWords(heading, 'f-w').forEach((word, i) => word.style.setProperty('--wi', String(i)));
  }

  root.classList.add('f-reveal-ready');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  [...headings, ...blocks].forEach((item) => observer.observe(item));
}

/* ── Manifesto: words light as you read ───────────────────── */

function initWords(): void {
  const text = document.querySelector<HTMLElement>('[data-f-words]');
  if (!text || reducedMotion) return;

  const words = splitWords(text, null);
  words.forEach((word) => word.classList.add('f-word'));
  text.classList.add('f-words-ready');

  let lit = -1;
  let ticking = false;
  const update = (): void => {
    ticking = false;
    const rect = text.getBoundingClientRect();
    const view = window.innerHeight;
    // Starts lighting as the text enters the lower third, done by mid-screen.
    const progress = clamp((view * 0.85 - rect.top) / (rect.height + view * 0.3), 0, 1);
    const next = Math.round(progress * words.length);
    if (next === lit) return;
    lit = next;
    words.forEach((word, i) => word.classList.toggle('is-lit', i < lit));
  };
  const request = (): void => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  request();
}

/* ── Process path ─────────────────────────────────────────── */

function initTrail(): void {
  const section = document.querySelector<HTMLElement>('[data-f-trail]');
  if (!section) return;
  const steps = Array.from(section.querySelectorAll<HTMLElement>('.f-step'));
  if (steps.length === 0) return;

  if (reducedMotion) {
    section.style.setProperty('--trail', '1');
    steps.forEach((step) => step.classList.add('is-lit'));
    return;
  }

  section.classList.add('f-trail-ready');
  const list = section.querySelector<HTMLElement>('.f-steps') ?? section;
  let ticking = false;
  const update = (): void => {
    ticking = false;
    const rect = list.getBoundingClientRect();
    const view = window.innerHeight;
    const progress = clamp((view * 0.8 - rect.top) / (rect.height + view * 0.2), 0, 1);
    section.style.setProperty('--trail', progress.toFixed(3));
    steps.forEach((step, i) => {
      step.classList.toggle('is-lit', progress >= i / steps.length + 0.04);
    });
  };
  const request = (): void => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  request();
}

/* ── Magnetic buttons (fine pointers only) ───────────────── */

function initMagnetic(): void {
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll<HTMLElement>('[data-f-magnetic]').forEach((el) => {
    const label = el.firstElementChild instanceof HTMLElement ? el.firstElementChild : null;
    el.addEventListener('pointermove', (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const dy = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      el.style.transform = `translate3d(${(dx * 7).toFixed(2)}px, ${(dy * 6).toFixed(2)}px, 0)`;
      if (label) {
        label.style.transform = `translate3d(${(dx * 4).toFixed(2)}px, ${(dy * 3).toFixed(2)}px, 0)`;
      }
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
      if (label) label.style.transform = '';
    });
  });
}

/* ── Navigation ───────────────────────────────────────────── */

function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-f-nav]');
  if (!nav) return;

  const toggle = nav.querySelector<HTMLButtonElement>('[data-f-menu-toggle]');
  const menu = document.getElementById('f-menu');
  const menuOpen = (): boolean => toggle?.getAttribute('aria-expanded') === 'true';

  let lastY = window.scrollY;
  const onScroll = (): void => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    // Step aside while reading downwards; come back on the way up.
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (!menuOpen() && !nav.contains(document.activeElement)) {
      if (goingDown && y > window.innerHeight * 1.2) nav.classList.add('is-hidden');
      else if (goingUp || y < window.innerHeight) nav.classList.remove('is-hidden');
    }
    lastY = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  if (toggle && menu) {
    const setOpen = (open: boolean): void => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      document.body.classList.toggle('f-menu-open', open);
      if (open) nav.classList.remove('is-hidden');
    };

    toggle.addEventListener('click', () => setOpen(!menuOpen()));
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  // Scroll-spy for same-page links only (homepage).
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('.nav-link[href^="#"]'));
  const targets = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter((el): el is HTMLElement => el !== null);
  if (targets.length === 0) return;

  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  targets.forEach((target) => spy.observe(target));
}

/* ── Pricing ──────────────────────────────────────────────── */

function initPricing(): void {
  const group = document.querySelector<HTMLElement>('[data-f-billing]');
  if (!group) return;

  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button[data-mode]'));
  const prices = Array.from(document.querySelectorAll<HTMLElement>('[data-f-price]'));
  const periods = Array.from(document.querySelectorAll<HTMLElement>('[data-f-period]'));
  const format = new Intl.NumberFormat('en-US');
  const toNumber = (text: string | undefined): number => Number((text ?? '').replace(/[^\d]/g, ''));
  const running = new WeakMap<HTMLElement, number>();

  const countTo = (el: HTMLElement, finalText: string): void => {
    const from = toNumber(el.textContent ?? '');
    const to = toNumber(finalText);
    const previous = running.get(el);
    if (previous) cancelAnimationFrame(previous);
    if (reducedMotion || !from || !to || from === to) {
      el.textContent = finalText;
      return;
    }
    const start = performance.now();
    const duration = 800;
    const step = (now: number): void => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      if (t < 1) {
        el.textContent = format.format(Math.round(lerp(from, to, eased)));
        running.set(el, requestAnimationFrame(step));
      } else {
        el.textContent = finalText;
        running.delete(el);
      }
    };
    running.set(el, requestAnimationFrame(step));
  };

  const apply = (mode: string): void => {
    group.dataset.mode = mode;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    }
    for (const el of prices) {
      const value = mode === 'project' ? el.dataset.project : el.dataset.monthly;
      if (value !== undefined) countTo(el, value);
    }
    for (const el of periods) {
      const value = mode === 'project' ? el.dataset.project : el.dataset.monthly;
      if (value !== undefined) el.textContent = value;
    }
  };

  for (const button of buttons) {
    button.addEventListener('click', () => apply(button.dataset.mode ?? 'monthly'));
  }
}

initHero();
initNav();
initReveal();
initWords();
initTrail();
initMagnetic();
initPricing();
