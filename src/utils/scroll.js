/**
 * Lightweight scroll-driven animation utility
 * Replaces GSAP/ScrollTrigger for zero-dependency parallax
 */

export class ScrollAnimator {
  constructor() {
    this.targets = [];
    this.ticking = false;
    this.scrollY = window.scrollY;
    this._onScroll = this._onScroll.bind(this);
    this._tick = this._tick.bind(this);
    window.addEventListener('scroll', this._onScroll, { passive: true });
  }

  _onScroll() {
    this.scrollY = window.scrollY;
    if (!this.ticking) {
      requestAnimationFrame(this._tick);
      this.ticking = true;
    }
  }

  _tick() {
    this.targets.forEach(t => t.update(this.scrollY));
    this.ticking = false;
  }

  /**
   * Parallax: element moves at a fraction of scroll speed
   * @param {Element} el
   * @param {number} speed - 0 = fixed, 0.5 = half scroll, -0.3 = opposite
   * @param {string} axis - 'y' | 'x'
   */
  parallax(el, speed = 0.3, axis = 'y') {
    const update = (scrollY) => {
      const rect = el.parentElement.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (window.innerHeight / 2 - center) * speed;
      el.style.transform = axis === 'y'
        ? `translateY(${offset}px)`
        : `translateX(${offset}px)`;
    };
    this.targets.push({ update });
    return this;
  }

  /**
   * Opacity fade based on scroll position through viewport
   */
  fadeOnScroll(el, { from = 0, to = 1, start = 0.1, end = 0.6 } = {}) {
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = 1 - (rect.top / (vh * (1 - start + end)));
      const clamped = Math.min(1, Math.max(0, progress));
      const val = from + (to - from) * clamped;
      el.style.opacity = val;
    };
    this.targets.push({ update });
    return this;
  }

  /**
   * Counter animation — counts from 0 to target when element enters view
   */
  static countUp(el, target, duration = 2000, suffix = '') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(el);
        const start = performance.now();
        const isFloat = target % 1 !== 0;
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = target * eased;
          el.textContent = (isFloat ? value.toFixed(2) : Math.floor(value)).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    observer.observe(el);
  }

  /**
   * Stagger reveal children of a container
   */
  static staggerReveal(container, childSelector = ':scope > *', delay = 80) {
    const children = [...container.querySelectorAll(childSelector)];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        children.forEach((child, i) => {
          setTimeout(() => {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          }, i * delay);
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    children.forEach(child => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(24px)';
      child.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    observer.observe(container);
  }

  /**
   * Typing text effect
   */
  static typeWriter(el, text, speed = 40, onDone) {
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, speed);
      } else if (onDone) {
        onDone();
      }
    };
    tick();
  }

  destroy() {
    window.removeEventListener('scroll', this._onScroll);
    this.targets = [];
  }
}

/**
 * Smooth scroll to element with offset
 */
export function smoothScrollTo(id, offset = 80) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

/**
 * Throttle helper
 */
export function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

/**
 * Lerp
 */
export function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Clamp
 */
export function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

/**
 * Map range
 */
export function mapRange(v, inMin, inMax, outMin, outMax) {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}
