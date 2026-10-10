(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };

  /* ---- Split names into letters for the entrance ---- */
  document.querySelectorAll('[data-split]').forEach(function (el, k) {
    var text = el.textContent.trim();
    el.textContent = '';
    Array.from(text).forEach(function (ch, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      s.style.setProperty('--i', i + k * 7);
      el.appendChild(s);
    });
  });

  /* ---- Hero parallax ---- */
  var hero = $('.hero');
  var px = 0, py = 0;
  window.addEventListener('pointermove', function (e) {
    px = e.clientX / window.innerWidth - 0.5;
    py = e.clientY / window.innerHeight - 0.5;
    if (!reduce) { hero.style.setProperty('--mx', (px * 2).toFixed(3)); hero.style.setProperty('--my', (py * 2).toFixed(3)); }
  }, { passive: true });

  /* ---- Floating gold dust and petals ---- */
  var cv = $('#motes'), ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), motes = [];
  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function make(i) {
    var petal = i % 6 === 0;
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: petal ? 5 + Math.random() * 5 : 0.8 + Math.random() * 2,
      vy: -(0.08 + Math.random() * 0.28), vx: (Math.random() - 0.5) * 0.25,
      ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02,
      petal: petal, depth: 0.3 + Math.random() * 0.9,
      c: petal ? '234,169,155' : (Math.random() < 0.7 ? '226,194,138' : '255,243,214')
    };
  }
  function seed() {
    var n = Math.round(Math.min(90, Math.max(36, W / 16)));
    motes = []; for (var i = 0; i < n; i++) motes.push(make(i));
  }
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      if (!reduce) {
        m.y += m.vy; m.x += m.vx + Math.sin(t / 1800 + m.ph) * 0.12; m.rot += m.vr;
        if (m.y < -20) { m.y = H + 20; m.x = Math.random() * W; }
        if (m.x < -20) m.x = W + 20; if (m.x > W + 20) m.x = -20;
      }
      var a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t / 900 + m.ph));
      var ox = px * 30 * m.depth, oy = py * 20 * m.depth;
      ctx.save();
      ctx.translate(m.x + ox, m.y + oy);
      if (m.petal) {
        ctx.rotate(m.rot);
        ctx.fillStyle = 'rgba(' + m.c + ',' + (a * 0.45).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(0, 0, m.r, m.r * 0.5, 0, 0, 6.283); ctx.fill();
      } else {
        var g = ctx.createRadialGradient(0, 0, 0, 0, 0, m.r * 4);
        g.addColorStop(0, 'rgba(' + m.c + ',' + a.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + m.c + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, m.r * 4, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  }
  size(); seed();
  if (reduce) { frame(0); } else { requestAnimationFrame(frame); }
  window.addEventListener('resize', function () { size(); seed(); if (reduce) frame(0); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduce) requestAnimationFrame(frame); });

  /* ---- Countdown ---- */
  var target = new Date($('[data-event]').getAttribute('data-event')).getTime();
  var cd = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };
  function put(el, v) {
    var s = String(v).padStart(2, '0');
    if (el.textContent !== s) {
      el.textContent = s;
      if (!reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
    }
  }
  function tick() {
    var ms = target - Date.now();
    if (ms <= 0) {
      $('#count-grid').hidden = true;
      var done = $('#count-done'); done.hidden = false;
      done.textContent = ms > -86400000 ? 'The celebration is today.' : 'Thank you for celebrating with us.';
      return;
    }
    var s = Math.floor(ms / 1000);
    put(cd.d, Math.floor(s / 86400));
    put(cd.h, Math.floor(s % 86400 / 3600));
    put(cd.m, Math.floor(s % 3600 / 60));
    put(cd.s, s % 60);
    setTimeout(tick, 1000 - (ms % 1000));
  }
  tick();

  /* ---- Clipboard helper with fallback ---- */
  function copyText(text, btn, fallbackEl) {
    var label = btn.textContent;
    function ok() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = label; }, 1600); }
    function fallback() {
      if (fallbackEl) { fallbackEl.focus(); fallbackEl.select && fallbackEl.select(); }
      btn.textContent = 'Press copy on your keyboard';
      setTimeout(function () { btn.textContent = label; }, 2400);
    }
    try {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } catch (e) { fallback(); }
  }
  $('#copy-addr').addEventListener('click', function () {
    var t = $('#addr').innerText.replace(/\s*\n\s*/g, ' ');
    var tmp = document.createElement('textarea'); tmp.value = t; tmp.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(tmp);
    var btn = this, label = btn.textContent;
    try {
      navigator.clipboard.writeText('Viswanath Gardens, ' + t).then(function () {
        btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = label; }, 1600);
      }, function () {
        tmp.select(); btn.textContent = 'Select and copy'; setTimeout(function () { btn.textContent = label; }, 2400);
      });
    } catch (e) { tmp.select(); btn.textContent = 'Select and copy'; setTimeout(function () { btn.textContent = label; }, 2400); }
    setTimeout(function () { tmp.remove(); }, 3000);
  });

  /* ---- RSVP form ---- */
  var form = $('#rsvp-form'), thanks = $('#thanks');
  var guests = 1, gOut = $('#guest-count');
  function setGuests(n) { guests = Math.max(1, Math.min(8, n)); gOut.textContent = guests; }
  $('#g-minus').addEventListener('click', function () { setGuests(guests - 1); });
  $('#g-plus').addEventListener('click', function () { setGuests(guests + 1); });
  form.elements.attend.forEach ? null : null;
  Array.prototype.forEach.call(form.querySelectorAll('input[name="attend"]'), function (r) {
    r.addEventListener('change', function () { $('#guest-field').hidden = form.elements.attend.value === 'no'; });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nameEl = $('#rsvp-name'), name = nameEl.value.trim();
    if (!name) { $('#name-err').hidden = false; nameEl.focus(); return; }
    $('#name-err').hidden = true;
    var yes = form.elements.attend.value === 'yes';
    var note = $('#rsvp-note').value.trim();
    var msg = 'Hello Keerthana and Robin, this is ' + name + '. ' +
      (yes ? 'We will be there, ' + guests + (guests === 1 ? ' guest' : ' guests') + ' in total, on 21 October.'
           : 'I am sorry, I will not be able to make it.') +
      (note ? ' ' + note : '');
    $('#thanks-h').textContent = yes ? 'See you there, ' + name.split(' ')[0] : 'We will miss you, ' + name.split(' ')[0];
    $('#thanks-p').textContent = 'Your reply is ready. Send it to Keerthana and Robin so they can count you in.';
    $('#reply-text').value = msg;
    var num = (thanks.getAttribute('data-whatsapp') || '').replace(/\D/g, '');
    $('#wa-link').href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
    form.hidden = true; thanks.hidden = false;
    thanks.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    if (yes) burst();
  });
  $('#copy-reply').addEventListener('click', function () { copyText($('#reply-text').value, this, $('#reply-text')); });
  $('#edit-reply').addEventListener('click', function () { thanks.hidden = true; form.hidden = false; $('#rsvp-name').focus(); });

  /* ---- Confetti burst ---- */
  var bc = $('#burst'), bx = bc.getContext('2d'), bits = [], running = false;
  function burst() {
    if (reduce) return;
    bc.width = window.innerWidth * dpr; bc.height = window.innerHeight * dpr;
    bx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = ['#e2c28a', '#f6dfae', '#eaa99b', '#f5ede1', '#2f8f80'];
    var ox = window.innerWidth / 2, oy = window.innerHeight * 0.62;
    for (var i = 0; i < 140; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 6 + Math.random() * 9;
      bits.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length], life: 0 });
    }
    if (!running) { running = true; requestAnimationFrame(step); }
  }
  function step() {
    bx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    bits = bits.filter(function (b) { return b.life < 190 && b.y < window.innerHeight + 30; });
    bits.forEach(function (b) {
      b.life++; b.vy += 0.22; b.vx *= 0.992; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      bx.save(); bx.translate(b.x, b.y); bx.rotate(b.r);
      bx.globalAlpha = Math.max(0, 1 - b.life / 190);
      bx.fillStyle = b.c; bx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); bx.restore();
    });
    if (bits.length) requestAnimationFrame(step); else { running = false; bx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }
})();
