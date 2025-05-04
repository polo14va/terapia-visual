// ============================================================================
// Configuration
// ============================================================================
const config = {
  separation: 1.5,
  separationStep: 0.5,
  displayStepMm: 1,
  pxPerUnit: 4,
  depthScale: 2,
  bgDots: 30000,
  dotSize: 3,
  radiusRatio: 0.25,
  lineWidthRatio: 0.08,
  gapSize: Math.PI / 6
};

// ============================================================================
// Audio assets
// ============================================================================
const correctSound = new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3');
const wrongSound   = new Audio('https://freesound.org/data/previews/331/331912_3248244-lq.mp3');

correctSound.preload = 'auto';
correctSound.volume = 1;
wrongSound.preload   = 'auto';
wrongSound.volume   = 1;
correctSound.load();
wrongSound.load();

// ============================================================================
// Runtime state
// ============================================================================
let correctCount = 0, wrongCount = 0;
let gapAngle = 0;
const ringGaps = [0, Math.PI/2, Math.PI, 3*Math.PI/2];

let canvas, context, blueCanvas, redCanvas, blueContext, redContext;
let mode = 'convergence';
let mixedTurn = 'convergence';
let mixedCycleCorrect = false;

// ============================================================================
// Utility helpers
// ============================================================================
function getColorFromStorage(key, defaultValue) {
  return localStorage.getItem(key) || defaultValue;
}

