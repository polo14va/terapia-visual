const cfg = {
    separation: 1.5,
    separationStep: .5,
    pxPerUnit: 4,
    depthScale: 2,
    bgDots: 30000,
    dot: 3,
    radiusRatio: .25,
    lineRatio: .08,
    gap: Math.PI / 6
};

let correct = 0, wrong = 0;
let gapAngle = 0;
const gaps = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];

let canvas, ctx, redCanvas, blueCanvas, redCtx, blueCtx;
let col = {};

function getColorFromStorage(key, defaultValue) {
    const storedValue = localStorage.getItem(key);
    return storedValue ? storedValue : defaultValue;
}

const randGap = () => {
    let a;
    do { a = gaps[Math.floor(Math.random() * gaps.length)]; } while (a === gapAngle);
    gapAngle = a;
};

const inRing = (x, y, cx, cy, r, lw) => {
    const dx = x - cx, dy = y - cy;
    const d2 = dx * dx + dy * dy;
    return d2 >= (r - lw / 2) ** 2 && d2 <= (r + lw / 2) ** 2;
};

const inGap = (x, y, cx, cy, r) => {
    let a = Math.atan2(y - cy, x - cx);
    if (a < 0) a += 2 * Math.PI;
    const s = (gapAngle - cfg.gap / 2 + 2 * Math.PI) % (2 * Math.PI);
    const e = (gapAngle + cfg.gap / 2 + 2 * Math.PI) % (2 * Math.PI);
    return s < e ? a >= s && a <= e : a >= s || a <= e;
};

const buildDots = (square, cx, cy, r, lw) => {
    const bg = [], ring = [];
    while (bg.length < cfg.bgDots) {
        const x = square.x + Math.random() * square.size;
        const y = square.y + Math.random() * square.size;
        if (inRing(x, y, cx, cy, r, lw) && !inGap(x, y, cx, cy, r)) continue;
        bg.push([x, y]);
    }
    const ringArea = 2 * Math.PI * r * lw * (1 - cfg.gap / (2 * Math.PI));
    const density = cfg.bgDots / (square.size ** 2 - 2 * Math.PI * r * lw);
    const target = Math.floor(ringArea * density);
    while (ring.length < target) {
        const a = Math.random() * 2 * Math.PI;
        const d = r + (Math.random() - .5) * lw;
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        if (inGap(x, y, cx, cy, r)) continue;
        ring.push([x, y]);
    }
    return { bg, ring };
};

const drawChannel = (ctxTarget, dots, dx) => {
    const halfDot = Math.floor(cfg.dot / 2);
    ctxTarget.clearRect(0, 0, canvas.width, canvas.height);
    ctxTarget.beginPath();
    dots.bg.forEach(([x, y]) =>
        ctxTarget.fillRect(Math.round(x) - halfDot, Math.round(y) - halfDot, cfg.dot, cfg.dot)
    );
    ctxTarget.globalCompositeOperation = 'destination-out';
    ctxTarget.beginPath();
    dots.ring.forEach(([x, y]) =>
        ctxTarget.fillRect(Math.round(x) - halfDot, Math.round(y) - halfDot, cfg.dot, cfg.dot)
    );
    ctxTarget.globalCompositeOperation = 'source-over';
    dots.ring.forEach(([x, y]) =>
        ctxTarget.fillRect(Math.round(x + dx) - halfDot, Math.round(y) - halfDot, cfg.dot, cfg.dot)
    );
};

