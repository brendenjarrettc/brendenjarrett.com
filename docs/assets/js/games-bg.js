// Articles background: the game covers in A-Z order, laid out like reading a page (left to right,
// row after row, starting again after Z). Covers per row adapt to the screen so the full A-Z run is
// visible; alternate rows sit half a cover over (brick layout), and because a row is not a multiple of
// the cover count each title drifts diagonally down the page, like stripes on a tie. The rows slide
// slowly left to right in a seamless loop.
(function () {
  var host = document.querySelector('.games-bg');
  if (!host) return;
  var COUNT = 41;                  // covers in /assets/img/games-strip.jpg
  var STRIP_W = 5474, STRIP_H = 177; // sprite size; each cover cell is STRIP_W / COUNT wide
  var grid = document.createElement('div');
  grid.className = 'games-grid';
  host.appendChild(grid);
  var built = '', lastW = 0, t0 = Date.now();

  var ANGLE = -14; // degrees; the grid is tilted like tie stripes
  var SPEED = 22;  // px per second the covers drift to the right

  function build() {
    // Height comes from the background box, which is sized to the tallest the screen gets (100lvh), so
    // the address bar sliding in and out while scrolling on a phone never moves or rebuilds the covers.
    var vw = window.innerWidth, vh = host.clientHeight || window.innerHeight;
    lastW = vw;
    // The tilted grid must be big enough to cover the screen's corners: use the screen diagonal.
    var size = Math.ceil(Math.hypot(vw, vh)) + 200;
    grid.style.width = grid.style.height = size + 'px';
    grid.style.left = ((vw - size) / 2) + 'px';
    grid.style.top = ((vh - size) / 2) + 'px';
    grid.style.transform = 'rotate(' + ANGLE + 'deg)';
    var target = Math.min(140, Math.max(62, vw / 16));    // preferred cover width in px
    var cols = Math.max(4, Math.round(size / target));
    var cw = size / cols;                                  // covers exactly fill each row
    var ch = cw * STRIP_H / (STRIP_W / COUNT);
    var rows = Math.ceil(size / ch) + 1;
    var key = cols + 'x' + rows + '@' + Math.round(cw);
    if (key === built) return;
    built = key;

    // Each row is one repeating strip of the A-Z covers. Rows slide right by exactly one full A-Z run
    // (the strip width) and start over: the frame after the jump is identical, so the loop is seamless.
    var stripW = cw * COUNT;
    var html = '', i = 0;
    for (var r = 0; r < rows; r++) {
      var odd = r % 2 === 1, n = odd ? cols + 1 : cols;
      var x = ((odd ? -cw / 2 : 0) - (i % COUNT) * cw) % stripW;
      html += '<div class="games-row" style="height:' + ch.toFixed(2) + 'px;--x:' + x.toFixed(2) + 'px"></div>';
      i += n;
    }
    grid.style.setProperty('--strip-w', stripW.toFixed(2) + 'px');
    var loop = stripW / SPEED;
    grid.style.setProperty('--loop', loop.toFixed(1) + 's');
    // Pick up the drift where it was (a rebuild only happens when the width changes, e.g. rotating a phone).
    grid.style.setProperty('--phase', (-(((Date.now() - t0) / 1000) % loop)).toFixed(2) + 's');
    grid.innerHTML = html;
  }

  var t;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return; // height-only change: the phone address bar; ignore it
    clearTimeout(t); t = setTimeout(build, 150);
  });
  build();
})();
