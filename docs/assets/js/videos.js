// Videos page: each card shows a thumbnail; clicking it swaps in the YouTube player and starts playing.
// The player only loads on click, so the page stays fast and YouTube sets no cookies until then.
(function () {
  var playing = null;
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.vid-play');
    if (!btn) return;
    var id = btn.getAttribute('data-yt');
    var frame = document.createElement('iframe');
    frame.className = 'vid-frame';
    frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
    frame.title = btn.getAttribute('aria-label').replace(/^Play: /, '');
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    // Only one video at a time: put the previous one back to its thumbnail.
    if (playing && playing.frame.isConnected) playing.frame.replaceWith(playing.btn);
    btn.replaceWith(frame);
    playing = { frame: frame, btn: btn };
    if (window.bjEvent) window.bjEvent('video_play', { video_id: id, video_title: frame.title });
  });
})();
