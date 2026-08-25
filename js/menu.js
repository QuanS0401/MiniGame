(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     Starfield background (canvas)
     ========================================================= */
  function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let raf = null;
    let running = true;

    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const count = Math.min(160, Math.floor((window.innerWidth * window.innerHeight) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 * devicePixelRatio + 0.3,
        speed: Math.random() * 0.15 + 0.03,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.7 ? '157,78,255' : Math.random() > 0.5 ? '0,240,255' : '255,255,255'
      }));
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t / 900 + s.phase);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.hue},${(0.25 + twinkle * 0.6).toFixed(2)})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (!prefersReducedMotion) {
          s.y += s.speed * devicePixelRatio;
          if (s.y > canvas.height) s.y = 0;
        }
      }
      if (running) raf = requestAnimationFrame(draw);
    }

    resize();
    draw(0);
    window.addEventListener('resize', resize, { passive: true });

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running && !raf) raf = requestAnimationFrame(draw);
      else if (!running && raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }

  /* =========================================================
     Navbar scroll state + mobile drawer
     ========================================================= */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!navbar) return;

    const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        links.classList.toggle('is-open', !open);
        document.body.style.overflow = !open ? 'hidden' : '';
      });

      links.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          toggle.setAttribute('aria-expanded', 'false');
          links.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && links.classList.contains('is-open')) {
          toggle.setAttribute('aria-expanded', 'false');
          links.classList.remove('is-open');
          document.body.style.overflow = '';
          toggle.focus();
        }
      });
    }
  }

  /* =========================================================
     Scroll reveal via IntersectionObserver
     ========================================================= */
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('in-view'), (i % 4) * 60);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach((el) => io.observe(el));
  }

  /* =========================================================
     Hero stat counters
     ========================================================= */
  function initCounters() {
    const nums = document.querySelectorAll('.hero-stat .num[data-count]');
    if (!nums.length) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const gradEl = el.querySelector('.grad-cyan');
      if (prefersReducedMotion) {
        if (gradEl) gradEl.textContent = target + suffix;
        else el.textContent = target + suffix;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        if (gradEl) gradEl.textContent = val + suffix;
        else el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      nums.forEach(animate);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach((el) => io.observe(el));
  }

  /* =========================================================
     Game showcase carousel
     Only 4 real game cards live here now. On viewports wide
     enough to show all 4 without any horizontal scroll, the
     prev/next/autoplay/dots controls are hidden — nothing left
     for them to do. On narrower viewports (tablet/mobile) the
     track still overflows, so the full carousel stays active.
     ========================================================= */
  function initCarousel() {
    const viewport = document.getElementById('carouselViewport');
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const autoplayBtn = document.getElementById('carouselAutoplay');
    const controls = document.querySelector('.carousel-controls');
    const dotsWrap = document.getElementById('carouselDots');
    const status = document.getElementById('carouselStatus');
    if (!viewport || !track) return;

    const cards = Array.from(track.children);
    const dots = cards.map((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('aria-label', `Go to game ${i + 1} of ${cards.length}`);
      btn.innerHTML = '<span></span>';
      btn.addEventListener('click', () => scrollToIndex(i));
      dotsWrap.appendChild(btn);
      return btn;
    });

    let current = 0;
    let autoplayTimer = null;
    let isAutoplay = true;
    let overflowing = true;

    function cardStep() {
      const card = cards[0];
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || '0');
      return card.getBoundingClientRect().width + gap;
    }

    function updateActive() {
      const scrollLeft = viewport.scrollLeft;
      const step = cardStep();
      const idx = Math.round(scrollLeft / step);
      current = Math.max(0, Math.min(cards.length - 1, idx));
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === current)));
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === cards.length - 1;
      const title = cards[current].querySelector('h3');
      status.textContent = title ? `Showing ${title.textContent}, ${current + 1} of ${cards.length}` : '';
    }

    function scrollToIndex(i) {
      const step = cardStep();
      viewport.scrollTo({ left: step * i, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    prevBtn.addEventListener('click', () => scrollToIndex(Math.max(0, current - 1)));
    nextBtn.addEventListener('click', () => scrollToIndex(Math.min(cards.length - 1, current + 1)));

    let scrollDebounce;
    viewport.addEventListener('scroll', () => {
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(updateActive, 80);
    }, { passive: true });

    function startAutoplay() {
      if (prefersReducedMotion || !overflowing) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        const next = current + 1 >= cards.length ? 0 : current + 1;
        scrollToIndex(next);
      }, 4200);
    }
    function stopAutoplay() {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }

    autoplayBtn.addEventListener('click', () => {
      isAutoplay = !isAutoplay;
      autoplayBtn.setAttribute('aria-pressed', String(isAutoplay));
      autoplayBtn.setAttribute('aria-label', isAutoplay ? 'Pause auto-scroll' : 'Resume auto-scroll');
      autoplayBtn.querySelector('.icon-pause').style.display = isAutoplay ? 'block' : 'none';
      autoplayBtn.querySelector('.icon-play').style.display = isAutoplay ? 'none' : 'block';
      if (isAutoplay) startAutoplay(); else stopAutoplay();
    });

    [viewport, track].forEach((el) => {
      el.addEventListener('mouseenter', stopAutoplay);
      el.addEventListener('mouseleave', () => { if (isAutoplay) startAutoplay(); });
      el.addEventListener('focusin', stopAutoplay);
      el.addEventListener('focusout', () => { if (isAutoplay) startAutoplay(); });
    });

    function updateOverflowState() {
      const wasOverflowing = overflowing;
      overflowing = track.scrollWidth > viewport.clientWidth + 4;
      if (overflowing === wasOverflowing) return;
      if (controls) controls.style.display = overflowing ? '' : 'none';
      if (dotsWrap) dotsWrap.style.display = overflowing ? '' : 'none';
      if (overflowing) {
        if (isAutoplay) startAutoplay();
      } else {
        stopAutoplay();
        viewport.scrollTo({ left: 0, behavior: 'auto' });
      }
      updateActive();
    }

    let resizeDebounce;
    window.addEventListener('resize', () => {
      clearTimeout(resizeDebounce);
      resizeDebounce = setTimeout(updateOverflowState, 120);
    }, { passive: true });

    updateOverflowState();
    updateActive();
    if (overflowing && !prefersReducedMotion) startAutoplay();
    else if (!overflowing) {
      if (controls) controls.style.display = 'none';
      if (dotsWrap) dotsWrap.style.display = 'none';
    }
    if (prefersReducedMotion) autoplayBtn.style.display = 'none';
  }

  /* =========================================================
     3D tilt on feature cards (mouse-driven, pointer:fine only)
     ========================================================= */
  function initTilt() {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card) => {
      let rect;
      const maxTilt = 8;

      const onMove = (e) => {
        rect = rect || card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * maxTilt;
        const ry = (px - 0.5) * maxTilt;
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
      };

      card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        rect = null;
      });
    });
  }


  /* =========================================================
     Trailer button (placeholder interaction — no video asset)
     ========================================================= */
  function initTrailerButton() {
    const btn = document.getElementById('trailerBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      btn.setAttribute('data-clicked', 'true');
      const original = btn.innerHTML;
      btn.innerHTML = btn.innerHTML.replace('Watch Trailer', 'Coming Soon');
      setTimeout(() => { btn.innerHTML = original; }, 1800);
    });
  }

  /* =========================================================
     Newsletter form (client-side only, no backend)
     ========================================================= */
  function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    const msg = document.getElementById('newsletterMsg');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('newsletterEmail');
      if (!input.checkValidity()) {
        msg.style.color = 'var(--neon-magenta)';
        msg.textContent = 'Please enter a valid email address.';
        return;
      }
      msg.style.color = 'var(--neon-green)';
      msg.textContent = `You're in! Confirmation sent to ${input.value}.`;
      form.reset();
    });
  }

  /* =========================================================
     Expanding phone/email contact pills — desktop gets the
     expand-on-hover for free from CSS (:hover/:focus-visible).
     Touch devices have no :hover, so the first tap expands the
     pill instead of navigating; a second tap (now expanded)
     follows the tel:/mailto: link normally. Tapping elsewhere
     collapses any open pill.
     ========================================================= */
  function initContactPills() {
    const pills = document.querySelectorAll('.contact-pill');
    if (!pills.length) return;
    if (!window.matchMedia('(hover: none)').matches) return;

    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        if (!pill.classList.contains('is-expanded')) {
          e.preventDefault();
          pills.forEach((p) => { if (p !== pill) p.classList.remove('is-expanded'); });
          pill.classList.add('is-expanded');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.contact-pill')) {
        pills.forEach((p) => p.classList.remove('is-expanded'));
      }
    });
  }

  /* =========================================================
     Back to top
     ========================================================= */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* =========================================================
     Misc
     ========================================================= */
  function initMisc() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initNavbar();
    initScrollReveal();
    initCounters();
    initCarousel();
    initTilt();
    initTrailerButton();
    initNewsletter();
    initContactPills();
    initBackToTop();
    initMisc();
  });
})();
