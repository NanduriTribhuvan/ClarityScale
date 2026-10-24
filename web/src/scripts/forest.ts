/**
 * Aurora forest behaviour (no dependencies).
 *
 * Visual work lives in forest.css; this file writes numbers and draws two
 * canvases:
 * - Hero walk-in: scroll progress through the hero is eased into --p (0 → 1),
 *   the pointer into --mx / --my (-1 → 1).
 * - Aurora: the logo's two ribbons as moving light curtains (canvas).
 * - Spores: glowing particles in the ribbon colours that drift up and part
 *   around the pointer (canvas).
 * - Marquee, scroll reveals, lit process trail, 3D project windows, magnetic
 *   buttons, pointer light, pricing toggle with a counting price.
 * - Navigation: scrolled / hidden state, mobile menu, scroll-spy.
 *
 * Every feature checks for its markup first, so the script is safe on any page
 * that uses the forest navigation. With reduced motion, only the functional
 * parts run (menu, scroll-spy, pricing).
 */

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

type RGB = [number, number, number];

const LEFT_RIBBON: RGB[] = [
  [0, 212, 255],
  [41, 121, 255],
  [106, 29, 224],
  [124, 19, 200],
];
const RIGHT_RIBBON: RGB[] = [
  [139, 25, 214],
  [212, 31, 176],
  [240, 68, 106],
  [255, 106, 0],
];
const SPORE_COLOURS: RGB[] = [
  [111, 233, 255],
  [116, 169, 255],
  [207, 123, 255],
  [255, 116, 214],
  [255, 171, 92],
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sample(stops: RGB[], t: number): RGB {
  const scaled = clamp(t, 0, 1) * (stops.length - 1);
  const i = Math.min(Math.floor(scaled), stops.length - 2);
  const f = scaled - i;
  const a = stops[i] ?? stops[0] ?? [255, 255, 255];
  const b = stops[i + 1] ?? a;
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}

/** Runs `fn` every frame while `isActive()` is true; restart with `wake()`. */
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
  if (!hero) return;

  let visible = true;
  const wakers: Array<() => void> = [];
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      visible = entry.isIntersecting;
      hero.classList.toggle('is-offscreen', !visible);
      if (visible) wakers.forEach((wake) => wake());
    }
  });
  visibility.observe(hero);

  if (reducedMotion) return;
  root.classList.add('f-motion');

  // Eased walk-in + pointer parallax
  let target = 0;
  let progress = 0;
  let tmx = 0;
  let tmy = 0;
  let mx = 0;
  let my = 0;

  const measure = (): void => {
    const travel = hero.offsetHeight - window.innerHeight;
    target = travel > 0 ? clamp(-hero.getBoundingClientRect().top / travel, 0, 1) : 0;
  };

  let settling = true;
  const wakeWalk = loop(
    () => {
      progress = lerp(progress, target, 0.1);
      mx = lerp(mx, tmx, 0.06);
      my = lerp(my, tmy, 0.06);
      if (Math.abs(progress - target) < 0.0004) progress = target;
      hero.style.setProperty('--p', progress.toFixed(4));
      hero.style.setProperty('--mx', mx.toFixed(4));
      hero.style.setProperty('--my', my.toFixed(4));
      hero.classList.toggle('is-deep', progress > 0.3);
      settling = progress !== target || Math.abs(mx - tmx) > 0.001 || Math.abs(my - tmy) > 0.001;
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
      tmy = (event.clientY / window.innerHeight) * 2 - 1;
      kick();
    });
  }
  kick();

  const aurora = hero.querySelector<HTMLCanvasElement>('[data-f-aurora]');
  if (aurora) wakers.push(initAurora(aurora, () => visible && !document.hidden));

  const spores = hero.querySelector<HTMLCanvasElement>('[data-f-spores]');
  if (spores) wakers.push(initSpores(spores, hero, () => visible && !document.hidden));

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wakers.forEach((wake) => wake());
  });
}

/**
 * The logo's two ribbons as aurora curtains. Drawn at low resolution and
 * scaled up by CSS, which gives the soft glow for free.
 */
