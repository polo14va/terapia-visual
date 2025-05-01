document.addEventListener('DOMContentLoaded', () => {
  // Utilidades
  const getColor = (key, def) => {
    const val = localStorage.getItem(key);
    return /^#([0-9A-F]{3}){1,2}$/i.test(val) ? val : def;
  };

  // Configuración de colores y constantes
  let colorRed = getColor('tv_redColor', 'rgb(149,0,3)');
  let colorCyan = getColor('tv_blueColor', 'rgb(16,127,255)');
  let bgColor = getColor('tv_bgColor', 'rgba(110, 97, 253, 0.7)');
  document.body.style.backgroundColor = bgColor;

  const canvasIds = ['canvasBlue', 'canvasRed', 'canvasBackground'];
  const canvases = canvasIds.map(id => document.getElementById(id));
  const [ctxBlue, ctxRed, ctxBg] = canvases.map(c => c && c.getContext('2d'));
  if (![ctxBlue, ctxRed, ctxBg].every(Boolean)) return;

  // Pixel perfect rendering
  canvases.forEach(canvas => {
    canvas.style.setProperty('image-rendering', 'pixelated', 'important');
    canvas.style.setProperty('image-rendering', 'crisp-edges', 'important');
    canvas.style.setProperty('image-rendering', '-moz-crisp-edges', 'important');
    canvas.style.setProperty('image-rendering', '-webkit-optimize-contrast', 'important');
    canvas.style.setProperty('image-rendering', '-o-crisp-edges', 'important');
    canvas.style.setProperty('msInterpolationMode', 'nearest-neighbor', 'important');
  });
  [ctxBlue, ctxRed, ctxBg].forEach(ctx => {
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.oImageSmoothingEnabled = false;
  });

  // Parámetros de la tarea visual
  const stepTitle = document.getElementById('stepTitle');
  const infoDiv = document.getElementById('infoDiv');
  const { width, height } = ctxBlue.canvas;
  const DOT_RADIUS = 1;
  const MM_TO_PX = 2;
  const STEP_MM = 5;
  const MIN_DIST = 1.5 * MM_TO_PX;
  const BG_COUNT = 11000;
  const FILLER_COUNT = 12000;
  const C_SIZE = 350;
  const C_THICKNESS = 60;
  const C_HOLE_ANGLE = Math.PI / 8;
  const ringArea = (((C_SIZE / 2 + C_THICKNESS / 2) ** 2 - (C_SIZE / 2 - C_THICKNESS / 2) ** 2) * (2 * Math.PI - C_HOLE_ANGLE) / 2);
  const FILLER_DENSITY = FILLER_COUNT / (width * height);
  const C_COUNT = Math.round(FILLER_DENSITY * ringArea);

  // Estado
  let hits = 0, misses = 0, step = 1, orientation;
  let bgDots = [], cDots = [], blueDots = [], redDots = [];

  // Funciones de generación y dibujo
  const randOrient = () => Math.floor(Math.random() * 4);
  const deviation = () => step * STEP_MM * MM_TO_PX / 2;
  const orientText = ['Derecha →', 'Abajo ↓', 'Izquierda ←', 'Arriba ↑'];
  const updateInfo = () => {
    infoDiv.innerHTML = `✔️ ${hits} ❌ ${misses} | C: <b>${orientText[orientation]}</b>`;
  };

  const genDots = (count, exclude = []) => {
    const dots = [], occupied = new Set(exclude.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
    let tries = 0, maxTries = count * 10;
    while (dots.length < count && tries < maxTries) {
      const x = Math.random() * width, y = Math.random() * height;
      const key = `${Math.round(x)},${Math.round(y)}`;
      if (!occupied.has(key) && !exclude.some(p => Math.hypot(p.x - x, p.y - y) < MIN_DIST)) {
        occupied.add(key);
        dots.push({ x, y });
      }
      tries++;
    }
    return dots;
  };

  const genC = ori => {
    const centerX = width / 2, centerY = height / 2;
    const angles = [-C_HOLE_ANGLE / 2, Math.PI / 2 - C_HOLE_ANGLE / 2, Math.PI - C_HOLE_ANGLE / 2, 3 * Math.PI / 2 - C_HOLE_ANGLE / 2];
    const sa = angles[ori], arc = 2 * Math.PI - C_HOLE_ANGLE;
    const dots = [];
    let attempts = 0, maxAttempts = C_COUNT * 10;
    while (dots.length < C_COUNT && attempts < maxAttempts) {
      const angle = sa + Math.random() * arc;
      const radius = C_SIZE / 2 - C_THICKNESS / 2 + Math.random() * C_THICKNESS;
      const x = centerX + radius * Math.cos(angle), y = centerY + radius * Math.sin(angle);
      let inside = true;
      if (arc < 2 * Math.PI) {
        const relAngle = (angle - sa + 2 * Math.PI) % (2 * Math.PI);
        inside = relAngle < arc;
      }
      if (inside && !dots.some(p => Math.hypot(p.x - x, p.y - y) < MIN_DIST)) dots.push({ x, y });
      attempts++;
    }
    return dots;
  };

  const drawDot = (ctx, x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - DOT_RADIUS), Math.round(y - DOT_RADIUS), DOT_RADIUS * 2, DOT_RADIUS * 2);
  };

  const draw = () => {
    ctxBlue.clearRect(0, 0, width, height);
    ctxRed.clearRect(0, 0, width, height);
    ctxBg.clearRect(0, 0, width, height);
    ctxBg.fillStyle = bgColor;
    ctxBg.fillRect(0, 0, width, height);

    bgDots.forEach(pt => drawDot(ctxBg, pt.x, pt.y, '#000'));
    cDots.forEach(pt => {
      drawDot(ctxBlue, pt.x, pt.y, colorCyan);
      drawDot(ctxRed, pt.x, pt.y, colorRed);
    });
    blueDots.forEach(pt => drawDot(ctxBlue, pt.x, pt.y, colorCyan));
    redDots.forEach(pt => drawDot(ctxRed, pt.x, pt.y, colorRed));

    const d = deviation();
    [ctxBlue.canvas, ctxRed.canvas, ctxBg.canvas].forEach((el, i) => {
      el.style.left = `calc(50% + ${[-d, d, 0][i]}px)`;
      el.style.transform = 'translateX(-50%)';
    });
    stepTitle.textContent = step * STEP_MM;
    updateInfo();
  };

  const init = () => {
    // Recarga colores por si cambiaron en localStorage
    colorRed = getColor('tv_redColor', 'rgb(149,0,3)');
    colorCyan = getColor('tv_blueColor', 'rgb(16,127,255)');
    bgColor = getColor('tv_bgColor', 'rgba(110, 97, 253, 0.7)');
    document.body.style.backgroundColor = bgColor;

    orientation = randOrient();
    cDots = genC(orientation);
    bgDots = genDots(BG_COUNT);
    blueDots = genDots(FILLER_COUNT, cDots);
    redDots = genDots(FILLER_COUNT, cDots);
    draw();
  };

  document.addEventListener('keydown', e => {
    const map = { ArrowRight: 0, ArrowDown: 1, ArrowLeft: 2, ArrowUp: 3 };
    if (e.key in map) {
      map[e.key] === orientation ? hits++ : misses++;
      step++;
      init();
    }
  });

  // Soporte para botón de actualización si existe
  const updateBtn = document.getElementById('updateBtn');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      init();
    });
  }

  init();
});