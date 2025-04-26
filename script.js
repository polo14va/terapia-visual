document.addEventListener('DOMContentLoaded', () => {
  const getColor = (key, def) => /^#([0-9A-F]{3}){1,2}$/i.test(localStorage.getItem(key)) ? localStorage.getItem(key) : def;
  const colorRed = getColor('tv_redColor', 'rgb(149,0,3)');
  const colorCyan = getColor('tv_blueColor', 'rgb(16,127,255)');
  const bgColor = getColor('tv_bgColor', 'rgb(130,124,254)');
  document.body.style.backgroundColor = bgColor;

  const canvasIds = ['canvasBlue','canvasRed','canvasBackground'];

  canvasIds.forEach(id => {
    const canvas = document.getElementById(id);
    canvas.style.setProperty('image-rendering', 'pixelated', 'important');
    canvas.style.setProperty('image-rendering', 'crisp-edges', 'important');
    canvas.style.setProperty('image-rendering', '-moz-crisp-edges', 'important');
    canvas.style.setProperty('image-rendering', '-webkit-optimize-contrast', 'important');
    canvas.style.setProperty('image-rendering', '-o-crisp-edges', 'important');
    canvas.style.setProperty('msInterpolationMode', 'nearest-neighbor', 'important');
  });

  // 2. Obtener el contexto 2d con opciones (si es posible)
  const [ctxBlue, ctxRed, ctxBg] = canvasIds.map(id => {
    const c = document.getElementById(id);
    // Intenta obtener el contexto con opciones para evitar suavizado
    return c && c.getContext('2d');
  });
  if (![ctxBlue, ctxRed, ctxBg].every(Boolean)) return;

  [ctxBlue, ctxRed, ctxBg].forEach(ctx => {
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.oImageSmoothingEnabled = false;
});

  const stepTitle = document.getElementById('stepTitle');

  const { width, height } = ctxBlue.canvas;
  const DOT_RADIUS = 1.5;
  const MM_TO_PX = 4;
  const STEP_MM = 5;
  const MIN_DIST = 1.5 * MM_TO_PX;
  const BG_COUNT = 12000;
  const FILLER_COUNT = 12000;
  const C_SIZE = 350;
  const C_THICKNESS = 60;
  const C_HOLE_ANGLE = Math.PI / 8;
  const ringArea = (((C_SIZE/2 + C_THICKNESS/2)**2 - (C_SIZE/2 - C_THICKNESS/2)**2) * (2*Math.PI - C_HOLE_ANGLE) / 2);
  const C_COUNT = Math.floor(FILLER_COUNT * (ringArea / (width * height)) * 0.5);

  const infoDiv = document.getElementById('infoDiv');
  let hits = 0, misses = 0, step = 1, orientation, bgDots = [], cDots = [], blueDots = [], redDots = [];

  const randOrient = () => Math.floor(Math.random() * 4);
  const deviation = () => step * STEP_MM * MM_TO_PX / 2;
  const orientText = ['Derecha →','Abajo ↓','Izquierda ←','Arriba ↑'];
  const updateInfo = () => infoDiv.innerHTML = `✔️ ${hits} ❌ ${misses} | C: <b>${orientText[orientation]}</b>`;

  const genDots = (count, exclude=[]) => {
    const dots = [], occupied = new Set(exclude.map(p=>`${Math.round(p.x)},${Math.round(p.y)}`));
    for (let i=0; dots.length<count && i<count*10; i++) {
      const x = Math.random()*width, y = Math.random()*height;
      const key = `${Math.round(x)},${Math.round(y)}`;
      if (!occupied.has(key) && !exclude.some(p=>Math.hypot(p.x-x,p.y-y)<MIN_DIST)) {
        occupied.add(key);
        dots.push({x,y});
      }
    }
    return dots;
  };

  const genC = ori => {
    const centerX=width/2, centerY=height/2;
    const angles = [-C_HOLE_ANGLE/2,Math.PI/2-C_HOLE_ANGLE/2,Math.PI-C_HOLE_ANGLE/2,3*Math.PI/2-C_HOLE_ANGLE/2];
    const sa = angles[ori], arc = 2*Math.PI - C_HOLE_ANGLE;
    const dots = [];
    for (let i=0; dots.length<C_COUNT && i<C_COUNT*10; i++) {
      const angle = sa + Math.random()*arc;
      const radius = C_SIZE/2 - C_THICKNESS/2 + Math.random()*C_THICKNESS;
      const x = centerX + radius*Math.cos(angle), y = centerY + radius*Math.sin(angle);
      if (!dots.some(p=>Math.hypot(p.x-x,p.y-y)<MIN_DIST)) dots.push({x,y});
    }
    return dots;
  };

  const drawDot = (ctx,x,y,color) => { ctx.fillStyle=color; ctx.fillRect(x-DOT_RADIUS,y-DOT_RADIUS,DOT_RADIUS*2,DOT_RADIUS*2); };

  const draw = () => {
    ctxBlue.clearRect(0,0,width,height);
    ctxRed.clearRect(0,0,width,height);
    ctxBg.clearRect(0,0,width,height);
    

    
    bgDots.forEach(pt=>drawDot(ctxBg,pt.x,pt.y,'#000'));
    cDots.forEach(pt=>drawDot(ctxBlue,pt.x,pt.y,colorCyan));
    blueDots.forEach(pt=>drawDot(ctxBlue,pt.x,pt.y,colorCyan));
    cDots.forEach(pt=>drawDot(ctxRed,pt.x,pt.y,colorRed));
    redDots.forEach(pt=>drawDot(ctxRed,pt.x,pt.y,colorRed));
    const d = deviation();
    const canvases = [ctxBlue.canvas, ctxRed.canvas, ctxBg.canvas];
    const offsets = [-d, d, 0];
    canvases.forEach((el, i) => {
      el.style.left = `calc(50% + ${offsets[i]}px)`;
      el.style.transform = 'translateX(-50%)';
    });
    stepTitle.textContent = step*STEP_MM;
    updateInfo();
  };

  const init = () => {
    orientation = randOrient();
    cDots = genC(orientation);
    bgDots = genDots(BG_COUNT);
    blueDots = genDots(FILLER_COUNT,cDots);
    redDots = genDots(FILLER_COUNT,cDots);

    draw();
  };

  document.addEventListener('keydown', e => {
    const map={ArrowRight:0,ArrowDown:1,ArrowLeft:2,ArrowUp:3};
    if(e.key in map){
      map[e.key]===orientation?hits++:misses++;
      step++;
      init();
    }
  });

  init();
});