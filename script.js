const cfg = {
    separation: 1.5,
    separationStep: .5,
    displayStepMm: 1,
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

let canvas, ctx, blueCanvas, redCanvas, blueCtx, redCtx;

function getColorFromStorage(key, defaultValue) {
    const storedValue = localStorage.getItem(key);
    return storedValue ? storedValue : defaultValue;
}

function buildRingDots(cx, cy, r, lw, count) {
    const dots = [];
    let produced = 0, attempts = 0;
    const maxAttempts = count * 10;
    const start = (gapAngle - cfg.gap/2 + 2*Math.PI) % (2*Math.PI);
    const end   = (gapAngle + cfg.gap/2 + 2*Math.PI) % (2*Math.PI);
    while (produced < count && attempts < maxAttempts) {
        attempts++;
        // sample within circle of radius r
        const angle0 = Math.random() * 2 * Math.PI;
        const dist0 = Math.sqrt(Math.random()) * r;
        const x = cx + Math.cos(angle0) * dist0;
        const y = cy + Math.sin(angle0) * dist0;
        let a = Math.atan2(y - cy, x - cx);
        if (a < 0) a += 2 * Math.PI;
        const inGap = start < end ? (a >= start && a <= end) : (a >= start || a <= end);
        if (inGap) continue;
        dots.push([x, y]);
        produced++;
    }
    return dots;
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

function render() {
    // Resize all canvases
    canvas.width = blueCanvas.width = redCanvas.width = window.innerWidth;
    canvas.height = blueCanvas.height = redCanvas.height = window.innerHeight;
    if (!canvas.width || !canvas.height) return;

    // Square and geometry
    const squareSize = canvas.height * .8;
    const squareX = (canvas.width - squareSize) / 2;
    const squareY = (canvas.height - squareSize) / 2;
    const r = squareSize * cfg.radiusRatio;
    const lw = squareSize * cfg.lineRatio;
    const cx = squareX + squareSize / 2;
    const cy = squareY + squareSize / 2;
    const disp = cfg.separation * cfg.pxPerUnit * cfg.depthScale / 2;
    const shift = Math.min(disp, squareSize / 2 - r - lw - cfg.dot);
    const half = Math.floor(cfg.dot / 2);
    const start = (gapAngle - cfg.gap / 2 + 2 * Math.PI) % (2 * Math.PI);
    const end   = (gapAngle + cfg.gap / 2 + 2 * Math.PI) % (2 * Math.PI);

    // Build ring dots once
    const ringArea = 2 * Math.PI * r * lw * (1 - cfg.gap / (2 * Math.PI));
    const density = cfg.bgDots / (squareSize ** 2 - 2 * Math.PI * r * lw);
    const ringCount = Math.floor(ringArea * density);
    const ringDots = buildRingDots(cx, cy, r, lw, ringCount);

    // Build C interior dot pattern
    const cDensity = cfg.bgDots / (squareSize * squareSize);
    const cCount = Math.floor(Math.PI * r * r * cDensity * (1 - cfg.gap / (2 * Math.PI)));
    const cDots = buildRingDots(cx, cy, r, lw, cCount);

    // Blue channel: full cloud minus C interior, then C
    blueCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (document.getElementById('showBlue').checked) {
        blueCtx.fillStyle = col.blue;
        let countB = 0;
        while (countB < cfg.bgDots) {
            const bx = squareX + Math.random() * squareSize;
            const by = squareY + Math.random() * squareSize;
            const dxB = bx - cx;
            const dyB = by - cy;
            const d2B = dxB * dxB + dyB * dyB;
            let aB = Math.atan2(dyB, dxB);
            if (aB < 0) aB += 2 * Math.PI;
            const inC = d2B <= r * r &&
                !((aB >= start && aB <= end) || (end < start && (aB >= start || aB <= end)));
            if (inC) { countB++; continue; }
            blueCtx.fillRect(Math.round(bx - shift) - half, Math.round(by) - half, cfg.dot, cfg.dot);
            countB++;
        }
        // draw C interior dots
        for (const [x, y] of cDots) {
            blueCtx.fillRect(Math.round(x - shift) - half, Math.round(y) - half, cfg.dot, cfg.dot);
        }
    }

    // Red channel: full cloud minus C interior, then C
    redCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (document.getElementById('showRed').checked) {
        redCtx.fillStyle = col.red;
        let countR = 0;
        while (countR < cfg.bgDots) {
            const rx = squareX + Math.random() * squareSize;
            const ry = squareY + Math.random() * squareSize;
            const dxR = rx - cx;
            const dyR = ry - cy;
            const d2R = dxR * dxR + dyR * dyR;
            let aR = Math.atan2(dyR, dxR);
            if (aR < 0) aR += 2 * Math.PI;
            const inC2 = d2R <= r * r &&
                !((aR >= start && aR <= end) || (end < start && (aR >= start || aR <= end)));
            if (inC2) { countR++; continue; }
            redCtx.fillRect(Math.round(rx + shift) - half, Math.round(ry) - half, cfg.dot, cfg.dot);
            countR++;
        }
        // draw C interior dots
        for (const [x, y] of cDots) {
            redCtx.fillRect(Math.round(x + shift) - half, Math.round(y) - half, cfg.dot, cfg.dot);
        }
    }

    // Composite layers by priority: blue, red; overlapping blue+red → black
    const width = canvas.width, height = canvas.height;
    // fill background
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, width, height);

    // grab pixel data
    let blueData, redData;
    if (document.getElementById('showBlue').checked) {
        blueData = blueCtx.getImageData(0, 0, width, height).data;
    }
    if (document.getElementById('showRed').checked) {
        redData = redCtx.getImageData(0, 0, width, height).data;
    }

    // parse pure colors
    const [rR, gR, bR] = col.red.match(/\d+/g).map(Number);
    const [rB, gB, bB] = col.blue.match(/\d+/g).map(Number);
    const [rBg, gBg, bBg] = col.bg.match(/\d+/g).map(Number);
    // output buffer
    const out = ctx.createImageData(width, height);
    const outData = out.data;

    for (let i = 0; i < outData.length; i += 4) {
        const hasB = blueData && blueData[i + 3] > 0;
        const hasR = redData && redData[i + 3] > 0;
        if (hasB && hasR) {
            // overlap → black
            outData[i] = outData[i + 1] = outData[i + 2] = 0;
            outData[i + 3] = 255;
        } else if (hasB) {
            outData[i] = rB; outData[i + 1] = gB; outData[i + 2] = bB; outData[i + 3] = 255;
        } else if (hasR) {
            outData[i] = rR; outData[i + 1] = gR; outData[i + 2] = bR; outData[i + 3] = 255;
        } else {
          outData[i]     = rBg;
          outData[i + 1] = gBg;
          outData[i + 2] = bBg;
          outData[i + 3] = 255;
        }
    }

    // put composed image
    ctx.putImageData(out, 0, 0);
}

const keyHandler = e => {
    const map = { ArrowRight: 0, ArrowUp: 3 * Math.PI / 2, ArrowLeft: Math.PI, ArrowDown: Math.PI / 2 };
    if (e.key in map) {
        e.preventDefault();
        if (gapAngle === map[e.key]) {
            correct++;
            cfg.separation += cfg.separationStep;
        } else {
            wrong++;
        }
        randGap();
        render();
        updateScore();
        return;
    } else if (e.key === '+' || e.key === '=') {
        cfg.separation += cfg.separationStep; render();
    } else if (e.key === '-' || e.key === '_') {
        cfg.separation = Math.max(0, cfg.separation - cfg.separationStep); render();
    }
};

const updateScore = () => {
    const dispMm = Math.round(cfg.separation / cfg.displayStepMm) * cfg.displayStepMm;
    document.getElementById('scoreboard').textContent =
      `Convergencia — Aciertos: ${correct} · Errores: ${wrong} · Separación: ${dispMm} mm`;
};

document.addEventListener('DOMContentLoaded', () => {
    col = {
        red: getColorFromStorage('tv_redColor', 'rgb(255,0,0)'),
        blue: getColorFromStorage('tv_blueColor', 'rgb(2,150,255)'),
        bg: getColorFromStorage('tv_bgColor', 'rgb(148,150,255)')
    };
    canvas = document.getElementById('anaglyphCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    blueCanvas  = document.createElement('canvas');
    redCanvas   = document.createElement('canvas');
    blueCtx  = blueCanvas.getContext('2d', { willReadFrequently: true });
    redCtx   = redCanvas.getContext('2d', { willReadFrequently: true });

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
