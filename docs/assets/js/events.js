// Google Analytics events for the actions that matter, beyond page views:
// reel plays, streaming and social clicks, "Work with me", album plays and the Wall Street Raider links.
// (LISTEN opens and contact form sends are recorded in player.js and contact.js.)
(function () {
  function ev(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }
  window.bjEvent = ev;

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var img = a.querySelector('img');
    var label = (img && img.alt) || a.getAttribute('aria-label') || a.hostname;
    if (a.closest('.platforms')) ev('streaming_click', { platform: label });
    else if (a.closest('.socials')) ev('social_click', { platform: label });
    else if (a.classList.contains('hire-btn')) ev('hire_click', { from_page: location.pathname });
    else if (a.classList.contains('album-play')) ev('album_play_click', { album: location.pathname });
    else if (a.closest('.wsr-feature')) ev('wsr_click', { link: a.hostname });
    else if (a.classList.contains('about-src')) ev('profile_click', { site: a.hostname });
  }, true);

  // The reel is a separate player in a frame; when the window loses focus to it, the visitor clicked into it.
  var reelSeen = false;
  window.addEventListener('blur', function () {
    setTimeout(function () {
      var f = document.activeElement;
      if (!reelSeen && f && f.tagName === 'IFRAME' && f.closest('.reel')) { reelSeen = true; ev('reel_interact'); }
    }, 0);
  });
})();

