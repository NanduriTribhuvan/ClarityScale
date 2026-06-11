/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import '../styles/aurora.css';

/**
 * AuroraCanvas — a reactive "aurora" hero background.
 *
 * Pure Canvas 2D + a single requestAnimationFrame loop (no WebGL, no GSAP).
 * It paints layered, drifting radial-gradient "blobs" composited with the
 * `screen` blend mode, plus a faint constellation of floating particles that
 * connect with thin lines when near. The whole field eases toward the pointer
 * (parallax) and briefly intensifies when the user scrolls quickly.
 *
 * Lifecycle / performance:
 *  - Sizes to its parent with devicePixelRatio capped at 2 and reacts to resize.
 *  - Pauses the loop when the tab is hidden or the canvas leaves the viewport.
 *  - Cleans up every listener, observer, and rAF frame on unmount.
 *  - Honours `prefers-reduced-motion`: draws one calm static frame, no loop.
 *  - SSR-safe: all window/document access lives inside useEffect.
 */

// Brand palette as RGB triples so we can vary alpha per layer/frame.
const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [0, 212, 255], // cyan   #00d4ff
  [41, 121, 255], // blue   #2979ff
  [106, 29, 224], // purple #6a1de0
  [139, 25, 214], // violet #8b19d6
  [212, 31, 176], // pink   #d41fb0
];

/** A large soft gradient cloud that drifts with independent sine motion. */
interface Blob {
  baseX: number; // home position (fraction of width)
  baseY: number; // home position (fraction of height)
  radius: number; // fraction of the smaller viewport dimension
  color: readonly [number, number, number];
  // Per-axis sine parameters for organic drift.
  ampX: number;
  ampY: number;
  speedX: number;
  speedY: number;
  phaseX: number;
  phaseY: number;
  parallax: number; // how strongly this layer follows the pointer
}

/** A small floating point for the constellation field. */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  parallax: number;
}

