document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-navigation');
  const year = document.querySelector('#year');

  year.textContent = new Date().getFullYear();

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
    toggle.querySelector('.sr-only').textContent = open ? 'Open menu' : 'Close menu';
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.sr-only').textContent = 'Open menu';
  }));

  const heroArt = document.querySelector('.hero-art');
  const profile = document.querySelector('.profile-frame');
  const roleCard = document.querySelector('.role-card');
  const orbitOne = document.querySelector('.orbit-one');
  const orbitTwo = document.querySelector('.orbit-two');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroArt && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    heroArt.classList.add('is-interactive');
    heroArt.addEventListener('pointermove', (event) => {
      const bounds = heroArt.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      profile.style.transform = `translate(${x * 15}px, ${y * 12}px)`;
      roleCard.style.transform = `translate(${x * -18}px, ${y * -14}px)`;
      orbitOne.style.transform = `translate(${x * -9}px, ${y * -8}px)`;
      orbitTwo.style.transform = `translate(${x * 12}px, ${y * 10}px)`;
    });
    heroArt.addEventListener('pointerleave', () => {
      [profile, roleCard, orbitOne, orbitTwo].forEach((element) => { element.style.transform = ''; });
    });
  }

  // Hidden terminal: loaded only when someone finds it, so regular visits stay light.
  let terminalRequested = false;
  const openTerminal = () => {
    if (window.IndeTerminal) return window.IndeTerminal.open();
    if (terminalRequested) return;
    terminalRequested = true;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'assets/css/terminal.css';
    document.head.append(style);
    const script = document.createElement('script');
    script.src = 'assets/js/terminal.js';
    script.onload = () => window.IndeTerminal.open();
    script.onerror = () => { terminalRequested = false; };
    document.body.append(script);
  };

  const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
  let recentKeys = [];
  document.addEventListener('keydown', (event) => {
    if (window.IndeTerminal && window.IndeTerminal.isOpen()) return;
    if (event.target.closest && event.target.closest('input, textarea, select, [contenteditable]')) return;
    if (event.code === 'Backquote' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      openTerminal();
      return;
    }
    recentKeys = [...recentKeys, event.key].slice(-sequence.length);
    if (recentKeys.join() === sequence.join()) {
      recentKeys = [];
      openTerminal();
    }
  });

  const hint = document.querySelector('.konami-hint');
  if (hint) hint.addEventListener('click', openTerminal);
});
