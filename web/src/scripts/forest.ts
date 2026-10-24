/**
 * Forest theme behaviour (no dependencies).
 *
 * - Hero walk-in: maps scroll progress through the hero to the CSS custom
 *   property --p (0 → 1) and the pointer to --mx / --my (-1 → 1). All visual
 *   work happens in forest.css; this file only writes numbers.
 * - Navigation: scrolled state, mobile menu, and scroll-spy (aria-current).
 * - Pricing: monthly / one-project toggle.
 *
 * Every feature checks for its markup first, so the script is safe on any
 * page that uses the forest navigation.
 */

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function initHero(): void {
  const hero = document.querySelector<HTMLElement>('[data-f-hero]');
  if (!hero) return;

  // Pause ambient loops when the hero is out of view.
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      hero.classList.toggle('is-offscreen', !entry.isIntersecting);
    }
  });
  visibility.observe(hero);

  if (reducedMotion.matches) return;

  // Enables the tall, scroll-driven hero in CSS.
  root.classList.add('f-motion');

  let frame = 0;
  let mx = 0;
  let my = 0;

  const update = (): void => {
    frame = 0;
    const travel = hero.offsetHeight - window.innerHeight;
    const progress = travel > 0 ? clamp01(-hero.getBoundingClientRect().top / travel) : 0;
    hero.style.setProperty('--p', progress.toFixed(4));
    hero.style.setProperty('--mx', mx.toFixed(3));
    hero.style.setProperty('--my', my.toFixed(3));
    hero.classList.toggle('is-deep', progress > 0.3);
  };

  const request = (): void => {
    if (frame === 0) frame = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  hero.addEventListener('pointermove', (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    mx = (event.clientX / window.innerWidth) * 2 - 1;
    my = (event.clientY / window.innerHeight) * 2 - 1;
    request();
  });

  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    root.classList.remove('f-motion');
    hero.style.setProperty('--p', '0');
    hero.style.setProperty('--mx', '0');
    hero.style.setProperty('--my', '0');
  });

  request();
}

function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-f-nav]');
  if (!nav) return;

  const onScroll = (): void => {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const toggle = nav.querySelector<HTMLButtonElement>('[data-f-menu-toggle]');
  const menu = document.getElementById('f-menu');
  if (toggle && menu) {
    const setOpen = (open: boolean): void => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      document.body.classList.toggle('f-menu-open', open);
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
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

function initPricing(): void {
  const group = document.querySelector<HTMLElement>('[data-f-billing]');
  if (!group) return;

  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button[data-mode]'));
  const swappable = Array.from(
    document.querySelectorAll<HTMLElement>('[data-f-price], [data-f-period]')
  );

  const apply = (mode: string): void => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    }
    for (const el of swappable) {
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
initPricing();
