// Full-screen image viewer for every content image on the site.
// Click/tap an image to open it; arrows, swipe or the on-screen buttons move through the page's images;
// click the image (or press +/-) to zoom; Esc, the close button or a click on the backdrop closes.
// Images inside links (album/article cards, social icons) keep working as links and are skipped.
(function () {
  var MIN_SIZE = 80; // skip icons and other small images
  var images = [];
  var index = 0;
  var lastFocus = null;
  var zoomed = false;

  function eligible(img) {
    if (img.closest('a, button, .lightbox, [data-no-lightbox]')) return false;
    // Judge size from the image file itself; lazy images that haven't loaded yet are included.
    if (!img.naturalWidth) return true;
    return img.naturalWidth >= MIN_SIZE || img.naturalHeight >= MIN_SIZE;
  }

  function collect() {
    images = Array.prototype.filter.call(document.querySelectorAll('main img'), eligible);
    images.forEach(function (img, i) {
      img.classList.add('lb-trigger');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      if (!img.getAttribute('aria-label')) img.setAttribute('aria-label', 'View image full screen' + (img.alt ? ': ' + img.alt : ''));
      img.dataset.lbIndex = i;
    });
  }

  // ---------- Overlay ----------
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.hidden = true;
  box.innerHTML =
    '<div class="lb-stage"><img class="lb-img" alt=""></div>' +
    '<p class="lb-caption"></p>' +
    '<span class="lb-count" aria-live="polite"></span>' +
    '<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lb-btn lb-zoom" aria-label="Zoom in">+</button>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="Previous image">&#8249;</button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="Next image">&#8250;</button>';
  var stage = box.querySelector('.lb-stage');
  var big = box.querySelector('.lb-img');
  var caption = box.querySelector('.lb-caption');
  var count = box.querySelector('.lb-count');
  var zoomBtn = box.querySelector('.lb-zoom');

  function captionFor(img) {
    var fig = img.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    return (cap && cap.textContent.trim()) || img.alt || '';
  }

  // Zoom shows the image at its real pixel size, never larger, so it never gets blurry or grainy.
  // If the whole image already fits on screen at full size, there is nothing to zoom into.
  function canZoom() {
    if (!big.naturalWidth) return false;
    return big.naturalWidth > stage.clientWidth + 1 || big.naturalHeight > stage.clientHeight + 1;
  }

  function setZoom(on) {
    if (on && !canZoom()) on = false;
    zoomed = on;
    box.classList.toggle('is-zoomed', on);
    box.classList.toggle('no-zoom', !canZoom());
    zoomBtn.textContent = on ? '−' : '+';
    zoomBtn.setAttribute('aria-label', on ? 'Zoom out' : 'Zoom in');
    if (on) {
      big.style.width = big.naturalWidth + 'px';
      stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
      stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
    } else {
      big.style.width = '';
    }
  }

  function show(i) {
    index = (i + images.length) % images.length;
    var img = images[index];
    setZoom(false);
    big.src = img.dataset.full || img.currentSrc || img.src;
    big.alt = img.alt || '';
    var text = captionFor(img);
    caption.textContent = text;
    caption.hidden = !text;
    var many = images.length > 1;
    count.textContent = many ? (index + 1) + ' / ' + images.length : '';
    box.classList.toggle('single', !many);
  }

  function open(i) {
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('lb-open');
    show(i);
    box.querySelector('.lb-close').focus();
  }

  function close() {
    box.hidden = true;
    setZoom(false);
    document.documentElement.classList.remove('lb-open');
    big.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // ---------- Events ----------
  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('img.lb-trigger');
    if (img) { e.preventDefault(); open(+img.dataset.lbIndex); }
  });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('lb-trigger')) {
        e.preventDefault(); open(+e.target.dataset.lbIndex);
      }
      return;
    }
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === '+' || e.key === '=') setZoom(true);
    else if (e.key === '-') setZoom(false);
    else if (e.key === 'Tab') {
      // keep focus inside the viewer
      var f = box.querySelectorAll('button:not([hidden])');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });
  zoomBtn.addEventListener('click', function () { setZoom(!zoomed); });
  big.addEventListener('click', function (e) { e.stopPropagation(); setZoom(!zoomed); });
  stage.addEventListener('click', function (e) { if (e.target === stage && !zoomed) close(); });
  big.addEventListener('load', function () { setZoom(zoomed); });

  // Swipe left/right to change image, swipe down to close (only when not zoomed).
  var sx = 0, sy = 0, touching = false;
  stage.addEventListener('touchstart', function (e) {
    if (zoomed || e.touches.length !== 1) { touching = false; return; }
    touching = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!touching) return;
    touching = false;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
  });

  function init() {
    document.body.appendChild(box);
    collect();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Lazy images may have had no size yet; re-check once everything has loaded.
  window.addEventListener('load', collect);
})();
