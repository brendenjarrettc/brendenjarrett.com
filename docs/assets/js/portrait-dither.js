// Contact page portrait: the photo slowly breaks into chunky pixels and dithers into the
// pixel-art portrait, holds, then dissolves back, on a loop. Drawn on a canvas over the photo;
// the <img> underneath stays for search engines, screen readers and the lightbox.
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

  // Timing (ms): hold the photo, change over, hold the pixel art, change back.
  var HOLD_PHOTO = 4000, CHANGE = 5200, HOLD_ART = 4000;
  var CYCLE = HOLD_PHOTO + CHANGE + HOLD_ART + CHANGE;
  var MAX_BLOCK = 22; // largest pixel size mid-change, in canvas pixels

  // 4x4 Bayer matrix for ordered dithering, scaled to 0..1.
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return (v + 0.5) / 16; });

  var W = 0, H = 0, srcA = null, srcB = null, small = document.createElement('canvas'), sctx = small.getContext('2d');

  // Draw an image into a W x H canvas, cropped to fill it (like object-fit: cover).
  function cover(img) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    var s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    var w = img.naturalWidth * s, h = img.naturalHeight * s;
    x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    return c;
  }

  function setup() {
    var r = box.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W; canvas.height = H;
    srcA = cover(photo); srcB = cover(art);
  }

  // Average both images down to a grid of block-sized cells and read the cells back.
  function cells(src, gw, gh) {
    small.width = gw; small.height = gh;
    sctx.imageSmoothingEnabled = true; sctx.imageSmoothingQuality = 'medium';
    sctx.drawImage(src, 0, 0, gw, gh);
    return sctx.getImageData(0, 0, gw, gh).data;
  }

  function lum(d, i) { return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; }

  // t: 0 = photo, 1 = pixel art.
  function render(t) {
    if (t <= 0) { ctx.clearRect(0, 0, W, H); canvas.classList.remove('ready'); return; }
    canvas.classList.add('ready');
    if (t >= 1) { ctx.imageSmoothingEnabled = false; ctx.drawImage(srcB, 0, 0); return; }
    var mid = 1 - Math.abs(2 * t - 1);                       // 0 at the ends, 1 halfway
    var block = Math.max(1, Math.round(1 + (MAX_BLOCK - 1) * Math.pow(mid, 0.8)) * (W / 600 > 1 ? 2 : 1));
    var gw = Math.ceil(W / block), gh = Math.ceil(H / block);
    var a = cells(srcA, gw, gh), b = cells(srcB, gw, gh);
    var out = sctx.createImageData(gw, gh), o = out.data;
    var levels = Math.round(255 - 251 * Math.min(1, mid * 1.6)) + 1; // fewer grey levels mid-change
    var step = 255 / (levels - 1);
    for (var y = 0; y < gh; y++) {
      for (var x = 0; x < gw; x++) {
        var i = (y * gw + x) * 4, th = BAYER[(y & 3) * 4 + (x & 3)];
        var v = th < t ? lum(b, i) : lum(a, i);               // dither dissolve between the two
        v = Math.min(255, Math.floor(v / step + th) * step);  // ordered-dither the grey levels
        o[i] = o[i + 1] = o[i + 2] = v; o[i + 3] = 255;
      }
    }
    sctx.putImageData(out, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, gw, gh, 0, 0, gw * block, gh * block);
  }

  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  function progress(ms) {
    var p = ms % CYCLE;
    if (p < HOLD_PHOTO) return 0;
    p -= HOLD_PHOTO;
    if (p < CHANGE) return ease(p / CHANGE);
    p -= CHANGE;
    if (p < HOLD_ART) return 1;
    p -= HOLD_ART;
    return 1 - ease(p / CHANGE);
  }

  var start = 0, last = -1, lastFrame = 0;
  function frame(now) {
    if (!start) start = now;
    // About 15 frames a second: enough for a steppy, glitchy change and light on phones.
    if (now - lastFrame >= 66) {
      lastFrame = now;
      var t = progress(now - start);
      if (t !== last || (t > 0 && t < 1)) { render(t); last = t; }
    }
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
    rt = setTimeout(function () { if (ready(photo) && ready(art)) { setup(); last = -1; } }, 150);
  });
})();
