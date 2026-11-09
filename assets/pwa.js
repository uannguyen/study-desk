// Đăng ký service worker + popup flashcard: chạm để lật, chấm "Chưa nhớ / Nhớ rồi" kiểu Leitner.
(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});

  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s) { return ov.querySelector(s); }

  var PASTEL = ['#c5def5', '#cfe8cf', '#fbd3b4', '#ddd3f2', '#f7da6a', '#f5c6cf', '#cde9e4'];
  var WEIGHT = { 1: 6, 2: 2, 3: 1 };   // hộp 1 = chưa nhớ, gặp nhiều nhất; hộp 3 = thuộc, thỉnh thoảng
  var decks = [], loaded = {}, pool = [], recent = [], cur = null, flipped = false;
  var box = get('fc-box', {});         // { cardId: 1|2|3 }
  var deckId = get('fc-deck', 'all');

  var fab = document.createElement('button');
  fab.id = 'fc-fab'; fab.hidden = true; fab.innerHTML = '<span>✎</span> Ôn bài';
  var ov = document.createElement('div');
  ov.id = 'fc-ov';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Ôn bài bằng thẻ');
  ov.innerHTML =
    '<header class="fc-top"><div class="fc-chips"></div><button class="fc-x" aria-label="Đóng">×</button></header>' +
    '<div class="fc-stats"></div>' +
    '<div class="fc-scene"><div class="fc-card">' +
      '<section class="fc-face fc-front"></section><section class="fc-face fc-back"></section>' +
    '</div></div>' +
    '<footer class="fc-bar"></footer>';
  document.body.appendChild(fab); document.body.appendChild(ov);
  var card = $('.fc-card');

  function color(id) { var i = decks.findIndex(function (d) { return d.id === id; }); return PASTEL[(i < 0 ? 0 : i) % PASTEL.length]; }
  function lvl(c) { return box[c.id] || 1; }

  function renderChips() {
    var all = decks.reduce(function (n, d) { return n + d.count; }, 0);
    $('.fc-chips').innerHTML = [{ id: 'all', name: 'Tất cả', count: all }].concat(decks).map(function (d) {
      return '<button class="fc-chip' + (d.id === deckId ? ' on' : '') + '" data-id="' + d.id + '"' +
        (d.id === 'all' ? '' : ' style="--c:' + color(d.id) + '"') + '>' + esc(d.name) + ' <small>' + d.count + '</small></button>';
    }).join('');
  }
  function renderStats() {
    var n = [0, 0, 0, 0];
    pool.forEach(function (c) { n[lvl(c)]++; });
    $('.fc-stats').innerHTML = '<span class="b1">Chưa nhớ ' + n[1] + '</span><span class="b2">Đang nhớ ' + n[2] + '</span><span class="b3">Thuộc ' + n[3] + '</span>';
  }
  function renderBar() {
    $('.fc-bar').innerHTML = flipped
      ? '<button class="no" data-act="1">✗ Chưa nhớ</button><button class="ok" data-act="2">✓ Nhớ rồi</button>'
      : '<button class="skip" data-act="skip">Bỏ qua</button><button class="flip" data-act="flip">Lật thẻ</button>';
  }

  // Chọn ngẫu nhiên có trọng số theo hộp, tránh lặp lại mấy thẻ vừa gặp.
  function pick() {
    var avoid = Math.min(5, pool.length - 1);
    var cand = pool.filter(function (c) { return recent.slice(-avoid).indexOf(c.id) < 0; });
    var total = cand.reduce(function (s, c) { return s + WEIGHT[lvl(c)]; }, 0), r = Math.random() * total;
    for (var i = 0; i < cand.length; i++) { r -= WEIGHT[lvl(cand[i])]; if (r < 0) return cand[i]; }
    return cand[cand.length - 1];
  }

  function show(c) {
    cur = c; flipped = false; card.classList.remove('flip');
    recent.push(c.id); if (recent.length > 20) recent.shift();
    card.style.setProperty('--c', color(c.deck));
    var tag = '<div class="fc-tag"><b>' + esc(c.deckName) + '</b> · ' + esc(c.sub || '') + '</div>';
    $('.fc-front').innerHTML = tag +
      '<div class="fc-q">' + c.q + (c.star ? ' <span class="fc-star" title="Câu hay bị hỏi">⭐</span>' : '') + '</div>' +
      (c.hint ? '<button class="fc-hint" data-act="hint">💡 gợi ý từ khóa</button><div class="fc-kw" hidden>' + esc(c.hint) + '</div>' : '') +
      '<div class="fc-tip">Tự nói thành lời trước, rồi chạm để lật</div>';
    $('.fc-back').innerHTML = tag + '<div class="fc-q2">' + c.q + '</div>' +
      c.a.map(function (r) {
        var warn = /bẫy|red flag/i.test(r.label) ? ' warn' : '';
        return '<div class="fc-row' + warn + '">' + (r.label ? '<span class="lb">' + esc(r.label) + '</span>' : '') + r.html + '</div>';
      }).join('') +
      (c.src ? '<a class="fc-src" href="' + esc(c.src) + '">Xem trong vở →</a>' : '');
    card.classList.remove('enter'); void card.offsetWidth; card.classList.add('enter');
    renderBar(); renderStats();
  }
  function next() { if (pool.length) show(pick()); }
  function flip() { flipped = !flipped; card.classList.toggle('flip', flipped); renderBar(); }
  function grade(ok) {
    box[cur.id] = ok ? Math.min(3, lvl(cur) + 1) : 1;
    set('fc-box', box); next();
  }

  function loadDeck(d) {
    if (loaded[d.id]) return Promise.resolve(loaded[d.id]);
    return fetch('cards/' + d.id + '.json').then(function (r) { return r.json(); }).then(function (cs) {
      cs.forEach(function (c) { c.deck = d.id; c.deckName = d.name; });
      return (loaded[d.id] = cs);
    });
  }
  function useDeck(id) {
    deckId = decks.some(function (d) { return d.id === id; }) ? id : 'all';
    set('fc-deck', deckId); renderChips();
    var want = deckId === 'all' ? decks : decks.filter(function (d) { return d.id === deckId; });
    return Promise.all(want.map(loadDeck)).then(function (lists) {
      pool = [].concat.apply([], lists); recent = []; next();
    });
  }

  function open() {
    if (!decks.length) return;
    ov.classList.add('open'); document.documentElement.classList.add('fc-lock');
    set('fc-day', new Date().toDateString());
    if (pool.length) next(); else useDeck(deckId);
  }
  function close() { ov.classList.remove('open'); document.documentElement.classList.remove('fc-lock'); }

  // Chạm thẻ = lật; vuốt ngang = bỏ qua. Chặn click sau khi vuốt.
  var x0 = null, swiped = false;
  card.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; swiped = false; }, { passive: true });
  card.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 70) { swiped = true; next(); }
  });
  card.addEventListener('click', function (e) {
    if (swiped) { swiped = false; return; }
    var t = e.target.closest('[data-act="hint"]');
    if (t) { t.hidden = true; t.nextElementSibling.hidden = false; return; }
    var a = e.target.closest('a');
    if (a) {
      // Mở vở trong khung đọc của index (bấm link tương ứng ở sidebar) thay vì rời trang.
      var side = document.querySelector('nav a[href="' + a.getAttribute('href') + '"]');
      if (side) { e.preventDefault(); side.click(); }
      close(); return;
    }
    flip();
  });
  ov.addEventListener('click', function (e) {
    var chip = e.target.closest('.fc-chip'), act = e.target.closest('.fc-bar [data-act]');
    if (chip) useDeck(chip.dataset.id);
    else if (e.target.closest('.fc-x')) close();
    else if (act) {
      var a = act.dataset.act;
      if (a === 'flip') flip(); else if (a === 'skip') next(); else grade(a === '2');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (!ov.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    else if (flipped && (e.key === '1' || e.key === 'ArrowLeft')) grade(false);
    else if (flipped && (e.key === '2' || e.key === 'ArrowRight')) grade(true);
    else if (!flipped && e.key === 'ArrowRight') next();
  });
  fab.addEventListener('click', open);

  fetch('cards/index.json').then(function (r) { return r.json(); }).then(function (data) {
    decks = data; if (!decks.length) return;
    fab.hidden = false;
    // Mở sẵn một câu mỗi ngày: vào app là bị hỏi, không phải đọc.
    if (get('fc-day', '') !== new Date().toDateString()) open();
  }).catch(function () {});
})();
