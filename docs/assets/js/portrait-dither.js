// Contact page portrait: the photo turns into the pixel-art portrait and back, on a loop.
//
// The pixel art is a 43 x 43 grid. Every frame of the change is drawn on that same grid, so nothing
// ever jumps: the photo is averaged into blocks that nest inside the art's cells (8, then 4, then 2
// blocks per cell, then 1), those cells are ordered-dithered onto the art's own grey levels, and then
// each cell flips to its exact pixel-art value in an ordered (Bayer) pattern. The last frame is the
// pixel art itself; the way back runs the same steps in reverse.
// Drawn on a canvas over the photo; the <img> underneath stays for search engines, screen readers and the lightbox.
(function () {
  var box = document.querySelector('.portrait[data-pixel]');
  if (!box) return;
  var photo = box.querySelector('img');
  var art = new Image();
  art.src = box.getAttribute('data-pixel');

  var canvas = document.createElement('canvas');
  canvas.className = 'portrait-fx';
  canvas.setAttribute('aria-hidden', 'true');
  box.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var N = 43;               // cells across (and down) the pixel art
  var SIDE = 1000;          // working size of the square "art space"
  var LEVELS = [8, 4, 2, 1]; // blocks per art cell while the photo coarsens

  // Timing (ms): hold the photo, change over, hold the pixel art, change back.
  var HOLD_PHOTO = 3000, CHANGE = 3000, HOLD_ART = 3000;
  var CYCLE = HOLD_PHOTO + CHANGE + HOLD_ART + CHANGE;

  // 8x8 Bayer matrix: the order in which cells change, spread evenly so it reads as a dither.
  var BAYER8 = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
  ];
  function order(x, y) { return (BAYER8[(y & 7) * 8 + (x & 7)] + 0.5) / 64; }

  var W = 0, H = 0, ox = 0, oy = 0, side = 0;
  var photoLevels = [], photoCells = null, photoQuant = null, artCells = null;
  var small = document.createElement('canvas'), sctx = small.getContext('2d');

  function lumAt(d, i) { return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; } // same weights as CSS grayscale()

  // Scale a canvas down to g x g in halving steps, so every block is a true average of what it covers.
  function averageTo(src, g) {
    var cur = src, size = src.width;
    while (size / 2 > g) {
      var half = document.createElement('canvas');
      size = Math.max(g, Math.round(size / 2));
      half.width = half.height = size;
      var h = half.getContext('2d');
      h.imageSmoothingEnabled = true; h.imageSmoothingQuality = 'high';
      h.drawImage(cur, 0, 0, size, size);
      cur = half;
    }
    var out = document.createElement('canvas');
    out.width = out.height = g;
    var o = out.getContext('2d');
    o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high';
    o.drawImage(cur, 0, 0, g, g);
    var d = o.getImageData(0, 0, g, g).data, v = new Float32Array(g * g);
    for (var i = 0; i < v.length; i++) v[i] = lumAt(d, i * 4);
    return v;
  }

  // Draw an image to cover a rectangle (like object-fit: cover).
  function cover(c, img, x, y, w, h) {
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    c.restore();
  }

  function setup() {
    var r = box.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W; canvas.height = H;

    // The square pixel art is shown covering the frame; work out where that square sits on the canvas.
    side = Math.max(W, H); ox = (W - side) / 2; oy = (H - side) / 2;
    var k = SIDE / side; // canvas px -> art-space px
    var vx = -ox * k, vy = -oy * k, vw = W * k, vh = H * k; // the visible frame, in art space

    // The photo in art space, lined up exactly with what the visitor sees. Cells that hang off the
    // edge of the frame are filled from a full-square copy so their averages are not darkened.
    var sq = document.createElement('canvas');
    sq.width = sq.height = SIDE;
    var q = sq.getContext('2d');
    cover(q, photo, 0, 0, SIDE, SIDE);
    cover(q, photo, vx, vy, vw, vh);
    photoLevels = LEVELS.map(function (lv) { return averageTo(sq, N * lv); });
    photoCells = photoLevels[LEVELS.length - 1];

    // The pixel art's exact cell values, read from the centre of each cell.
    var a = document.createElement('canvas');
    a.width = a.height = SIDE;
    var ac = a.getContext('2d');
    ac.drawImage(art, 0, 0, SIDE, SIDE);
    var d = ac.getImageData(0, 0, SIDE, SIDE).data;
    artCells = new Float32Array(N * N);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var px = Math.floor((x + 0.5) * SIDE / N), py = Math.floor((y + 0.5) * SIDE / N);
      artCells[y * N + x] = lumAt(d, (py * SIDE + px) * 4);
    }

    // The art's own grey levels; the photo's cells are snapped to these before they flip.
    var levels = [];
    artCells.forEach(function (v) {
      for (var i = 0; i < levels.length; i++) if (Math.abs(levels[i] - v) < 10) return;
      levels.push(v);
    });
    levels.sort(function (p, q2) { return p - q2; });
    photoQuant = new Float32Array(N * N);
    for (var i = 0; i < photoCells.length; i++) {
      // Ordered dither between the two nearest levels, so smooth gradients keep their shape.
      var v = photoCells[i], lo = levels[0], hi = levels[levels.length - 1];
      for (var j = 0; j < levels.length - 1; j++) if (v >= levels[j] && v <= levels[j + 1]) { lo = levels[j]; hi = levels[j + 1]; break; }
      var f = hi > lo ? (v - lo) / (hi - lo) : 0;
      photoQuant[i] = f > order(i % N, Math.floor(i / N)) ? hi : lo;
    }
  }

  // Paint a g x g grid of grey values over the art square.
  function paint(g, valueAt) {
    small.width = small.height = g;
    var img = sctx.createImageData(g, g), o = img.data;
    for (var y = 0; y < g; y++) for (var x = 0; x < g; x++) {
      var i = y * g + x, v = valueAt(x, y, i);
      o[i * 4] = o[i * 4 + 1] = o[i * 4 + 2] = v; o[i * 4 + 3] = 255;
    }
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(small, 0, 0, g, g, ox, oy, side, side);
  }

  // t: 0 = photo, 1 = pixel art.
  var shown = '';
  function render(t) {
    var key;
    if (t <= 0) { canvas.classList.remove('ready'); shown = ''; return; }
    canvas.classList.add('ready');

    if (t < 0.36) {                                   // 1. the photo coarsens onto the art's grid
      var step = Math.min(LEVELS.length - 1, Math.floor(t / 0.09));
      key = 'p' + step;
      if (key === shown) return;
      var g = N * LEVELS[step], vals = photoLevels[step];
      paint(g, function (x, y, i) { return vals[i]; });
    } else if (t < 0.5) {                             // 2. cells snap to the art's grey levels
      var u = (t - 0.36) / 0.14;
      key = 'q' + Math.floor(u * 64);
      if (key === shown) return;
      paint(N, function (x, y, i) { return order(x, y) < u ? photoQuant[i] : photoCells[i]; });
    } else if (t < 1) {                               // 3. each cell flips to the pixel art
      var w = (t - 0.5) / 0.5;
      key = 'a' + Math.floor(w * 64);
      if (key === shown) return;
      paint(N, function (x, y, i) { return order(x, y) < w ? artCells[i] : photoQuant[i]; });
    } else {
      key = 'art';
      if (key === shown) return;
      paint(N, function (x, y, i) { return artCells[i]; });
    }
    shown = key;
  }

  function progress(ms) {
    var p = ms % CYCLE;
    if (p < HOLD_PHOTO) return 0;
    p -= HOLD_PHOTO;
    if (p < CHANGE) return p / CHANGE;
    p -= CHANGE;
    if (p < HOLD_ART) return 1;
    p -= HOLD_ART;
    return 1 - p / CHANGE;
  }

  var start = 0, paused = false;
  box.portraitFx = { show: function (t) { paused = true; shown = ''; render(t); }, play: function () { paused = false; shown = ''; } }; // for checking single frames
  function frame(now) {
    if (!canvas.isConnected) return;
    if (!start) start = now;
    if (!paused) render(progress(now - start));
    requestAnimationFrame(frame);
  }

  function ready(img) { return img.complete && img.naturalWidth > 0; }
  var started = false;
  function go() {
    if (started || !ready(photo) || !ready(art)) return;
    started = true;
    setup();
    requestAnimationFrame(frame);
  }
  photo.addEventListener('load', go);
  art.addEventListener('load', go);
  go();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (started) { setup(); shown = ''; } }, 150);
  });
})();
