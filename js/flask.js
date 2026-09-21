/* Liquid in the hero flask.
   Three layers: the original logo underneath (what no-JS sees), a canvas
   with a small ripple simulation clipped to the liquid mask, and the
   outline layer on top. The simulation is the classic two-buffer height
   field: a splash on load that settles, a gentle pull toward the pointer,
   and a slosh when the page scrolls. Cells outside the mask are walls, so
   waves reflect off the glass. */
(function () {
  var root = document.querySelector('[data-flask]');
  if (!root || !window.requestAnimationFrame) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = root.querySelector('canvas');
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var W = 150, H = 195;             /* simulation grid, same aspect as the art */
  var N = W * H;
  var cur = new Float32Array(N);
  var prev = new Float32Array(N);
  var tmp = new Float32Array(N);
  var wall = new Uint8Array(N);     /* 1 = outside the liquid */
  var mask = new Image();
  var maskReady = false;
  var off = document.createElement('canvas');
  off.width = W; off.height = H;
  var octx = off.getContext('2d');
  var img = octx.createImageData(W, H);
  var px = img.data;

  var SPEED = 0.08;                 /* wave speed squared, 0.5 is the fastest stable */
  var DAMP = 0.990;                 /* per-step energy loss, close to 1 settles slowly */
  var VISC = 0.22;                  /* diffusion per step: short ripples die, the swell stays */
  var running = false;
  var idleFrames = 0;
  var pointer = null;               /* {x, y} in grid units, or null */
  var pointerEnergy = 0;

  /* Three flat shades of one yellow, no gradients: the liquid reads as
     vector art, crests one step lighter, troughs one step darker. */
  var LIGHT = [255, 226, 92];
  var BASE = [255, 204, 0];
  var DARK = [232, 176, 0];
  var BAND = 0.9;                   /* slope needed to leave the base shade */

  mask.onload = function () {
    octx.drawImage(mask, 0, 0, W, H);
    var d = octx.getImageData(0, 0, W, H).data;
    for (var i = 0; i < N; i++) wall[i] = d[i * 4] < 110 ? 1 : 0;
    maskReady = true;
    root.classList.add('flask-live');
    resize();
    setTimeout(splash, 250);
  };
  mask.src = root.getAttribute('data-flask-mask');

  function resize() {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    draw();
  }

  function drop(gx, gy, radius, amp) {
    var x0 = Math.max(1, Math.floor(gx - radius)), x1 = Math.min(W - 2, Math.ceil(gx + radius));
    var y0 = Math.max(1, Math.floor(gy - radius)), y1 = Math.min(H - 2, Math.ceil(gy + radius));
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var dx = x - gx, dy = y - gy;
        var d2 = dx * dx + dy * dy;
        if (d2 > radius * radius) continue;
        var i = y * W + x;
        if (wall[i]) continue;
        cur[i] += amp * (1 - d2 / (radius * radius));
      }
    }
    wake();
  }

  /* The splash: one big drop where the stem meets the surface, then a few
     smaller ones so it reads as a splash rather than a single ring. */
  function splash() {
    drop(W * 0.56, H * 0.60, 22, 16);
    setTimeout(function () { drop(W * 0.30, H * 0.72, 16, 10); }, 350);
    setTimeout(function () { drop(W * 0.72, H * 0.82, 14, 9); }, 650);
  }

  /* Scroll: the table moved. A tilt impulse across the whole body. */
  var lastY = window.scrollY;
  function onScroll() {
    var dy = window.scrollY - lastY;
    lastY = window.scrollY;
    if (!maskReady || dy === 0) return;
    var k = Math.max(-1, Math.min(1, dy / 120)) * 2.2;
    for (var y = 1; y < H - 1; y++) {
      for (var x = 1; x < W - 1; x++) {
        var i = y * W + x;
        if (wall[i]) continue;
        cur[i] += k * ((x / W - 0.5) * 1.4 + (y / H - 0.72) * 0.6);
      }
    }
    wake();
  }

  /* Pointer: a soft pull that follows the cursor. Near the flask it stirs a
     little; over the liquid it stirs a bit more. Never a splash. */
  function onMove(e) {
    if (!maskReady) return;
    var r = canvas.getBoundingClientRect();
    var gx = (e.clientX - r.left) / r.width * W;
    var gy = (e.clientY - r.top) / r.height * H;
    var margin = W * 0.35;
    if (gx < -margin || gx > W + margin || gy < -margin || gy > H + margin) {
      pointer = null;
      return;
    }
    pointer = { x: gx, y: gy };
    pointerEnergy = 1;
    wake();
  }

  function nearestLiquid(gx, gy) {
    /* Clamp into the grid, then walk toward the centre of the body until we
       are on liquid. Cheap and good enough for a gentle effect. */
    var x = Math.max(1, Math.min(W - 2, gx));
    var y = Math.max(1, Math.min(H - 2, gy));
    var cx = W * 0.5, cy = H * 0.74;
    for (var s = 0; s < 40; s++) {
      var i = Math.round(y) * W + Math.round(x);
      if (!wall[i]) return { x: x, y: y, i: i, dist: Math.hypot(x - gx, y - gy) };
      x += (cx - x) * 0.12;
      y += (cy - y) * 0.12;
    }
    return null;
  }

  function step() {
    if (pointer && pointerEnergy > 0.02) {
      var n = nearestLiquid(pointer.x, pointer.y);
      if (n) {
        var reach = 1 / (1 + n.dist / 10);
        drop(n.x, n.y, 12, 0.7 * reach * pointerEnergy);
      }
      pointerEnergy *= 0.9;
    }
    var energy = 0;
    for (var y = 1; y < H - 1; y++) {
      for (var x = 1; x < W - 1; x++) {
        var i = y * W + x;
        if (wall[i]) { prev[i] = 0; continue; }
        var c = cur[i];
        var lap = cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W] - 4 * c;
        var v = 2 * c - prev[i] + SPEED * lap;
        v = c + (v - c) * DAMP;
        prev[i] = v;
        energy += v < 0 ? -v : v;
      }
    }
    var t = cur; cur = prev; prev = t;
    /* Diffusion: blend each cell toward its neighbours. */
    for (y = 1; y < H - 1; y++) {
      for (x = 1; x < W - 1; x++) {
        i = y * W + x;
        if (wall[i]) { tmp[i] = 0; continue; }
        var avg = (cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.25;
        tmp[i] = cur[i] + (avg - cur[i]) * VISC;
      }
    }
    t = cur; cur = tmp; tmp = t;
    root.__flaskEnergy = energy / N;
    return energy / N;
  }

  function draw() {
    if (!maskReady) return;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        var o = i * 4;
        if (wall[i]) { px[o + 3] = 0; continue; }
        /* Lit from the upper left: slopes facing the light take the pale
           shade, slopes facing away take the deep one, the rest stays base. */
        var l = x > 2 ? cur[i - 3] : cur[i];
        var u = y > 2 ? cur[i - 3 * W] : cur[i];
        var s = (cur[i] - l) * 0.9 + (cur[i] - u) * 0.6 + cur[i] * 0.15;
        var col = s > BAND ? LIGHT : s < -BAND ? DARK : BASE;
        px[o] = col[0];
        px[o + 1] = col[1];
        px[o + 2] = col[2];
        px[o + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* Time scale: one physics step every STRIDE frames. 2 is half speed. */
  var STRIDE = 2;
  var tick = 0;

  function frame() {
    if (!running) return;
    tick = (tick + 1) % STRIDE;
    if (tick !== 0) { requestAnimationFrame(frame); return; }
    var e = step();
    draw();
    idleFrames = e < 0.0005 && !(pointer && pointerEnergy > 0.02) ? idleFrames + 1 : 0;
    if (idleFrames > 30) { running = false; return; }
    requestAnimationFrame(frame);
  }

  function wake() {
    idleFrames = 0;
    if (running || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { lastY = window.scrollY; wake(); }
  });
})();
