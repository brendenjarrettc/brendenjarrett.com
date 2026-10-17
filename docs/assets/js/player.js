// Site-wide music player: full albums from Bandcamp that keep playing while you move around the site.
//
// On a normal page this adds a LISTEN button. Clicking it opens /listen/, a small shell page with the
// Bandcamp player in a bar along the bottom and the site shown in a frame above it. Moving between pages
// only changes the frame, so the music never stops; the address bar and tab title follow the page in the
// frame, and reloading simply returns to the normal page (and stops the music).
(function () {
  var ALBUMS = [
    { id: '1087454692', title: 'Quailentime', slug: 'quailentime' },
    { id: '2510744562', title: "Grandpa's Clothes EP", slug: 'grandpas-clothes-ep' },
    { id: '3515328253', title: 'ACOLDAUS', slug: 'acoldaus' },
    { id: '1811916302', title: 'Cleft', slug: 'cleft' },
    { id: '1894157059', title: 'Effervescent', slug: 'effervescent' },
    { id: '369130015', title: 'Tomorrow Is Only a Dream Away', slug: 'tomorrow-is-only-a-dream-away' }
  ];
  var NOTE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="17" cy="16" r="3" fill="currentColor"/></svg>';

  function albumFor(path) {
    var m = /^\/music\/([^\/]+)\//.exec(path);
    for (var i = 0; m && i < ALBUMS.length; i++) if (ALBUMS[i].slug === m[1]) return ALBUMS[i];
    return ALBUMS[0];
  }
  function embedUrl(id) {
    return 'https://bandcamp.com/EmbeddedPlayer/album=' + id + '/size=small/bgcol=333333/linkcol=ffffff/transparent=true/';
  }
  function safePath(p) { return (p && p.charAt(0) === '/' && p.charAt(1) !== '/' && p.indexOf('/listen/') !== 0) ? p : '/'; }

  var shell = document.body.classList.contains('bj-shell');
  var framed = false;
  try { framed = window.parent !== window && window.parent.document.body.classList.contains('bj-shell'); } catch (e) {}

  // ---- A page shown inside the shell: no button; links to other sites open in a new tab so the music keeps going.
  if (framed) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (a && a.origin !== location.origin && !a.target) { a.target = '_blank'; a.rel = 'noopener'; }
    }, true);
    return;
  }

  // ---- The shell page (/listen/).
  if (shell) {
    var params = new URLSearchParams(location.search);
    var start = safePath(params.get('p'));
    var y = parseInt(params.get('y'), 10) || 0;
    var chosen = albumFor(start);
    for (var i = 0; i < ALBUMS.length; i++) if (ALBUMS[i].id === params.get('a')) chosen = ALBUMS[i];

    var site = document.getElementById('bj-site');
    var bc = document.getElementById('bj-bandcamp');
    var select = document.getElementById('bj-album');
    var close = document.getElementById('bj-close');

    ALBUMS.forEach(function (a) {
      var o = document.createElement('option');
      o.value = a.id; o.textContent = a.title;
      if (a === chosen) o.selected = true;
      select.appendChild(o);
    });
    bc.src = embedUrl(chosen.id);
    select.addEventListener('change', function () { bc.src = embedUrl(select.value); });

    var current = start, first = true;
    site.addEventListener('load', function () {
      try {
        var w = site.contentWindow;
        current = w.location.pathname + w.location.search + w.location.hash;
        history.replaceState(null, '', current);
        document.title = w.document.title;
        if (first && y) w.scrollTo(0, y);
      } catch (e) {}
      first = false;
    });
    site.src = start;

    // Close: leave the shell and go back to the normal page you are on (this stops the music).
    close.addEventListener('click', function () { location.href = current; });
    return;
  }

  // ---- A normal page: the LISTEN button.
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bj-listen';
  btn.setAttribute('aria-label', 'Listen to full albums while you browse');
  btn.innerHTML = NOTE + '<span>LISTEN</span>';
  btn.addEventListener('click', function () {
    var p = location.pathname + location.search + location.hash;
    location.href = '/listen/?p=' + encodeURIComponent(p) + '&a=' + albumFor(location.pathname).id + '&y=' + Math.round(window.scrollY);
  });
  document.body.appendChild(btn);
  document.body.classList.add('has-listen');
})();
