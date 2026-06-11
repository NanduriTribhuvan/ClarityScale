/**
 * ClarityScale — script.js
 * GSAP animations, scroll reveals, navbar, interactions
 * Requires: GSAP 3.12 + ScrollTrigger (loaded via CDN)
 */

/* ── Wait for DOM ── */
document.addEventListener('DOMContentLoaded', () => {

  /* Register GSAP ScrollTrigger plugin */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  initNavbar();
  initMobileMenu();
  initHeroAnimations();
  initScrollReveal();
  initSmoothScroll();
  initPricingToggle();
  initActiveNavLinks();
  initParallax();
  initFloatCards();
  initDashboardAnimations();
  initCursorGlow();

});


/* ============================================================
   NAVBAR — scroll state + active link
============================================================ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load

  /* GSAP entrance */
  if (typeof gsap !== 'undefined') {
    gsap.from(navbar, {
      y: -80,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.1
    });
  }
}


/* ============================================================
   MOBILE MENU
============================================================ */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobileDrawer');
  const overlay   = document.getElementById('mobileOverlay');
  if (!hamburger || !drawer || !overlay) return;

  const mobileLinks = document.querySelectorAll('.mobile-link');

  function openMenu() {
    hamburger.classList.add('active');
    drawer.classList.add('open');
    overlay.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (drawer.classList.contains('open')) closeMenu();
    else openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* Close on ESC */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
}


/* ============================================================
   HERO ANIMATIONS (GSAP stagger entrance)
============================================================ */
function initHeroAnimations() {
  if (typeof gsap === 'undefined') return;

  const tl = gsap.timeline({ delay: 0.3 });

  /* Badge */
  tl.from('.hero-badge', {
    y: 20, opacity: 0, duration: 0.6, ease: 'power3.out'
  });

  /* Headline words stagger */
  tl.from('.hero-headline', {
    y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'
  }, '-=0.3');

  /* Sub */
  tl.from('.hero-sub', {
    y: 20, opacity: 0, duration: 0.6, ease: 'power2.out'
  }, '-=0.5');

  /* CTA buttons */
  tl.from('.hero-cta-row .btn', {
    y: 20, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out'
  }, '-=0.4');

  /* Stats */
  tl.from('.hero-stat, .stat-sep', {
    y: 16, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out'
  }, '-=0.3');

  /* Hero visual */
  tl.from('.hero-logo-wrap', {
    scale: 0.85, opacity: 0, duration: 0.9, ease: 'back.out(1.4)'
  }, '-=0.8');

  /* Float cards stagger in */
  tl.from('.float-card', {
    scale: 0.7, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.6)'
  }, '-=0.5');

  /* Scroll cue */
  tl.from('.scroll-cue', {
    opacity: 0, duration: 0.5
  }, '-=0.2');

  /* Counter animation for stats */
  animateCounters();
}

/* Animated number counters in hero stats */
function animateCounters() {
  const counters = [
    { el: '.hero-stats .stat-value:nth-child(1)', target: 10, suffix: 'K+', prefix: '' },
  ];

  document.querySelectorAll('.stat-value').forEach(el => {
    const text = el.textContent.trim();
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return;

    const prefix = text.match(/^\$/) ? '$' : '';
    const suffix = text.replace(/^[$0-9.]+/, '');

    if (typeof gsap !== 'undefined') {
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
        }
      });
    }
  });
}


/* ============================================================
   SCROLL REVEAL (Intersection Observer + GSAP)
============================================================ */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('[data-scroll-reveal]');
  if (!revealEls.length) return;

  /* Mark elements for animation ONLY after JS confirms it can handle them.
     This prevents blank sections when GSAP CDN fails (e.g. localhost offline). */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    /* GSAP path: add will-animate class first, then animate in */
    revealEls.forEach(el => {
      el.classList.add('will-animate');
      const delay = parseFloat(el.getAttribute('data-delay') || 0) / 1000;
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        y: 40, opacity: 0, duration: 0.75, delay: delay, ease: 'power3.out',
        onStart: () => el.classList.add('will-animate'),
        onComplete: () => { el.classList.add('revealed'); el.classList.remove('will-animate'); }
      });
    });
  } else {
    /* IntersectionObserver fallback — mark + reveal with CSS */
    revealEls.forEach(el => el.classList.add('will-animate'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.getAttribute('data-delay') || 0);
          setTimeout(() => {
            el.classList.add('revealed');
            el.classList.remove('will-animate');
          }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  }
}


/* ============================================================
   SMOOTH SCROLL
============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#' || !href) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;

      if (typeof gsap !== 'undefined') {
        gsap.to(window, {
          scrollTo: { y: top, autoKill: false },
          duration: 1,
          ease: 'power3.inOut'
        });
        /* Note: gsap.to window scrollTo requires ScrollToPlugin.
           Fallback gracefully: */
      }

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ============================================================
   ACTIVE NAV LINK (scroll spy)
