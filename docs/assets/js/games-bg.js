// Articles background: the game covers in A-Z order, laid out like reading a page (left to right,
// row after row, starting again after Z). Covers per row adapt to the screen so the full A-Z run is
// visible; alternate rows sit half a cover over (brick layout), and because a row is not a multiple of
// the cover count each title drifts diagonally down the page, like stripes on a tie.
(function () {
  var host = document.querySelector('.games-bg');
  if (!host) return;
  var COUNT = 41;                  // covers in /assets/img/games-strip.jpg
  var STRIP_W = 5474, STRIP_H = 177; // sprite size; each cover cell is STRIP_W / COUNT wide
  var grid = document.createElement('div');
  grid.className = 'games-grid';
  host.appendChild(grid);
  var built = '';

  var ANGLE = -14; // degrees; the grid is tilted like tie stripes

  function build() {
    var vw = window.innerWidth, vh = window.innerHeight;
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

    var html = '', i = 0;
    for (var r = 0; r < rows; r++) {
      var odd = r % 2 === 1, n = odd ? cols + 1 : cols;
      html += '<div class="games-row" style="height:' + ch.toFixed(2) + 'px;' + (odd ? 'margin-left:' + (-cw / 2).toFixed(2) + 'px' : '') + '">';
      for (var c = 0; c < n; c++, i++) {
        html += '<span style="width:' + cw.toFixed(2) + 'px;background-position:' + (-(i % COUNT) * cw).toFixed(2) + 'px 0"></span>';
      }
      html += '</div>';
    }
    grid.style.setProperty('--strip-w', (cw * COUNT).toFixed(2) + 'px');
    grid.innerHTML = html;
  }

  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 150); });
  build();
})();
