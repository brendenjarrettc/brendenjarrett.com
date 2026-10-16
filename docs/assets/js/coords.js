// Contact page backdrop: a faint, rug-like field of level terminal text (after aphextwin.warp.net).
// Horizontal rows alternate between a live cursor readout and crawling stock-ticker tape:
//  - readout rows: the browser, screen size, cursor pixel position and that position as latitude /
//    longitude (left edge 180°W, right 180°E, top 90°N, bottom 90°S), the page address and a clock;
//  - ticker rows: RANDOM made-up symbols with random prices in USD and yen (not real market data),
//    scrolling sideways in alternating directions and re-pricing every couple of seconds;
//  - sporadic full-height columns of sideways text (some reading down, some up, of varying widths)
//    break through the rows, mixing ticker tape and readout.
// Nothing is stored or sent anywhere.
(function () {
  var box = document.querySelector('.coords-bg');
  if (!box) return;
  var YEN_PER_USD = 150; // fixed nominal rate for the made-up prices

  var field = document.createElement('div');
  field.className = 'coords-field';
  box.appendChild(field);

  var x = Math.round(window.innerWidth / 2), y = Math.round(window.innerHeight / 2);
  var start = performance.now();
  var readoutRows = [];   // {el, kind}
  var tickerRows = [];    // {el, items}
  var built = '';

  function pad(n, len) { n = String(Math.abs(Math.round(n))); while (n.length < len) n = '0' + n; return n; }
  function deg(v, len, pos, neg) { return pad(Math.floor(Math.abs(v)), len) + '.' + pad((Math.abs(v) % 1) * 10000, 4) + '°' + (v >= 0 ? pos : neg); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  // ---------- made-up tickers ----------
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function symbol() {
    var s = '', n = 2 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) s += LETTERS[Math.floor(Math.random() * 26)];
    return s;
  }
  function newTicker() { return { sym: symbol(), usd: Math.exp(rand(Math.log(2), Math.log(1500))), chg: rand(-6, 6) }; }
  function money(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function yen(v) { return Math.round(v * YEN_PER_USD).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function tickerText(t) {
    return t.sym + ' ' + (t.chg >= 0 ? '▲' : '▼') + Math.abs(t.chg).toFixed(2) + '% $' + money(t.usd) + ' ¥' + yen(t.usd);
  }
  function renderTape(row) {
    var s = row.items.map(tickerText).join('   ·   ') + '   ·   ';
    row.el.firstChild.textContent = s + s; // doubled so the crawl loops seamlessly
  }

  // ---------- readout ----------
  function clock() {
    var d = new Date(), ms = performance.now() - start, s = Math.floor(ms / 1000);
    return pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2) + ' ' +
      pad(Math.floor(s / 3600), 2) + ':' + pad(Math.floor(s / 60) % 60, 2) + ':' + pad(s % 60, 2) + ':' + pad(Math.floor((ms % 1000) / 1000 * 30), 2);
  }
  var UA = navigator.userAgent.toLowerCase(), URL_ = location.href.toLowerCase();
  function readoutText(kind) {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (kind === 'ua') return UA;
    if (kind === 'url') return URL_;
    if (kind === 'pos') return vw + 'px ' + vh + 'px x' + pad(x, 4) + ' y' + pad(y, 4) + ' ' + clock();
    var lon = (x / vw) * 360 - 180, lat = 90 - (y / vh) * 180;
    return 'lat ' + deg(lat, 2, 'n', 's') + ' lon ' + deg(lon, 3, 'e', 'w');
  }
  function repeatToWidth(text, minChars) { var s = text; while (s.length < minChars) s += '   ' + text; return s; }

  // ---------- layout ----------
  var KINDS = ['ua', 'pos', 'geo', 'url'];
  function build() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var fs = parseFloat(getComputedStyle(box).fontSize);
    var lineH = fs * 1.02;
    var rows = Math.ceil(vh / lineH) + 1;
    var key = rows + '@' + vw + 'x' + vh;
    if (key === built) return;
    built = key;

    field.innerHTML = '';
    readoutRows = []; tickerRows = [];
    var charsPerRow = Math.ceil(vw / (fs * 0.42)) + 10;       // VT323 is ~0.42em per character

    for (var r = 0; r < rows; r++) {
      var p = document.createElement('p');
      if (r % 2 === 0) {                                      // readout row
        var kind = KINDS[(r / 2) % KINDS.length];
        p.className = 'coords-row';
        readoutRows.push({ el: p, kind: kind, min: charsPerRow });
      } else {                                                // ticker tape row
        p.className = 'coords-row tape' + (((r - 1) / 2) % 2 ? ' rev' : '');
        var span = document.createElement('span');
        p.appendChild(span);
        var items = [];
        var count = Math.ceil(charsPerRow / 30) + 1;
        for (var i = 0; i < count; i++) items.push(newTicker());
        var row = { el: p, items: items };
        tickerRows.push(row);
        renderTape(row);
        span.style.animationDuration = (70 + Math.random() * 50).toFixed(0) + 's';
      }
      field.appendChild(p);
    }
    buildColumns(vw, vh, fs);
    renderReadout();
  }

  // ---------- vertical breaks ----------
  // Sporadic full-height columns cut through the rows. Their text is turned on its side: some read
  // top-to-bottom, others bottom-to-top. Each column is 1-4 lines wide at its own text size, so widths
  // vary, and mixes crawling ticker tape with the live readout. Placement is random on every visit.
  function buildColumns(vw, vh, fs) {
    var count = Math.max(1, Math.round(rand(vw / 520, vw / 260)));
    var placed = [], tries = 0;
    while (placed.length < count && tries++ < 300) {
      var lines = 1 + Math.floor(Math.random() * 4);
      var scale = rand(0.7, 1.45);
      var w = lines * fs * scale * 1.02;
      var left = Math.random() * (vw - w);
      var clash = placed.some(function (p) { return left < p.left + p.w + fs * 0.6 && p.left < left + w + fs * 0.6; });
      if (!clash) placed.push({ left: left, w: w, lines: lines, scale: scale });
    }
    placed.forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'coords-col' + (Math.random() < 0.5 ? ' up' : '');
      el.style.left = c.left.toFixed(0) + 'px';
      el.style.width = c.w.toFixed(1) + 'px';
      el.style.fontSize = c.scale.toFixed(2) + 'em';
      var chars = Math.ceil(vh / (fs * c.scale * 0.42)) + 10; // characters needed to run the full height
      for (var l = 0; l < c.lines; l++) {
        var p = document.createElement('p');
        if (Math.random() < 0.65) {                             // crawling ticker line
          p.className = 'coords-vline tape' + (Math.random() < 0.5 ? ' rev' : '');
          var span = document.createElement('span');
          span.style.animationDuration = (45 + Math.random() * 60).toFixed(0) + 's';
          p.appendChild(span);
          var items = [];
          for (var i = 0; i < Math.ceil(chars / 30) + 1; i++) items.push(newTicker());
          var row = { el: p, items: items };
          tickerRows.push(row);
          renderTape(row);
        } else {                                                // live readout line
          p.className = 'coords-vline';
          readoutRows.push({ el: p, kind: KINDS[Math.floor(Math.random() * KINDS.length)], min: chars });
        }
        el.appendChild(p);
      }
      field.appendChild(el);
    });
  }
  var queued = false;
  function renderReadout() {
    queued = false;
    for (var i = 0; i < readoutRows.length; i++) {
      var r = readoutRows[i];
      r.el.textContent = repeatToWidth(readoutText(r.kind), r.min);
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(renderReadout); } }

  // Re-price: every 1.8s nudge prices on a few rows and occasionally swap in a new symbol.
  function reprice(row) {
    row.items.forEach(function (t, j) {
      if (Math.random() < 0.06) { row.items[j] = newTicker(); return; }
      var move = rand(-1.2, 1.2);
      t.usd = Math.max(0.5, t.usd * (1 + move / 100));
      t.chg = Math.max(-25, Math.min(25, t.chg + move));
    });
  }
  function tick() {
    tickerRows.forEach(function (row) { if (Math.random() < 0.5) return; reprice(row); renderTape(row); });
  }

  window.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; queue(); }, { passive: true });
  window.addEventListener('touchmove', function (e) { var t = e.touches[0]; x = t.clientX; y = t.clientY; queue(); }, { passive: true });
  window.addEventListener('touchstart', function (e) { var t = e.touches[0]; x = t.clientX; y = t.clientY; queue(); }, { passive: true });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); queue(); }, 150); });
  setInterval(queue, 1000 / 15);
  setInterval(tick, 1800);
  build();
})();