============================================================ */
function initActiveNavLinks() {
  const sections  = document.querySelectorAll('section[id], footer[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0
  });

  sections.forEach(s => observer.observe(s));
}


/* ============================================================
   PRICING TOGGLE (monthly / annual)
============================================================ */
function initPricingToggle() {
  const toggle = document.getElementById('billingToggle');
  if (!toggle) return;

  const amounts = document.querySelectorAll('.price-amount');

  toggle.addEventListener('change', () => {
    const isAnnual = toggle.checked;

    amounts.forEach(el => {
      const monthly = el.getAttribute('data-monthly');
      const annual  = el.getAttribute('data-annual');
      if (!monthly || !annual) return;

      if (typeof gsap !== 'undefined') {
        gsap.to(el, {
          y: -10, opacity: 0, duration: 0.2, ease: 'power2.in',
          onComplete: () => {
            el.textContent = isAnnual ? annual : monthly;
            gsap.to(el, { y: 10, opacity: 0, duration: 0 });
            gsap.to(el, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
          }
        });
      } else {
        el.textContent = isAnnual ? annual : monthly;
      }
    });
  });
}


/* ============================================================
   PARALLAX (subtle hero depth)
============================================================ */
function initParallax() {
  if (typeof gsap === 'undefined') return;

  const orbs = document.querySelectorAll('.hero .orb');
  const heroContent = document.querySelector('.hero-content');
  const heroVisual  = document.querySelector('.hero-visual');

  if (!orbs.length) return;

  window.addEventListener('mousemove', e => {
    const mx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1 to 1
    const my = (e.clientY / window.innerHeight - 0.5) * 2;

    orbs.forEach((orb, i) => {
      const depth = (i + 1) * 12;
      gsap.to(orb, {
        x: mx * depth,
        y: my * depth,
        duration: 1.2,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    });

    /* Subtle tilt on hero visual */
    if (heroVisual) {
      gsap.to(heroVisual, {
        rotateY: mx * 4,
        rotateX: -my * 3,
        duration: 1,
        ease: 'power1.out',
        overwrite: 'auto',
        transformPerspective: 600
      });
    }
  }, { passive: true });
}


/* ============================================================
   FLOATING CARDS — micro interactions
============================================================ */
function initFloatCards() {
  const cards = document.querySelectorAll('.float-card');
  if (!cards.length || typeof gsap === 'undefined') return;

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.06,
        boxShadow: '0 16px 48px rgba(41,121,255,0.3)',
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        boxShadow: '',
        duration: 0.4,
        ease: 'power2.out'
      });
    });
  });
}


/* ============================================================
   DASHBOARD — stagger chart bars + KPI counters
============================================================ */
function initDashboardAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  /* Animate chart bars */
  const bars = document.querySelectorAll('.chart-bar');
  if (bars.length) {
    gsap.from(bars, {
      scrollTrigger: {
        trigger: '.dashboard-frame',
        start: 'top 80%',
        once: true
      },
      scaleY: 0,
      transformOrigin: 'bottom center',
      duration: 0.7,
      stagger: 0.08,
      ease: 'power2.out'
    });
  }

  /* Animate source fill bars */
  const fills = document.querySelectorAll('.source-fill');
  if (fills.length) {
    gsap.from(fills, {
      scrollTrigger: {
        trigger: '.dashboard-frame',
        start: 'top 80%',
        once: true
      },
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.8,
      stagger: 0.12,
      ease: 'power2.out',
      delay: 0.4
    });
  }

  /* KPI values count up */
  const kpiValues = document.querySelectorAll('.kpi-value');
  kpiValues.forEach(el => {
    const orig = el.textContent;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        /* Simple flash-in */
        if (typeof gsap !== 'undefined') {
          gsap.from(el, {
            textContent: '0',
            duration: 1,
            ease: 'power1.out',
            snap: { textContent: 1 },
            onComplete: () => { el.textContent = orig; }
          });
        }
      }
    });
  });
}


