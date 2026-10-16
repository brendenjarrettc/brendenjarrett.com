// Landing page: scale the whole report (title, table, key and ENTER, all sized in em) so it fits
// the browser window's height with no scrolling. Starts from the stylesheet's size and shrinks
// only as much as needed; re-fits when the window is resized or the fonts finish loading.
(function () {
  var page = document.querySelector('.board-page');
  if (!page) return;
  var MIN = 7; // px; below this the text is too small to read

  // Compare the content's natural height (min-height switched off while measuring) to the window.
  function overflowing() { return page.getBoundingClientRect().height > window.innerHeight; }

  function fit() {
    var root = document.documentElement;
    // Hide the scrollbar while measuring: it steals width, which re-wraps the titles and changes the height.
    root.style.overflowY = 'hidden';
    page.style.fontSize = '';
    page.style.minHeight = '0';
    var fs = parseFloat(getComputedStyle(page).fontSize);
    if (!overflowing()) { page.style.minHeight = ''; return; }
    // Binary search for the largest size that still fits.
    var lo = MIN, hi = fs;
    for (var i = 0; i < 14; i++) {
      var mid = (lo + hi) / 2;
      page.style.fontSize = mid + 'px';
      if (overflowing()) hi = mid; else lo = mid;
    }
    page.style.fontSize = lo + 'px';
    // If even the smallest size can't fit (a very short window), let the page scroll after all.
    if (overflowing()) root.style.overflowY = '';
    page.style.minHeight = '';
  }

  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 60); });
  // Web fonts change line wrapping, so fit again once they (and the page) have fully loaded.
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(fit);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fit);
  }
  window.addEventListener('load', fit);
  fit();
})();
