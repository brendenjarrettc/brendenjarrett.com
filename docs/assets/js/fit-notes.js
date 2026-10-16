// Album pages: make the notes box end level with the bottom of the artwork beside it, and pick the
// largest text size that fills that box (short notes get bigger text, long notes smaller).
// Only on the side-by-side layout; on phones the notes sit under the artwork at normal size.
(function () {
  var art = document.querySelector('.album-art');
  var notes = document.querySelector('.album-notes');
  if (!art || !notes) return;
  var MIN = 11, MAX = 40; // px

  function sideBySide() { return notes.getBoundingClientRect().top < art.getBoundingClientRect().bottom - 1; }

  function fit() {
    notes.style.fontSize = '';
    notes.style.height = '';
    if (!sideBySide()) return;
    var target = art.getBoundingClientRect().height;
    notes.style.height = target + 'px';
    var lo = MIN, hi = MAX;
    for (var i = 0; i < 16; i++) {
      var mid = (lo + hi) / 2;
      notes.style.fontSize = mid + 'px';
      if (notes.scrollHeight <= notes.clientHeight) lo = mid; else hi = mid;
    }
    notes.style.fontSize = lo + 'px';
    // Too much text to fit even at the smallest readable size: let the box run longer rather than cut it off.
    if (notes.scrollHeight > notes.clientHeight) notes.style.height = '';
  }

  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 80); });
  Array.prototype.forEach.call(art.querySelectorAll('img'), function (img) {
    if (!img.complete) img.addEventListener('load', fit);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit);
  fit();
})();
