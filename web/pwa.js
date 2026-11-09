// Đăng ký service worker + popup flashcard (chạm để lật câu hỏi / câu trả lời).
(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  var cards = [], deck = [], cur = null;
  var fab = document.createElement('button');
  fab.id = 'fc-fab'; fab.textContent = 'Ôn bài'; fab.hidden = true;
  var ov = document.createElement('div');
  ov.id = 'fc-ov';
  ov.innerHTML = '<div class="fc-box"><div class="fc-scene"><div class="fc-card" id="fc-card">' +
    '<div class="fc-face fc-front"></div><div class="fc-face fc-back"></div></div></div>' +
    '<div class="fc-bar"><button id="fc-close">Đóng</button><button id="fc-next" class="pri">Câu khác</button></div></div>';
  document.body.appendChild(fab); document.body.appendChild(ov);

  var card = ov.querySelector('#fc-card'), front = ov.querySelector('.fc-front'), back = ov.querySelector('.fc-back');

  // Bộ bài xáo trộn, rút hết mới xáo lại: tránh lặp câu liên tục.
  function refill() {
    deck = cards.map(function (_, i) { return i; });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
  }
  function show(c) {
    cur = c; card.classList.remove('flip');
    front.innerHTML = '<div class="fc-tag">' + esc(c.tag) + (c.star ? ' · ⭐ câu phân loại' : '') + '</div>' +
      '<div class="fc-q">' + c.q + '</div><div class="fc-hint">Tự nói thành lời trước, rồi chạm để lật xem đáp án</div>';
    back.innerHTML = '<div class="fc-tag">' + c.q.replace(/<[^>]+>/g, '') + '</div>' + c.a.map(function (r) {
      var red = /red flag/i.test(r.label) ? ' red' : '';
      return '<div class="fc-row' + red + '"><b class="l">' + esc(r.label) + '</b>' + r.html + '</div>';
    }).join('') + '<div class="fc-hint">Chạm để quay lại câu hỏi</div>';
  }
  function next() { if (!deck.length) refill(); show(cards[deck.pop()]); }
  function open() { if (!cards.length) return; ov.classList.add('open'); next(); store('fc-day', new Date().toDateString()); }
  function close() { ov.classList.remove('open'); }

  card.addEventListener('click', function () { card.classList.toggle('flip'); });
  ov.querySelector('#fc-next').addEventListener('click', next);
  ov.querySelector('#fc-close').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  fab.addEventListener('click', open);
  document.addEventListener('keydown', function (e) {
    if (!ov.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); card.classList.toggle('flip'); }
    else if (e.key === 'ArrowRight') next();
  });

  fetch('cards.json').then(function (r) { return r.json(); }).then(function (data) {
    cards = data; if (!cards.length) return;
    fab.hidden = false;
    // Mở sẵn một câu mỗi ngày: vào app là bị hỏi, không phải đọc.
    if (store('fc-day') !== new Date().toDateString()) open();
  }).catch(function () {});
})();
