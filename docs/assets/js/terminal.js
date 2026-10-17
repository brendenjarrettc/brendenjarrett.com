// Landing page terminal: boot-up line by line, a running clock, number-key shortcuts,
// and every few seconds a brief stutter with datamosh-style tears across the screen.
// With "reduce motion" switched on, the tears come less often and the screen does not shake.
(function () {
  var crt = document.querySelector('.crt');
  var term = document.getElementById('term');
  if (!crt || !term) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Boot: each line switches on a moment after the one before.
  document.documentElement.classList.add('js');
  var lines = term.querySelectorAll('.ln');
  for (var i = 0; i < lines.length; i++) lines[i].style.animationDelay = (150 + i * 95) + 'ms';

  // Clock in the header.
  var clock = document.getElementById('term-clock');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() { var d = new Date(); clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  if (clock) { tick(); setInterval(tick, 1000); }

  // Keys: 1-4 open the menu items, Enter opens ENTER.
  var menu = term.querySelectorAll('.term-menu a');
  var enter = term.querySelector('.term-enter');
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= menu.length) { menu[n - 1].click(); return; }
    if (e.key === 'Enter' && enter && !(document.activeElement && document.activeElement.closest('a'))) enter.click();
  });

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // Two glitch layers (fresh copies of the screen) and a few datamosh blocks.
  var layers = [0, 1].map(function (i) {
    var l = document.createElement('div');
    l.className = 'glitch-layer' + (i ? ' tint' : '');
    l.setAttribute('aria-hidden', 'true');
    crt.appendChild(l);
    return l;
  });
  var blocks = [0, 1, 2, 3, 4].map(function () {
    var b = document.createElement('div');
    b.className = 'mosh';
    crt.appendChild(b);
    return b;
  });

  function copyScreen(layer) {
    var c = term.cloneNode(true);
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
    c.querySelectorAll('a').forEach(function (a) { a.removeAttribute('href'); a.setAttribute('tabindex', '-1'); });
    c.querySelectorAll('.ln').forEach(function (el) { el.style.animation = 'none'; el.style.opacity = '1'; });
    c.scrollTop = term.scrollTop;
    layer.innerHTML = '';
    layer.appendChild(c);
  }

  function frame() {
    layers.forEach(function (l) {
      var top = rnd(0, 92), h = rnd(1.5, 9);
      l.style.clipPath = 'inset(' + top + '% 0 ' + Math.max(0, 100 - top - h) + '% 0)';
      l.style.transform = 'translateX(' + pick([-1, 1]) * rnd(4, 38) + 'px)';
    });
    var W = crt.clientWidth, H = crt.clientHeight, G = 16, count = Math.floor(rnd(1, blocks.length + 1));
    blocks.forEach(function (b, i) {
      if (i >= count) { b.classList.remove('on'); return; }
      var w = G * Math.floor(rnd(3, 18)), h = G * Math.floor(rnd(1, 5));
      b.style.left = G * Math.floor(rnd(0, (W - w) / G)) + 'px';
      b.style.top = G * Math.floor(rnd(0, (H - h) / G)) + 'px';
      b.style.width = w + 'px'; b.style.height = h + 'px';
      b.classList.add('on');
    });
    crt.style.setProperty('--jx', pick([-1, 1]) * rnd(1, 6) + 'px');
    crt.style.setProperty('--jy', pick([-1, 0, 0, 1]) * rnd(0, 3) + 'px');
  }

  function clear() {
    layers.forEach(function (l) { l.classList.remove('on'); });
    blocks.forEach(function (b) { b.classList.remove('on'); });
    crt.classList.remove('stutter');
  }

  function glitch() {
    layers.forEach(function (l) { copyScreen(l); l.classList.add('on'); });
    if (!reduce) crt.classList.add('stutter');
    var steps = Math.floor(rnd(2, 6)), t = 0;
    for (var s = 0; s < steps; s++) { setTimeout(frame, t); t += rnd(40, 110); }
    setTimeout(clear, t);
    setTimeout(glitch, t + (reduce ? rnd(7000, 14000) : rnd(2600, 7500)));
  }
  setTimeout(glitch, 2200);
})();
