/** @jsxImportSource preact */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'preact/hooks';
import '../styles/idea-board.css';

/**
 * IdeaBoard — the agency's signature interactive "Idea Board" island.
 *
 * A draggable, physics-flung wall of project tiles (a reimagined Pinterest
 * board). Renders as a `client:visible` Preact island on an SSR page, so every
 * window/document touch is guarded and all heavy GSAP code is imported
 * dynamically inside an effect (kept off the critical path).
 *
 * Progressive enhancement contract:
 *  - With GSAP        → drag + throw/inertia, idle drift, hover lift, Flip-based
 *                       expand into a full-screen case-study overlay.
 *  - Reduced motion   → no inertia / drift / Flip; overlay opens & closes
 *                       instantly but stays fully usable.
 *  - GSAP import fails → board still renders statically and tiles still open
 *                       the overlay instantly. Nothing throws.
 */

type Stat = { label: string; value: string };

type Project = {
  title: string;
  category: string;
  metric: string;
  /** gradient stops, expressed with the global brand tokens */
  g1: string;
  g2: string;
  desc: string;
  stats: Stat[];
  /** deterministic masonry placement on the draggable plane (px) */
  x: number;
  y: number;
  w: number;
  h: number;
};

const PLANE_W = 1640;
const PLANE_H = 1240;

