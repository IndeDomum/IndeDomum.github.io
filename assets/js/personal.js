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
});
