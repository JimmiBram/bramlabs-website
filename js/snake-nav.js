document.addEventListener('DOMContentLoaded', function () {
    const link = document.querySelector('.nav-link.active');
    if (!link) return;

    const SEG = 4;
    const COUNT = 10;
    const STEP_MS = 80;

    link.style.position = 'relative';

    const wrap = document.createElement('div');
    wrap.className = 'snake-wrap';
    link.appendChild(wrap);

    function buildPath(w, h) {
        const path = [];
        for (let x = 0; x <= w - SEG; x += SEG) path.push([x, 0]);
        for (let y = SEG; y <= h - SEG; y += SEG) path.push([w - SEG, y]);
        for (let x = w - SEG * 2; x >= 0; x -= SEG) path.push([x, h - SEG]);
        for (let y = h - SEG * 2; y >= SEG; y -= SEG) path.push([0, y]);
        return path;
    }

    const w = link.offsetWidth + 4;
    const h = link.offsetHeight + 4;
    wrap.style.cssText = 'position:absolute;inset:-2px;pointer-events:none;overflow:hidden;border-radius:8px;';

    const path = buildPath(w, h);

    const segs = [];
    for (let i = 0; i < COUNT; i++) {
        const el = document.createElement('div');
        el.className = 'snake-seg';
        const fade = 1 - (i / COUNT) * 0.8;
        if (i === 0) {
            el.style.cssText = `position:absolute;width:${SEG}px;height:${SEG}px;background:#ff77c6;box-shadow:0 0 6px #ff77c6, 0 0 2px #fff;`;
        } else {
            el.style.cssText = `position:absolute;width:${SEG}px;height:${SEG}px;background:rgba(120,219,255,${fade});`;
        }
        wrap.appendChild(el);
        segs.push(el);
    }

    // Restore position from sessionStorage (stored as fraction 0-1 of perimeter)
    let head = 0;
    try {
        const saved = parseFloat(sessionStorage.getItem('snake-pos'));
        if (!isNaN(saved)) {
            head = Math.round(saved * path.length) % path.length;
        }
    } catch (e) {}

    function render() {
        for (let i = 0; i < segs.length; i++) {
            const idx = (head - i + path.length) % path.length;
            segs[i].style.left = path[idx][0] + 'px';
            segs[i].style.top = path[idx][1] + 'px';
        }
    }

    function step() {
        head = (head + 1) % path.length;
        render();
    }

    // Save position before navigating away
    window.addEventListener('beforeunload', function () {
        try {
            sessionStorage.setItem('snake-pos', String(head / path.length));
        } catch (e) {}
    });

    render();
    setInterval(step, STEP_MS);
});