// Phones: a "back to top" button that appears once the page has been scrolled down
// and smoothly returns to the top when tapped. Hidden on desktop by the stylesheet.
(function () {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5l-7 7m7-7l7 7M12 5v14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(btn);

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  var ticking = false;
  function update() {
    ticking = false;
    btn.classList.toggle('show', window.scrollY > Math.min(window.innerHeight * 0.6, 120)); // short pages (About with its sections closed) still get it
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