/* ============================================================
   CURSOR GLOW — subtle accent trail
============================================================ */
function initCursorGlow() {
  /* Only on desktop */
  if (window.matchMedia('(max-width: 1024px)').matches) return;

  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed;
    width: 280px; height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
    opacity: 0;
  `;
  document.body.appendChild(glow);

  let glowX = 0, glowY = 0;
  let targetX = 0, targetY = 0;
  let raf;

  document.addEventListener('mousemove', e => {
    targetX = e.clientX;
    targetY = e.clientY;
    glow.style.opacity = '1';
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    glowX = lerp(glowX, targetX, 0.08);
    glowY = lerp(glowY, targetY, 0.08);
    glow.style.left = glowX + 'px';
    glow.style.top  = glowY + 'px';
    raf = requestAnimationFrame(animate);
  }

  animate();
}


/* ============================================================
   FEATURE CARDS — interactive tilt
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const featureCards = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card');

  featureCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      if (window.matchMedia('(max-width: 768px)').matches) return;

      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top)  / rect.height - 0.5;

      const tiltX = y * 6;
      const tiltY = -x * 6;

      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
      card.style.transition = 'transform 0.1s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease';
    });
  });
});


/* ============================================================
   TRUST BAR — infinite marquee on mobile
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') return;
  if (!window.matchMedia('(max-width: 768px)').matches) return;

  const trustLogos = document.querySelector('.trust-logos');
  if (!trustLogos) return;

  gsap.to(trustLogos, {
    x: '-50%',
    duration: 12,
    ease: 'none',
    repeat: -1
  });
});


/* ============================================================
   HERO SECTION — text glitch micro-animation on load
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') return;

  const headline = document.querySelector('.hero-headline');
  if (!headline) return;

  /* Subtle character shimmer on the gradient text */
  const gradientSpan = headline.querySelector('.gradient-text');
  if (!gradientSpan) return;

  gsap.to(gradientSpan, {
    backgroundPosition: '200% center',
    duration: 4,
    ease: 'power1.inOut',
    repeat: -1,
    yoyo: true
  });
});


/* ============================================================
   SECTION ENTRANCE — feature grid stagger
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  /* Feature cards — only animate if GSAP is loaded */
  const featureGrid = document.querySelector('.features-grid');
  if (featureGrid && typeof ScrollTrigger !== 'undefined') {
    gsap.from('.feature-card', {
      scrollTrigger: { trigger: featureGrid, start: 'top 80%', once: true },
      y: 50, opacity: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out'
    });
  }

  /* Pricing cards stagger */
  const pricingGrid = document.querySelector('.pricing-grid');
  if (pricingGrid && typeof ScrollTrigger !== 'undefined') {
    gsap.from('.pricing-card', {
      scrollTrigger: { trigger: pricingGrid, start: 'top 80%', once: true },
      y: 60, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out'
    });
  }

  /* Testimonial cards stagger */
  const testimonialsGrid = document.querySelector('.testimonials-grid');
  if (testimonialsGrid && typeof ScrollTrigger !== 'undefined') {
    gsap.from('.testimonial-card', {
      scrollTrigger: { trigger: testimonialsGrid, start: 'top 80%', once: true },
      y: 50, opacity: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out'
    });
  }

  /* CTA box */
  const ctaBox = document.querySelector('.cta-box');
  if (ctaBox) {
    gsap.from(ctaBox, {
      scrollTrigger: {
        trigger: ctaBox,
        start: 'top 85%',
        once: true
      },
      y: 40,
      opacity: 0,
      scale: 0.97,
      duration: 0.9,
      ease: 'power3.out'
    });
  }

  /* Step cards */
  if (document.querySelector('.steps-grid') && typeof ScrollTrigger !== 'undefined') {
    gsap.from('.step-card', {
      scrollTrigger: { trigger: '.steps-grid', start: 'top 80%', once: true },
      y: 50, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out'
    });
  }

  /* Dashboard frame */
  const frame = document.querySelector('.dashboard-frame');
  if (frame) {
    gsap.from(frame, {
      scrollTrigger: {
        trigger: frame,
        start: 'top 85%',
        once: true
      },
      y: 80,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out'
    });
  }
});


/* ============================================================
   BUTTON MAGNETIC EFFECT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(max-width: 1024px)').matches) return;

  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width  / 2;
      const y = e.clientY - rect.top  - rect.height / 2;

      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px) translateY(-2px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
});


/* ============================================================
   PERFORMANCE: Pause animations when tab is hidden
============================================================ */
document.addEventListener('visibilitychange', () => {
  if (typeof gsap === 'undefined') return;

  if (document.hidden) {
    gsap.globalTimeline.pause();
  } else {
    gsap.globalTimeline.resume();
  }
});


/* ============================================================
   MOBILE BOTTOM NAV — active state on scroll
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const bottomNavItems = document.querySelectorAll('.mob-nav-item[data-section]');
  if (!bottomNavItems.length) return;

  const sections = ['home','services','how-it-works','pricing','testimonials','contact'];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        bottomNavItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('data-section') === id) {
            item.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  /* Tap feedback — small scale bounce */
  bottomNavItems.forEach(item => {
    item.addEventListener('touchstart', () => {
      item.style.transform = 'scale(0.92)';
    }, { passive: true });
    item.addEventListener('touchend', () => {
      setTimeout(() => { item.style.transform = ''; }, 150);
    }, { passive: true });
  });
});