const render = () => {
    canvas.width = redCanvas.width = blueCanvas.width = window.innerWidth;
    canvas.height = redCanvas.height = blueCanvas.height = window.innerHeight;
    if (!canvas.width || !canvas.height) return;

    const square = { size: canvas.height * .8 };
    square.x = (canvas.width - square.size) / 2;
    square.y = (canvas.height - square.size) / 2;

    const r = square.size * cfg.radiusRatio;
    const lw = square.size * cfg.lineRatio;
    const cx = square.x + square.size / 2;
    const cy = square.y + square.size / 2;

    const disp = cfg.separation * cfg.pxPerUnit * cfg.depthScale / 2;
    const max = square.size / 2 - r - lw - cfg.dot;
    const shift = Math.min(disp, max);

    const dots = buildDots(square, cx, cy, r, lw);

    // --- Draw ring first (shifted dots) ---
    redCtx.clearRect(0, 0, canvas.width, canvas.height);
    redCtx.fillStyle = col.red;
    for (const [x, y] of dots.ring) {
        redCtx.fillRect(
            Math.round(x - shift - cfg.dot / 2),
            Math.round(y - cfg.dot / 2),
            cfg.dot, cfg.dot
        );
    }

    // --- Background for red: fill except where ring is ---
    let countR = 0;
    const cxR = cx - shift;
    while (countR < cfg.bgDots) {
        const rx = square.x + Math.random() * square.size;
        const ry = square.y + Math.random() * square.size;
        if (inRing(rx, ry, cxR, cy, r, lw) && !inGap(rx, ry, cxR, cy, r)) continue;
        redCtx.fillRect(
            Math.round(rx - cfg.dot / 2),
            Math.round(ry - cfg.dot / 2),
            cfg.dot, cfg.dot
        );
        countR++;
    }

    // --- Blue channel ---
    blueCtx.clearRect(0, 0, canvas.width, canvas.height);
    blueCtx.fillStyle = col.blue;
    for (const [x, y] of dots.ring) {
        blueCtx.fillRect(
            Math.round(x + shift - cfg.dot / 2),
            Math.round(y - cfg.dot / 2),
            cfg.dot, cfg.dot
        );
    }

    let countB = 0;
    const cxB = cx + shift;
    while (countB < cfg.bgDots) {
        const bx = square.x + Math.random() * square.size;
        const by = square.y + Math.random() * square.size;
        if (inRing(bx, by, cxB, cy, r, lw) && !inGap(bx, by, cxB, cy, r)) continue;
        blueCtx.fillRect(
            Math.round(bx - cfg.dot / 2),
            Math.round(by - cfg.dot / 2),
            cfg.dot, cfg.dot
        );
        countB++;
    }

    // Composite channels with additive blending for red/cyan anaglyph
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    if (document.getElementById('showBlue').checked) {
        ctx.drawImage(blueCanvas, 0, 0);
    }
    if (document.getElementById('showRed').checked) {
        ctx.drawImage(redCanvas, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
};

const keyHandler = e => {
    const map = { ArrowRight: 0, ArrowUp: 3 * Math.PI / 2, ArrowLeft: Math.PI, ArrowDown: Math.PI / 2 };
    if (e.key in map) {
        e.preventDefault();
        (gapAngle === map[e.key] ? correct++ : wrong++);
        randGap(); render(); updateScore();
    } else if (e.key === '+' || e.key === '=') {
        cfg.separation += cfg.separationStep; render();
    } else if (e.key === '-' || e.key === '_') {
        cfg.separation = Math.max(0, cfg.separation - cfg.separationStep); render();
    }
};

const updateScore = () => {
    document.getElementById('scoreboard').textContent = `Convergencia — Aciertos: ${correct} · Errores: ${wrong}`;
};

document.addEventListener('DOMContentLoaded', () => {
    col = {
        red: getColorFromStorage('tv_redColor', 'rgb(255,0,0)'),
        blue: getColorFromStorage('tv_blueColor', 'rgb(0,255,255)'),
        bg: getColorFromStorage('tv_bgColor', '#000')
    };
    canvas = document.getElementById('anaglyphCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    redCanvas = document.createElement('canvas');
    blueCanvas = document.createElement('canvas');
    redCtx = redCanvas.getContext('2d');
    blueCtx = blueCanvas.getContext('2d');
    document.body.insertBefore(
        Object.assign(document.createElement('div'), {
            id: 'scoreboard',
            style: 'position:fixed;top:0;left:0;width:100%;padding:6px 0;background:rgba(0,0,0,.6);color:#fff;font:16px/1.4 sans-serif;text-align:center;z-index:1000'
        }),
        canvas
    );
    randGap(); render(); updateScore();
    addEventListener('keydown', keyHandler);
    addEventListener('resize', () => { randGap(); render(); });
    document.getElementById('showRed').addEventListener('change', render);
    document.getElementById('showBlue').addEventListener('change', render);
});