/** Slugify a title to match the data slugs used by the /work pages. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const PROJECTS: Project[] = [
  {
    title: 'NovaBrew',
    category: 'E-Commerce',
    metric: '+340% traffic',
    g1: 'var(--cyan)',
    g2: 'var(--blue)',
    desc: 'A craft-coffee storefront rebuilt for speed and story. We paired a headless commerce stack with editorial product pages, turning casual scrollers into subscribers.',
    stats: [
      { label: 'Organic traffic', value: '+340%' },
      { label: 'Conversion', value: '4.8%' },
      { label: 'Page weight', value: '−61%' },
    ],
    x: 48,
    y: 64,
    w: 264,
    h: 312,
  },
  {
    title: 'Luxe Realty',
    category: 'SEO',
    metric: '+212% leads',
    g1: 'var(--purple)',
    g2: 'var(--violet)',
    desc: 'Technical SEO and a content engine for a luxury property group. Structured data plus market-level landing pages pushed them to the top of high-intent searches.',
    stats: [
      { label: 'Qualified leads', value: '+212%' },
      { label: 'Keywords #1', value: '38' },
      { label: 'Time to rank', value: '9 wks' },
    ],
    x: 344,
    y: 40,
    w: 244,
    h: 220,
  },
  {
    title: 'PeakFit',
    category: 'Branding',
    metric: '2.1M reach',
    g1: 'var(--pink)',
    g2: 'var(--orange)',
    desc: 'A bold identity system for a performance fitness brand — type, motion and a flexible logo built to flex across launch campaigns and packaging.',
    stats: [
      { label: 'Launch reach', value: '2.1M' },
      { label: 'Brand recall', value: '+74%' },
      { label: 'Assets shipped', value: '120+' },
    ],
    x: 620,
    y: 96,
    w: 224,
    h: 288,
  },
  {
    title: 'Zenit SaaS',
    category: 'Web',
    metric: '+58% signups',
    g1: 'var(--blue)',
    g2: 'var(--cyan)',
    desc: 'A marketing site and onboarding flow for a B2B analytics platform. Crisp messaging, interactive product tours and a frictionless trial path lifted activation.',
    stats: [
      { label: 'Free trials', value: '+58%' },
      { label: 'Activation', value: '+33%' },
      { label: 'LCP', value: '0.9s' },
    ],
    x: 880,
    y: 52,
    w: 300,
    h: 244,
  },
  {
    title: 'Aurora Labs',
    category: 'Branding',
    metric: '+90 NPS',
    g1: 'var(--violet)',
    g2: 'var(--pink)',
    desc: 'Naming, identity and a living design language for a research studio. A spectral gradient system ties product, deck and web into one coherent universe.',
    stats: [
      { label: 'NPS', value: '+90' },
      { label: 'Funding raised', value: '$12M' },
      { label: 'Press hits', value: '40+' },
    ],
    x: 1224,
    y: 84,
    w: 296,
    h: 300,
  },
  {
    title: 'Vertex',
    category: 'E-Commerce',
    metric: '+5.4x ROAS',
    g1: 'var(--blue)',
    g2: 'var(--purple)',
    desc: 'A performance-marketing rebuild for a DTC hardware brand. We rewired the funnel, sharpened the PDP and let the creative do the heavy lifting.',
    stats: [
      { label: 'ROAS', value: '5.4x' },
      { label: 'AOV', value: '+41%' },
      { label: 'Checkout drop-off', value: '−28%' },
    ],
    x: 60,
    y: 404,
    w: 300,
    h: 236,
  },
  {
    title: 'Bloom & Co',
    category: 'E-Commerce',
    metric: '+180% sales',
    g1: 'var(--pink)',
    g2: 'var(--violet)',
    desc: 'A florist gone digital. Same-day delivery logic, gift flows and a calm, tactile interface made repeat ordering feel effortless.',
    stats: [
      { label: 'Online sales', value: '+180%' },
      { label: 'Repeat rate', value: '52%' },
      { label: 'Returns', value: '−12%' },
    ],
    x: 404,
    y: 308,
    w: 256,
    h: 300,
  },
  {
    title: 'Halo Studio',
    category: 'Web',
    metric: '0.4s LCP',
    g1: 'var(--cyan)',
    g2: 'var(--purple)',
    desc: 'A portfolio site for a motion studio that had to feel as good as the work. Edge-rendered, image-optimised and obsessively fast.',
    stats: [
      { label: 'LCP', value: '0.4s' },
      { label: 'Lighthouse', value: '100' },
      { label: 'Bounce', value: '−37%' },
    ],
    x: 700,
    y: 424,
    w: 284,
    h: 224,
  },
  {
    title: 'Drift',
    category: 'Branding',
    metric: '+320% follows',
    g1: 'var(--orange)',
    g2: 'var(--pink)',
    desc: 'A social-first identity for a travel app. A kinetic logo and template kit let the team ship on-brand content at the speed of the feed.',
    stats: [
      { label: 'Followers', value: '+320%' },
      { label: 'Saves', value: '+5x' },
      { label: 'Content time', value: '−60%' },
    ],
    x: 1024,
    y: 380,
    w: 240,
    h: 264,
  },
  {
    title: 'Monolith',
    category: 'Web',
    metric: '99/100 perf',
    g1: 'var(--blue)',
    g2: 'var(--violet)',
    desc: 'A corporate platform replatform — design system, CMS and a component library that let a non-technical team publish without breaking a thing.',
    stats: [
      { label: 'Perf score', value: '99' },
      { label: 'Publish time', value: '−80%' },
      { label: 'Components', value: '64' },
    ],
    x: 1308,
    y: 432,
    w: 260,
    h: 300,
  },
  {
    title: 'Pulse',
    category: 'SEO',
    metric: '#1 rankings',
    g1: 'var(--cyan)',
    g2: 'var(--blue)',
    desc: 'A programmatic SEO build for a health platform. Thousands of templated, genuinely useful pages — each one fast, structured and intent-matched.',
    stats: [
      { label: 'Top-3 keywords', value: '1.2k' },
      { label: 'Indexed pages', value: '8.4k' },
      { label: 'Organic clicks', value: '+460%' },
    ],
    x: 132,
    y: 724,
    w: 280,
    h: 256,
  },
  {
    title: 'Kindred',
    category: 'E-Commerce',
    metric: '+260% AOV',
    g1: 'var(--purple)',
    g2: 'var(--pink)',
    desc: 'A subscription marketplace with bundling, gifting and a recommendation layer that nudges shoppers toward the perfect basket every time.',
    stats: [
      { label: 'AOV', value: '+260%' },
      { label: 'LTV', value: '+3.1x' },
      { label: 'Churn', value: '−19%' },
    ],
    x: 452,
    y: 668,
    w: 300,
    h: 240,
  },
];

function tileStyle(p: Project): string {
  return [
    `left:${p.x}px`,
    `top:${p.y}px`,
    `width:${p.w}px`,
    `height:${p.h}px`,
    `--g1:${p.g1}`,
    `--g2:${p.g2}`,
  ].join(';');
}

export default function IdeaBoard() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /** Latest loaded GSAP context (mutable, never triggers re-render). */
  const gsapCtx = useRef<{ gsap: any; Flip: any; reduced: boolean; ready: boolean }>({
    gsap: null,
    Flip: null,
    reduced: false,
    ready: false,
  });
  /** True while a real drag is in progress, so we can swallow the trailing click. */
  const draggedRef = useRef(false);
  const prevOverflow = useRef<string>('');

  const [active, setActive] = useState<number | null>(null);
  const activeTile: Project | null = active != null ? (PROJECTS[active] ?? null) : null;

  // ── Load GSAP + plugins, wire up Draggable / inertia / idle drift ──────────
  useEffect(() => {
    let cancelled = false;
    const draggables: any[] = [];
    let drift: any = null;
    let revealTween: any = null;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsapCtx.current.reduced = reduced;

    (async () => {
      try {
        const gsapMod = await import('gsap');
        const DraggableMod = await import('gsap/Draggable');
        const InertiaMod = await import('gsap/InertiaPlugin');
        const FlipMod = await import('gsap/Flip');
        const ScrollTriggerMod = await import('gsap/ScrollTrigger');
        if (cancelled) return;

        const gsap = (gsapMod as any).gsap ?? (gsapMod as any).default;
        const Draggable = (DraggableMod as any).Draggable ?? (DraggableMod as any).default;
        const InertiaPlugin =
          (InertiaMod as any).InertiaPlugin ?? (InertiaMod as any).default;
        const Flip = (FlipMod as any).Flip ?? (FlipMod as any).default;
        const ScrollTrigger =
          (ScrollTriggerMod as any).ScrollTrigger ?? (ScrollTriggerMod as any).default;

        gsap.registerPlugin(Draggable, InertiaPlugin, Flip, ScrollTrigger);

        gsapCtx.current.gsap = gsap;
        gsapCtx.current.Flip = Flip;
        gsapCtx.current.ready = true;

        const viewport = viewportRef.current;
        const plane = planeRef.current;
        if (!viewport || !plane) return;

        // Centre the (oversized) plane within the clipped viewport.
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        const pw = plane.offsetWidth;
        const ph = plane.offsetHeight;
        gsap.set(plane, { x: (vw - pw) / 2, y: (vh - ph) / 2 });

        const created = Draggable.create(plane, {
          type: 'x,y',
          inertia: !reduced,
          bounds: viewport,
          edgeResistance: 0.85,
          dragClickables: true,
          allowContextMenu: true,
          onPress() {
            if (drift) drift.kill();
            drift = null;
            draggedRef.current = false;
          },
          onDrag() {
            draggedRef.current = true;
          },
          onDragEnd() {
            // Let the swallowed click pass, then clear the flag.
            gsap.delayedCall(0.01, () => {
              draggedRef.current = false;
            });
          },
        });
        if (Array.isArray(created)) draggables.push(...created);

        // Gentle idle drift until the first interaction (skipped if reduced).
        if (!reduced) {
          drift = gsap.to(plane, {
            x: '+=26',
            y: '-=18',
            duration: 7,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });

          revealTween = gsap.from(viewport, {
            opacity: 0,
            y: 48,
            duration: 0.9,
            ease: 'power2.out',
            scrollTrigger: { trigger: viewport, start: 'top 82%' },
          });
        }
      } catch {
        // Dynamic import / plugin failure → static, instant-overlay fallback.
        gsapCtx.current.ready = false;
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (drift) drift.kill();
        if (revealTween) {
          if (revealTween.scrollTrigger) revealTween.scrollTrigger.kill();
          revealTween.kill();
        }
        draggables.forEach((d) => d.kill());
      } catch {
        /* nothing meaningful to recover here */
      }
      // Always restore scroll if we unmount with an overlay open.
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prevOverflow.current;
      }
    };
  }, []);

  // ── Open animation: runs whenever a tile becomes active ────────────────────
  useEffect(() => {
    if (active == null) return;
    const ov = overlayRef.current;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!ov || !panel) return;

    ov.style.display = 'flex';
    const { gsap, Flip, reduced, ready } = gsapCtx.current;
    const tileEl = tileRefs.current[active] ?? null;

    const focusClose = () => closeBtnRef.current?.focus();

    if (!ready || reduced || !Flip || !gsap || !tileEl) {
      // Instant, no-animation path (fallback / reduced motion).
      ov.style.opacity = '1';
      if (backdrop) backdrop.style.opacity = '1';
      focusClose();
      return;
    }

    // Clear any inline styles left by a previous close, then Flip the panel
    // out from the clicked tile's on-screen bounds into its full layout.
    gsap.set(panel, { clearProps: 'all' });
    gsap.set(ov, { opacity: 1 });
    if (backdrop) gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 });

    const state = Flip.getState(panel);
    Flip.fit(panel, tileEl, { absolute: true });
    Flip.from(state, {
      duration: 0.55,
      ease: 'power3.inOut',
      absolute: true,
    });
    focusClose();
  }, [active]);

  // ── Escape-to-close, only while the overlay is open ────────────────────────
  useEffect(() => {
    if (active == null || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOverlay();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function openTile(i: number) {
    if (draggedRef.current) return; // it was a drag, not a click
    if (typeof document !== 'undefined') {
      prevOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    setActive(i);
  }

  function closeOverlay() {
    const ov = overlayRef.current;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!ov) return;

    const { gsap, Flip, reduced, ready } = gsapCtx.current;
    const tileEl = active != null ? (tileRefs.current[active] ?? null) : null;
    const returnFocusTo = tileEl;

    const finish = () => {
      if (gsap && panel) gsap.set(panel, { clearProps: 'all' });
      ov.style.display = 'none';
      ov.style.opacity = '';
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prevOverflow.current;
      }
      setActive(null);
      returnFocusTo?.focus();
    };

    if (!ready || reduced || !Flip || !gsap || !panel || !tileEl) {
      finish();
      return;
    }

    if (backdrop) gsap.to(backdrop, { opacity: 0, duration: 0.35 });
    Flip.fit(panel, tileEl, {
      duration: 0.5,
      ease: 'power3.inOut',
      absolute: true,
      onComplete: finish,
    });
  }

  function onTileEnter(i: number) {
    const { gsap, ready, reduced } = gsapCtx.current;
    if (!ready || reduced || !gsap) return;
    const el = tileRefs.current[i];
    if (el) {
      gsap.to(el, {
        scale: 1.06,
        zIndex: 6,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true,
      });
    }
    // Neighbours subtly recede.
    [tileRefs.current[i - 1], tileRefs.current[i + 1]].forEach((n) => {
      if (n) gsap.to(n, { scale: 0.97, opacity: 0.82, duration: 0.3, overwrite: true });
    });
  }

  function onTileLeave(i: number) {
    const { gsap, ready, reduced } = gsapCtx.current;
    if (!ready || reduced || !gsap) return;
    const el = tileRefs.current[i];
    if (el) {
      gsap.to(el, { scale: 1, zIndex: 1, duration: 0.35, ease: 'power2.out', overwrite: true });
    }
    [tileRefs.current[i - 1], tileRefs.current[i + 1]].forEach((n) => {
      if (n) gsap.to(n, { scale: 1, opacity: 1, duration: 0.35, overwrite: true });
    });
  }

  return (
    <section id="work" class="idea-board-section section" aria-label="Our work">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Our Work</span>
          <h2 class="section-title">
            Explore the <span class="gradient-text">board</span>
          </h2>
          <p class="section-sub">Drag, fling, and click any tile to dive in.</p>
        </div>
      </div>

      <div class="ib-viewport" ref={viewportRef}>
        <div class="ib-plane" ref={planeRef} style={`width:${PLANE_W}px;height:${PLANE_H}px`}>
          {PROJECTS.map((p, i) => (
            <button
              type="button"
              key={p.title}
              class="ib-tile"
              style={tileStyle(p)}
              ref={(el) => {
                tileRefs.current[i] = el as HTMLButtonElement | null;
              }}
              aria-label={`Open case study: ${p.title}, ${p.category}, ${p.metric}`}
              onClick={() => openTile(i)}
              onMouseEnter={() => onTileEnter(i)}
              onMouseLeave={() => onTileLeave(i)}
              onFocus={() => onTileEnter(i)}
              onBlur={() => onTileLeave(i)}
            >
              <span class="ib-tile-sheen" aria-hidden="true" />
              <span class="ib-tile-cat">{p.category}</span>
              <span class="ib-tile-body">
                <span class="ib-tile-title">{p.title}</span>
                <span class="ib-tile-metric">{p.metric}</span>
              </span>
            </button>
          ))}
        </div>

        <div class="ib-hint" aria-hidden="true">
          <span class="ib-hint-dot" /> Drag to explore
        </div>
      </div>

      {/* Case-study overlay — lives in this island's own DOM, fixed & on top. */}
      <div
        class="ib-overlay"
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label={activeTile ? `${activeTile.title} case study` : 'Case study'}
        aria-hidden={active == null ? 'true' : 'false'}
      >
        <div class="ib-backdrop" ref={backdropRef} onClick={closeOverlay} />
        <div class="ib-panel" ref={panelRef} style={activeTile ? tilePanelGradient(activeTile) : ''}>
          <button
            type="button"
            class="ib-close"
            ref={closeBtnRef}
            aria-label="Close case study"
            onClick={closeOverlay}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {activeTile && (
            <div class="ib-panel-inner">
              <span class="ib-panel-cat">{activeTile.category}</span>
              <h3 class="ib-panel-title">{activeTile.title}</h3>
              <p class="ib-panel-metric">{activeTile.metric}</p>
              <p class="ib-panel-desc">{activeTile.desc}</p>
              <div class="ib-stat-row">
                {activeTile.stats.map((s) => (
                  <div class="ib-stat-chip" key={s.label}>
                    <span class="ib-stat-value">{s.value}</span>
                    <span class="ib-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
              <a class="ib-panel-cta btn btn-primary" href={`/work/${slugify(activeTile.title)}`}>
                View full case study →
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Feed the active project's gradient stops into the overlay panel. */
function tilePanelGradient(p: Project): string {
  return `--g1:${p.g1};--g2:${p.g2}`;
}