function buildRingDots(cx, cy, r, lw, count) {
  const dots = [];
  let produced = 0, attempts = 0, maxAttempts = count * 10;
  const start = (gapAngle - config.gapSize/2 + 2*Math.PI) % (2*Math.PI);
  const end   = (gapAngle + config.gapSize/2 + 2*Math.PI) % (2*Math.PI);
  while (produced < count && attempts < maxAttempts) {
    attempts++;
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

// ============================================================================
// Gap management
// ============================================================================
function randomizeGap() {
  let a;
  do { a = ringGaps[Math.floor(Math.random() * ringGaps.length)]; }
  while (a === gapAngle);
  gapAngle = a;
}

// ============================================================================
// Rendering
// ============================================================================
function render() {
  canvas.width = blueCanvas.width = redCanvas.width = window.innerWidth;
  canvas.height = blueCanvas.height = redCanvas.height = window.innerHeight;
  if (!canvas.width || !canvas.height) return;

  const squareSize = canvas.height * .8;
  const squareX = (canvas.width - squareSize) / 2;
  const squareY = (canvas.height - squareSize) / 2;
  const r = squareSize * config.radiusRatio;
  const lw = squareSize * config.lineWidthRatio;
  const disp = config.separation * config.pxPerUnit * config.depthScale / 2;
  const baseShift = Math.min(disp, squareSize/2 - r - lw - config.dotSize);
  let shift;
  if (mode === 'convergence') shift = baseShift;
  else if (mode === 'divergence') shift = -baseShift;
  else { // mixed
    shift = mixedTurn === 'convergence' ? baseShift : -baseShift;
  }

  const half = Math.floor(config.dotSize / 2);
  const start = (gapAngle - config.gapSize/2 + 2*Math.PI) % (2*Math.PI);
  const end   = (gapAngle + config.gapSize/2 + 2*Math.PI) % (2*Math.PI);

  const cx = squareX + squareSize/2;
  const cy = squareY + squareSize/2;

  const ringArea = 2*Math.PI*r*lw*(1 - config.gapSize/(2*Math.PI));
  const density = config.bgDots / (squareSize**2 - 2*Math.PI*r*lw);
  const ringCount = Math.floor(ringArea * density);
  const ringDots = buildRingDots(cx, cy, r, lw, ringCount);

  const cDensity = config.bgDots / (squareSize * squareSize);
  const cCount = Math.floor(Math.PI * r*r * cDensity * (1 - config.gapSize/(2*Math.PI)));
  const cDots = buildRingDots(cx, cy, r, lw, cCount);

  blueContext.clearRect(0, 0, canvas.width, canvas.height);
  if (document.getElementById('showBlue').checked) {
    blueContext.fillStyle = colors.blue;
    let count = 0;
    while (count < config.bgDots) {
      const x = squareX + Math.random()*squareSize;
      const y = squareY + Math.random()*squareSize;
      const dx = x - cx, dy = y - cy, d2 = dx*dx + dy*dy;
      let a = Math.atan2(dy, dx); if (a < 0) a += 2*Math.PI;
      const insideC = d2 <= r*r && !((a>=start&&a<=end)||(end<start&&(a>=start||a<=end)));
      if (insideC) { count++; continue; }
      blueContext.fillRect(Math.round(x-shift)-half, Math.round(y)-half, config.dotSize, config.dotSize);
      count++;
    }
    for (const [x,y] of cDots) {
      blueContext.fillRect(Math.round(x-shift)-half, Math.round(y)-half, config.dotSize, config.dotSize);
    }
  }

  redContext.clearRect(0, 0, canvas.width, canvas.height);
  if (document.getElementById('showRed').checked) {
    redContext.fillStyle = colors.red;
    let count = 0;
    while (count < config.bgDots) {
      const x = squareX + Math.random()*squareSize;
      const y = squareY + Math.random()*squareSize;
      const dx = x - cx, dy = y - cy, d2 = dx*dx + dy*dy;
      let a = Math.atan2(dy, dx); if (a < 0) a += 2*Math.PI;
      const insideC = d2 <= r*r && !((a>=start&&a<=end)||(end<start&&(a>=start||a<=end)));
      if (insideC) { count++; continue; }
      redContext.fillRect(Math.round(x+shift)-half, Math.round(y)-half, config.dotSize, config.dotSize);
      count++;
    }
    for (const [x,y] of cDots) {
      redContext.fillRect(Math.round(x+shift)-half, Math.round(y)-half, config.dotSize, config.dotSize);
    }
  }

  const width = canvas.width, height = canvas.height;
  context.fillStyle = colors.bg;
  context.fillRect(0, 0, width, height);
  const blueData = document.getElementById('showBlue').checked
    ? blueContext.getImageData(0, 0, width, height).data
    : null;
  const redData = document.getElementById('showRed').checked
    ? redContext.getImageData(0, 0, width, height).data
    : null;

  const [rR,gR,bR] = colors.red.match(/\d+/g).map(Number);
  const [rB,gB,bB] = colors.blue.match(/\d+/g).map(Number);
  const [rBg,gBg,bBg] = colors.bg.match(/\d+/g).map(Number);
  const out = context.createImageData(width, height);
  const outData = out.data;

  for (let i = 0; i < outData.length; i += 4) {
    const hasBlue = blueData && blueData[i+3] > 0;
    const hasRed  = redData && redData[i+3] > 0;
    if (hasBlue && hasRed) {
      outData[i] = outData[i+1] = outData[i+2] = 0;
      outData[i+3] = 255;
    } else if (hasBlue) {
      outData[i] = rB; outData[i+1] = gB; outData[i+2] = bB; outData[i+3] = 255;
    } else if (hasRed) {
      outData[i] = rR; outData[i+1] = gR; outData[i+2] = bR; outData[i+3] = 255;
    } else {
      outData[i] = rBg; outData[i+1] = gBg; outData[i+2] = bBg; outData[i+3] = 255;
    }
  }
  context.putImageData(out, 0, 0);
}

// ============================================================================
// Input handling
// ============================================================================
function keyHandler(e) {
  const map = {
    ArrowRight: 0,
    ArrowUp: 3*Math.PI/2,
    ArrowLeft: Math.PI,
    ArrowDown: Math.PI/2
  };
  if (e.key in map) {
    e.preventDefault();
    const expected = map[e.key];
    const isCorrect = gapAngle === expected;
    if (mode === 'mixed') {
      if (isCorrect) {
        correctCount++;
        correctSound.currentTime = 0;
        correctSound.play();
      } else {
        wrongCount++;
        wrongSound.currentTime = 0;
        wrongSound.play();
      }
      if (mixedTurn === 'convergence') {
        mixedCycleCorrect = isCorrect;
        mixedTurn = 'divergence';
      } else { // divergence phase
        if (isCorrect && mixedCycleCorrect) {
          config.separation += config.displayStepMm;
        }
        mixedCycleCorrect = false;
        mixedTurn = 'convergence';
      }
    } else {
      if (isCorrect) {
        correctCount++;
        config.separation += config.separationStep;
        correctSound.currentTime = 0;
        correctSound.play();
      } else {
        wrongCount++;
        wrongSound.currentTime = 0;
        wrongSound.play();
      }
    }
    randomizeGap();
    render();
    updateScore();
  }
  else if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    config.separation = Math.max(0, config.separation - config.displayStepMm);
    wrongCount++;
    wrongSound.currentTime = 0;
    wrongSound.play();
    render();
    updateScore();
    return;
  }
  else if (e.key === '+' || e.key === '=') {
    config.separation += config.separationStep; render();
  } else if (e.key === '-' || e.key === '_') {
    config.separation = Math.max(0, config.separation - config.separationStep);
    render();
  }
}

// ============================================================================
// Scoreboard
// ============================================================================
function updateScore() {
  const dispMm = Math.round(config.separation / config.displayStepMm) * config.displayStepMm;
  const baseLabels = {
    convergence: 'Convergencia',
    divergence: 'Divergencia'
  };
  let modeLabel = mode === 'mixed'
    ? `Mixto (${mixedTurn === 'convergence' ? 'Convergencia' : 'Divergencia'})`
    : baseLabels[mode] || 'Convergencia';
  document.getElementById('scoreboard').textContent =
    `${modeLabel} — Aciertos: ${correctCount} · Errores: ${wrongCount} · Separación: ${dispMm} mm`;
}

// ============================================================================
// Application bootstrap
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  colors = {
    red:  getColorFromStorage('tv_redColor',  'rgb(255,0,0)'),
    blue: getColorFromStorage('tv_blueColor', 'rgb(2,150,255)'),
    bg:   getColorFromStorage('tv_bgColor',   'rgb(148,150,255)')
  };
  canvas = document.getElementById('anaglyphCanvas');
  context = canvas.getContext('2d');
  blueCanvas = document.createElement('canvas');
  redCanvas = document.createElement('canvas');
  blueContext = blueCanvas.getContext('2d', { willReadFrequently: true });
  redContext  = redCanvas.getContext('2d', { willReadFrequently: true });

  document.body.insertBefore(
    Object.assign(document.createElement('div'), {
      id: 'scoreboard',
      style: 'position:fixed;top:0;left:0;width:100%;padding:6px 0;' +
             'background:rgba(0,0,0,.6);color:#fff;font:16px/1.4 sans-serif;' +
             'text-align:center;z-index:1000'
    }),
    canvas
  );

  randomizeGap(); render(); updateScore();
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('resize', () => { randomizeGap(); render(); });
  document.getElementById('showRed').addEventListener('change', render);
  document.getElementById('showBlue').addEventListener('change', render);
  document.getElementById('mode-convergence').addEventListener('click', () => selectMode('convergence'));
  document.getElementById('mode-divergence').addEventListener('click', () => selectMode('divergence'));
  document.getElementById('mode-mixed').addEventListener('click', () => selectMode('mixed'));
});

// ============================================================================
// Mode selection
// ============================================================================
function selectMode(selected) {
  mode = selected;
  document.getElementById('menu').style.display = 'none';
  randomizeGap(); render(); updateScore();
}