function initAurora(canvas: HTMLCanvasElement, isActive: () => boolean): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  const SCALE = 0.25;
  let w = 0;
  let h = 0;

  const resize = (): void => {
    w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
    h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
    canvas.width = w;
    canvas.height = h;
  };
  resize();
  window.addEventListener('resize', resize);

  const ribbons = [
    { stops: LEFT_RIBBON, base: 0.3, amp: 0.1, freq: 2.1, speed: 0.00016, phase: 0, height: 0.42 },
    {
      stops: RIGHT_RIBBON,
      base: 0.4,
      amp: 0.12,
      freq: 1.7,
      speed: 0.00012,
      phase: 2.4,
      height: 0.36,
    },
  ];

  const draw = (time: number): void => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const step = 1;

    for (const ribbon of ribbons) {
      const t = time * ribbon.speed;
      for (let x = 0; x <= w; x += step) {
        const u = x / w;
        const wave =
          Math.sin(u * Math.PI * ribbon.freq + t * 6 + ribbon.phase) * ribbon.amp +
          Math.sin(u * Math.PI * ribbon.freq * 2.3 - t * 4.2 + ribbon.phase) * ribbon.amp * 0.45;
        const top = (ribbon.base + wave) * h;
        const shimmer = 0.6 + 0.4 * Math.sin(u * 11 + t * 18 + ribbon.phase);
        const length = ribbon.height * h * (0.7 + 0.3 * shimmer);
        const [r, g, b] = sample(ribbon.stops, u * 0.85 + 0.15 * Math.sin(t * 3 + ribbon.phase));
        const edge = Math.sin(u * Math.PI);
        const alpha = 0.55 * edge * (0.6 + 0.4 * shimmer);

        const grad = ctx.createLinearGradient(0, top, 0, top + length);
        grad.addColorStop(0, `rgba(${r | 0},${g | 0},${b | 0},0)`);
        grad.addColorStop(0.12, `rgba(${r | 0},${g | 0},${b | 0},${alpha.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r | 0},${g | 0},${b | 0},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, top, step + 0.5, length);
      }
    }
  };

  const wake = loop(draw, isActive);
  wake();
  return wake;
}

interface Spore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colour: number;
  phase: number;
}

/** Glowing spores in the ribbon colours; they part around the pointer. */
function initSpores(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  isActive: () => boolean
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let w = 0;
  let h = 0;
  let spores: Spore[] = [];
  let px = -9999;
  let py = -9999;

  // One pre-rendered glow per colour (cheaper than per-frame gradients)
  const sprites = SPORE_COLOURS.map(([r, g, b]) => {
    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const s = sprite.getContext('2d');
    if (s) {
      const grad = s.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.12, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},0.25)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      s.fillStyle = grad;
      s.fillRect(0, 0, 64, 64);
    }
    return sprite;
  });

  const spawn = (anywhere: boolean): Spore => ({
    x: Math.random() * w,
    y: anywhere ? h * (0.3 + Math.random() * 0.7) : h + 20,
    vx: (Math.random() - 0.5) * 0.15,
    vy: -(0.12 + Math.random() * 0.35),
    size: 10 + Math.random() * 22,
    colour: Math.floor(Math.random() * SPORE_COLOURS.length),
    phase: Math.random() * Math.PI * 2,
  });

  const resize = (): void => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = w < 640 ? 26 : 58;
    spores = Array.from({ length: count }, () => spawn(true));
  };
  resize();
  window.addEventListener('resize', resize);

  if (finePointer) {
    host.addEventListener('pointermove', (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      px = event.clientX - rect.left;
      py = event.clientY - rect.top;
    });
    host.addEventListener('pointerleave', () => {
      px = -9999;
      py = -9999;
    });
  }

  const draw = (time: number): void => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < spores.length; i++) {
      const s = spores[i];
      if (!s) continue;
      const dx = s.x - px;
      const dy = s.y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 140 * 140 && dist2 > 0.01) {
        const force = (1 - Math.sqrt(dist2) / 140) * 0.6;
        const inv = 1 / Math.sqrt(dist2);
        s.vx += dx * inv * force;
        s.vy += dy * inv * force;
      }
      s.vx = lerp(s.vx, Math.sin(time * 0.0004 + s.phase) * 0.2, 0.02);
      s.vy = lerp(s.vy, -(0.15 + (s.size / 32) * 0.3), 0.02);
      s.x += s.vx;
      s.y += s.vy;
      if (s.y < -30 || s.x < -40 || s.x > w + 40) spores[i] = spawn(false);

      const twinkle = 0.45 + 0.55 * Math.sin(time * 0.002 + s.phase);
      const sprite = sprites[s.colour];
      if (!sprite) continue;
      ctx.globalAlpha = clamp(twinkle, 0.1, 1) * clamp(s.y / (h * 0.35), 0, 1);
      ctx.drawImage(sprite, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  };

  const wake = loop(draw, isActive);
  wake();
  return wake;
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

/* ── Marquee ──────────────────────────────────────────────── */

function initMarquee(): void {
  const marquee = document.querySelector<HTMLElement>('[data-f-marquee]');
  const track = marquee?.querySelector<HTMLElement>('[data-f-marquee-track]');
  if (!marquee || !track || reducedMotion) return;

  let offset = 0;
  let boost = 0;
  let lastY = window.scrollY;
  let onScreen = false;

  new IntersectionObserver((entries) => {
    for (const entry of entries) onScreen = entry.isIntersecting;
    if (onScreen) wake();
  }).observe(marquee);

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      boost = clamp(boost + (y - lastY) * 0.08, -14, 14);
      lastY = y;
    },
    { passive: true }
  );

  let last = 0;
  const wake = loop(
    (time) => {
      const dt = last ? Math.min(time - last, 50) : 16;
      last = time;
      const half = track.scrollWidth / 2;
      if (half <= 0) return;
      boost = lerp(boost, 0, 0.06);
      offset -= (0.045 * dt + boost) * 1;
      if (offset <= -half) offset += half;
      if (offset > 0) offset -= half;
      track.style.transform = `translate3d(${offset.toFixed(2)}px,0,0)`;
    },
    () => {
      if (!onScreen) last = 0;
      return onScreen && !document.hidden;
    }
  );
  wake();
}

/* ── Scroll reveals ───────────────────────────────────────── */

function initReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-f-reveal]'));
  if (items.length === 0 || reducedMotion) return;

  root.classList.add('f-reveal-ready');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  items.forEach((item) => observer.observe(item));
}

/* ── Process trail ────────────────────────────────────────── */

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

  let ticking = false;
  const update = (): void => {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const view = window.innerHeight;
    const progress = clamp((view * 0.75 - rect.top) / (rect.height * 0.7), 0, 1);
    section.style.setProperty('--trail', progress.toFixed(3));
    steps.forEach((step, i) => {
      step.classList.toggle('is-lit', progress >= i / steps.length + 0.02);
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

/* ── Pointer niceties (fine pointers only) ───────────────── */

function initPointer(): void {
  if (!finePointer || reducedMotion) return;

  // A soft light that follows the pointer through the forest
  const glow = document.querySelector<HTMLElement>('[data-f-glow]');
  if (glow) {
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let moving = false;
    const wake = loop(
      () => {
        x = lerp(x, tx, 0.12);
        y = lerp(y, ty, 0.12);
        glow.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
        moving = Math.abs(x - tx) > 0.3 || Math.abs(y - ty) > 0.3;
      },
      () => moving
    );
    window.addEventListener('pointermove', (event: PointerEvent) => {
      tx = event.clientX;
      ty = event.clientY;
      glow.classList.add('is-on');
      moving = true;
      wake();
    });
    document.documentElement.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
  }

  // Magnetic buttons
  document.querySelectorAll<HTMLElement>('[data-f-magnetic]').forEach((el) => {
    const label = el.firstElementChild instanceof HTMLElement ? el.firstElementChild : null;
    el.addEventListener('pointermove', (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const dy = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      el.style.transform = `translate3d(${(dx * 6).toFixed(2)}px,${(dy * 5).toFixed(2)}px,0)`;
      if (label)
        label.style.transform = `translate3d(${(dx * 4).toFixed(2)}px,${(dy * 3).toFixed(2)}px,0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
      if (label) label.style.transform = '';
    });
  });

  // Project windows tilt toward the pointer, with a moving highlight
  document.querySelectorAll<HTMLElement>('[data-f-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const u = (event.clientX - rect.left) / rect.width;
      const v = (event.clientY - rect.top) / rect.height;
      el.classList.add('is-tilting');
      el.style.setProperty('--ry', ((u - 0.5) * 9).toFixed(2));
      el.style.setProperty('--rx', ((0.5 - v) * 7).toFixed(2));
      el.style.setProperty('--gx', `${(u * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(v * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0');
      el.style.setProperty('--ry', '0');
    });
  });
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
    const duration = 700;
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
initMarquee();
initReveal();
initTrail();
initPointer();
initPricing();