/** Linear interpolation helper for eased easing toward targets. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function AuroraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // -------------------------------------------------- reduced motion
    // Respect the user's preference: paint a single calm frame and bail out
    // before wiring up any animation loop or listeners.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // -------------------------------------------------- sizing state
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssW = 0; // logical (CSS) pixel width
    let cssH = 0; // logical (CSS) pixel height

    /** Resize the backing store to the parent box at the capped DPR. */
    const resize = () => {
      const parent = canvas.parentElement ?? canvas;
      const rect = parent.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      // Draw in CSS pixels; the transform scales to device pixels.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // -------------------------------------------------- build the field
    // 5 large drifting blobs, one per brand colour.
    const blobs: Blob[] = PALETTE.map((color, i) => {
      const angle = (i / PALETTE.length) * Math.PI * 2;
      return {
        baseX: 0.5 + Math.cos(angle) * 0.28,
        baseY: 0.5 + Math.sin(angle) * 0.28,
        radius: 0.42 + (i % 3) * 0.08,
        color,
        ampX: 0.05 + (i % 2) * 0.03,
        ampY: 0.06 + (i % 3) * 0.025,
        speedX: 0.06 + i * 0.012,
        speedY: 0.05 + i * 0.009,
        phaseX: angle,
        phaseY: angle * 1.7,
        parallax: 0.02 + i * 0.01,
      };
    });

    // Particle count scales gently with area but stays capped for perf.
    const particleCount = Math.max(60, Math.min(100, Math.round((cssW * cssH) / 18000)));
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        parallax: 0.01 + Math.random() * 0.04,
      });
    }
    const CONNECT_DIST = 120; // px distance below which particles link

    // -------------------------------------------------- pointer parallax
    // Target offset is driven by the pointer; the rendered offset eases toward
    // it so motion feels smooth rather than snapping.
    let pointerTX = 0;
    let pointerTY = 0;
    let pointerX = 0;
    let pointerY = 0;

    const onPointerMove = (e: PointerEvent) => {
      // Normalise pointer to [-1, 1] relative to the viewport centre.
      pointerTX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerTY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    // -------------------------------------------------- scroll velocity
    // Fast scrolling briefly raises `intensity`, which boosts drift speed and
    // brightness; it decays back to a calm baseline each frame.
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let intensity = 0; // 0 = calm, 1 = energetic

    const onScroll = () => {
      const y = window.scrollY;
      scrollVelocity = Math.abs(y - lastScrollY);
      lastScrollY = y;
      // Map raw velocity to a bounded burst of energy.
      intensity = Math.min(1, intensity + Math.min(scrollVelocity / 120, 0.6));
    };

    // -------------------------------------------------- the render
    /** Paint one frame. `time` is in seconds; `animated` toggles motion. */
    const render = (time: number, animated: boolean) => {
      // Eased parallax offset (skipped visually when not animated).
      if (animated) {
        pointerX = lerp(pointerX, pointerTX, 0.05);
        pointerY = lerp(pointerY, pointerTY, 0.05);
        intensity = lerp(intensity, 0, 0.04); // decay toward calm
      }

      const minDim = Math.min(cssW, cssH);
      const energy = animated ? 1 + intensity * 0.8 : 1;

      // Deep, dark base so the screen-blended layers read as luminous aurora.
      ctx.globalCompositeOperation = 'source-over';
      const bg = ctx.createLinearGradient(0, 0, 0, cssH);
      bg.addColorStop(0, '#05060f');
      bg.addColorStop(1, '#0a0418');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);

      // --- Layered aurora blobs (additive 'screen' blend) ---
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        if (!b) continue; // guard for noUncheckedIndexedAccess
        const t = animated ? time : 0;
        const driftX = Math.sin(t * b.speedX + b.phaseX) * b.ampX * energy;
        const driftY = Math.cos(t * b.speedY + b.phaseY) * b.ampY * energy;
        const px = (b.baseX + driftX) * cssW + pointerX * cssW * b.parallax;
        const py = (b.baseY + driftY) * cssH + pointerY * cssH * b.parallax;
        const r = b.radius * minDim;

        const [cr, cg, cb] = b.color;
        const peak = Math.min(0.42, 0.26 + intensity * 0.16); // brighten on scroll
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${peak})`);
        grad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${peak * 0.35})`);
        grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Constellation particles + connecting lines ('lighter' blend) ---
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue; // guard for noUncheckedIndexedAccess
        if (animated) {
          p.x += p.vx * energy;
          p.y += p.vy * energy;
          // Wrap around the edges to keep the field continuous.
          if (p.x < 0) p.x += cssW;
          else if (p.x > cssW) p.x -= cssW;
          if (p.y < 0) p.y += cssH;
          else if (p.y > cssH) p.y -= cssH;
        }
        const dx = pointerX * cssW * p.parallax;
        const dy = pointerY * cssH * p.parallax;
        const sx = p.x + dx;
        const sy = p.y + dy;

        // Soft point.
        ctx.fillStyle = `rgba(140, 200, 255, ${0.5 + intensity * 0.3})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Link to nearby particles with a faint line (constellation effect).
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          if (!q) continue; // guard for noUncheckedIndexedAccess
          const qx = q.x + pointerX * cssW * q.parallax;
          const qy = q.y + pointerY * cssH * q.parallax;
          const ddx = sx - qx;
          const ddy = sy - qy;
          const dist = Math.hypot(ddx, ddy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * (0.12 + intensity * 0.1);
            ctx.strokeStyle = `rgba(120, 170, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(qx, qy);
            ctx.stroke();
          }
        }
      }

      // Reset to default for any subsequent draws.
      ctx.globalCompositeOperation = 'source-over';
    };

    // -------------------------------------------------- reduced-motion path
    // One static, calm frame — no loop, no listeners beyond what we attached.
    if (reduceMotion) {
      render(0, false);
      const onResizeStatic = () => {
        resize();
        render(0, false);
      };
      window.addEventListener('resize', onResizeStatic);
      return () => {
        window.removeEventListener('resize', onResizeStatic);
      };
    }

    // -------------------------------------------------- animation loop
    let rafId = 0;
    let running = false;
    let startTime = 0;

    const frame = (now: number) => {
      if (!running) return;
      if (startTime === 0) startTime = now;
      const time = (now - startTime) / 1000; // seconds
      render(time, true);
      rafId = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      // Reset the clock origin so paused time doesn't cause a visual jump.
      startTime = 0;
      rafId = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    // -------------------------------------------------- visibility gating
    // Pause when the tab is hidden; resume when it returns (and still in view).
    let inView = true;
    const updateRunState = () => {
      if (inView && !document.hidden) start();
      else stop();
    };

    const onVisibility = () => updateRunState();

    // Pause when scrolled out of view to save cycles.
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) inView = entry.isIntersecting;
          updateRunState();
        },
        { threshold: 0 },
      );
      observer.observe(canvas);
    }

    // Resize handling — prefer ResizeObserver on the parent, fall back to window.
    let resizeObserver: ResizeObserver | null = null;
    const onWindowResize = () => resize();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas.parentElement ?? canvas);
    } else {
      window.addEventListener('resize', onWindowResize);
    }

    // Reactive input listeners (passive — we never block scroll/pointer).
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    // Kick things off.
    updateRunState();

    // -------------------------------------------------- cleanup
    return () => {
      stop();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onWindowResize);
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Single decorative canvas element; sizing/painting handled imperatively.
  return <canvas ref={canvasRef} class="aurora-canvas" aria-hidden="true" />;
}
